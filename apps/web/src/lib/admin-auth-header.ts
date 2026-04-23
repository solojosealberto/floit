export function getAdminAuthHeader():
  | { headerName: "authorization"; headerValue: string }
  | { headerName: "x-admin-token"; headerValue: string }
  | null {
  const strictOidc = process.env.ADMIN_AUTH_REQUIRE_OIDC?.trim() === "true";
  const oidcToken = process.env.ADMIN_OIDC_ACCESS_TOKEN?.trim();
  if (oidcToken) {
    return {
      headerName: "authorization",
      headerValue: `Bearer ${oidcToken}`,
    };
  }
  if (strictOidc) return null;
  const legacyToken = process.env.ADMIN_API_TOKEN?.trim();
  if (legacyToken) {
    return {
      headerName: "x-admin-token",
      headerValue: legacyToken,
    };
  }
  return null;
}
