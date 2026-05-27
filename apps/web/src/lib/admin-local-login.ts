/**
 * Whether the admin UI password form (/admin/login) is enabled.
 * Local dev: ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD=true and NODE_ENV !== production.
 * Deployed staging: same flag + NEXT_PUBLIC_SITE_URL or VERCEL_ENV indicates non-prod host.
 */
export function isAdminLocalPasswordLoginEnabled(): boolean {
  if (process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() !== "true") {
    return false;
  }
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().toLowerCase() ?? "";
  if (siteUrl.includes("staging.") || siteUrl.includes("localhost")) {
    return true;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  return vercelEnv === "preview" || vercelEnv === "development";
}
