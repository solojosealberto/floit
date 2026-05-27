import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
import { getAdminEmailFromSession } from "@/lib/admin-session";

export async function getAdminAuthHeader(): Promise<
  | { headerName: "authorization"; headerValue: string }
  | { headerName: "x-admin-token"; headerValue: string }
  | null
> {
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
  if (!legacyToken) return null;

  if (isAdminLocalPasswordLoginEnabled()) {
    const expectedEmail = process.env.ADMIN_LOCAL_LOGIN_EMAIL?.trim().toLowerCase();
    const sessionEmail = await getAdminEmailFromSession();
    if (!expectedEmail || !sessionEmail || sessionEmail !== expectedEmail) {
      return null;
    }
  }

  return {
    headerName: "x-admin-token",
    headerValue: legacyToken,
  };
}
