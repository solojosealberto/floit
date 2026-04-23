import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { InternalApiGuard } from "./internal-api.guard";
import { SeedModule } from "./seed/seed.module";
import { PromotionEntity } from "./promotions/promotion.entity";
import { VenueReportEntity } from "./reports/venue-report.entity";
import { VenueEntity } from "./venues/venue.entity";
import { VenuesModule } from "./venues/venues.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("DATABASE_URL");
        if (!url) {
          throw new Error(
            "DATABASE_URL is required (e.g. postgresql://floit:floit@localhost:5432/floit_catalog)",
          );
        }
        return {
          type: "postgres" as const,
          url,
          entities: [VenueEntity, PromotionEntity, VenueReportEntity],
          synchronize: config.get<string>("DATABASE_SYNC") === "true",
          logging: config.get<string>("TYPEORM_LOGGING") === "true",
        };
      },
    }),
    VenuesModule,
    SeedModule,
  ],
  controllers: [HealthController],
  providers: [InternalApiGuard],
})
export class AppModule {}
