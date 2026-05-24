import { getPartnerAccessTokenFromSession } from "./partner-session";

export async function getPartnerAuthHeader():
  Promise<
  | { headerName: "authorization"; headerValue: string }
  | { headerName: "x-partner-email"; headerValue: string }
  | null> {
  const strictOidc = process.env.PARTNER_AUTH_REQUIRE_OIDC?.trim() === "true";
  const isNonProduction = process.env.NODE_ENV !== "production";
  const sessionToken = await getPartnerAccessTokenFromSession();
  if (sessionToken?.startsWith("dev-email:") && !strictOidc && isNonProduction) {
    const devEmailFromSession = sessionToken.slice("dev-email:".length).trim().toLowerCase();
    if (devEmailFromSession) {
      return {
        headerName: "x-partner-email",
        headerValue: devEmailFromSession,
      };
    }
  }
  const oidcToken = sessionToken || process.env.PARTNER_OIDC_ACCESS_TOKEN?.trim();
  if (oidcToken) {
    return {
      headerName: "authorization",
      headerValue: `Bearer ${oidcToken}`,
    };
  }
  if (strictOidc) return null;
  const devEmail = process.env.PARTNER_DEV_EMAIL?.trim();
  if (devEmail && isNonProduction) {
    return {
      headerName: "x-partner-email",
      headerValue: devEmail,
    };
  }
  return null;
}
