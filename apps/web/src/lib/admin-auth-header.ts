import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
import { getAdminEmailFromSession } from "@/lib/admin-session";

type AdminAuthHeader =
  | { headerName: "authorization"; headerValue: string }
  | { headerName: "x-admin-token"; headerValue: string };

type CachedM2m = { token: string; expiresAtMs: number };

let m2mCache: CachedM2m | null = null;
let m2mInflight: Promise<string | null> | null = null;

function resolveAuth0Domain(): string | null {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  if (domain) return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const issuer = process.env.ADMIN_OIDC_ISSUER?.trim();
  if (!issuer) return null;
  try {
    const host = new URL(
      /^https?:\/\//i.test(issuer) ? issuer : `https://${issuer}`,
    ).host;
    return host || null;
  } catch {
    return null;
  }
}

function readJwtExpMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(
      parts[1]!.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string, skewMs = 60_000): boolean {
  const expMs = readJwtExpMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}

async function fetchAuth0M2mToken(): Promise<string | null> {
  const clientId = process.env.AUTH0_M2M_CLIENT_ID?.trim();
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET?.trim();
  const audience =
    process.env.AUTH0_M2M_AUDIENCE?.trim() ||
    process.env.ADMIN_OIDC_AUDIENCE?.trim() ||
    "floit-admin";
  const domain = resolveAuth0Domain();
  if (!clientId || !clientSecret || !domain) return null;

  const now = Date.now();
  if (m2mCache && m2mCache.expiresAtMs - 60_000 > now) {
    return m2mCache.token;
  }
  if (m2mInflight) return m2mInflight;

  m2mInflight = (async () => {
    try {
      const res = await fetch(`https://${domain}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          audience,
          grant_type: "client_credentials",
        }),
        signal: AbortSignal.timeout(15000),
      });
      const body = (await res.json().catch(() => ({}))) as {
        access_token?: string;
        expires_in?: number;
      };
      const token = body.access_token?.trim();
      if (!res.ok || !token) return null;
      const expiresInSec =
        typeof body.expires_in === "number" && body.expires_in > 60
          ? body.expires_in
          : 3600;
      m2mCache = {
        token,
        expiresAtMs: Date.now() + expiresInSec * 1000,
      };
      return token;
    } catch {
      return null;
    } finally {
      m2mInflight = null;
    }
  })();

  return m2mInflight;
}

export async function getAdminAuthHeader(): Promise<AdminAuthHeader | null> {
  const strictOidc = process.env.ADMIN_AUTH_REQUIRE_OIDC?.trim() === "true";

  const liveM2m = await fetchAuth0M2mToken();
  if (liveM2m) {
    return {
      headerName: "authorization",
      headerValue: `Bearer ${liveM2m}`,
    };
  }

  const oidcToken = process.env.ADMIN_OIDC_ACCESS_TOKEN?.trim();
  if (oidcToken && !isJwtExpired(oidcToken)) {
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
