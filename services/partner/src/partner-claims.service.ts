import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreatePartnerPlanDto } from "./dto/create-partner-plan.dto";
import type { CreatePartnerClaimDto } from "./dto/create-partner-claim.dto";
import { UpdatePartnerPlanDto } from "./dto/update-partner-plan.dto";
import { UpdatePartnerProfileDto } from "./dto/update-partner-profile.dto";
import { PartnerClaimEntity } from "./partner-claim.entity";
import { PartnerCatalogSyncOutboxService } from "./partner-catalog-sync-outbox.service";
import { PartnerCatalogSyncService } from "./partner-catalog-sync.service";
import type { PartnerIdentity } from "./partner-auth.guard";
import { PartnerOwnershipAuditEntity } from "./partner-ownership-audit.entity";
import { PartnerPlanEntity } from "./partner-plan.entity";
import { PartnerProfileEntity } from "./partner-profile.entity";
import { PartnerVenueOwnershipEntity } from "./partner-venue-ownership.entity";

type LeadSummary = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
};

type LeadIdentity = {
  id: string;
  venueSlug: string;
  status: string;
  createdAt: string;
  firstContactedAt: string | null;
};

@Injectable()
export class PartnerClaimsService {
  constructor(
    @InjectRepository(PartnerClaimEntity)
    private readonly claims: Repository<PartnerClaimEntity>,
    @InjectRepository(PartnerVenueOwnershipEntity)
    private readonly ownerships: Repository<PartnerVenueOwnershipEntity>,
    @InjectRepository(PartnerProfileEntity)
    private readonly profiles: Repository<PartnerProfileEntity>,
    @InjectRepository(PartnerPlanEntity)
    private readonly plans: Repository<PartnerPlanEntity>,
    @InjectRepository(PartnerOwnershipAuditEntity)
    private readonly ownershipAudit: Repository<PartnerOwnershipAuditEntity>,
    private readonly catalogOutbox: PartnerCatalogSyncOutboxService,
    private readonly catalogSync: PartnerCatalogSyncService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreatePartnerClaimDto): Promise<{ id: string; status: string }> {
    const row = this.claims.create({
      venueSlug: dto.venueSlug,
      representativeName: dto.representativeName,
      representativeEmail: dto.representativeEmail,
      representativePhone: dto.representativePhone,
      evidence: dto.evidence?.trim() || null,
      status: "pending_review",
    });
    const saved = await this.claims.save(row);
    return { id: saved.id, status: saved.status };
  }

  async listRecent(limit = 200): Promise<PartnerClaimEntity[]> {
    return this.claims.find({
      order: { createdAt: "DESC" },
      take: Math.max(1, Math.min(limit, 500)),
    });
  }

  async updateStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<{ id: string; status: string }> {
    const row = await this.claims.findOne({ where: { id } });
    if (!row) return { id, status: "not_found" };
    row.status = status;
    const saved = await this.claims.save(row);
    if (status === "approved") {
      const email = saved.representativeEmail.trim().toLowerCase();
      const venueSlug = saved.venueSlug.trim();
      const existing = await this.ownerships.findOne({
        where: { partnerEmail: email, venueSlug },
      });
      if (!existing) {
        await this.ownerships.save(
          this.ownerships.create({
            partnerEmail: email,
            venueSlug,
            status: "active",
          }),
        );
      } else if (existing.status !== "active") {
        existing.status = "active";
        await this.ownerships.save(existing);
      }
      await this.enqueueVenueCatalogSync(email, venueSlug);
    }
    return { id: saved.id, status: saved.status };
  }

