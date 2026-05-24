import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminApiGuard } from "../admin-api.guard";
import { VenuesService } from "../venues/venues.service";

@Controller("v1/admin/venue-reports")
@UseGuards(AdminApiGuard)
export class AdminVenueReportsController {
  constructor(private readonly venues: VenuesService) {}

  @Get()
  async list(
    @Query("status") status?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const items = await this.venues.listVenueReports({
      status: status?.trim() || undefined,
      limit,
    });
    return { items };
  }

  @Patch(":id")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status?: string },
  ) {
    const status = body.status?.trim();
    if (status !== "reviewed" && status !== "dismissed" && status !== "pending") {
      throw new BadRequestException("invalid_status");
    }
    const item = await this.venues.updateVenueReportStatus(id, status);
    return { item };
  }
}
