export function getPartnerAuthHeader():
  | { headerName: "authorization"; headerValue: string }
  | { headerName: "x-partner-email"; headerValue: string }
  | null {
  const strictOidc = process.env.PARTNER_AUTH_REQUIRE_OIDC?.trim() === "true";
  const oidcToken = process.env.PARTNER_OIDC_ACCESS_TOKEN?.trim();
  if (oidcToken) {
    return {
      headerName: "authorization",
      headerValue: `Bearer ${oidcToken}`,
    };
  }
  if (strictOidc) return null;
  const devEmail = process.env.PARTNER_DEV_EMAIL?.trim();
  if (devEmail) {
    return {
      headerName: "x-partner-email",
      headerValue: devEmail,
    };
  }
  return null;
}
