import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { basename } from "node:path";
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
import {
  extractInstagramFromDescription,
  extractWebsiteFromDescription,
  normalizeInstagramHandle,
  normalizeWebsiteUrl,
} from "./venue-social";

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
    const base = {
      partnerEmail: identity.email,
      venueSlug,
      businessName: effectiveRow?.businessName ?? null,
      description: effectiveRow?.description ?? null,
      scheduleSummary: effectiveRow?.scheduleSummary ?? null,
      contactPhone: effectiveRow?.contactPhone ?? null,
      contactEmail: effectiveRow?.contactEmail ?? null,
      contactWhatsapp: effectiveRow?.contactWhatsapp ?? null,
      photoUrls: effectiveRow?.photoUrls ?? [],
      modalities: effectiveRow?.modalities ?? [],
      amenities: effectiveRow?.amenities ?? [],
      venueTypes: effectiveRow?.venueTypes ?? [],
      address: effectiveRow?.address ?? null,
      zone: effectiveRow?.zone ?? null,
      stateCode: effectiveRow?.stateCode ?? null,
      cityId: effectiveRow?.cityId ?? null,
      zoneId: effectiveRow?.zoneId ?? null,
      lat: effectiveRow?.lat ?? null,
      lng: effectiveRow?.lng ?? null,
      instagramHandle: effectiveRow?.instagramHandle ?? null,
      websiteUrl: effectiveRow?.websiteUrl ?? null,
    };
    return this.mergeCatalogSnapshotIntoProfile(base);
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
        modalities: [],
        amenities: [],
        venueTypes: [],
        address: null,
        zone: null,
        stateCode: null,
        cityId: null,
        zoneId: null,
        lat: null,
        lng: null,
        instagramHandle: null,
        websiteUrl: null,
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
    if (dto.modalities !== undefined) {
      row.modalities = normalizeSlugList(dto.modalities);
    }
    if (dto.amenities !== undefined) {
      row.amenities = normalizeSlugList(dto.amenities);
    }
    if (dto.venueTypes !== undefined) {
      row.venueTypes = normalizeSlugList(dto.venueTypes).slice(0, 12);
    }
    if (dto.address !== undefined) row.address = dto.address.trim() || null;
    if (dto.zone !== undefined) row.zone = dto.zone.trim() || null;
    if (dto.stateCode !== undefined) row.stateCode = dto.stateCode.trim() || null;
    if (dto.cityId !== undefined) row.cityId = dto.cityId.trim() || null;
    if (dto.zoneId !== undefined) row.zoneId = dto.zoneId.trim() || null;
    if (dto.lat !== undefined) {
      row.lat = Number.isFinite(dto.lat) ? dto.lat : null;
    }
    if (dto.lng !== undefined) {
      row.lng = Number.isFinite(dto.lng) ? dto.lng : null;
    }
    if (dto.instagramHandle !== undefined) {
      const trimmed = dto.instagramHandle.trim();
      if (!trimmed) {
        row.instagramHandle = "";
      } else {
        const normalized = normalizeInstagramHandle(trimmed);
        if (normalized) row.instagramHandle = normalized;
      }
    }
    if (dto.websiteUrl !== undefined) {
      const trimmed = dto.websiteUrl.trim();
      if (!trimmed) {
        row.websiteUrl = "";
      } else {
        const normalized = normalizeWebsiteUrl(trimmed);
        if (normalized) row.websiteUrl = normalized;
      }
    }
    const saved = await this.profiles.save(row);
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return this.mergeCatalogSnapshotIntoProfile({
      partnerEmail: saved.partnerEmail,
      venueSlug: saved.venueSlug,
      businessName: saved.businessName,
      description: saved.description,
      scheduleSummary: saved.scheduleSummary,
      contactPhone: saved.contactPhone,
      contactEmail: saved.contactEmail,
      contactWhatsapp: saved.contactWhatsapp,
      photoUrls: saved.photoUrls ?? [],
      modalities: saved.modalities ?? [],
      amenities: saved.amenities ?? [],
      venueTypes: saved.venueTypes ?? [],
      address: saved.address ?? null,
      zone: saved.zone ?? null,
      stateCode: saved.stateCode ?? null,
      cityId: saved.cityId ?? null,
      zoneId: saved.zoneId ?? null,
      lat: saved.lat ?? null,
      lng: saved.lng ?? null,
      instagramHandle: saved.instagramHandle ?? null,
      websiteUrl: saved.websiteUrl ?? null,
    });
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
    let rows = await this.plans.find({
      where: { partnerEmail: identity.email, venueSlug },
      order: { createdAt: "DESC" },
      take: 300,
    });
    if (rows.length === 0) {
      const seeded = await this.seedPartnerPlansFromCatalog(identity.email, venueSlug);
      if (seeded > 0) {
        rows = await this.plans.find({
          where: { partnerEmail: identity.email, venueSlug },
          order: { createdAt: "DESC" },
          take: 300,
        });
      }
    }
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

  async deletePlanByVenue(identity: PartnerIdentity, venueSlugRaw: string, id: string) {
    const venueSlug = venueSlugRaw.trim();
    const row = await this.plans.findOne({
      where: { id, partnerEmail: identity.email, venueSlug },
    });
    if (!row) return { error: "plan_not_found" as const };
    await this.plans.remove(row);
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return { id, status: "deleted" as const };
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
    let repaired = false;
    for (const row of rows) {
      const nextUrl = this.rewritePublicMediaUrl(row.url);
      if (nextUrl !== row.url) {
        row.url = nextUrl;
        repaired = true;
      }
    }
    if (repaired) {
      await this.photos.save(rows);
      await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    }
    return {
      items: rows.map((r) => ({
        id: r.id,
        venueSlug: r.venueSlug,
        url: this.publicPhotoUrl(r),
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        sortOrder: r.sortOrder,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
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
    const filename = basename(file.filename);
    const publicUrl = `${this.getPublicBaseUrl()}/uploads/${encodeURIComponent(filename)}`;
    let blobBase64: string | null = null;
    try {
      if (existsSync(file.path)) {
        blobBase64 = readFileSync(file.path).toString("base64");
      }
    } catch {
      blobBase64 = null;
    }
    const row = await this.photos.save(
      this.photos.create({
        partnerEmail: identity.email,
        venueSlug,
        url: publicUrl,
        storagePath: file.path,
        filename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        blobBase64,
        sortOrder: count,
        status: "active",
      }),
    );
    await this.normalizeVenuePhotoOrder(identity.email, venueSlug);
    await this.enqueueVenueCatalogSync(identity.email, venueSlug);
    return {
      id: row.id,
      venueSlug: row.venueSlug,
      url: this.publicPhotoUrl(row),
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
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
    await this.photos.update(
      { id: row.id },
      { status: "deleted", blobBase64: null },
    );
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
      name: profile?.businessName ?? undefined,
      description: profile?.description ?? undefined,
      scheduleSummary: profile?.scheduleSummary ?? undefined,
      contactPhone: profile?.contactPhone ?? undefined,
      contactEmail: profile?.contactEmail ?? undefined,
      contactWhatsapp: profile?.contactWhatsapp ?? undefined,
      modalities: profile?.modalities ?? undefined,
      amenities: profile?.amenities ?? undefined,
      ...(derivePrimaryVenueType(profile?.venueTypes ?? [])
        ? { venueType: derivePrimaryVenueType(profile?.venueTypes ?? [])! }
        : {}),
      ...(profile?.address?.trim() ? { address: profile.address.trim() } : {}),
      ...(profile?.zone?.trim() ? { zone: profile.zone.trim() } : {}),
      ...(profile?.stateCode?.trim()
        ? { stateCode: profile.stateCode.trim() }
        : {}),
      ...(profile?.cityId?.trim() ? { cityId: profile.cityId.trim() } : {}),
      ...(profile?.zoneId?.trim() ? { zoneId: profile.zoneId.trim() } : {}),
      ...(profile?.lat != null && Number.isFinite(profile.lat)
        ? { lat: profile.lat }
        : {}),
      ...(profile?.lng != null && Number.isFinite(profile.lng)
        ? { lng: profile.lng }
        : {}),
      ...(profile && profile.instagramHandle !== null
        ? { instagramHandle: profile.instagramHandle || "" }
        : {}),
      ...(profile && profile.websiteUrl !== null
        ? { websiteUrl: profile.websiteUrl || "" }
        : {}),
      // Never send empty photoUrls — that would wipe catalog gallery on profile-only saves.
      ...(photos.length > 0
        ? { photoUrls: photos.map((p) => this.rewritePublicMediaUrl(p.url)) }
        : {}),
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

  private publicPhotoUrl(row: {
    url: string;
    filename?: string | null;
    updatedAt?: Date;
  }): string {
    const base = this.rewritePublicMediaUrl(row.url);
    const v = row.updatedAt?.getTime?.();
    if (!v) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}v=${v}`;
  }

  private getPublicBaseUrl(): string {
    const configured = this.config
      .get<string>("PARTNER_PUBLIC_BASE_URL")
      ?.trim()
      .replace(/\/$/, "");
    if (configured) return configured;
    const railwayDomain = this.config
      .get<string>("RAILWAY_PUBLIC_DOMAIN")
      ?.trim()
      .replace(/\/$/, "");
    if (railwayDomain) {
      return railwayDomain.startsWith("http")
        ? railwayDomain
        : `https://${railwayDomain}`;
    }
    return "http://localhost:4013";
  }

  /** Rewrite local-dev partner upload URLs to the public base used in staging/prod. */
  private rewritePublicMediaUrl(url: string): string {
    const raw = url?.trim();
    if (!raw) return raw;
    try {
      const parsed = new URL(raw);
      const isLocalPartnerHost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      const isPartnerPort =
        parsed.port === "4013" || (parsed.port === "" && parsed.protocol === "http:");
      if (
        isLocalPartnerHost &&
        isPartnerPort &&
        parsed.pathname.startsWith("/uploads/")
      ) {
        return `${this.getPublicBaseUrl()}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // keep original if not a valid absolute URL
    }
    return raw;
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
      modalities: legacy.modalities ?? [],
      amenities: legacy.amenities ?? [],
      venueTypes: legacy.venueTypes ?? [],
      address: legacy.address ?? null,
      zone: legacy.zone ?? null,
      stateCode: legacy.stateCode ?? null,
      cityId: legacy.cityId ?? null,
      zoneId: legacy.zoneId ?? null,
      lat: legacy.lat ?? null,
      lng: legacy.lng ?? null,
      instagramHandle: legacy.instagramHandle ?? null,
      websiteUrl: legacy.websiteUrl ?? null,
    });
    return this.profiles.save(copy);
  }

  private async mergeCatalogSnapshotIntoProfile(base: {
    partnerEmail: string;
    venueSlug: string;
    businessName: string | null;
    description: string | null;
    scheduleSummary: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    contactWhatsapp: string | null;
    photoUrls: string[];
    modalities: string[];
    amenities: string[];
    venueTypes: string[];
    address: string | null;
    zone: string | null;
    stateCode: string | null;
    cityId: string | null;
    zoneId: string | null;
    lat: number | null;
    lng: number | null;
    /** null = never set (hydrate); "" = cleared; value = handle without @ */
    instagramHandle: string | null;
    websiteUrl: string | null;
  }) {
    const catalog = await this.fetchCatalogVenueSnapshot(base.venueSlug);
    const scheduleFromCatalog = catalog
      ? extractScheduleSummaryFromDescription(catalog.description)
      : null;
    const descriptionFromCatalog = catalog
      ? stripScheduleAndPlansFromDescription(catalog.description)
      : null;
    const modalities =
      base.modalities.length > 0
        ? base.modalities
        : (catalog?.modalities ?? []);
    const amenities =
      base.amenities.length > 0 ? base.amenities : (catalog?.amenities ?? []);
    const venueTypes =
      base.venueTypes.length > 0
        ? base.venueTypes
        : catalog?.venueType
          ? [catalog.venueType]
          : [];
    const catalogPhotoUrls = (catalog?.photoUrls ?? []).map((u) =>
      this.rewritePublicMediaUrl(u),
    );
    const lat =
      base.lat != null && Number.isFinite(base.lat)
        ? base.lat
        : (catalog?.lat ?? null);
    const lng =
      base.lng != null && Number.isFinite(base.lng)
        ? base.lng
        : (catalog?.lng ?? null);
    const instagramHandle =
      base.instagramHandle !== null
        ? normalizeInstagramHandle(base.instagramHandle)
        : (normalizeInstagramHandle(catalog?.instagramHandle) ??
          extractInstagramFromDescription(catalog?.description) ??
          null);
    const websiteUrl =
      base.websiteUrl !== null
        ? normalizeWebsiteUrl(base.websiteUrl)
        : (normalizeWebsiteUrl(catalog?.websiteUrl) ??
          extractWebsiteFromDescription(catalog?.description) ??
          null);
    return {
      ...base,
      businessName: base.businessName?.trim() || catalog?.name || null,
      description: base.description?.trim() || descriptionFromCatalog || null,
      scheduleSummary:
        base.scheduleSummary?.trim() || scheduleFromCatalog || null,
      contactPhone: base.contactPhone?.trim() || catalog?.contactPhone || null,
      contactEmail: base.contactEmail?.trim() || catalog?.contactEmail || null,
      contactWhatsapp:
        base.contactWhatsapp?.trim() || catalog?.contactWhatsapp || null,
      modalities,
      amenities,
      venueTypes,
      venueType:
        derivePrimaryVenueType(venueTypes) || catalog?.venueType || null,
      address: base.address?.trim() || catalog?.address || null,
      zone: base.zone?.trim() || catalog?.zone || null,
      stateCode: base.stateCode?.trim() || catalog?.stateCode || null,
      cityId: base.cityId?.trim() || catalog?.cityId || null,
      zoneId: base.zoneId?.trim() || catalog?.zoneId || null,
      lat,
      lng,
      instagramHandle,
      websiteUrl,
      catalogPhotoUrls,
      photoUrls: (base.photoUrls ?? []).map((u) => this.rewritePublicMediaUrl(u)),
      hydratedFromCatalog: Boolean(catalog),
    };
  }

  private resolveCatalogBaseUrl(): string {
    const configured = this.config.get<string>("CATALOG_SERVICE_URL")?.trim();
    if (configured) return configured.replace(/\/$/, "");
    const railwayHost = this.config
      .get<string>("RAILWAY_SERVICE__FLOIT_CATALOG_SERVICE_URL")
      ?.trim();
    if (railwayHost) {
      return railwayHost.startsWith("http")
        ? railwayHost.replace(/\/$/, "")
        : `https://${railwayHost.replace(/\/$/, "")}`;
    }
    return "http://localhost:4010";
  }

  private async fetchCatalogVenueSnapshot(venueSlug: string): Promise<{
    name: string;
    description: string | null;
    venueType: string;
    zone: string;
    address: string;
    lat: number | null;
    lng: number | null;
    stateCode: string | null;
    cityId: string | null;
    zoneId: string | null;
    instagramHandle: string | null;
    websiteUrl: string | null;
    modalities: string[];
    amenities: string[];
    contactPhone: string | null;
    contactEmail: string | null;
    contactWhatsapp: string | null;
    photoUrls: string[];
    plans: Array<{
      name: string;
      description: string | null;
      period: string | null;
      priceLabel: string | null;
      active: boolean;
    }>;
  } | null> {
    if (!venueSlug || venueSlug === "__global__") return null;
    const candidates = Array.from(
      new Set(
        [
          this.resolveCatalogBaseUrl(),
          this.config
            .get<string>("RAILWAY_SERVICE__FLOIT_CATALOG_SERVICE_URL")
            ?.trim()
            ? `https://${this.config
                .get<string>("RAILWAY_SERVICE__FLOIT_CATALOG_SERVICE_URL")!
                .trim()
                .replace(/^https?:\/\//, "")
                .replace(/\/$/, "")}`
            : "",
          "https://floitcatalog-service-production.up.railway.app",
        ].filter(Boolean),
      ),
    );
    for (const base of candidates) {
      try {
        const res = await fetch(
          `${base.replace(/\/$/, "")}/v1/venues/${encodeURIComponent(venueSlug)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) continue;
        const body = (await res.json()) as {
          name?: string;
          description?: string | null;
          venueType?: string;
          zone?: string;
          address?: string;
          lat?: number;
          lng?: number;
          stateCode?: string | null;
          cityId?: string | null;
          zoneId?: string | null;
          instagramHandle?: string | null;
          websiteUrl?: string | null;
          modalities?: string[];
          amenities?: string[];
          contactPhone?: string | null;
          contactEmail?: string | null;
          contactWhatsapp?: string | null;
          photoUrls?: string[] | null;
          plans?: Array<{
            name?: string;
            description?: string | null;
            period?: string | null;
            priceLabel?: string | null;
            active?: boolean;
          }> | null;
        };
        const structuredPlans = Array.isArray(body.plans)
          ? body.plans
              .filter((p) => p?.name?.trim())
              .map((p) => ({
                name: p.name!.trim(),
                description: p.description?.trim() || null,
                period: p.period?.trim() || null,
                priceLabel: p.priceLabel?.trim() || null,
                active: p.active !== false,
              }))
          : [];
        const fromDescription =
          structuredPlans.length > 0
            ? []
            : parsePlansFromDescription(body.description);
        return {
          name: body.name?.trim() || "",
          description: body.description ?? null,
          venueType: body.venueType?.trim() || "",
          zone: body.zone?.trim() || "",
          address: body.address?.trim() || "",
          lat:
            body.lat != null && Number.isFinite(Number(body.lat))
              ? Number(body.lat)
              : null,
          lng:
            body.lng != null && Number.isFinite(Number(body.lng))
              ? Number(body.lng)
              : null,
          stateCode: body.stateCode?.trim() || null,
          cityId: body.cityId?.trim() || null,
          zoneId: body.zoneId?.trim() || null,
          instagramHandle:
            normalizeInstagramHandle(body.instagramHandle) ??
            extractInstagramFromDescription(body.description) ??
            null,
          websiteUrl:
            normalizeWebsiteUrl(body.websiteUrl) ??
            extractWebsiteFromDescription(body.description) ??
            null,
          modalities: Array.isArray(body.modalities) ? body.modalities : [],
          amenities: Array.isArray(body.amenities) ? body.amenities : [],
          contactPhone: body.contactPhone ?? null,
          contactEmail: body.contactEmail ?? null,
          contactWhatsapp: body.contactWhatsapp ?? null,
          photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
          plans: structuredPlans.length > 0 ? structuredPlans : fromDescription,
        };
      } catch {
        /* try next candidate */
      }
    }
    return null;
  }

  /** Import catalog plans into partner DB once so the admin panel can edit them. */
  private async seedPartnerPlansFromCatalog(
    partnerEmail: string,
    venueSlug: string,
  ): Promise<number> {
    const catalog = await this.fetchCatalogVenueSnapshot(venueSlug);
    const source = catalog?.plans ?? [];
    if (source.length === 0) return 0;
    const rows = source.slice(0, 20).map((p) =>
      this.plans.create({
        partnerEmail,
        venueSlug,
        name: p.name.slice(0, 120),
        description: p.description,
        period: p.period,
        priceLabel: p.priceLabel,
        active: p.active !== false,
      }),
    );
    await this.plans.save(rows);
    await this.enqueueVenueCatalogSync(partnerEmail, venueSlug);
    return rows.length;
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

  async adminCatalogDeletePlan(venueSlug: string, planId: string) {
    const r = await this.resolveDelegatedPartnerIdentityForVenue(venueSlug);
    if ("error" in r) return r;
    return this.deletePlanByVenue(r.identity, venueSlug, planId);
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

function derivePrimaryVenueType(types: string[]): string | null {
  const cleaned = Array.from(
    new Set(types.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  );
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0]!;
  return "mixed";
}

function normalizeSlugList(items: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of items) {
    const value = raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!value || seen.has(value)) continue;
    seen.add(value);
    cleaned.push(value);
    if (cleaned.length >= 40) break;
  }
  return cleaned;
}

function stripScheduleAndPlansFromDescription(
  description: string | null | undefined,
): string | null {
  if (!description?.trim()) return null;
  return description
    .replace(/\n*\nHorarios:\n[\s\S]*$/i, "")
    .replace(/\n*\nPlanes:\n[\s\S]*$/i, "")
    .trim() || null;
}

function extractScheduleSummaryFromDescription(
  description: string | null | undefined,
): string | null {
  if (!description) return null;
  const match = description.match(/\nHorarios:\n([\s\S]*?)(?:\nPlanes:|$)/i);
  const value = match?.[1]?.trim();
  return value || null;
}

function parsePlansFromDescription(
  description: string | null | undefined,
): Array<{
  name: string;
  description: string | null;
  period: string | null;
  priceLabel: string | null;
  active: boolean;
}> {
  if (!description) return [];
  const match = description.match(/\nPlanes:\n([\s\S]*)$/i);
  const block = match?.[1]?.trim();
  if (!block) return [];
  const out: Array<{
    name: string;
    description: string | null;
    period: string | null;
    priceLabel: string | null;
    active: boolean;
  }> = [];
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/^\s*[-•*]\s*/, "").trim();
    if (!line) continue;
    const parts = line.split("·").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) continue;
    const name = parts[0]!;
    let period: string | null = null;
    let priceLabel: string | null = null;
    let desc: string | null = null;
    for (const part of parts.slice(1)) {
      if (/^\$?\d/.test(part) || /consultar/i.test(part)) {
        priceLabel = part;
      } else if (
        /mensual|anual|mes|trim|una vez|clase|sesión/i.test(part) &&
        !period
      ) {
        period = part;
      } else if (!desc) {
        desc = part;
      }
    }
    out.push({
      name: name.slice(0, 120),
      description: desc,
      period,
      priceLabel,
      active: true,
    });
    if (out.length >= 20) break;
  }
  return out;
}
