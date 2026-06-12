#!/usr/bin/env node
/**
 * Ejecuta gates Sprint 4 + Sprint 5 contra staging (Railway + staging.quegym.com).
 *
 * Requiere docs/env/staging.local con credencial admin para SLA:
 *   - LEADS_SLA_AUTH_BEARER (token M2M ya obtenido), o
 *   - AUTH0_M2M_CLIENT_ID + AUTH0_M2M_CLIENT_SECRET + AUTH0_DOMAIN (o ADMIN_OIDC_ISSUER)
 *
 * Uso:
 *   pnpm sprint5:staging-gate
 *   pnpm sprint5:staging-gate -- --kpi-relaxed   # umbrales KPI mínimos (smoke staging)
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { loadStagingEnv } from "./load-staging-env.mjs";

const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const kpiRelaxed = args.has("--kpi-relaxed");

loadStagingEnv();

const STAGING = {
  WEB_BASE_URL: "https://staging.quegym.com",
  SEARCH_HEALTH_URL:
    "https://floitsearch-service-production.up.railway.app/health",
  CATALOG_HEALTH_URL:
    "https://floitcatalog-service-production.up.railway.app/health",
  LEADS_HEALTH_URL:
    "https://floitleads-service-production.up.railway.app/health",
  PARTNER_HEALTH_URL:
    "https://floitpartner-service-production.up.railway.app/health",
  ANALYTICS_HEALTH_URL:
    "https://floitanalytics-service-production.up.railway.app/health",
  ANALYTICS_FUNNEL_URL:
    "https://floitanalytics-service-production.up.railway.app/v1/metrics/funnel?windowHours=168",
  ANALYTICS_EXPERIMENT_URL:
    "https://floitanalytics-service-production.up.railway.app/v1/metrics/experiments/cta-lead-form?windowDays=14",
  LEADS_SLA_URL:
    "https://floitleads-service-production.up.railway.app/v1/admin/leads/sla-summary?windowHours=168&targetMinutes=120",
  LEADS_ADMIN_URL:
    "https://floitleads-service-production.up.railway.app/v1/admin/leads?limit=1",
  PARTNER_ME_URL:
    "https://floitpartner-service-production.up.railway.app/v1/partner/me/leads?limit=1",
  LEADS_HEALTH_URL_GATE:
    "https://floitleads-service-production.up.railway.app/health",
  PARTNER_HEALTH_URL_GATE:
    "https://floitpartner-service-production.up.railway.app/health",
};

async function resolveSlaBearer() {
  const existing = process.env.LEADS_SLA_AUTH_BEARER?.trim();
  if (existing) return existing;

  const hasM2m =
    process.env.AUTH0_M2M_CLIENT_ID?.trim() &&
    process.env.AUTH0_M2M_CLIENT_SECRET?.trim() &&
    (process.env.AUTH0_DOMAIN?.trim() || process.env.ADMIN_OIDC_ISSUER?.trim());

  if (!hasM2m) {
    console.error(`
Bloqueador Sprint 5: leads-service exige Bearer OIDC (adminStrictOidc=true).

Opción A — token M2M en vault (recomendado):
  1. Auth0 → Applications → QueGym Admin BFF → Test → copiar access_token
  2. En docs/env/staging.local:
     LEADS_SLA_AUTH_BEARER=<token>
  3. En Vercel Preview (staging.quegym.com):
     ADMIN_OIDC_ACCESS_TOKEN=<mismo token> → redeploy

Opción B — client credentials en vault:
  AUTH0_M2M_CLIENT_ID=...
  AUTH0_M2M_CLIENT_SECRET=...
  AUTH0_DOMAIN=<tenant>.us.auth0.com

Verificado en staging: /admin/configuracion muestra ADMIN_OIDC_ACCESS_TOKEN=No
y /admin/leads responde HTTP 401 hacia leads-service.
`);
    process.exit(1);
  }

  const { spawnSync } = await import("node:child_process");
  const child = spawnSync("node", ["scripts/obtain-auth0-m2m-token.mjs"], {
    cwd: REPO_ROOT,
    env: process.env,
   encoding: "utf8",
  });
  if (child.status !== 0) {
    process.stderr.write(child.stderr ?? "");
    process.exit(child.status ?? 1);
  }
  const token = child.stdout.trim();
  if (!token) {
    console.error("Auth0 M2M devolvió token vacío");
    process.exit(1);
  }
  console.log("INFO  LEADS_SLA_AUTH_BEARER obtenido vía Auth0 client_credentials");
  return token;
}

function run(label, scriptPath, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- ${label} ---\n`);
    const child = spawn("node", [scriptPath], {
      cwd: REPO_ROOT,
      stdio: "inherit",
      env: { ...process.env, ...STAGING, ...extraEnv },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exit ${code}`));
    });
  });
}

try {
  const bearer = await resolveSlaBearer();
  const baseEnv = {
    LEADS_SLA_AUTH_BEARER: bearer,
    LEADS_HEALTH_URL: STAGING.LEADS_HEALTH_URL_GATE,
    PARTNER_HEALTH_URL: STAGING.PARTNER_HEALTH_URL_GATE,
    LEADS_ADMIN_URL: STAGING.LEADS_ADMIN_URL,
    PARTNER_ME_URL: STAGING.PARTNER_ME_URL,
  };

  await run("sprint4:readiness", join(REPO_ROOT, "scripts/sprint4-readiness.mjs"), baseEnv);
  await run("sprint4:auth-negative", join(REPO_ROOT, "scripts/sprint4-auth-negative.mjs"), baseEnv);
  await run("sprint5:flow-checklist", join(REPO_ROOT, "scripts/sprint5-flow-checklist.mjs"), baseEnv);

  const kpiEnv = kpiRelaxed
    ? {
        ...baseEnv,
        SPRINT5_MIN_SEARCH_TO_PROFILE_RATE: "0",
        SPRINT5_MIN_COMPARE_ADOPTION_RATE: "0",
        SPRINT5_MIN_PROFILE_TO_LEAD_RATE: "0",
        SPRINT5_MIN_PARTNER_SLA_RATE: "0",
        SPRINT5_AB_MIN_ASSIGNMENTS_PER_VARIANT: "0",
        SPRINT5_AB_MIN_LEAD_SUBMITS_PER_VARIANT: "0",
        SPRINT5_AB_MIN_STABLE_DAYS: "0",
        SPRINT5_AB_MIN_UPLIFT: "-1",
        SPRINT5_AB_MIN_UPLIFT_WHATSAPP: "-1",
      }
    : baseEnv;

  await run("sprint5:kpi-gate", join(REPO_ROOT, "scripts/sprint5-kpi-gate.mjs"), kpiEnv);

  console.log("\nPASS  sprint5:staging-gate completado.");
} catch (error) {
  console.error(`\nFAIL  ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
