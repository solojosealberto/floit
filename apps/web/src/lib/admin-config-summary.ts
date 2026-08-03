import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";

/**
 * Read-only summary of admin BFF auth configuration for `/admin/configuracion`.
 * Never exposes secret values.
 */

export type AdminEnvFlags = {
  nodeEnv: string;
  hasOidcAccessToken: boolean;
  hasM2mClientCredentials: boolean;
  strictOidc: boolean;
  hasLegacyApiToken: boolean;
  localPasswordLoginEnabled: boolean;
};

export function readAdminEnvFlags(): AdminEnvFlags {
  const hasM2mClientCredentials = Boolean(
    process.env.AUTH0_M2M_CLIENT_ID?.trim() &&
      process.env.AUTH0_M2M_CLIENT_SECRET?.trim() &&
      (process.env.AUTH0_DOMAIN?.trim() || process.env.ADMIN_OIDC_ISSUER?.trim()),
  );
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    hasOidcAccessToken: Boolean(process.env.ADMIN_OIDC_ACCESS_TOKEN?.trim()),
    hasM2mClientCredentials,
    strictOidc: process.env.ADMIN_AUTH_REQUIRE_OIDC?.trim() === "true",
    hasLegacyApiToken: Boolean(process.env.ADMIN_API_TOKEN?.trim()),
    localPasswordLoginEnabled: isAdminLocalPasswordLoginEnabled(),
  };
}

export type AdminAuthHeaderKind = "authorization" | "x-admin-token";

/**
 * Human-readable description when `getAdminAuthHeader()` returned a header.
 */
export function describeAuthenticatedAdminMode(
  auth: { headerName: AdminAuthHeaderKind },
  opts: {
    sessionEmail: string | null;
    localPasswordGateApplies: boolean;
    hasM2mClientCredentials?: boolean;
  },
): string {
  if (auth.headerName === "authorization") {
    if (opts.hasM2mClientCredentials) {
      return "Las peticiones del BFF admin envían Authorization Bearer renovado vía Auth0 M2M (AUTH0_M2M_CLIENT_ID/SECRET).";
    }
    return "Las peticiones del BFF admin envían Authorization Bearer usando ADMIN_OIDC_ACCESS_TOKEN en el servidor.";
  }
  if (opts.localPasswordGateApplies && opts.sessionEmail) {
    return "Las peticiones usan x-admin-token; la sesión local QA está activa y debe coincidir con ADMIN_LOCAL_LOGIN_EMAIL.";
  }
  return "Las peticiones del BFF admin envían x-admin-token con ADMIN_API_TOKEN.";
}
