#!/usr/bin/env node
/**
 * Normaliza data/venues-caracas.source.csv → data/venues-caracas.normalized.json
 * y actualiza data/venues-geocode-cache.json
 *
 * Uso:
 *   node scripts/venues-import/normalize.mjs
 *   node scripts/venues-import/normalize.mjs --skip-geocode   # solo cache + URLs
 *   VENUES_SOURCE_CSV=/ruta/al.csv node scripts/venues-import/normalize.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { geocodeVenue } from "./lib/geocode.mjs";
import {
  buildDescription,
  buildSlugCandidates,
  computeCompleteness,
  parseSourceRow,
  sourceToDraft,
} from "./lib/parse-source.mjs";
import { getZoneCentroid, readJson, REPO_ROOT, writeJson } from "./lib/utils.mjs";

const args = new Set(process.argv.slice(2));
const skipGeocode = args.has("--skip-geocode");

const SOURCE_CSV =
  process.env.VENUES_SOURCE_CSV ||
  path.join(REPO_ROOT, "data/venues-caracas.source.csv");
const OUT_JSON = path.join(REPO_ROOT, "data/venues-caracas.normalized.json");
const CACHE_JSON = path.join(REPO_ROOT, "data/venues-geocode-cache.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (c === "\n" || (c === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((cell) => String(cell).trim())) rows.push(row);
      row = [];
      if (c === "\r") i++;
      continue;
    }
    if (c === "\r") continue;
    field += c;
  }
  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => String(cell).trim())) rows.push(row);
  }
  return rows;
}

async function main() {
  const raw = await fs.readFile(SOURCE_CSV, "utf8");
  const table = parseCsv(raw);
  if (table.length < 2) {
    console.error("CSV vacío o sin filas de datos:", SOURCE_CSV);
    process.exit(1);
  }

  let cache = {};
  try {
    cache = await readJson(CACHE_JSON);
  } catch {
    cache = {};
  }

  const usedSlugs = new Set();
  const records = [];
  const stats = { geocode: {}, fallback: 0, zoneFallback: 0, total: 0 };

  for (let i = 1; i < table.length; i++) {
    const source = parseSourceRow(table[i], i - 1);
    if (!source.name) continue;
    stats.total++;
    const slug = buildSlugCandidates(source, usedSlugs);
    const draft = sourceToDraft(source, slug);
    const geo = await geocodeVenue(draft, cache, { skipNetwork: skipGeocode });

    let lat = geo.lat;
    let lng = geo.lng;
    let geocodeNote = `${geo.method}${geo.query ? `: ${geo.query}` : ""}`;
    if (lat == null || lng == null) {
      const zc = getZoneCentroid(draft.zone);
      lat = zc.lat;
      lng = zc.lng;
      geocodeNote += " (centroide de zona — revisar ubicación exacta)";
      stats.zoneFallback++;
    }
    stats.geocode[geo.method] = (stats.geocode[geo.method] ?? 0) + 1;

    const description = buildDescription(source);
    const record = {
      ...draft,
      lat,
      lng,
      description,
      importMeta: {
        sourceRow: source.rowIndex,
        geocodeNote: geocodeNote ?? null,
        importedAt: new Date().toISOString(),
      },
      completenessScore: 0,
      geocode: { ...geo, lat, lng },
    };
    record.completenessScore = computeCompleteness(record);
    records.push(record);
  }

  await writeJson(CACHE_JSON, cache);
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceCsv: SOURCE_CSV,
    count: records.length,
    records,
  };
  await writeJson(OUT_JSON, payload);

  console.log(`Normalizado: ${records.length} venues → ${OUT_JSON}`);
  console.log(`Geocode cache: ${CACHE_JSON}`);
  console.log(`Centroide por zona: ${stats.zoneFallback} / ${stats.total}`);
  console.log("Métodos geocode:", stats.geocode);
  if (skipGeocode) {
    console.log("(Modo --skip-geocode: sin llamadas Nominatim)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
