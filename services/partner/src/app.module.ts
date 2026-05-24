import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { AdminApiGuard } from "./admin-api.guard";
import { HealthController } from "./health.controller";
import { PartnerCatalogSyncJobEntity } from "./partner-catalog-sync-job.entity";
import { PartnerCatalogSyncOutboxEntity } from "./partner-catalog-sync-outbox.entity";
import { PartnerCatalogSyncOutboxService } from "./partner-catalog-sync-outbox.service";
import { PartnerCatalogSyncService } from "./partner-catalog-sync.service";
import { PartnerClaimEntity } from "./partner-claim.entity";
import { PartnerAuthGuard } from "./partner-auth.guard";
import { PartnerClaimsController } from "./partner-claims.controller";
import { PartnerClaimsService } from "./partner-claims.service";
import { PartnerPlanEntity } from "./partner-plan.entity";
import { PartnerProfileEntity } from "./partner-profile.entity";
import { PartnerOwnershipAuditEntity } from "./partner-ownership-audit.entity";
import { PartnerVenueOwnershipEntity } from "./partner-venue-ownership.entity";
import { PartnerVenuePhotoEntity } from "./partner-venue-photo.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const entities = [
          PartnerClaimEntity,
          PartnerVenueOwnershipEntity,
          PartnerProfileEntity,
          PartnerPlanEntity,
          PartnerOwnershipAuditEntity,
          PartnerVenuePhotoEntity,
          PartnerCatalogSyncOutboxEntity,
          PartnerCatalogSyncJobEntity,
        ];
        const synchronize = config.get<string>("DATABASE_SYNC") !== "false";
        const databaseUrl = config.get<string>("DATABASE_URL")?.trim();
        if (databaseUrl) {
          return {
            type: "postgres" as const,
            url: databaseUrl,
            entities,
            synchronize,
            ssl: databaseUrl.includes("sslmode=require")
              ? { rejectUnauthorized: false }
              : undefined,
          };
        }
        const dbPath =
          config.get<string>("PARTNER_SQLITE_PATH") ??
          join(__dirname, "..", "data", "partner.sqlite");
        return {
          type: "sqlite" as const,
          database: dbPath,
          entities,
          synchronize,
        };
      },
    }),
    TypeOrmModule.forFeature([
      PartnerClaimEntity,
      PartnerVenueOwnershipEntity,
      PartnerProfileEntity,
      PartnerPlanEntity,
      PartnerOwnershipAuditEntity,
      PartnerVenuePhotoEntity,
      PartnerCatalogSyncOutboxEntity,
      PartnerCatalogSyncJobEntity,
    ]),
  ],
  controllers: [HealthController, PartnerClaimsController],
  providers: [
    PartnerClaimsService,
    PartnerCatalogSyncOutboxService,
    PartnerCatalogSyncService,
    AdminApiGuard,
    PartnerAuthGuard,
  ],
})
export class AppModule {}
