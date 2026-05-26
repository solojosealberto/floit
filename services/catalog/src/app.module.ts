import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogSchemaBootstrapService } from "./catalog-schema-bootstrap.service";
import { HealthController } from "./health.controller";
import { InternalApiGuard } from "./internal-api.guard";
import { SeedModule } from "./seed/seed.module";
import { PromotionEntity } from "./promotions/promotion.entity";
import { VenueReportEntity } from "./reports/venue-report.entity";
import { TaxonomyAttributeEntity } from "./taxonomy/taxonomy-attribute.entity";
import { TaxonomyModule } from "./taxonomy/taxonomy.module";
import { VenueEntity } from "./venues/venue.entity";
import { VenuesModule } from "./venues/venues.module";

const log = new Logger("CatalogAppModule");
const DEFAULT_LOCAL_DATABASE_URL =
  "postgresql://floit:floit@localhost:5432/floit_catalog";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const configuredUrl = config.get<string>("DATABASE_URL");
        const nodeEnv = config.get<string>("NODE_ENV");
        const isProd = nodeEnv === "production";
        const url = configuredUrl ?? (!isProd ? DEFAULT_LOCAL_DATABASE_URL : undefined);
        if (!url) {
          throw new Error(
            "DATABASE_URL is required (e.g. postgresql://floit:floit@localhost:5432/floit_catalog)",
          );
        }
        if (!configuredUrl && !isProd) {
          log.warn(
            "DATABASE_URL not set; using local default for catalog dev startup.",
          );
        }
        return {
          type: "postgres" as const,
          url,
          entities: [
            VenueEntity,
            PromotionEntity,
            VenueReportEntity,
            TaxonomyAttributeEntity,
          ],
          synchronize: config.get<string>("DATABASE_SYNC") === "true",
          logging: config.get<string>("TYPEORM_LOGGING") === "true",
        };
      },
    }),
    VenuesModule,
    TaxonomyModule,
    SeedModule,
  ],
  controllers: [HealthController],
  providers: [InternalApiGuard, CatalogSchemaBootstrapService],
})
export class AppModule {}
