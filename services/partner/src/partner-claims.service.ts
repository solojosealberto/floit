import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { existsSync, unlinkSync } from "node:fs";
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
import { PartnerVenuePhotoEntity } from "./partner-venue-photo.entity";

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
    @InjectRepository(PartnerVenuePhotoEntity)
    private readonly photos: Repository<PartnerVenuePhotoEntity>,
    private readonly catalogOutbox: PartnerCatalogSyncOutboxService,
    private readonly catalogSync: PartnerCatalogSyncService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreatePartnerClaimDto): Promise<{ id: string; status: string }> {
    const claimKind = dto.claimKind ?? "existing";
    const newVenueDraftJson =
      claimKind === "new" && dto.newVenueDraft
        ? JSON.stringify(dto.newVenueDraft)
        : null;
    const row = this.claims.create({
      venueSlug: dto.venueSlug,
      representativeName: dto.representativeName,
      representativeEmail: dto.representativeEmail,
      representativePhone: dto.representativePhone,
      evidence: dto.evidence?.trim() || null,
      claimKind,
      newVenueDraftJson,
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
    if (status === "approved") {
      await this.ensureCatalogVenueForNewClaim(row);
    }
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
    this.fireClaimStatusWebhookIfConfigured(saved, status);
    return { id: saved.id, status: saved.status };
  }

  /**
   * Hook opcional para automatización (email vía Zapier/Make, Slack, etc.).
   * Best-effort: no bloquea la respuesta HTTP si el webhook falla.
   */
  private fireClaimStatusWebhookIfConfigured(
    row: PartnerClaimEntity,
    status: "approved" | "rejected",
  ): void {
    const url = this.config.get<string>("PARTNER_CLAIM_STATUS_WEBHOOK_URL")?.trim();
    if (!url) return;
    const secret = this.config.get<string>("PARTNER_CLAIM_STATUS_WEBHOOK_SECRET")?.trim();
    const payload = {
      event: "partner_claim_status_changed",
      claimId: row.id,
      venueSlug: row.venueSlug,
      representativeEmail: row.representativeEmail,
      representativeName: row.representativeName,
      claimKind: row.claimKind,
      status,
      decidedAt: new Date().toISOString(),
    };
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "floit-partner-service/claim-webhook",
    };
    if (secret) headers["x-floit-webhook-secret"] = secret;
    void fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }).catch(() => {
      // intentional no-op: webhook es best-effort
    });
  }

  /**
   * Para claims `new`, crea el stub en catalog antes de ownership/sync (mismo slug que el claim).
   */
  private async ensureCatalogVenueForNewClaim(row: PartnerClaimEntity): Promise<void> {
    if (row.claimKind !== "new") return;
    type Draft = {
      businessName: string;
      zone: string;
      venueType: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    let draft: Draft;
    try {
      const raw = row.newVenueDraftJson?.trim();
      if (!raw) throw new Error("missing");
      draft = JSON.parse(raw) as Draft;
    } catch {
      throw new BadRequestException("partner_claim_new_venue_draft_missing");
    }
    if (
      !draft.businessName?.trim() ||
      !draft.zone?.trim() ||
      !draft.venueType?.trim()
    ) {
      throw new BadRequestException("partner_claim_new_venue_draft_invalid");
    }

    const base = this.config.get<string>("CATALOG_SERVICE_URL") ?? "http://localhost:4010";
    const configured = this.config.get<string>("PARTNER_TO_CATALOG_INTERNAL_TOKEN")?.trim();
    const isNonProduction = this.config.get<string>("NODE_ENV")?.trim() !== "production";
    const token = configured || (isNonProduction ? "change-me-dev-only" : "");
    if (!token) {
      throw new BadGatewayException("partner_to_catalog_internal_token_not_configured");
    }

    const address = draft.address?.trim() || "Dirección pendiente de verificación";
    const body = {
      slug: row.venueSlug.trim(),
      name: draft.businessName.trim(),
      address,
      zone: draft.zone.trim(),
      lat: draft.lat,
      lng: draft.lng,
      venueType: draft.venueType.trim(),
    };

    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/v1/internal/venues`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": token,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) return;
      const errText = await res.text().catch(() => "");
      throw new BadGatewayException(
        `catalog_venue_create_failed_${res.status}${errText ? `: ${errText.slice(0, 200)}` : ""}`,
      );
    } catch (e) {
      if (e instanceof BadGatewayException) throw e;
      throw new BadGatewayException(
        e instanceof Error ? e.message : "catalog_venue_create_unreachable",
      );
    }
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

  async listPartnerLeadsByVenue(
    identity: PartnerIdentity,
    venueSlugRaw: string,
    limit = 200,
  ): Promise<{ items: LeadSummary[]; venues: string[] } | { error: "venue_not_owned" }> {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" };
    const base = await this.listPartnerLeads(identity, limit);
    return {
      venues: [venueSlug],
      items: base.items.filter((it) => it.venueSlug === venueSlug),
    };
  }

  async updatePartnerLeadStatus(
    identity: PartnerIdentity,
    leadId: string,
    status: "contacted" | "closed",
    expectedVenueSlug?: string,
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
      if (expectedVenueSlug && currentLead.venueSlug !== expectedVenueSlug) {
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

  async updatePartnerLeadStatusByVenue(
    identity: PartnerIdentity,
    venueSlugRaw: string,
    leadId: string,
    status: "contacted" | "closed",
  ) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    return this.updatePartnerLeadStatus(identity, leadId, status, venueSlug);
  }

  private getLeadsInternalHeader():
    | { headerName: "x-internal-token"; headerValue: string }
    | null {
    const configured = this.config.get<string>("PARTNER_TO_LEADS_INTERNAL_TOKEN")?.trim();
    const isNonProduction = this.config.get<string>("NODE_ENV")?.trim() !== "production";
    const token = configured || (isNonProduction ? "change-me-dev-only" : "");
    if (token) {
      return { headerName: "x-internal-token", headerValue: token };
    }
    return null;
  }

  async getProfile(identity: PartnerIdentity) {
    const venueSlug = await this.resolveDefaultVenueSlug(identity);
    return this.getProfileByVenue(identity, venueSlug);
  }

  async getProfileByVenue(identity: PartnerIdentity, venueSlugRaw: string) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership && venueSlug !== "__global__") {
      return { error: "venue_not_owned" as const };
    }
    const row = await this.profiles.findOne({
      where: { partnerEmail: identity.email, venueSlug },
    });
    const effectiveRow = row ?? (await this.copyGlobalProfileToVenue(identity.email, venueSlug));
    if (!effectiveRow) {
      return {
        partnerEmail: identity.email,
        venueSlug,
        businessName: null,
        description: null,
        scheduleSummary: null,
        contactPhone: null,
        contactEmail: null,
        contactWhatsapp: null,
        photoUrls: [],
      };
    }
    return {
      partnerEmail: effectiveRow.partnerEmail,
      venueSlug: effectiveRow.venueSlug,
      businessName: effectiveRow.businessName,
      description: effectiveRow.description,
      scheduleSummary: effectiveRow.scheduleSummary,
      contactPhone: effectiveRow.contactPhone,
      contactEmail: effectiveRow.contactEmail,
      contactWhatsapp: effectiveRow.contactWhatsapp,
      photoUrls: effectiveRow.photoUrls ?? [],
    };
  }

  async upsertProfile(identity: PartnerIdentity, dto: UpdatePartnerProfileDto) {
    const venueSlug = await this.resolveDefaultVenueSlug(identity);
    return this.upsertProfileByVenue(identity, venueSlug, dto);
  }

  async upsertProfileByVenue(
    identity: PartnerIdentity,
    venueSlugRaw: string,
    dto: UpdatePartnerProfileDto,
  ) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership && venueSlug !== "__global__") {
      return { error: "venue_not_owned" as const };
    }
    let row = await this.profiles.findOne({
      where: { partnerEmail: identity.email, venueSlug },
    });
    if (!row) {
      row = this.profiles.create({
        partnerEmail: identity.email,
        venueSlug,
        businessName: null,
        description: null,
        scheduleSummary: null,
        contactPhone: null,
        contactEmail: null,
        contactWhatsapp: null,
        photoUrls: [],
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
    if (dto.photoUrls !== undefined) {
      row.photoUrls = sanitizePhotoUrls(dto.photoUrls);
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
      venueSlug: saved.venueSlug,
      businessName: saved.businessName,
      description: saved.description,
      scheduleSummary: saved.scheduleSummary,
      contactPhone: saved.contactPhone,
      contactEmail: saved.contactEmail,
      contactWhatsapp: saved.contactWhatsapp,
      photoUrls: saved.photoUrls ?? [],
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

  async listMyPlansByVenue(identity: PartnerIdentity, venueSlugRaw: string) {
    const venueSlug = venueSlugRaw.trim();
    const hasOwnership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!hasOwnership) return { error: "venue_not_owned" as const };
    const rows = await this.plans.find({
      where: { partnerEmail: identity.email, venueSlug },
      order: { createdAt: "DESC" },
      take: 300,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        venueSlug: r.venueSlug,
        name: r.name,
        description: r.description,
        period: r.period,
        priceLabel: r.priceLabel,
        active: r.active,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async createPlanByVenue(identity: PartnerIdentity, venueSlugRaw: string, dto: CreatePartnerPlanDto) {
    return this.createPlan(identity, { ...dto, venueSlug: venueSlugRaw.trim() });
  }

  async updatePlanByVenue(
    identity: PartnerIdentity,
    venueSlugRaw: string,
    id: string,
    dto: UpdatePartnerPlanDto,
  ) {
    const venueSlug = venueSlugRaw.trim();
    const row = await this.plans.findOne({
      where: { id, partnerEmail: identity.email, venueSlug },
    });
    if (!row) return { error: "plan_not_found" as const };
    return this.updatePlan(identity, id, dto);
  }

  async listMyVenues(identity: PartnerIdentity) {
    const rows = await this.ownerships.find({
      where: { partnerEmail: identity.email, status: "active" },
      order: { updatedAt: "DESC" },
      take: 300,
    });
    return rows.map((r) => ({
      venueSlug: r.venueSlug,
      status: r.status,
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

  async listVenuePhotos(identity: PartnerIdentity, venueSlugRaw: string) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    const rows = await this.photos.find({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
      order: { sortOrder: "ASC", createdAt: "DESC" },
      take: 50,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        venueSlug: r.venueSlug,
        url: r.url,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        sortOrder: r.sortOrder,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async addVenuePhoto(
    identity: PartnerIdentity,
    venueSlugRaw: string,
    file: { path: string; mimeType: string; sizeBytes: number; filename: string },
  ) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    const count = await this.photos.count({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (count >= 12) return { error: "photo_limit_reached" as const };
    const base = this.getPublicBaseUrl();
    const row = await this.photos.save(
      this.photos.create({
        partnerEmail: identity.email,
        venueSlug,
        url: `${base}/uploads/${encodeURIComponent(file.filename)}`,
        storagePath: file.path,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        sortOrder: count,
        status: "active",
      }),
    );
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return {
      id: row.id,
      venueSlug: row.venueSlug,
      url: row.url,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteVenuePhoto(identity: PartnerIdentity, venueSlugRaw: string, photoId: string) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    const row = await this.photos.findOne({
      where: { id: photoId, partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!row) return { error: "photo_not_found" as const };
    row.status = "deleted";
    await this.photos.save(row);
    if (existsSync(row.storagePath)) {
      try {
        unlinkSync(row.storagePath);
      } catch {
        // ignore delete failures on local file system
      }
    }
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return { id: row.id, status: "deleted" as const };
  }

  async moveVenuePhoto(
    identity: PartnerIdentity,
    venueSlugRaw: string,
    photoId: string,
    direction: "up" | "down",
  ) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    const rows = await this.photos.find({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
      order: { sortOrder: "ASC", createdAt: "ASC" },
      take: 100,
    });
    const index = rows.findIndex((r) => r.id === photoId);
    if (index < 0) return { error: "photo_not_found" as const };
    if (rows.length < 2) return { ok: true as const };
    if (direction === "up" && index > 0) {
      const current = rows[index]!;
      const prev = rows[index - 1]!;
      const tmp = current.sortOrder;
      current.sortOrder = prev.sortOrder;
      prev.sortOrder = tmp;
      await this.photos.save([current, prev]);
    } else if (direction === "down" && index < rows.length - 1) {
      const current = rows[index]!;
      const next = rows[index + 1]!;
      const tmp = current.sortOrder;
      current.sortOrder = next.sortOrder;
      next.sortOrder = tmp;
      await this.photos.save([current, next]);
    }
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return { ok: true as const };
  }

  async reorderVenuePhotos(identity: PartnerIdentity, venueSlugRaw: string, photoIds: string[]) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    const rows = await this.photos.find({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
      order: { sortOrder: "ASC", createdAt: "ASC" },
      take: 100,
    });
    if (rows.length === 0) return { ok: true as const };
    const rowMap = new Map(rows.map((row) => [row.id, row] as const));
    if (photoIds.length !== rows.length) return { error: "photo_order_mismatch" as const };
    const seen = new Set<string>();
    for (const id of photoIds) {
      if (!rowMap.has(id) || seen.has(id)) return { error: "photo_order_mismatch" as const };
      seen.add(id);
    }
    const updates: PartnerVenuePhotoEntity[] = [];
    for (let i = 0; i < photoIds.length; i++) {
      const row = rowMap.get(photoIds[i]!);
      if (!row) return { error: "photo_order_mismatch" as const };
      if (row.sortOrder !== i) {
        row.sortOrder = i;
        updates.push(row);
      }
    }
    if (updates.length > 0) {
      await this.photos.save(updates);
      await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    }
    return { ok: true as const };
  }

  async setVenuePhotoAsCover(identity: PartnerIdentity, venueSlugRaw: string, photoId: string) {
    const venueSlug = venueSlugRaw.trim();
    const ownership = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
    });
    if (!ownership) return { error: "venue_not_owned" as const };
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    const rows = await this.photos.find({
      where: { partnerEmail: identity.email, venueSlug, status: "active" },
      order: { sortOrder: "ASC", createdAt: "ASC" },
      take: 100,
    });
    const index = rows.findIndex((r) => r.id === photoId);
    if (index < 0) return { error: "photo_not_found" as const };
    if (index === 0) return { ok: true as const };
    const current = rows[index]!;
    rows.splice(index, 1);
    rows.unshift(current);
    const updates: PartnerVenuePhotoEntity[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      if (row.sortOrder !== i) {
        row.sortOrder = i;
        updates.push(row);
      }
    }
    if (updates.length > 0) {
      await this.photos.save(updates);
      await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    }
    return { ok: true as const };
  }

  private async enqueueVenueCatalogSync(
    partnerEmail: string,
    venueSlug: string,
  ): Promise<void> {
    const profile =
      (await this.profiles.findOne({ where: { partnerEmail, venueSlug } })) ??
      (await this.profiles.findOne({ where: { partnerEmail, venueSlug: "__global__" } }));
    const plans = await this.plans.find({
      where: { partnerEmail, venueSlug },
      order: { createdAt: "DESC" },
      take: 20,
    });
    const photos = await this.photos.find({
      where: { partnerEmail, venueSlug, status: "active" },
      order: { sortOrder: "ASC", createdAt: "DESC" },
      take: 12,
    });
    const payload = {
      description: profile?.description ?? undefined,
      contactPhone: profile?.contactPhone ?? undefined,
      contactEmail: profile?.contactEmail ?? undefined,
      contactWhatsapp: profile?.contactWhatsapp ?? undefined,
      photoUrls: photos.map((p) => p.url),
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

  private getPublicBaseUrl(): string {
    return (
      this.config.get<string>("PARTNER_PUBLIC_BASE_URL")?.trim().replace(/\/$/, "") ||
      "http://localhost:4013"
    );
  }

  private async resolveDefaultVenueSlug(identity: PartnerIdentity): Promise<string> {
    const link = await this.ownerships.findOne({
      where: { partnerEmail: identity.email, status: "active" },
      order: { updatedAt: "DESC" },
    });
    return link?.venueSlug ?? "__global__";
  }

  private async normalizeVenuePhotoOrder(partnerEmail: string, venueSlug: string): Promise<void> {
    const rows = await this.photos.find({
      where: { partnerEmail, venueSlug, status: "active" },
      order: { sortOrder: "ASC", createdAt: "ASC" },
      take: 100,
    });
    let changed = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      if (row.sortOrder !== i) {
        row.sortOrder = i;
        changed = true;
      }
    }
    if (changed) {
      await this.photos.save(rows);
    }
  }

  private async copyGlobalProfileToVenue(
    partnerEmail: string,
    venueSlug: string,
  ): Promise<PartnerProfileEntity | null> {
    if (!venueSlug || venueSlug === "__global__") return null;
    const legacy = await this.profiles.findOne({
      where: { partnerEmail, venueSlug: "__global__" },
    });
    if (!legacy) return null;
    const copy = this.profiles.create({
      partnerEmail,
      venueSlug,
      businessName: legacy.businessName,
      description: legacy.description,
      scheduleSummary: legacy.scheduleSummary,
      contactPhone: legacy.contactPhone,
      contactEmail: legacy.contactEmail,
      contactWhatsapp: legacy.contactWhatsapp,
      photoUrls: legacy.photoUrls ?? [],
    });
    return this.profiles.save(copy);
  }

  /**
   * Admin catalog UI acts as the first active owner for the venue, or as
   * ADMIN_CATALOG_DELEGATE_EMAIL when there is no ownership (optional env).
   */
  private async resolveDelegatedPartnerIdentityForVenue(
    venueSlugRaw: string,
  ): Promise<
    { identity: PartnerIdentity } | { error: "venue_delegate_not_configured" }
  > {
    const venueSlug = venueSlugRaw.trim();
    if (!venueSlug || venueSlug === "__global__") {
      return { error: "venue_delegate_not_configured" };
    }
    const owners = await this.ownerships.find({
      where: { venueSlug, status: "active" },
      order: { createdAt: "ASC" },
      take: 20,
    });
    if (owners.length > 0) {
      const email = owners[0]!.partnerEmail;
      return { identity: { email, subject: email } };
    }
    const delegate = this.config
      .get<string>("ADMIN_CATALOG_DELEGATE_EMAIL")
      ?.trim()
      .toLowerCase();
    if (!delegate) {
      return { error: "venue_delegate_not_configured" };
    }
    await this.ensureActiveOwnership(delegate, venueSlug);
    return { identity: { email: delegate, subject: delegate } };
  }

  private async ensureActiveOwnership(
    partnerEmail: string,
    venueSlug: string,
  ): Promise<void> {
    const existing = await this.ownerships.findOne({
      where: { partnerEmail, venueSlug },
    });
    if (!existing) {
      await this.ownerships.save(
        this.ownerships.create({
          partnerEmail,
          venueSlug,
          status: "active",
        }),
      );
      return;
    }
    if (existing.status !== "active") {
      existing.status = "active";
      await this.ownerships.save(existing);
    }
  }

  async adminCatalogGetProfile(venueSlug: string) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.getProfileByVenue(r.identity, venueSlug);
  }

  async adminCatalogUpsertProfile(
    venueSlug: string,
    dto: UpdatePartnerProfileDto,
  ) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.upsertProfileByVenue(r.identity, venueSlug, dto);
  }

  async adminCatalogListPlans(venueSlug: string) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.listMyPlansByVenue(r.identity, venueSlug);
  }

  async adminCatalogCreatePlan(
    venueSlug: string,
    dto: {
      name: string;
      description?: string;
      period?: string;
      priceLabel?: string;
    },
  ) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.createPlanByVenue(r.identity, venueSlug, {
      venueSlug,
      name: dto.name,
      description: dto.description,
      period: dto.period,
      priceLabel: dto.priceLabel,
    });
  }

  async adminCatalogUpdatePlan(
    venueSlug: string,
    planId: string,
    dto: UpdatePartnerPlanDto,
  ) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.updatePlanByVenue(r.identity, venueSlug, planId, dto);
  }

  async adminCatalogListLeads(venueSlug: string, limit: number) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.listPartnerLeadsByVenue(r.identity, venueSlug, limit);
  }

  async adminCatalogUpdateLeadStatus(
    venueSlug: string,
    leadId: string,
    status: "contacted" | "closed",
  ) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.updatePartnerLeadStatusByVenue(r.identity, venueSlug, leadId, status);
  }

  async adminCatalogListPhotos(venueSlug: string) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.listVenuePhotos(r.identity, venueSlug);
  }

  async adminCatalogAddPhoto(
    venueSlug: string,
    file: { path: string; mimeType: string; sizeBytes: number; filename: string },
  ) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.addVenuePhoto(r.identity, venueSlug, file);
  }

  async adminCatalogDeletePhoto(venueSlug: string, photoId: string) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.deleteVenuePhoto(r.identity, venueSlug, photoId);
  }

  async adminCatalogMovePhoto(
    venueSlug: string,
    photoId: string,
    direction: "up" | "down",
  ) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.moveVenuePhoto(r.identity, venueSlug, photoId, direction);
  }

  async adminCatalogReorderPhotos(venueSlug: string, photoIds: string[]) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.reorderVenuePhotos(r.identity, venueSlug, photoIds);
  }

  async adminCatalogSetCoverPhoto(venueSlug: string, photoId: string) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.setVenuePhotoAsCover(r.identity, venueSlug, photoId);
  }
}

function sanitizePhotoUrls(items: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of items) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    cleaned.push(value);
    if (cleaned.length >= 12) break;
  }
  return cleaned;
}
