import { cookies } from "next/headers";

const OIDC_STATE_COOKIE = "floit_partner_oidc_state";

type OidcConfig = {
  authorization_endpoint: string;
  token_endpoint: string;
};

export async function fetchPartnerOidcConfig(): Promise<OidcConfig> {
  const issuer = process.env.PARTNER_OIDC_ISSUER?.trim();
  if (!issuer) throw new Error("partner_oidc_issuer_missing");
  const url = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`partner_oidc_discovery_failed_${res.status}`);
  const body = (await res.json()) as OidcConfig;
  if (!body.authorization_endpoint || !body.token_endpoint) {
    throw new Error("partner_oidc_discovery_invalid");
  }
  return body;
}

export async function setPartnerOidcState(state: string): Promise<void> {
  const store = await cookies();
  store.set(OIDC_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function consumePartnerOidcState(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(OIDC_STATE_COOKIE)?.value ?? null;
  store.delete(OIDC_STATE_COOKIE);
  return value;
}
