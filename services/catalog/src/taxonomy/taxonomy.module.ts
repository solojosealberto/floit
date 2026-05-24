import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminApiGuard } from "../admin-api.guard";
import { VenueEntity } from "../venues/venue.entity";
import { AdminTaxonomyController } from "./admin-taxonomy.controller";
import { PublicTaxonomyController } from "./public-taxonomy.controller";
import { TaxonomyAttributeEntity } from "./taxonomy-attribute.entity";
import { TaxonomyService } from "./taxonomy.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxonomyAttributeEntity, VenueEntity]),
  ],
  controllers: [AdminTaxonomyController, PublicTaxonomyController],
  providers: [TaxonomyService, AdminApiGuard],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
