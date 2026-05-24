import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromotionEntity } from "../promotions/promotion.entity";
import { TaxonomyModule } from "../taxonomy/taxonomy.module";
import { VenueEntity } from "../venues/venue.entity";
import { SeedService } from "./seed.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([VenueEntity, PromotionEntity]),
    TaxonomyModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
