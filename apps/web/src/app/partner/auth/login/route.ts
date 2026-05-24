import { NextResponse } from "next/server";
import { fetchPartnerOidcConfig } from "@/lib/partner-oidc";
import { setPartnerAccessTokenSession } from "@/lib/partner-session";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/partner/login", request.url));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let email = "";
  let password = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    email = typeof form?.get("email") === "string" ? String(form.get("email")).trim() : "";
    password = typeof form?.get("password") === "string" ? String(form.get("password")) : "";
  }
  if (!email || !password) {
    return NextResponse.redirect(new URL("/partner/login?error=missing_credentials", url.origin), {
      status: 303,
    });
  }

  const allowLocalPassword =
    process.env.PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true";
  const isNonProduction = process.env.NODE_ENV !== "production";
  const localEmail = process.env.PARTNER_LOCAL_LOGIN_EMAIL?.trim().toLowerCase();
  const localPassword = process.env.PARTNER_LOCAL_LOGIN_PASSWORD ?? "";
  if (allowLocalPassword && localEmail && localPassword && isNonProduction) {
    if (email.toLowerCase() === localEmail && password === localPassword) {
      await setPartnerAccessTokenSession(`dev-email:${localEmail}`);
      return NextResponse.redirect(new URL("/partner/venues", url.origin), { status: 303 });
    }
    return NextResponse.redirect(new URL("/partner/login?error=invalid_credentials", url.origin), {
      status: 303,
    });
  }

  try {
    const oidc = await fetchPartnerOidcConfig();
    const clientId = process.env.PARTNER_OIDC_CLIENT_ID?.trim();
    if (!clientId) {
      return NextResponse.redirect(new URL("/partner/login?error=partner_oidc_client_id_missing", url.origin), {
        status: 303,
      });
    }
    const clientSecret = process.env.PARTNER_OIDC_CLIENT_SECRET?.trim();
    const scope = process.env.PARTNER_OIDC_SCOPE?.trim() || "openid email profile";
    const body = new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      username: email,
      password,
      scope,
    });
    if (clientSecret) body.set("client_secret", clientSecret);
    const tokenRes = await fetch(oidc.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      const errBody = (await tokenRes.json().catch(() => ({}))) as {
        error?: string;
        error_description?: string;
      };
      const upstreamError = errBody.error?.trim().toLowerCase() ?? "";
      const upstreamDesc = errBody.error_description?.trim().toLowerCase() ?? "";
      const unsupportedPasswordGrant =
        upstreamError === "unsupported_grant_type" ||
        upstreamError === "unauthorized_client" ||
        upstreamDesc.includes("grant");
      const invalidCredentials =
        upstreamError === "invalid_grant" || upstreamDesc.includes("invalid") || upstreamDesc.includes("credential");
      const mappedError = unsupportedPasswordGrant
        ? "oidc_password_grant_not_enabled"
        : invalidCredentials
          ? "invalid_credentials"
          : `token_exchange_${tokenRes.status}`;
      return NextResponse.redirect(
        new URL(`/partner/login?error=${encodeURIComponent(mappedError)}`, url.origin),
        { status: 303 },
      );
    }
    const payload = (await tokenRes.json()) as { access_token?: string };
    if (!payload.access_token) {
      return NextResponse.redirect(new URL("/partner/login?error=missing_access_token", url.origin), {
        status: 303,
      });
    }
    await setPartnerAccessTokenSession(payload.access_token);
    return NextResponse.redirect(new URL("/partner/venues", url.origin), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "partner_login_init_failed";
    return NextResponse.redirect(new URL(`/partner/login?error=${encodeURIComponent(message)}`, url.origin), {
      status: 303,
    });
  }
}
