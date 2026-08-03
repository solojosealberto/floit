import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import {
  loadJose,
  normalizeOidcIssuer,
  resolveOidcJwksUrl,
} from "./oidc-jose";

type AdminIdentity = { subject: string; email: string | null };

@Injectable()
export class AdminApiGuard implements CanActivate {
  private jwksCache = new Map<string, unknown>();

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
    if (!expected) throw new UnauthorizedException("admin_not_configured");
    const got = String(req.headers["x-admin-token"] ?? "").trim();
    if (got !== expected) throw new UnauthorizedException();
    const withIdentity = req as Request & { adminIdentity?: AdminIdentity };
    withIdentity.adminIdentity = {
      subject: "admin_legacy_token",
      email: null,
    };
    return true;
  }

  private async validateOidcBearer(
    req: Request,
    issuerRaw: string,
  ): Promise<boolean> {
    const auth = String(req.headers.authorization ?? "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) throw new UnauthorizedException("missing_bearer_token");

    try {
      const issuerBase = normalizeOidcIssuer(issuerRaw);
      const audience =
        this.config.get<string>("ADMIN_OIDC_AUDIENCE")?.trim() || "floit-admin";
      const jwksUrl = resolveOidcJwksUrl(
        issuerBase,
        this.config.get<string>("ADMIN_OIDC_JWKS_URL"),
      );
      const jose = await loadJose();
      const jwks = this.getOrCreateJwks(jose, jwksUrl);

      const verified = await jose.jwtVerify(token, jwks as never, {
        issuer: [issuerBase, `${issuerBase}/`],
        audience,
      });
      const payload = verified.payload as { sub?: string; email?: string };
      const withIdentity = req as Request & { adminIdentity?: AdminIdentity };
      withIdentity.adminIdentity = {
        subject: payload.sub?.trim() || "unknown_sub",
        email: payload.email?.trim().toLowerCase() || null,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("invalid_admin_token");
    }
  }

  private getOrCreateJwks(
    jose: typeof import("jose"),
    url: URL,
  ): unknown {
    const key = url.toString();
    const existing = this.jwksCache.get(key);
    if (existing) return existing;
    const created = jose.createRemoteJWKSet(url);
    this.jwksCache.set(key, created);
    return created;
  }
}
