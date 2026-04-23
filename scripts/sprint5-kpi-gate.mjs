#!/usr/bin/env node
/**
 * Sprint 5 KPI gate for beta readiness.
 *
 * Usage:
 *   pnpm sprint5:kpi-gate
 *
 * Optional envs:
 *   ANALYTICS_FUNNEL_URL                 (default http://localhost:4014/v1/metrics/funnel?windowHours=168)
 *   ANALYTICS_EXPERIMENT_URL             (default http://localhost:4014/v1/metrics/experiments/cta-lead-form?windowDays=14)
 *   LEADS_SLA_URL                        (default http://localhost:4012/v1/admin/leads/sla-summary?windowHours=168&targetMinutes=120)
 *   LEADS_SLA_AUTH_BEARER                (optional Bearer JWT for protected SLA endpoint)
 *   SPRINT5_MIN_SEARCH_TO_PROFILE_RATE   (default 0)
 *   SPRINT5_MIN_COMPARE_ADOPTION_RATE    (default 0.15)
 *   SPRINT5_MIN_PROFILE_TO_LEAD_RATE     (default 0.08)
 *   SPRINT5_MIN_PARTNER_SLA_RATE         (default 0.5)
 *   SPRINT5_AB_MIN_ASSIGNMENTS_PER_VARIANT (default 30)
 *   SPRINT5_AB_MIN_LEAD_SUBMITS_PER_VARIANT (default 3)
 *   SPRINT5_MIN_EVENTS                   (default 1)
 */

const funnelUrl =
  process.env.ANALYTICS_FUNNEL_URL ??
  "http://localhost:4014/v1/metrics/funnel?windowHours=168";
const experimentUrl =
  process.env.ANALYTICS_EXPERIMENT_URL ??
  "http://localhost:4014/v1/metrics/experiments/cta-lead-form?windowDays=14";
const leadsSlaUrl =
  process.env.LEADS_SLA_URL ??
  "http://localhost:4012/v1/admin/leads/sla-summary?windowHours=168&targetMinutes=120";
const leadsSlaBearer = process.env.LEADS_SLA_AUTH_BEARER?.trim();

const minSearchToProfileRate = Number(
  process.env.SPRINT5_MIN_SEARCH_TO_PROFILE_RATE ?? "0",
);
const minCompareAdoptionRate = Number(
  process.env.SPRINT5_MIN_COMPARE_ADOPTION_RATE ?? "0.15",
);
const minProfileToLeadRate = Number(
  process.env.SPRINT5_MIN_PROFILE_TO_LEAD_RATE ?? "0.08",
);
const minPartnerSlaRate = Number(
  process.env.SPRINT5_MIN_PARTNER_SLA_RATE ?? "0.5",
);
const minAbAssignmentsPerVariant = Number(
  process.env.SPRINT5_AB_MIN_ASSIGNMENTS_PER_VARIANT ?? "30",
);
const minAbLeadSubmitsPerVariant = Number(
  process.env.SPRINT5_AB_MIN_LEAD_SUBMITS_PER_VARIANT ?? "3",
);
const minAbStableDays = Number(process.env.SPRINT5_AB_MIN_STABLE_DAYS ?? "7");
const minAbUplift = Number(process.env.SPRINT5_AB_MIN_UPLIFT ?? "0.02");
const minAbUpliftWhatsapp = Number(
  process.env.SPRINT5_AB_MIN_UPLIFT_WHATSAPP ?? "0.01",
);
const minEvents = Number(process.env.SPRINT5_MIN_EVENTS ?? "1");

function printRow(label, ok, details = "") {
  const suffix = details ? ` — ${details}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${suffix}`);
}

function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

