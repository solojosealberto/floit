#!/usr/bin/env node
/**
 * Sprint 5 staged flow preflight checklist.
 *
 * Usage:
 *   pnpm sprint5:flow-checklist
 *
 * Optional envs:
 *   WEB_BASE_URL           (default http://localhost:3000)
 *   SEARCH_HEALTH_URL      (default http://localhost:4011/health)
 *   CATALOG_HEALTH_URL     (default http://localhost:4010/health)
 *   LEADS_HEALTH_URL       (default http://localhost:4012/health)
 *   PARTNER_HEALTH_URL     (default http://localhost:4013/health)
 *   ANALYTICS_HEALTH_URL   (default http://localhost:4014/health)
 *   ANALYTICS_FUNNEL_URL   (default http://localhost:4014/v1/metrics/funnel?windowHours=168)
 *   ANALYTICS_EXPERIMENT_URL (default http://localhost:4014/v1/metrics/experiments/cta-lead-form?windowDays=14)
 *   LEADS_SLA_URL          (default http://localhost:4012/v1/admin/leads/sla-summary?windowHours=168&targetMinutes=120)
 *   LEADS_SLA_AUTH_BEARER  (optional Bearer JWT for admin-protected SLA endpoint)
 */

const endpoints = {
  web: process.env.WEB_BASE_URL ?? "http://localhost:3000",
  searchHealth: process.env.SEARCH_HEALTH_URL ?? "http://localhost:4011/health",
  catalogHealth: process.env.CATALOG_HEALTH_URL ?? "http://localhost:4010/health",
  leadsHealth: process.env.LEADS_HEALTH_URL ?? "http://localhost:4012/health",
  partnerHealth: process.env.PARTNER_HEALTH_URL ?? "http://localhost:4013/health",
  analyticsHealth:
    process.env.ANALYTICS_HEALTH_URL ?? "http://localhost:4014/health",
  analyticsFunnel:
    process.env.ANALYTICS_FUNNEL_URL ??
    "http://localhost:4014/v1/metrics/funnel?windowHours=168",
  analyticsExperiment:
    process.env.ANALYTICS_EXPERIMENT_URL ??
    "http://localhost:4014/v1/metrics/experiments/cta-lead-form?windowDays=14",
  leadsSla:
    process.env.LEADS_SLA_URL ??
    "http://localhost:4012/v1/admin/leads/sla-summary?windowHours=168&targetMinutes=120",
};

const leadsSlaBearer = process.env.LEADS_SLA_AUTH_BEARER?.trim();

function print(ok, label, details = "") {
  const suffix = details ? ` — ${details}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${suffix}`);
}

async function checkJson(url, label, opts = {}) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    ...opts,
  });
  const ok = res.ok;
  print(ok, label, `HTTP ${res.status}`);
  return { ok, res };
}

let failures = 0;

try {
  console.log("Sprint 5 flow checklist (preflight)\n");
  console.log(`web:                 ${endpoints.web}`);
  console.log(`search health:       ${endpoints.searchHealth}`);
  console.log(`catalog health:      ${endpoints.catalogHealth}`);
  console.log(`leads health:        ${endpoints.leadsHealth}`);
  console.log(`partner health:      ${endpoints.partnerHealth}`);
  console.log(`analytics health:    ${endpoints.analyticsHealth}`);
  console.log(`analytics funnel:    ${endpoints.analyticsFunnel}`);
  console.log(`analytics experiment:${endpoints.analyticsExperiment}`);
  console.log(`leads SLA:           ${endpoints.leadsSla}\n`);

  const checks = await Promise.all([
    checkJson(endpoints.web, "web base up"),
    checkJson(endpoints.searchHealth, "search health"),
    checkJson(endpoints.catalogHealth, "catalog health"),
    checkJson(endpoints.leadsHealth, "leads health"),
    checkJson(endpoints.partnerHealth, "partner health"),
    checkJson(endpoints.analyticsHealth, "analytics health"),
    checkJson(endpoints.analyticsFunnel, "analytics funnel endpoint"),
    checkJson(endpoints.analyticsExperiment, "analytics experiment endpoint"),
    checkJson(endpoints.leadsSla, "leads SLA endpoint", {
      headers: leadsSlaBearer
        ? { authorization: `Bearer ${leadsSlaBearer}` }
        : undefined,
    }),
  ]);

  failures += checks.filter((it) => !it.ok).length;

  if (failures === 0) {
    console.log(
      "\nPASS  Preflight técnico OK. Continúa con el flujo manual en docs/STAGING_EVIDENCE_SPRINT5.md",
    );
  } else {
    console.error(
      `\nFAIL  ${failures} checks fallaron. Corrige entorno antes de la prueba integral.`,
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    `FAIL  checklist execution error — ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
