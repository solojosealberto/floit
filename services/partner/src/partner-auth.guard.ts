import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

export type PartnerIdentity = {
  subject: string;
  email: string;
};

type PartnerRequest = Request & { partnerIdentity?: PartnerIdentity };

@Injectable()
export class PartnerAuthGuard implements CanActivate {
  private jwksCache = new Map<string, unknown>();
  private josePromise: Promise<typeof import("jose")> | null = null;

  constructor(private readonly config: ConfigService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<PartnerRequest>();
    const issuer = this.config.get<string>("PARTNER_OIDC_ISSUER")?.trim();
    const strictOidc =
      this.config.get<string>("PARTNER_AUTH_REQUIRE_OIDC")?.trim() === "true";
    if (issuer) {
      req.partnerIdentity = await this.validateOidcBearer(req, issuer);
      return true;
    }
    if (strictOidc) {
      throw new UnauthorizedException("partner_oidc_required");
    }
    req.partnerIdentity = this.validateDevFallback(req);
    return true;
  }

  private async validateOidcBearer(
    req: Request,
    issuerRaw: string,
  ): Promise<PartnerIdentity> {
    const auth = String(req.headers.authorization ?? "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) throw new UnauthorizedException("missing_partner_token");

    const issuerBase = issuerRaw.replace(/\/$/, "");
    const audience =
      this.config.get<string>("PARTNER_OIDC_AUDIENCE")?.trim() || "floit-partner";
    const jwksUrl =
      this.config.get<string>("PARTNER_OIDC_JWKS_URL")?.trim() ||
      `${issuerBase}/.well-known/jwks.json`;
    const jose = await this.getJose();
    const jwks = await this.getOrCreateJwks(jwksUrl);

    try {
      const verified = await jose.jwtVerify(token, jwks as never, {
        issuer: [issuerBase, `${issuerBase}/`],
        audience,
      });
      const emailRaw = verified.payload.email;
      const subRaw = verified.payload.sub;
      if (typeof emailRaw !== "string" || typeof subRaw !== "string") {
        throw new UnauthorizedException("partner_identity_incomplete");
      }
      return { subject: subRaw, email: emailRaw.toLowerCase() };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("invalid_partner_token");
    }
  }

  private validateDevFallback(req: Request): PartnerIdentity {
    const headerEmail = String(req.headers["x-partner-email"] ?? "").trim();
    const fallbackEmail =
      headerEmail || this.config.get<string>("PARTNER_DEV_EMAIL")?.trim() || "";
    if (!fallbackEmail) {
      throw new UnauthorizedException("partner_not_configured");
    }
    return {
      subject: `dev:${fallbackEmail.toLowerCase()}`,
      email: fallbackEmail.toLowerCase(),
    };
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
