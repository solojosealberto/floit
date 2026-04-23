#!/usr/bin/env node
/**
 * Sprint 4 negative auth checks for strict OIDC mode.
 *
 * Validates that legacy/dev headers are rejected with 401.
 *
 * Optional envs:
 *   LEADS_ADMIN_URL   (default http://localhost:4012/v1/admin/leads?limit=1)
 *   PARTNER_ME_URL    (default http://localhost:4013/v1/partner/me/leads?limit=1)
 */

const leadsAdminUrl =
  process.env.LEADS_ADMIN_URL ?? "http://localhost:4012/v1/admin/leads?limit=1";
const partnerMeUrl =
  process.env.PARTNER_ME_URL ?? "http://localhost:4013/v1/partner/me/leads?limit=1";

function row(ok, label, details = "") {
  const suffix = details ? ` — ${details}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${suffix}`);
}

async function expect401(url, headers) {
  const res = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(5000),
  });
  return res.status === 401 ? null : `HTTP ${res.status}`;
}

let failures = 0;

try {
  console.log("Sprint 4 negative auth checks\n");
  console.log(`Leads admin URL:  ${leadsAdminUrl}`);
  console.log(`Partner me URL:   ${partnerMeUrl}\n`);

  const legacyAdminErr = await expect401(leadsAdminUrl, {
    "x-admin-token": "legacy-token-should-fail",
  });
  row(!legacyAdminErr, "x-admin-token rejected in strict mode", legacyAdminErr ?? "");
  if (legacyAdminErr) failures += 1;

  const legacyPartnerErr = await expect401(partnerMeUrl, {
    "x-partner-email": "partner@example.com",
  });
  row(!legacyPartnerErr, "x-partner-email rejected in strict mode", legacyPartnerErr ?? "");
  if (legacyPartnerErr) failures += 1;
} catch (e) {
  console.error(`FAIL  execution error — ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
}

if (failures > 0) {
  console.error(`\nResult: FAIL (${failures} checks failed)`);
  process.exitCode = 1;
} else if (process.exitCode !== 1) {
  console.log("\nResult: PASS (legacy/dev headers are blocked)");
}
