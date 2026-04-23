#!/usr/bin/env node
/**
 * Sprint 4 readiness check (OIDC-only rollout).
 *
 * Usage:
 *   pnpm sprint4:readiness
 *
 * Optional envs:
 *   LEADS_HEALTH_URL   (default http://localhost:4012/health)
 *   PARTNER_HEALTH_URL (default http://localhost:4013/health)
 */

const leadsUrl = process.env.LEADS_HEALTH_URL ?? "http://localhost:4012/health";
const partnerUrl = process.env.PARTNER_HEALTH_URL ?? "http://localhost:4013/health";

function pass(ok) {
  return ok ? "PASS" : "FAIL";
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function printRow(label, ok, details = "") {
  const suffix = details ? ` — ${details}` : "";
  console.log(`${pass(ok).padEnd(5)} ${label}${suffix}`);
}

let failed = 0;

try {
  console.log("Sprint 4 readiness check\n");
  console.log(`Leads health:   ${leadsUrl}`);
  console.log(`Partner health: ${partnerUrl}\n`);

  const [leads, partner] = await Promise.all([fetchJson(leadsUrl), fetchJson(partnerUrl)]);

  const leadsAdminStrict = Boolean(leads?.auth?.adminStrictOidc);
  const leadsAdminIssuer = Boolean(leads?.auth?.adminOidcConfigured);
  printRow("leads.auth.adminStrictOidc=true", leadsAdminStrict);
  printRow("leads.auth.adminOidcConfigured=true", leadsAdminIssuer);

  const partnerAdminStrict = Boolean(partner?.auth?.adminStrictOidc);
  const partnerPartnerStrict = Boolean(partner?.auth?.partnerStrictOidc);
  const partnerAdminIssuer = Boolean(partner?.auth?.adminOidcConfigured);
  const partnerPartnerIssuer = Boolean(partner?.auth?.partnerOidcConfigured);
  printRow("partner.auth.adminStrictOidc=true", partnerAdminStrict);
  printRow("partner.auth.partnerStrictOidc=true", partnerPartnerStrict);
  printRow("partner.auth.adminOidcConfigured=true", partnerAdminIssuer);
  printRow("partner.auth.partnerOidcConfigured=true", partnerPartnerIssuer);

  const readinessOidc = Boolean(partner?.readiness?.oidcConfigReady);
  const readinessQueues = Boolean(partner?.readiness?.queuesHealthy);
  const readinessRecommended = Boolean(partner?.readiness?.recommendedForStrictOidc);
  const failedQueues = Number(partner?.readiness?.failedQueues ?? 0);
  printRow("partner.readiness.oidcConfigReady=true", readinessOidc);
  printRow("partner.readiness.queuesHealthy=true", readinessQueues, `failedQueues=${failedQueues}`);
  printRow("partner.readiness.recommendedForStrictOidc=true", readinessRecommended);

  const checks = [
    leadsAdminStrict,
    leadsAdminIssuer,
    partnerAdminStrict,
    partnerPartnerStrict,
    partnerAdminIssuer,
    partnerPartnerIssuer,
    readinessOidc,
    readinessQueues,
    readinessRecommended,
  ];
  failed = checks.filter((it) => !it).length;
} catch (e) {
  console.error(`FAIL  health check execution — ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
}

if (failed > 0) {
  console.error(`\nResult: FAIL (${failed} checks failed)`);
  process.exitCode = 1;
} else if (process.exitCode !== 1) {
  console.log("\nResult: PASS (ready for OIDC-only rollout checks)");
}
