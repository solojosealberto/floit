import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";

/**
 * Read-only summary of admin BFF auth configuration for `/admin/configuracion`.
 * Never exposes secret values.
 */

export type AdminEnvFlags = {
  nodeEnv: string;
  hasOidcAccessToken: boolean;
  strictOidc: boolean;
  hasLegacyApiToken: boolean;
  localPasswordLoginEnabled: boolean;
};

export function readAdminEnvFlags(): AdminEnvFlags {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    hasOidcAccessToken: Boolean(process.env.ADMIN_OIDC_ACCESS_TOKEN?.trim()),
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
  },
): string {
  if (auth.headerName === "authorization") {
    return "Las peticiones del BFF admin envían Authorization Bearer usando ADMIN_OIDC_ACCESS_TOKEN en el servidor.";
  }
  if (opts.localPasswordGateApplies && opts.sessionEmail) {
    return "Las peticiones usan x-admin-token; la sesión local QA está activa y debe coincidir con ADMIN_LOCAL_LOGIN_EMAIL.";
  }
  return "Las peticiones del BFF admin envían x-admin-token con ADMIN_API_TOKEN.";
}
