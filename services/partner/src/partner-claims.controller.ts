import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { AdminApiGuard } from "./admin-api.guard";
import { CreatePartnerPlanDto } from "./dto/create-partner-plan.dto";
import { CreatePartnerClaimDto } from "./dto/create-partner-claim.dto";
import { RevokeOwnershipDto } from "./dto/revoke-ownership.dto";
import { UpdatePartnerLeadStatusDto } from "./dto/update-partner-lead-status.dto";
import { UpdatePartnerPlanDto } from "./dto/update-partner-plan.dto";
import { UpdatePartnerClaimStatusDto } from "./dto/update-partner-claim-status.dto";
import { UpdatePartnerProfileDto } from "./dto/update-partner-profile.dto";
import { PartnerAuthGuard } from "./partner-auth.guard";
import { PartnerClaimsService } from "./partner-claims.service";

@Controller()
export class PartnerClaimsController {
  constructor(private readonly claims: PartnerClaimsService) {}

  @Post("v1/partner/claims")
  async create(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreatePartnerClaimDto,
  ) {
    return this.claims.create(dto);
  }

  @Get("v1/partner/me/leads")
  @UseGuards(PartnerAuthGuard)
  async myLeads(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Query("limit") limitRaw?: string,
  ) {
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    const identity = req.partnerIdentity;
    if (!identity) {
      return { items: [], venues: [] };
    }
    return this.claims.listPartnerLeads(identity, limit);
  }

  @Patch("v1/partner/me/leads/:id/status")
  @UseGuards(PartnerAuthGuard)
  async patchMyLeadStatus(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerLeadStatusDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const updated = await this.claims.updatePartnerLeadStatus(identity, id, dto.status);
    if ("error" in updated) {
      if (updated.error === "lead_not_found") {
        throw new ForbiddenException("lead_not_found");
      }
      if (updated.error === "lead_not_owned") {
        throw new ForbiddenException("lead_not_owned");
      }
      if (updated.error === "integration_not_configured") {
        throw new ForbiddenException("leads_integration_not_configured");
      }
      throw new ForbiddenException("lead_status_update_failed");
    }
    return updated;
  }

  @Get("v1/partner/me/profile")
  @UseGuards(PartnerAuthGuard)
  async myProfile(@Req() req: { partnerIdentity?: { subject: string; email: string } }) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    return this.claims.getProfile(identity);
  }

  @Put("v1/partner/me/profile")
  @UseGuards(PartnerAuthGuard)
  async updateProfile(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerProfileDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    return this.claims.upsertProfile(identity, dto);
  }

  @Get("v1/partner/me/plans")
  @UseGuards(PartnerAuthGuard)
  async myPlans(@Req() req: { partnerIdentity?: { subject: string; email: string } }) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    return { items: await this.claims.listMyPlans(identity) };
  }

  @Post("v1/partner/me/plans")
  @UseGuards(PartnerAuthGuard)
  async createPlan(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreatePartnerPlanDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const created = await this.claims.createPlan(identity, dto);
    if ("error" in created) {
      throw new ForbiddenException(created.error);
    }
    return created;
  }

  @Patch("v1/partner/me/plans/:id")
  @UseGuards(PartnerAuthGuard)
  async patchPlan(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerPlanDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const updated = await this.claims.updatePlan(identity, id, dto);
    if ("error" in updated) throw new ForbiddenException(updated.error);
    return updated;
  }

  @Get("v1/admin/partner/claims")
  @UseGuards(AdminApiGuard)
  async listRecent(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    const items = await this.claims.listRecent(limit);
    return {
      items: items.map((it) => ({
        id: it.id,
        venueSlug: it.venueSlug,
        representativeName: it.representativeName,
        representativeEmail: it.representativeEmail,
        representativePhone: it.representativePhone,
        evidence: it.evidence,
        status: it.status,
        createdAt: it.createdAt.toISOString(),
      })),
    };
  }

  @Post("v1/admin/partner/claims/:id/status")
  @UseGuards(AdminApiGuard)
  async setStatus(
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerClaimStatusDto,
  ) {
    return this.claims.updateStatus(id, dto.status);
  }

  @Get("v1/admin/partner/catalog-sync/failures")
  @UseGuards(AdminApiGuard)
  async listCatalogSyncFailures(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "100", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 100;
    return { items: await this.claims.listCatalogSyncFailures(limit) };
  }

  @Post("v1/admin/partner/catalog-sync/retry")
  @UseGuards(AdminApiGuard)
  async retryCatalogSyncFailures(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "50", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 50;
    return this.claims.retryCatalogSyncFailures(limit);
  }

  @Get("v1/admin/partner/catalog-sync/outbox/failures")
  @UseGuards(AdminApiGuard)
  async listCatalogSyncOutboxFailures(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "100", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 100;
    return { items: await this.claims.listCatalogSyncOutboxFailures(limit) };
  }

  @Post("v1/admin/partner/catalog-sync/outbox/retry")
  @UseGuards(AdminApiGuard)
  async retryCatalogSyncOutboxFailures(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "50", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 50;
    return this.claims.retryCatalogSyncOutboxFailures(limit);
  }

  @Get("v1/admin/partner/ownerships")
  @UseGuards(AdminApiGuard)
  async listOwnerships(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    return { items: await this.claims.listOwnerships(limit) };
  }

  @Post("v1/admin/partner/ownerships/:id/revoke")
  @UseGuards(AdminApiGuard)
  async revokeOwnership(
    @Req() req: { adminIdentity?: { subject: string; email: string | null } },
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RevokeOwnershipDto,
  ) {
    const identity = req.adminIdentity;
    const actor = identity?.email ?? identity?.subject ?? "unknown_admin";
    return this.claims.revokeOwnership(id, { actor, reason: dto.reason });
  }

  @Get("v1/admin/partner/ownership-audit")
  @UseGuards(AdminApiGuard)
  async listOwnershipAudit(
    @Query("limit") limitRaw?: string,
    @Query("partnerEmail") partnerEmailRaw?: string,
    @Query("venueSlug") venueSlugRaw?: string,
  ) {
    const n = Number.parseInt(limitRaw ?? "100", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 100;
    const partnerEmail = partnerEmailRaw?.trim().toLowerCase() || undefined;
    const venueSlug = venueSlugRaw?.trim() || undefined;
    return {
      items: await this.claims.listOwnershipAudit(limit, { partnerEmail, venueSlug }),
    };
  }
}
