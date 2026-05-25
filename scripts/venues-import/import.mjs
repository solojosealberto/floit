#!/usr/bin/env node
/**
 * Importa data/venues-caracas.normalized.json al catalog-service.
 *
 * Uso:
 *   pnpm venues:import              # requiere catalog en :4010
 *   pnpm venues:import --dry-run
 *   pnpm venues:import --update     # re-sincroniza venues existentes (partner-sync)
 *   CATALOG_SERVICE_URL=... CATALOG_INTERNAL_API_TOKEN=... node scripts/venues-import/import.mjs
 */
import path from "node:path";
import { readJson, REPO_ROOT } from "./lib/utils.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const updateExisting = args.has("--update");
const concurrency = Number(process.env.VENUES_IMPORT_CONCURRENCY ?? "4");

const NORMALIZED_JSON = path.join(REPO_ROOT, "data/venues-caracas.normalized.json");
const BASE_URL = (process.env.CATALOG_SERVICE_URL || "http://localhost:4010").replace(
  /\/$/,
  "",
);
const TOKEN =
  process.env.CATALOG_INTERNAL_API_TOKEN?.trim() ||
  process.env.PARTNER_TO_CATALOG_INTERNAL_TOKEN?.trim() ||
  "change-me-dev-only";

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": TOKEN,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

function toCreateBody(record) {
  return {
    slug: record.slug,
    name: record.name,
    address: record.address,
    zone: record.zone,
    venueType: record.venueType,
    lat: record.lat,
    lng: record.lng,
    modalities: record.modalities,
    amenities: record.amenities,
    description: record.description,
    priceMin: record.priceMin,
    priceMax: record.priceMax,
    completenessScore: record.completenessScore,
    popularityScore: record.popularityScore,
    allowsTrial: record.allowsTrial,
    contactPhone: record.contactPhone,
    contactWhatsapp: record.contactWhatsapp,
    contactEmail: record.contactEmail,
    photoUrls: record.photoUrls?.length ? record.photoUrls : undefined,
  };
}

function toSyncBody(record) {
  /** Descripción completa ya va en POST /v1/internal/venues; sync solo añade planes. */
  return {
    contactPhone: record.contactPhone ?? undefined,
    contactWhatsapp: record.contactWhatsapp ?? undefined,
    allowsTrial: record.allowsTrial,
    photoUrls: record.photoUrls?.length ? record.photoUrls : undefined,
    plans: record.plans?.length ? record.plans : undefined,
  };
}

async function importOne(record) {
  const createUrl = `${BASE_URL}/v1/internal/venues`;
  const syncUrl = `${BASE_URL}/v1/internal/venues/${encodeURIComponent(record.slug)}/partner-sync`;

  if (dryRun) {
    return { slug: record.slug, action: "dry-run" };
  }

  const created = await postJson(createUrl, toCreateBody(record));
  if (created.ok) {
    const wasNew = created.json?.created === true;
    const wasUpdated = created.json?.updated === true;
    const sync = await postJson(syncUrl, toSyncBody(record));
    if (!sync.ok && sync.status !== 204) {
      return {
        slug: record.slug,
        action: wasNew ? "created-sync-failed" : "exists-sync-failed",
        status: sync.status,
        error: sync.json,
      };
    }
    return {
      slug: record.slug,
      action: wasNew ? "created" : wasUpdated ? "updated" : "synced",
    };
  }

  if (updateExisting) {
    const sync = await postJson(syncUrl, toSyncBody(record));
    return {
      slug: record.slug,
      action: sync.ok ? "updated-sync" : "update-failed",
      status: sync.status,
      error: sync.ok ? undefined : sync.json,
    };
  }

  return {
    slug: record.slug,
    action: "failed",
    status: created.status,
    error: created.json,
  };
}

async function runPool(items, worker, limit) {
  const results = [];
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => next()));
  return results;
}

async function main() {
  const payload = await readJson(NORMALIZED_JSON);
  const records = payload.records ?? [];
  if (records.length === 0) {
    console.error("Sin registros en", NORMALIZED_JSON);
    console.error("Ejecuta antes: pnpm venues:normalize");
    process.exit(1);
  }

  if (!dryRun) {
    const isRemote =
      BASE_URL.includes("railway.app") || BASE_URL.startsWith("https://");
    const attempts = isRemote ? 12 : 1;
    const timeoutMs = isRemote ? 30_000 : 3_000;
    let lastErr = "unknown";
    let ok = false;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const health = await fetch(`${BASE_URL}/health`, {
          signal: AbortSignal.timeout(timeoutMs),
        });
        const body = await health.text();
        if (!health.ok) throw new Error(`health HTTP ${health.status}: ${body.slice(0, 120)}`);
        ok = true;
        break;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (attempt < attempts) {
          console.warn(
            `Health intento ${attempt}/${attempts} falló (${lastErr}); reintento en 10s…`,
          );
          await new Promise((r) => setTimeout(r, 10_000));
        }
      }
    }
    if (!ok) {
      console.error(`catalog-service no disponible en ${BASE_URL} tras ${attempts} intentos.`);
      console.error(lastErr);
      console.error(
        "Local: pnpm docker:up && pnpm --filter @floit/catalog-service start. Staging: revisar deploy Railway (logs, DATABASE_URL, redeploy).",
      );
      process.exit(1);
    }
  }

  console.log(
    `Importando ${records.length} venues → ${BASE_URL} (dryRun=${dryRun}, concurrency=${concurrency})`,
  );

  const results = await runPool(records, importOne, concurrency);
  const summary = {};
  for (const r of results) {
    summary[r.action] = (summary[r.action] ?? 0) + 1;
  }
  console.log("Resumen:", summary);
  const failed = results.filter((r) => r.action.includes("failed"));
  if (failed.length) {
    console.log("Fallos (primeros 5):");
    for (const f of failed.slice(0, 5)) {
      console.log(" ", f.slug, f.status, JSON.stringify(f.error)?.slice(0, 200));
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