try {
  console.log("Sprint 5 KPI gate\n");
  console.log(`Analytics funnel URL: ${funnelUrl}\n`);
  console.log(`Analytics experiment URL: ${experimentUrl}\n`);
  console.log(`Leads SLA URL:        ${leadsSlaUrl}\n`);

  const [funnelRes, experimentRes, slaRes] = await Promise.all([
    fetch(funnelUrl, { signal: AbortSignal.timeout(5000) }),
    fetch(experimentUrl, { signal: AbortSignal.timeout(5000) }),
    fetch(leadsSlaUrl, {
      signal: AbortSignal.timeout(5000),
      headers: leadsSlaBearer
        ? { authorization: `Bearer ${leadsSlaBearer}` }
        : undefined,
    }),
  ]);
  if (!funnelRes.ok) {
    throw new Error(`funnel HTTP ${funnelRes.status}`);
  }
  if (!experimentRes.ok) {
    throw new Error(`experiment HTTP ${experimentRes.status}`);
  }
  if (!slaRes.ok) {
    throw new Error(`sla HTTP ${slaRes.status}`);
  }
  const data = await funnelRes.json();
  const experimentData = await experimentRes.json();
  const slaData = await slaRes.json();
  const events = Number(data?.events ?? 0);
  const searchToProfileRate = Number(data?.rates?.searchToProfileRate ?? 0);
  const compareAdoptionRate = Number(data?.rates?.compareAdoptionRate ?? 0);
  const profileToLeadRate = Number(data?.rates?.profileToLeadSubmitRate ?? 0);
  const partnerSlaRate = Number(slaData?.partnerSlaRate ?? 0);
  const ctaVariants = Array.isArray(data?.experiments?.ctaLeadForm)
    ? data.experiments.ctaLeadForm
    : [];

  let failures = 0;

  const hasVolume = events >= minEvents;
  printRow("event volume", hasVolume, `events=${events}, min=${minEvents}`);
  if (!hasVolume) failures += 1;

  const searchOk = searchToProfileRate >= minSearchToProfileRate;
  printRow(
    "search->profile rate",
    searchOk,
    `${pct(searchToProfileRate)} >= ${pct(minSearchToProfileRate)}`,
  );
  if (!searchOk) failures += 1;

  const compareOk = compareAdoptionRate >= minCompareAdoptionRate;
  printRow(
    "compare adoption rate",
    compareOk,
    `${pct(compareAdoptionRate)} >= ${pct(minCompareAdoptionRate)}`,
  );
  if (!compareOk) failures += 1;

  const leadOk = profileToLeadRate >= minProfileToLeadRate;
  printRow(
    "profile->lead rate",
    leadOk,
    `${pct(profileToLeadRate)} >= ${pct(minProfileToLeadRate)}`,
  );
  if (!leadOk) failures += 1;

  const slaOk = partnerSlaRate >= minPartnerSlaRate;
  printRow(
    "partner SLA rate",
    slaOk,
    `${pct(partnerSlaRate)} >= ${pct(minPartnerSlaRate)}`,
  );
  if (!slaOk) failures += 1;

  const membership = ctaVariants.find((row) => row?.variant === "membership");
  const trial = ctaVariants.find((row) => row?.variant === "trial");
  const whatsapp = ctaVariants.find((row) => row?.variant === "whatsapp_first");
  const hasTwoVariants = Boolean(membership && trial);
  const hasWhatsappVariant = Boolean(whatsapp);
  printRow(
    "ab variants present (membership + trial)",
    hasTwoVariants,
    hasTwoVariants ? "" : "missing cta_lead_form_v1 variants",
  );
  if (!hasTwoVariants) failures += 1;

  printRow(
    "ab whatsapp_first variant present",
    hasWhatsappVariant,
    hasWhatsappVariant ? "" : "missing whatsapp_first variant",
  );
  if (!hasWhatsappVariant) failures += 1;

  if (hasTwoVariants && hasWhatsappVariant) {
    const assignmentOk =
      Number(membership.assignments ?? 0) >= minAbAssignmentsPerVariant &&
      Number(trial.assignments ?? 0) >= minAbAssignmentsPerVariant &&
      Number(whatsapp.assignments ?? 0) >= minAbAssignmentsPerVariant;
    printRow(
      "ab minimum assignments per variant",
      assignmentOk,
      `membership=${membership.assignments}, trial=${trial.assignments}, whatsapp_first=${whatsapp.assignments}, min=${minAbAssignmentsPerVariant}`,
    );
    if (!assignmentOk) failures += 1;

    const submitsOk =
      Number(membership.leadSubmits ?? 0) >= minAbLeadSubmitsPerVariant &&
      Number(trial.leadSubmits ?? 0) >= minAbLeadSubmitsPerVariant &&
      Number(whatsapp.leadSubmits ?? 0) >= minAbLeadSubmitsPerVariant;
    printRow(
      "ab minimum lead submits per variant",
      submitsOk,
      `membership=${membership.leadSubmits}, trial=${trial.leadSubmits}, whatsapp_first=${whatsapp.leadSubmits}, min=${minAbLeadSubmitsPerVariant}`,
    );
    if (!submitsOk) failures += 1;

    const membershipRate = Number(membership.submitRateFromAssignments ?? 0);
    const trialRate = Number(trial.submitRateFromAssignments ?? 0);
    const whatsappRate = Number(whatsapp.submitRateFromAssignments ?? 0);
    const delta = trialRate - membershipRate;
    const deltaWhatsapp = whatsappRate - membershipRate;
    console.log(
      `INFO  ab submit rate delta (trial-membership) — ${pct(delta)} (trial=${pct(trialRate)}, membership=${pct(membershipRate)})`,
    );
    console.log(
      `INFO  ab submit rate delta (whatsapp_first-membership) — ${pct(deltaWhatsapp)} (whatsapp_first=${pct(whatsappRate)}, membership=${pct(membershipRate)})`,
    );

    const stableDays = Number(experimentData?.stableDaysWithAllVariants ?? 0);
    const stableDaysOk = stableDays >= minAbStableDays;
    printRow(
      "ab stable days with all variants",
      stableDaysOk,
      `${stableDays} >= ${minAbStableDays}`,
    );
    if (!stableDaysOk) failures += 1;

    const upliftOk = delta >= minAbUplift;
    printRow(
      "ab uplift trial vs membership",
      upliftOk,
      `${pct(delta)} >= ${pct(minAbUplift)}`,
    );
    if (!upliftOk) failures += 1;

    const upliftWhatsappOk = deltaWhatsapp >= minAbUpliftWhatsapp;
    printRow(
      "ab uplift whatsapp_first vs membership",
      upliftWhatsappOk,
      `${pct(deltaWhatsapp)} >= ${pct(minAbUpliftWhatsapp)}`,
    );
    if (!upliftWhatsappOk) failures += 1;
  }

  if (failures > 0) {
    console.error(`\nResult: FAIL (${failures} KPI checks failed)`);
    process.exitCode = 1;
  } else {
    console.log("\nResult: PASS (KPI gate for Sprint 5 is green)");
  }
} catch (error) {
  console.error(
    `FAIL  gate execution error — ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
