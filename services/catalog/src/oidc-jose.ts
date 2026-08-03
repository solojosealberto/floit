import { UnauthorizedException } from "@nestjs/common";

type JoseModule = typeof import("jose");

let josePromise: Promise<JoseModule> | null = null;

export function loadJose(): Promise<JoseModule> {
  if (!josePromise) {
    josePromise = import("jose");
  }
  return josePromise;
}

/** Ensure OIDC issuer is an absolute URL (Railway often stores host-only). */
export function normalizeOidcIssuer(issuerRaw: string): string {
  const trimmed = issuerRaw.trim().replace(/\/$/, "");
  if (!trimmed) {
    throw new UnauthorizedException("oidc_issuer_missing");
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function resolveOidcJwksUrl(
  issuerBase: string,
  jwksUrlRaw?: string | null,
): URL {
  const configured = jwksUrlRaw?.trim();
  const candidate =
    configured || `${normalizeOidcIssuer(issuerBase)}/.well-known/jwks.json`;
  const withScheme = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  try {
    return new URL(withScheme);
  } catch {
    throw new UnauthorizedException("oidc_jwks_url_invalid");
  }
}
