import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Controller()
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get("health")
  health() {
    const strictAdminOidc =
      this.config.get<string>("ADMIN_AUTH_REQUIRE_OIDC")?.trim() === "true";
    return {
      ok: true,
      service: "leads",
      auth: {
        adminStrictOidc: strictAdminOidc,
        adminOidcConfigured: Boolean(
          this.config.get<string>("ADMIN_OIDC_ISSUER")?.trim(),
        ),
      },
    };
  }
}