  async listOwnerships(limit = 200) {
    const rows = await this.ownerships.find({
      order: { updatedAt: "DESC" },
      take: Math.max(1, Math.min(limit, 500)),
    });
    return rows.map((r) => ({
      id: r.id,
      partnerEmail: r.partnerEmail,
      venueSlug: r.venueSlug,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async revokeOwnership(
    id: string,
    opts: { actor: string; reason?: string },
  ): Promise<{ id: string; status: string }> {
    const row = await this.ownerships.findOne({ where: { id } });
    if (!row) return { id, status: "not_found" };
    row.status = "revoked";
    await this.ownerships.save(row);
    await this.ownershipAudit.save(
      this.ownershipAudit.create({
        action: "revoked",
        partnerEmail: row.partnerEmail,
        venueSlug: row.venueSlug,
        actor: opts.actor.trim() || "unknown_admin",
        reason: opts.reason?.trim() || null,
      }),
    );
    return { id: row.id, status: row.status };
  }

  async listOwnershipAudit(
    limit = 200,
    filters?: { partnerEmail?: string; venueSlug?: string },
  ) {
    const qb = this.ownershipAudit
      .createQueryBuilder("audit")
      .orderBy("audit.createdAt", "DESC")
      .take(Math.max(1, Math.min(limit, 500)));
    if (filters?.partnerEmail) {
      qb.andWhere("LOWER(audit.partnerEmail) = :partnerEmail", {
        partnerEmail: filters.partnerEmail.trim().toLowerCase(),
      });
    }
    if (filters?.venueSlug) {
      qb.andWhere("audit.venueSlug = :venueSlug", {
        venueSlug: filters.venueSlug.trim(),
      });
    }
    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      partnerEmail: r.partnerEmail,
      venueSlug: r.venueSlug,
      actor: r.actor,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listPartnerLeads(
    identity: PartnerIdentity,
    limit = 200,
  ): Promise<{ items: LeadSummary[]; venues: string[] }> {
    const links = await this.ownerships.find({
      where: {
        partnerEmail: identity.email,
        status: "active",
      },
    });
    const venues = Array.from(new Set(links.map((c) => c.venueSlug)));
    if (venues.length === 0) {
      return { items: [], venues: [] };
    }

    const leadsBase = this.config.get<string>("LEADS_SERVICE_URL") ?? "http://localhost:4012";
    const auth = this.getLeadsInternalHeader();
    if (!auth) {
      return { items: [], venues };
    }

    try {
      const q = new URLSearchParams({
        venues: venues.join(","),
        limit: String(Math.max(1, Math.min(limit, 500))),
      });
      const res = await fetch(
        `${leadsBase.replace(/\/$/, "")}/v1/internal/leads/by-venues?${q.toString()}`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (!res.ok) return { items: [], venues };
      const data = (await res.json()) as { items?: LeadSummary[] };
      return {
        items: (data.items ?? []).slice(0, Math.max(1, Math.min(limit, 500))),
        venues,
      };
    } catch {
      return { items: [], venues };
    }
  }

  async updatePartnerLeadStatus(
    identity: PartnerIdentity,
    leadId: string,
    status: "contacted" | "closed",
  ): Promise<
    | { id: string; status: string; firstContactedAt: string | null }
    | { error: "lead_not_found" | "lead_not_owned" | "integration_not_configured" | "upstream_error" }
  > {
    const auth = this.getLeadsInternalHeader();
    if (!auth) {
      return { error: "integration_not_configured" };
    }
    const leadsBase = this.config.get<string>("LEADS_SERVICE_URL") ?? "http://localhost:4012";
    const normalizedLeadId = leadId.trim();
    const owned = await this.ownerships.find({
      where: { partnerEmail: identity.email, status: "active" },
      take: 500,
    });
    const ownedVenues = new Set(owned.map((it) => it.venueSlug));
    if (ownedVenues.size === 0) return { error: "lead_not_owned" };
    try {
      const current = await fetch(
        `${leadsBase.replace(/\/$/, "")}/v1/internal/leads/${encodeURIComponent(normalizedLeadId)}`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (current.status === 404) return { error: "lead_not_found" };
      if (!current.ok) return { error: "upstream_error" };
      const currentLead = (await current.json()) as LeadIdentity;
      if (!ownedVenues.has(currentLead.venueSlug)) {
        return { error: "lead_not_owned" };
      }

      const updatedRes = await fetch(
        `${leadsBase.replace(/\/$/, "")}/v1/internal/leads/${encodeURIComponent(normalizedLeadId)}/status`,
        {
          method: "PATCH",
          headers: {
            [auth.headerName]: auth.headerValue,
            "content-type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );
      if (updatedRes.status === 404) return { error: "lead_not_found" };
      if (!updatedRes.ok) return { error: "upstream_error" };
      const updated = (await updatedRes.json()) as {
        id: string;
        status: string;
        firstContactedAt: string | null;
      };
      return {
        id: updated.id,
        status: updated.status,
        firstContactedAt: updated.firstContactedAt,
      };
    } catch {
      return { error: "upstream_error" };
    }
  }

  private getLeadsInternalHeader():
    | { headerName: "x-internal-token"; headerValue: string }
    | null {
    const token = this.config.get<string>("PARTNER_TO_LEADS_INTERNAL_TOKEN")?.trim();
    if (token) {
      return { headerName: "x-internal-token", headerValue: token };
    }
    return null;
  }

  async getProfile(identity: PartnerIdentity) {
    const row = await this.profiles.findOne({
      where: { partnerEmail: identity.email },
    });
    if (!row) {
      return {
        partnerEmail: identity.email,
        businessName: null,
        description: null,
        scheduleSummary: null,
        contactPhone: null,
        contactEmail: null,
        contactWhatsapp: null,
      };
    }
    return {
      partnerEmail: row.partnerEmail,
      businessName: row.businessName,
      description: row.description,
      scheduleSummary: row.scheduleSummary,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      contactWhatsapp: row.contactWhatsapp,
    };
  }

  async upsertProfile(identity: PartnerIdentity, dto: UpdatePartnerProfileDto) {
    let row = await this.profiles.findOne({
      where: { partnerEmail: identity.email },
    });
    if (!row) {
      row = this.profiles.create({
        partnerEmail: identity.email,
        businessName: null,
        description: null,
        scheduleSummary: null,
        contactPhone: null,
        contactEmail: null,
        contactWhatsapp: null,
      });
    }
    if (dto.businessName !== undefined) row.businessName = dto.businessName.trim() || null;
    if (dto.description !== undefined) row.description = dto.description.trim() || null;
    if (dto.scheduleSummary !== undefined) {
      row.scheduleSummary = dto.scheduleSummary.trim() || null;
    }
    if (dto.contactPhone !== undefined) row.contactPhone = dto.contactPhone.trim() || null;
    if (dto.contactEmail !== undefined) {
      row.contactEmail = dto.contactEmail.trim().toLowerCase() || null;
    }
    if (dto.contactWhatsapp !== undefined) {
      row.contactWhatsapp = dto.contactWhatsapp.trim() || null;
    }
    const saved = await this.profiles.save(row);
    const links = await this.ownerships.find({
      where: { partnerEmail: identity.email, status: "active" },
    });
    for (const link of links) {
      await this.enqueueVenueCatalogSync(identity.email, link.venueSlug);
    }
    return {
      partnerEmail: saved.partnerEmail,
      businessName: saved.businessName,
      description: saved.description,
      scheduleSummary: saved.scheduleSummary,
      contactPhone: saved.contactPhone,
      contactEmail: saved.contactEmail,
      contactWhatsapp: saved.contactWhatsapp,
    };
  }

  async listMyPlans(identity: PartnerIdentity) {
    const rows = await this.plans.find({
      where: { partnerEmail: identity.email },
      order: { createdAt: "DESC" },
      take: 300,
    });
    return rows.map((r) => ({
      id: r.id,
      venueSlug: r.venueSlug,
      name: r.name,
      description: r.description,
      period: r.period,
      priceLabel: r.priceLabel,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async createPlan(identity: PartnerIdentity, dto: CreatePartnerPlanDto) {
    const venueSlug = dto.venueSlug.trim();
    const hasOwnership = await this.ownerships.findOne({
      where: {
        partnerEmail: identity.email,
        venueSlug,
        status: "active",
      },
    });
    if (!hasOwnership) {
      return { error: "venue_not_owned" as const };
    }
    const row = await this.plans.save(
      this.plans.create({
        partnerEmail: identity.email,
        venueSlug,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        period: dto.period?.trim() || null,
        priceLabel: dto.priceLabel?.trim() || null,
        active: true,
      }),
    );
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return {
      id: row.id,
      venueSlug: row.venueSlug,
      name: row.name,
      description: row.description,
      period: row.period,
      priceLabel: row.priceLabel,
      active: row.active,
    };
  }

  async updatePlan(identity: PartnerIdentity, id: string, dto: UpdatePartnerPlanDto) {
    const row = await this.plans.findOne({
      where: { id, partnerEmail: identity.email },
    });
    if (!row) return { error: "plan_not_found" as const };
    if (dto.name !== undefined) row.name = dto.name.trim();
    if (dto.description !== undefined) row.description = dto.description.trim() || null;
    if (dto.period !== undefined) row.period = dto.period.trim() || null;
    if (dto.priceLabel !== undefined) row.priceLabel = dto.priceLabel.trim() || null;
    if (dto.active !== undefined) row.active = dto.active;
    const saved = await this.plans.save(row);
    await this.enqueueVenueCatalogSync(identity.email, saved.venueSlug);
    return {
      id: saved.id,
      venueSlug: saved.venueSlug,
      name: saved.name,
      description: saved.description,
      period: saved.period,
      priceLabel: saved.priceLabel,
      active: saved.active,
    };
  }

  private async enqueueVenueCatalogSync(
    partnerEmail: string,
    venueSlug: string,
  ): Promise<void> {
    const profile = await this.profiles.findOne({ where: { partnerEmail } });
    const plans = await this.plans.find({
      where: { partnerEmail, venueSlug },
      order: { createdAt: "DESC" },
      take: 20,
    });
    const payload = {
      description: profile?.description ?? undefined,
      contactPhone: profile?.contactPhone ?? undefined,
      contactEmail: profile?.contactEmail ?? undefined,
      contactWhatsapp: profile?.contactWhatsapp ?? undefined,
      allowsTrial: plans.some((p) => p.active),
      plans: plans.map((p) => ({
        name: p.name,
        description: p.description,
        period: p.period,
        priceLabel: p.priceLabel,
        active: p.active,
      })),
    };
    await this.catalogOutbox.enqueueRequestedEvent(partnerEmail, venueSlug, payload);
  }

  async listCatalogSyncFailures(limit = 100) {
    return this.catalogSync.listFailures(limit);
  }

  async retryCatalogSyncFailures(limit = 50) {
    return this.catalogSync.retryFailures(limit);
  }

  async listCatalogSyncOutboxFailures(limit = 100) {
    return this.catalogOutbox.listFailures(limit);
  }

  async retryCatalogSyncOutboxFailures(limit = 50) {
    return this.catalogOutbox.retryFailures(limit);
  }
}
