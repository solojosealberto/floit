import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class AdminApiGuard implements CanActivate {
  private jwksCache = new Map<string, unknown>();
  private josePromise: Promise<typeof import("jose")> | null = null;

  constructor(private readonly config: ConfigService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const issuer = this.config.get<string>("ADMIN_OIDC_ISSUER")?.trim();
    const strictOidc =
      this.config.get<string>("ADMIN_AUTH_REQUIRE_OIDC")?.trim() === "true";
    if (issuer) {
      return this.validateOidcBearer(req, issuer);
    }
    if (strictOidc) {
      throw new UnauthorizedException("admin_oidc_required");
    }
    return this.validateStaticToken(req);
  }

  private validateStaticToken(req: Request): boolean {
    const configured = this.config.get<string>("ADMIN_API_TOKEN")?.trim();
    const expected =
      configured ||
      (process.env.NODE_ENV !== "production" ? "change-me-dev-only" : undefined);
    if (!expected) {
      throw new UnauthorizedException("admin_not_configured");
    }
    const got = String(req.headers["x-admin-token"] ?? "").trim();
    if (got !== expected) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private async validateOidcBearer(
    req: Request,
    issuerRaw: string,
  ): Promise<boolean> {
    const auth = String(req.headers.authorization ?? "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) {
      throw new UnauthorizedException("missing_bearer_token");
    }

    const issuer = issuerRaw.replace(/\/$/, "");
    const audience = this.config
      .get<string>("ADMIN_OIDC_AUDIENCE")
      ?.trim() || "floit-admin";
    const jwksUrl =
      this.config.get<string>("ADMIN_OIDC_JWKS_URL")?.trim() ||
      `${issuer}/.well-known/jwks.json`;
    const jose = await this.getJose();
    const jwks = await this.getOrCreateJwks(jwksUrl);

    try {
      await jose.jwtVerify(token, jwks as never, {
        issuer,
        audience,
      });
      return true;
    } catch {
      throw new UnauthorizedException("invalid_admin_token");
    }
  }

  private async getOrCreateJwks(url: string): Promise<unknown> {
    const existing = this.jwksCache.get(url);
    if (existing) return existing;
    const jose = await this.getJose();
    const created = jose.createRemoteJWKSet(new URL(url));
    this.jwksCache.set(url, created);
    return created;
  }

  private getJose(): Promise<typeof import("jose")> {
    if (!this.josePromise) {
      this.josePromise = import("jose");
    }
    return this.josePromise;
  }
}
