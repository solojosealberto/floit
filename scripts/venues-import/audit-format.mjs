#!/usr/bin/env node
/**
 * Auditoría de formato: JSON normalizado vs filas en Postgres/API.
 */
import path from "node:path";
import { readJson, REPO_ROOT } from "./lib/utils.mjs";

const NORMALIZED = path.join(REPO_ROOT, "data/venues-caracas.normalized.json");
const BASE = (process.env.CATALOG_SERVICE_URL || "http://localhost:4010").replace(
  /\/$/,
  "",
);
const VENUE_TYPES = new Set([
  "gym",
  "functional",
  "yoga",
  "pilates",
  "cycling",
  "mixed",
  "personal_training",
]);
const CARACAS_FALLBACK = { lat: 10.480594, lng: -66.903606 };

async function main() {
  const payload = await readJson(NORMALIZED);
  const records = payload.records ?? [];
  const issues = [];
  const stats = {
    total: records.length,
    withPhone: 0,
    withPhotos: 0,
    withPrice: 0,
    fallbackCoords: 0,
    invalidVenueType: 0,
    invalidSlug: 0,
    missingSource: 0,
    badDescription: 0,
    badPhone: 0,
  };

  for (const r of records) {
    if (!r.source) {
      stats.missingSource++;
      issues.push(`sin source: ${r.slug}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)) {
      stats.invalidSlug++;
      issues.push(`slug inválido: ${r.slug}`);
    }
    if (!VENUE_TYPES.has(r.venueType)) {
      stats.invalidVenueType++;
      issues.push(`venueType desconocido: ${r.slug} → ${r.venueType}`);
    }
    if (r.contactPhone && !/^\d{10,15}$/.test(r.contactPhone)) {
      stats.badPhone++;
      issues.push(`teléfono no E.164-ish: ${r.slug} → ${r.contactPhone}`);
    }
    if (r.contactPhone || r.contactWhatsapp) stats.withPhone++;
    if (r.photoUrls?.length) stats.withPhotos++;
    if (r.priceMin != null) stats.withPrice++;
    if (
      r.lat === CARACAS_FALLBACK.lat &&
      r.lng === CARACAS_FALLBACK.lng &&
      r.geocode?.method === "not-found"
    ) {
      stats.fallbackCoords++;
    }
    if (
      !r.description?.includes("importación normalizada") &&
      !r.description?.includes("venues-import")
    )
      stats.badDescription++;
    if (!r.modalities?.length) issues.push(`sin modalities: ${r.slug}`);
    if (r.name.length > 240) issues.push(`name > 240: ${r.slug}`);
  }

  console.log("=== Auditoría JSON normalizado ===");
  console.log(JSON.stringify(stats, null, 2));
  if (issues.length) {
    console.log(`\nProblemas (${issues.length}, primeros 15):`);
    for (const i of issues.slice(0, 15)) console.log(" -", i);
  } else {
    console.log("\nSin problemas estructurales en JSON.");
  }

  let apiItems = [];
  try {
    const res = await fetch(`${BASE}/v1/venues?limit=500`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    apiItems = data.items ?? [];
  } catch (e) {
    console.log("\n=== API catalog ===");
    console.log("No disponible:", e instanceof Error ? e.message : e);
    process.exit(issues.length ? 1 : 0);
  }

  const bySlug = Object.fromEntries(apiItems.map((v) => [v.slug, v]));
  const apiIssues = [];
  let matched = 0;
  for (const r of records) {
    const v = bySlug[r.slug];
    if (!v) {
      apiIssues.push(`falta en API: ${r.slug}`);
      continue;
    }
    matched++;
    if (v.name !== r.name) apiIssues.push(`name drift: ${r.slug}`);
    if (v.zone !== r.zone) apiIssues.push(`zone drift: ${r.slug}`);
    if (v.venueType !== r.venueType) apiIssues.push(`venueType drift: ${r.slug}`);
    if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) {
      apiIssues.push(`coords inválidas API: ${r.slug}`);
    }
    if (v.verificationStatus && v.verificationStatus !== "reference") {
      /* ok */
    }
  }

  console.log("\n=== API catalog (Postgres vía servicio) ===");
  console.log(`Venues totales API: ${apiItems.length}`);
  console.log(`Importados presentes: ${matched}/${records.length}`);
  const sample = records.slice(0, 3).map((r) => bySlug[r.slug]).filter(Boolean);
  console.log("\nMuestra (3 primeros importados):");
  for (const v of sample) {
    console.log(
      `  ${v.slug} | ${v.zone} | ${v.venueType} | $${v.priceMin ?? "?"}-${v.priceMax ?? "?"} | mods:${v.modalities?.length} amen:${v.amenities?.length}`,
    );
  }
  if (apiIssues.length) {
    console.log(`\nDrift API (${apiIssues.length}, primeros 10):`);
    for (const i of apiIssues.slice(0, 10)) console.log(" -", i);
    process.exit(1);
  }
  console.log("\nAPI alineada con JSON normalizado: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
