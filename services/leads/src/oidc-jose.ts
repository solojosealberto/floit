import { UnauthorizedException } from "@nestjs/common";

type JoseModule = typeof import("jose");

let josePromise: Promise<JoseModule> | null = null;

export function loadJose(): Promise<JoseModule> {
  if (!josePromise) {
    josePromise = import("jose");
  }
  return josePromise;
}

/**
 * Auth0 / OIDC issuers must be absolute URLs. Railway env values sometimes omit
 * `https://`, which makes `new URL(issuer + "/.well-known/jwks.json")` throw
 * and Nest surfaces that as HTTP 500 instead of 401.
 */
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
