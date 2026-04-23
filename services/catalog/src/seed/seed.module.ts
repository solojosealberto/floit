import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromotionEntity } from "../promotions/promotion.entity";
import { VenueEntity } from "../venues/venue.entity";
import { SeedService } from "./seed.service";

@Module({
  imports: [TypeOrmModule.forFeature([VenueEntity, PromotionEntity])],
  providers: [SeedService],
})
export class SeedModule {}
