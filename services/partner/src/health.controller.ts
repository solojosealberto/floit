import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PartnerCatalogSyncOutboxService } from "./partner-catalog-sync-outbox.service";
import { PartnerCatalogSyncService } from "./partner-catalog-sync.service";

@Controller()
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly catalogSync: PartnerCatalogSyncService,
    private readonly catalogOutbox: PartnerCatalogSyncOutboxService,
  ) {}

  @Get("health")
  async health() {
    const strictAdminOidc =
      this.config.get<string>("ADMIN_AUTH_REQUIRE_OIDC")?.trim() === "true";
    const strictPartnerOidc =
      this.config.get<string>("PARTNER_AUTH_REQUIRE_OIDC")?.trim() === "true";
    const [syncQueue, outboxQueue] = await Promise.all([
      this.catalogSync.getQueueStats(),
      this.catalogOutbox.getQueueStats(),
    ]);
    const adminOidcConfigured = Boolean(
      this.config.get<string>("ADMIN_OIDC_ISSUER")?.trim(),
    );
    const partnerOidcConfigured = Boolean(
      this.config.get<string>("PARTNER_OIDC_ISSUER")?.trim(),
    );
    const failedQueues = (syncQueue.failed ?? 0) + (outboxQueue.failed ?? 0);
    const readiness = {
      oidcConfigReady: adminOidcConfigured && partnerOidcConfigured,
      queuesHealthy: failedQueues === 0,
      recommendedForStrictOidc: adminOidcConfigured && partnerOidcConfigured && failedQueues === 0,
      failedQueues,
    };
    return {
      ok: true,
      service: "partner",
      auth: {
        adminStrictOidc: strictAdminOidc,
        adminOidcConfigured,
        partnerStrictOidc: strictPartnerOidc,
        partnerOidcConfigured,
      },
      queues: {
        catalogSync: syncQueue,
        catalogSyncOutbox: outboxQueue,
      },
      readiness,
    };
  }
}
