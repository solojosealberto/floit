import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  ValidationPipe,
  UseGuards,
} from "@nestjs/common";
import { InternalApiGuard } from "../internal-api.guard";
import { VenuesService } from "./venues.service";
import { ListVenuesQueryDto } from "./dto/list-venues.query";
import type { CreateVenueReportDto } from "../reports/create-report.dto";
import { UpdatePartnerSyncDto } from "./dto/update-partner-sync.dto";

@Controller()
export class VenuesController {
  constructor(@Inject(VenuesService) private readonly venues: VenuesService) {}

  @Get("v1/venues")
  async list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListVenuesQueryDto,
  ) {
    return this.venues.findAll(query);
  }

  @Get("v1/venues/:slug")
  async getBySlug(@Param("slug") slug: string) {
    const detail = await this.venues.findPublicDetail(slug);
    if (!detail) throw new NotFoundException("Venue not found");
    const v = detail.venue;
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      description: v.description,
      address: v.address,
      zone: v.zone,
      lat: v.lat,
      lng: v.lng,
      venueType: v.venueType,
      modalities: v.modalities ?? [],
      amenities: v.amenities ?? [],
      priceMin: v.priceMin,
      priceMax: v.priceMax,
      completenessScore: v.completenessScore,
      popularityScore: v.popularityScore,
      verificationStatus: v.verificationStatus,
      allowsTrial: v.allowsTrial,
      contactPhone: v.contactPhone ?? null,
      contactWhatsapp: v.contactWhatsapp ?? null,
      contactEmail: v.contactEmail ?? null,
      activePromotionTitle: detail.activePromotionTitle ?? null,
      updatedAt: v.updatedAt.toISOString(),
    };
  }

  @Post("v1/venues/:slug/reports")
  @HttpCode(204)
  async report(
    @Param("slug") slug: string,
    @Body(new ValidationPipe({ whitelist: true }))
    dto: CreateVenueReportDto,
  ) {
    await this.venues.createReport(slug, dto);
  }

  @Get("v1/meta/zones")
  async zones() {
    const zones = await this.venues.listZones();
    return { zones };
  }

  /** US-5.4 candidatos para revisión manual (sin auth en dev). */
  @Get("v1/meta/duplicate-suspects")
  async duplicateSuspects() {
    const pairs = await this.venues.findDuplicateSuspects();
    return { pairs };
  }

  @Post("v1/internal/venues/:slug/partner-sync")
  @UseGuards(InternalApiGuard)
  @HttpCode(204)
  async partnerSync(
    @Param("slug") slug: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UpdatePartnerSyncDto,
  ) {
    await this.venues.applyPartnerSync(slug, dto);
  }
}
