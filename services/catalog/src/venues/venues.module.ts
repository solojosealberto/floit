import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InternalApiGuard } from "../internal-api.guard";
import { PromotionEntity } from "../promotions/promotion.entity";
import { VenueReportEntity } from "../reports/venue-report.entity";
import { VenueEntity } from "./venue.entity";
import { AdminApiGuard } from "../admin-api.guard";
import { AdminMetaController } from "../reports/admin-meta.controller";
import { AdminVenueReportsController } from "../reports/admin-reports.controller";
import { VenuesController } from "./venues.controller";
import { VenuesService } from "./venues.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VenueEntity,
      PromotionEntity,
      VenueReportEntity,
    ]),
  ],
  controllers: [
    VenuesController,
    AdminVenueReportsController,
    AdminMetaController,
  ],
  providers: [VenuesService, InternalApiGuard, AdminApiGuard],
  exports: [VenuesService],
})
export class VenuesModule {}
