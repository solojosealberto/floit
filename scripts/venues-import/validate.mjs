#!/usr/bin/env node
/**
 * Valida el JSON normalizado y opcionalmente el catálogo en catalog-service.
 *
 *   pnpm venues:validate
 *   pnpm venues:validate --live
 */
import path from "node:path";
import { readJson, REPO_ROOT } from "./lib/utils.mjs";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");

const NORMALIZED_JSON = path.join(REPO_ROOT, "data/venues-caracas.normalized.json");
const BASE_URL = (process.env.CATALOG_SERVICE_URL || "http://localhost:4010").replace(
  /\/$/,
  "",
);

async function main() {
  const payload = await readJson(NORMALIZED_JSON);
  const records = payload.records ?? [];
  const issues = [];
  const slugs = new Set();

  for (const r of records) {
    if (slugs.has(r.slug)) issues.push(`slug duplicado: ${r.slug}`);
    slugs.add(r.slug);
    if (!r.name) issues.push(`sin nombre: ${r.slug}`);
    if (!r.zone) issues.push(`sin zona: ${r.slug}`);
    if (r.lat == null || r.lng == null) issues.push(`sin coords: ${r.slug}`);
    if (!r.source) issues.push(`sin source preservado: ${r.slug}`);
    if (
      !r.description?.includes("importación normalizada") &&
      !r.description?.includes("venues-import")
    ) {
      issues.push(`description sin marca import: ${r.slug}`);
    }
  }

  console.log(`Registros normalizados: ${records.length}`);
  console.log(`Slugs únicos: ${slugs.size}`);
  if (issues.length) {
    console.log("Problemas:");
    for (const i of issues.slice(0, 20)) console.log(" -", i);
    process.exit(1);
  }
  console.log("JSON normalizado: OK");

  if (!live) return;

  const res = await fetch(`${BASE_URL}/v1/venues?limit=500`);
  if (!res.ok) {
    console.error("No se pudo listar venues:", res.status);
    process.exit(1);
  }
  const data = await res.json();
  const items = data.items ?? data.venues ?? [];
  const imported = items.filter((v) =>
    records.some((r) => r.slug === v.slug),
  );
  console.log(`Venues en API: ${items.length}; importados presentes: ${imported.length}`);
  if (imported.length < records.length) {
    const missing = records
      .filter((r) => !items.some((v) => v.slug === r.slug))
      .map((r) => r.slug);
    console.log("Faltan en API (primeros 10):", missing.slice(0, 10));
    process.exit(1);
  }
  console.log("Catálogo live: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
