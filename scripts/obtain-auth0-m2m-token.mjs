#!/usr/bin/env node
/**
 * Obtiene access_token M2M Auth0 (audience floit-admin) para gates Sprint 5 / BFF admin.
 *
 * Env (docs/env/staging.local o export):
 *   AUTH0_M2M_CLIENT_ID
 *   AUTH0_M2M_CLIENT_SECRET
 *   AUTH0_M2M_AUDIENCE          (default floit-admin)
 *   AUTH0_DOMAIN                p.ej. quegym-staging.us.auth0.com
 *   ADMIN_OIDC_ISSUER           (alternativa: https://<tenant>.us.auth0.com/)
 *
 * Uso:
 *   node scripts/obtain-auth0-m2m-token.mjs
 *   LEADS_SLA_AUTH_BEARER=$(node scripts/obtain-auth0-m2m-token.mjs)
 */
import { loadStagingEnv } from "./load-staging-env.mjs";

loadStagingEnv();

function resolveAuth0Domain() {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  if (domain) return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const issuer = process.env.ADMIN_OIDC_ISSUER?.trim();
  if (issuer) {
    try {
      return new URL(issuer).host;
    } catch {
      /* fall through */
    }
  }
  return null;
}

const clientId = process.env.AUTH0_M2M_CLIENT_ID?.trim();
const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET?.trim();
const audience = process.env.AUTH0_M2M_AUDIENCE?.trim() || "floit-admin";
const domain = resolveAuth0Domain();

if (!clientId || !clientSecret || !domain) {
  console.error(
    "Configura AUTH0_M2M_CLIENT_ID, AUTH0_M2M_CLIENT_SECRET y AUTH0_DOMAIN (o ADMIN_OIDC_ISSUER) en docs/env/staging.local",
  );
  process.exit(1);
}

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

const body = await res.json().catch(() => ({}));
if (!res.ok || !body.access_token) {
  console.error(
    `Auth0 token error HTTP ${res.status}: ${body.error_description ?? body.error ?? JSON.stringify(body)}`,
  );
  process.exit(1);
}

process.stdout.write(String(body.access_token));
