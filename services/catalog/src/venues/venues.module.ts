import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InternalApiGuard } from "../internal-api.guard";
import { PromotionEntity } from "../promotions/promotion.entity";
import { VenueReportEntity } from "../reports/venue-report.entity";
import { VenueEntity } from "./venue.entity";
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
  controllers: [VenuesController],
  providers: [VenuesService, InternalApiGuard],
  exports: [VenuesService],
})
export class VenuesModule {}
