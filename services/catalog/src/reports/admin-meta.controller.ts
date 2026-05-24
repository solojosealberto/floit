import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminApiGuard } from "../admin-api.guard";
import { VenuesService } from "../venues/venues.service";

@Controller("v1/admin/meta")
@UseGuards(AdminApiGuard)
export class AdminMetaController {
  constructor(private readonly venues: VenuesService) {}

  @Get("duplicate-suspects")
  async duplicateSuspects() {
    const pairs = await this.venues.findDuplicateSuspects();
    return { pairs };
  }

  @Get("media-review")
  async mediaReview() {
    const items = await this.venues.listMediaForReview();
    return { items };
  }
}
