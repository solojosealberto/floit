import { NextResponse } from "next/server";
import { consumePartnerOidcState, fetchPartnerOidcConfig } from "@/lib/partner-oidc";
import { setPartnerAccessTokenSession } from "@/lib/partner-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/partner/login?error=missing_code", url.origin));
  }
  const savedState = await consumePartnerOidcState();
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/partner/login?error=invalid_state", url.origin));
  }
  const clientId = process.env.PARTNER_OIDC_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.redirect(new URL("/partner/login?error=missing_client_id", url.origin));
  }
  const clientSecret = process.env.PARTNER_OIDC_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.PARTNER_OIDC_REDIRECT_URI?.trim() || `${url.origin}/partner/auth/callback`;
  try {
    const oidc = await fetchPartnerOidcConfig();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
    });
    if (clientSecret) body.set("client_secret", clientSecret);
    const tokenRes = await fetch(oidc.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL(`/partner/login?error=token_exchange_${tokenRes.status}`, url.origin),
      );
    }
    const payload = (await tokenRes.json()) as { access_token?: string };
    if (!payload.access_token) {
      return NextResponse.redirect(new URL("/partner/login?error=missing_access_token", url.origin));
    }
    await setPartnerAccessTokenSession(payload.access_token);
    return NextResponse.redirect(new URL("/partner/venues", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/partner/login?error=callback_failed", url.origin));
  }
}
