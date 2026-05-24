import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  GoneException,
  HttpCode,
  PayloadTooLargeException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Request } from "express";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { AdminApiGuard } from "./admin-api.guard";
import { CreateVenuePartnerPlanDto } from "./dto/create-venue-partner-plan.dto";
import { CreatePartnerClaimDto } from "./dto/create-partner-claim.dto";
import { MovePartnerVenuePhotoDto } from "./dto/move-partner-venue-photo.dto";
import { ReorderPartnerVenuePhotosDto } from "./dto/reorder-partner-venue-photos.dto";
import { SetCoverPartnerVenuePhotoDto } from "./dto/set-cover-partner-venue-photo.dto";
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
  async myLeads() {
    throw new GoneException("deprecated_use_venue_scoped_leads_endpoint");
  }

  @Get("v1/partner/me/venues/:venueSlug/leads")
  @UseGuards(PartnerAuthGuard)
  async myVenueLeads(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Query("limit") limitRaw?: string,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    const result = await this.claims.listPartnerLeadsByVenue(identity, venueSlug, limit);
    if ("error" in result) throw new ForbiddenException(result.error);
    return result;
  }

  @Patch("v1/partner/me/leads/:id/status")
  @UseGuards(PartnerAuthGuard)
  async patchMyLeadStatus() {
    throw new GoneException("deprecated_use_venue_scoped_lead_status_endpoint");
  }

  @Patch("v1/partner/me/venues/:venueSlug/leads/:id/status")
  @UseGuards(PartnerAuthGuard)
  async patchMyVenueLeadStatus(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerLeadStatusDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const updated = await this.claims.updatePartnerLeadStatusByVenue(identity, venueSlug, id, dto.status);
    if ("error" in updated) {
      if (updated.error === "lead_not_found") {
        throw new ForbiddenException("lead_not_found");
      }
      if (updated.error === "venue_not_owned" || updated.error === "lead_not_owned") {
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
  async myProfile() {
    throw new GoneException("deprecated_use_venue_scoped_profile_endpoint");
  }

  @Get("v1/partner/me/venues/:venueSlug/profile")
  @UseGuards(PartnerAuthGuard)
  async myVenueProfile(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.getProfileByVenue(identity, venueSlug);
    if ("error" in result) throw new ForbiddenException(result.error);
    return result;
  }

  @Put("v1/partner/me/profile")
  @UseGuards(PartnerAuthGuard)
  async updateProfile() {
    throw new GoneException("deprecated_use_venue_scoped_profile_endpoint");
  }

  @Put("v1/partner/me/venues/:venueSlug/profile")
  @UseGuards(PartnerAuthGuard)
  async updateVenueProfile(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerProfileDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.upsertProfileByVenue(identity, venueSlug, dto);
    if ("error" in result) throw new ForbiddenException(result.error);
    return result;
  }

  @Get("v1/partner/me/venues")
  @UseGuards(PartnerAuthGuard)
  async myVenues(@Req() req: { partnerIdentity?: { subject: string; email: string } }) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    return { items: await this.claims.listMyVenues(identity) };
  }

  @Get("v1/partner/me/plans")
  @UseGuards(PartnerAuthGuard)
  async myPlans() {
    throw new GoneException("deprecated_use_venue_scoped_plans_endpoint");
  }

  @Get("v1/partner/me/venues/:venueSlug/plans")
  @UseGuards(PartnerAuthGuard)
  async myVenuePlans(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.listMyPlansByVenue(identity, venueSlug);
    if ("error" in result) throw new ForbiddenException(result.error);
    return result;
  }

  @Post("v1/partner/me/plans")
  @UseGuards(PartnerAuthGuard)
  async createPlan() {
    throw new GoneException("deprecated_use_venue_scoped_plans_endpoint");
  }

  @Post("v1/partner/me/venues/:venueSlug/plans")
  @UseGuards(PartnerAuthGuard)
  async createVenuePlan(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateVenuePartnerPlanDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const created = await this.claims.createPlanByVenue(identity, venueSlug, {
      venueSlug,
      name: dto.name,
      description: dto.description,
      period: dto.period,
      priceLabel: dto.priceLabel,
    });
    if ("error" in created) throw new ForbiddenException(created.error);
    return created;
  }

  @Patch("v1/partner/me/plans/:id")
  @UseGuards(PartnerAuthGuard)
  async patchPlan() {
    throw new GoneException("deprecated_use_venue_scoped_plans_endpoint");
  }

  @Patch("v1/partner/me/venues/:venueSlug/plans/:id")
  @UseGuards(PartnerAuthGuard)
  async patchVenuePlan(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerPlanDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const updated = await this.claims.updatePlanByVenue(identity, venueSlug, id, dto);
    if ("error" in updated) throw new ForbiddenException(updated.error);
    return updated;
  }

  @Get("v1/partner/me/venues/:venueSlug/photos")
  @UseGuards(PartnerAuthGuard)
  async listVenuePhotos(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.listVenuePhotos(identity, venueSlug);
    if ("error" in result) throw new ForbiddenException(result.error);
    return result;
  }

  @Post("v1/partner/me/venues/:venueSlug/photos")
  @UseGuards(PartnerAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const mediaDir =
            process.env.PARTNER_MEDIA_DIR?.trim() || join(process.cwd(), "data", "uploads");
          if (!existsSync(mediaDir)) {
            mkdirSync(mediaDir, { recursive: true });
          }
          cb(null, mediaDir);
        },
        filename: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const slug = String((req.params as { venueSlug?: string })?.venueSlug ?? "venue")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .slice(0, 60);
          const safeExt = extname(file.originalname || "").toLowerCase() || ".jpg";
          cb(null, `${slug}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadVenuePhoto(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @UploadedFile()
    file?: { path: string; filename: string; mimetype: string; size: number },
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    if (!file) throw new BadRequestException("file_required");
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      throw new UnsupportedMediaTypeException("image_type_not_supported");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new PayloadTooLargeException("image_too_large");
    }
    const result = await this.claims.addVenuePhoto(identity, venueSlug, {
      path: file.path,
      filename: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    if ("error" in result) {
      if (result.error === "photo_limit_reached") {
        throw new BadRequestException("photo_limit_reached");
      }
      throw new ForbiddenException(result.error);
    }
    return result;
  }

  @Delete("v1/partner/me/venues/:venueSlug/photos/:id")
  @UseGuards(PartnerAuthGuard)
  @HttpCode(200)
  async deleteVenuePhoto(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.deleteVenuePhoto(identity, venueSlug, id);
    if ("error" in result) {
      if (result.error === "photo_not_found") throw new BadRequestException("photo_not_found");
      throw new ForbiddenException(result.error);
    }
    return result;
  }

  @Patch("v1/partner/me/venues/:venueSlug/photos/:id/order")
  @UseGuards(PartnerAuthGuard)
  async moveVenuePhoto(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: MovePartnerVenuePhotoDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.moveVenuePhoto(identity, venueSlug, id, dto.direction);
    if ("error" in result) {
      if (result.error === "photo_not_found") throw new BadRequestException("photo_not_found");
      throw new ForbiddenException(result.error);
    }
    return result;
  }

  @Patch("v1/partner/me/venues/:venueSlug/photos/reorder")
  @UseGuards(PartnerAuthGuard)
  async reorderVenuePhotos(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: ReorderPartnerVenuePhotosDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.reorderVenuePhotos(identity, venueSlug, dto.photoIds);
    if ("error" in result) {
      if (result.error === "photo_order_mismatch") {
        throw new BadRequestException("photo_order_mismatch");
      }
      throw new ForbiddenException(result.error);
    }
    return result;
  }

  @Patch("v1/partner/me/venues/:venueSlug/photos/:id/cover")
  @UseGuards(PartnerAuthGuard)
  async setVenuePhotoCover(
    @Req() req: { partnerIdentity?: { subject: string; email: string } },
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    _dto: SetCoverPartnerVenuePhotoDto,
  ) {
    const identity = req.partnerIdentity;
    if (!identity) throw new ForbiddenException("partner_identity_missing");
    const result = await this.claims.setVenuePhotoAsCover(identity, venueSlug, id);
    if ("error" in result) {
      if (result.error === "photo_not_found") throw new BadRequestException("photo_not_found");
      throw new ForbiddenException(result.error);
    }
    return result;
  }

  private throwIfDelegatedVenueError(result: unknown): void {
    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      (result as { error: string }).error === "venue_delegate_not_configured"
    ) {
      throw new UnprocessableEntityException("venue_delegate_not_configured");
    }
  }

  @Get("v1/admin/catalog/venues/:venueSlug/profile")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenueProfile(@Param("venueSlug") venueSlug: string) {
    const result = await this.claims.adminCatalogGetProfile(venueSlug);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Put("v1/admin/catalog/venues/:venueSlug/profile")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenueProfilePut(
    @Param("venueSlug") venueSlug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerProfileDto,
  ) {
    const result = await this.claims.adminCatalogUpsertProfile(venueSlug, dto);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Get("v1/admin/catalog/venues/:venueSlug/plans")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePlans(@Param("venueSlug") venueSlug: string) {
    const result = await this.claims.adminCatalogListPlans(venueSlug);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Post("v1/admin/catalog/venues/:venueSlug/plans")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePlanPost(
    @Param("venueSlug") venueSlug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateVenuePartnerPlanDto,
  ) {
    const result = await this.claims.adminCatalogCreatePlan(venueSlug, dto);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Patch("v1/admin/catalog/venues/:venueSlug/plans/:id")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePlanPatch(
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerPlanDto,
  ) {
    const result = await this.claims.adminCatalogUpdatePlan(venueSlug, id, dto);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Get("v1/admin/catalog/venues/:venueSlug/leads")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenueLeads(
    @Param("venueSlug") venueSlug: string,
    @Query("limit") limitRaw?: string,
  ) {
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    const result = await this.claims.adminCatalogListLeads(venueSlug, limit);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Patch("v1/admin/catalog/venues/:venueSlug/leads/:id/status")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenueLeadStatus(
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerLeadStatusDto,
  ) {
    const result = await this.claims.adminCatalogUpdateLeadStatus(
      venueSlug,
      id,
      dto.status,
    );
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      if ((result as { error: string }).error === "lead_not_found") {
        throw new ForbiddenException("lead_not_found");
      }
      if (
        (result as { error: string }).error === "venue_not_owned" ||
        (result as { error: string }).error === "lead_not_owned"
      ) {
        throw new ForbiddenException("lead_not_owned");
      }
      if ((result as { error: string }).error === "integration_not_configured") {
        throw new ForbiddenException("leads_integration_not_configured");
      }
      throw new ForbiddenException("lead_status_update_failed");
    }
    return result;
  }

  @Get("v1/admin/catalog/venues/:venueSlug/photos")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePhotosList(@Param("venueSlug") venueSlug: string) {
    const result = await this.claims.adminCatalogListPhotos(venueSlug);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Post("v1/admin/catalog/venues/:venueSlug/photos")
  @UseGuards(AdminApiGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const mediaDir =
            process.env.PARTNER_MEDIA_DIR?.trim() || join(process.cwd(), "data", "uploads");
          if (!existsSync(mediaDir)) {
            mkdirSync(mediaDir, { recursive: true });
          }
          cb(null, mediaDir);
        },
        filename: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const slug = String((req.params as { venueSlug?: string })?.venueSlug ?? "venue")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .slice(0, 60);
          const safeExt = extname(file.originalname || "").toLowerCase() || ".jpg";
          cb(null, `${slug}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async adminCatalogVenuePhotoUpload(
    @Param("venueSlug") venueSlug: string,
    @UploadedFile()
    file?: { path: string; filename: string; mimetype: string; size: number },
  ) {
    if (!file) throw new BadRequestException("file_required");
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      throw new UnsupportedMediaTypeException("image_type_not_supported");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new PayloadTooLargeException("image_too_large");
    }
    const result = await this.claims.adminCatalogAddPhoto(venueSlug, {
      path: file.path,
      filename: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      if ((result as { error: string }).error === "photo_limit_reached") {
        throw new BadRequestException("photo_limit_reached");
      }
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Delete("v1/admin/catalog/venues/:venueSlug/photos/:id")
  @UseGuards(AdminApiGuard)
  @HttpCode(200)
  async adminCatalogVenuePhotoDelete(
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
  ) {
    const result = await this.claims.adminCatalogDeletePhoto(venueSlug, id);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      if ((result as { error: string }).error === "photo_not_found") {
        throw new BadRequestException("photo_not_found");
      }
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Patch("v1/admin/catalog/venues/:venueSlug/photos/:id/order")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePhotoOrder(
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: MovePartnerVenuePhotoDto,
  ) {
    const result = await this.claims.adminCatalogMovePhoto(venueSlug, id, dto.direction);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      if ((result as { error: string }).error === "photo_not_found") {
        throw new BadRequestException("photo_not_found");
      }
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Patch("v1/admin/catalog/venues/:venueSlug/photos/reorder")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePhotosReorder(
    @Param("venueSlug") venueSlug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: ReorderPartnerVenuePhotosDto,
  ) {
    const result = await this.claims.adminCatalogReorderPhotos(venueSlug, dto.photoIds);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      if ((result as { error: string }).error === "photo_order_mismatch") {
        throw new BadRequestException("photo_order_mismatch");
      }
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
  }

  @Patch("v1/admin/catalog/venues/:venueSlug/photos/:id/cover")
  @UseGuards(AdminApiGuard)
  async adminCatalogVenuePhotoCover(
    @Param("venueSlug") venueSlug: string,
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    _dto: SetCoverPartnerVenuePhotoDto,
  ) {
    const result = await this.claims.adminCatalogSetCoverPhoto(venueSlug, id);
    this.throwIfDelegatedVenueError(result);
    if (result && typeof result === "object" && "error" in result) {
      if ((result as { error: string }).error === "photo_not_found") {
        throw new BadRequestException("photo_not_found");
      }
      throw new ForbiddenException((result as { error: string }).error);
    }
    return result;
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
        claimKind: it.claimKind ?? "existing",
        newVenueDraft: parsePartnerClaimNewVenueDraft(it.newVenueDraftJson),
        status: it.status,
        createdAt: it.createdAt.toISOString(),
        updatedAt: it.updatedAt.toISOString(),
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

function parsePartnerClaimNewVenueDraft(
  json: string | null,
): Record<string, unknown> | null {
  if (!json?.trim()) return null;
  try {
    const v = JSON.parse(json) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
