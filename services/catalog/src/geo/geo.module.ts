import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoController } from "./geo.controller";
import { GeoCityEntity, GeoStateEntity, GeoZoneEntity } from "./geo.entities";
import { GeoService } from "./geo.service";

@Module({
  imports: [TypeOrmModule.forFeature([GeoStateEntity, GeoCityEntity, GeoZoneEntity])],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
