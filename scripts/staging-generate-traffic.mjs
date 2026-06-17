#!/usr/bin/env node
/**
 * Genera tráfico sintético en staging para funnel analytics + leads (gates Sprint 5).
 *
 * Uso:
 *   pnpm staging:generate-traffic
 *   pnpm staging:generate-traffic -- --dry-run
 *
 * Requiere docs/env/staging.local con AUTH0_M2M_* (para marcar leads contacted → SLA).
 */
import { loadStagingEnv } from "./load-staging-env.mjs";

loadStagingEnv();

const dryRun = process.argv.includes("--dry-run");
const WEB = process.env.STAGING_WEB_BASE_URL ?? "https://staging.quegym.com";
const ANALYTICS =
  process.env.ANALYTICS_SERVICE_URL ??
  "https://floitanalytics-service-production.up.railway.app";
const LEADS =
  process.env.LEADS_SERVICE_URL ??
  "https://floitleads-service-production.up.railway.app";

const VENUE_SLUG = process.env.STAGING_TRAFFIC_VENUE_SLUG ?? "life-fit-zone";
const ASSIGNMENTS_PER_VARIANT = Number(
  process.env.STAGING_TRAFFIC_ASSIGNMENTS ?? "35",
);
const SUBMITS_PER_VARIANT = Number(process.env.STAGING_TRAFFIC_SUBMITS ?? "4");
const DISCOVERY_VIEWS = Number(process.env.STAGING_TRAFFIC_DISCOVERY ?? "60");
const VENUE_VIEWS = Number(process.env.STAGING_TRAFFIC_VENUE_VIEWS ?? "60");
const COMPARE_OPENS = Number(process.env.STAGING_TRAFFIC_COMPARE ?? "20");

const VARIANTS = ["membership", "trial", "whatsapp_first"];

async function obtainBearer() {
  const { spawnSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const { join } = await import("node:path");
  const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
  const child = spawnSync("node", ["scripts/obtain-auth0-m2m-token.mjs"], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
  });
  if (child.status !== 0) {
    throw new Error(child.stderr || "auth0:m2m-token failed");
  }
  return child.stdout.trim();
}

async function postEvent(name, properties = {}) {
  if (dryRun) return { ok: true };
  const res = await fetch(`${ANALYTICS}/v1/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, properties }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`analytics ${name} HTTP ${res.status}`);
  }
  return res.json();
}

async function postLead(intent, index) {
  const payload = {
    venueSlug: VENUE_SLUG,
    intent,
    name: `QA Traffic ${intent} ${index}`,
    phone: `+58414${String(1000000 + index).slice(-7)}`,
    email: `qa-traffic-${intent}-${Date.now()}-${index}@quegym.dev`,
    message: "Tráfico sintético staging Sprint 5",
    consentAccepted: true,
    consentVersion: "quegym-r2-2026-05",
  };
  if (dryRun) return { id: `dry-${index}`, status: "received" };
  const res = await fetch(`${WEB}/api/leads`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "QueGym-Staging-Traffic/1.0",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`lead ${intent} HTTP ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function markContacted(leadId, bearer) {
  if (dryRun) return;
  const res = await fetch(`${LEADS}/v1/admin/lead/${leadId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({ status: "contacted" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`patch lead ${leadId} HTTP ${res.status}`);
  }
}

function experimentProps(variant) {
  return {
    experiment: "cta_lead_entrypoint_v2",
    ctaVariant: variant,
    venueSlug: VENUE_SLUG,
    slug: VENUE_SLUG,
    source: "/buscar",
  };
}

async function main() {
  console.log(`staging-generate-traffic → ${WEB}`);
  console.log(
    `analytics=${ANALYTICS} venue=${VENUE_SLUG} dryRun=${dryRun}\n`,
  );

  let events = 0;
  for (let i = 0; i < DISCOVERY_VIEWS; i++) {
    await postEvent("discovery_view", { source: "/buscar", zone: "Caracas" });
    events++;
  }
  for (let i = 0; i < VENUE_VIEWS; i++) {
    await postEvent("venue_view", { slug: VENUE_SLUG, source: `/gyms/${VENUE_SLUG}` });
    events++;
  }
  for (let i = 0; i < COMPARE_OPENS; i++) {
    await postEvent("compare_open", { source: "/comparar" });
    events++;
  }

  for (const variant of VARIANTS) {
    for (let day = 0; day < 7; day++) {
      for (let i = 0; i < 5; i++) {
        await postEvent("experiment_assignment", {
          ...experimentProps(variant),
          _stagingBackdateDays: day,
        });
        events++;
      }
    }
    for (let i = 0; i < SUBMITS_PER_VARIANT; i++) {
      await postEvent("lead_submit", experimentProps(variant));
      events++;
    }
  }

  console.log(`OK  ${events} eventos analytics`);

  const bearer = await obtainBearer();
  const leadIds = [];
  for (const variant of ["membership", "trial", "info"]) {
    for (let i = 0; i < 3; i++) {
      const lead = await postLead(variant, leadIds.length + 1);
      if (lead.id) leadIds.push(lead.id);
      await postEvent("lead_persisted", {
        venueSlug: VENUE_SLUG,
        leadId: lead.id,
        intent: variant,
      });
    }
  }
  console.log(`OK  ${leadIds.length} leads creados vía BFF`);

  let contacted = 0;
  for (const id of leadIds) {
    try {
      await markContacted(id, bearer);
      contacted++;
    } catch (e) {
      console.warn(`WARN patch ${id}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`OK  ${contacted} leads marcados contacted (SLA)`);
  console.log("\nSiguiente: pnpm sprint5:staging-gate");
}

main().catch((e) => {
  console.error("FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
