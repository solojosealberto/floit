#!/usr/bin/env node
/**
 * Auditoría de perfiles listos para UI (foto, precio, descripción limpia).
 *
 *   pnpm venues:audit:ui
 */
import path from "node:path";
import { readJson, REPO_ROOT } from "./lib/utils.mjs";

const NORMALIZED_JSON = path.join(REPO_ROOT, "data/venues-caracas.normalized.json");

function isCleanDescription(text) {
  if (!text?.trim()) return false;
  if (/Calificación \(fuente\):/i.test(text)) return false;
  if (/Ubicación:\s*cache:/i.test(text)) return false;
  if (/venues-import|importación normalizada/i.test(text)) return false;
  return true;
}

async function main() {
  const payload = await readJson(NORMALIZED_JSON);
  const records = payload.records ?? [];
  const total = records.length;
  if (total === 0) {
    console.error("Sin registros en", NORMALIZED_JSON);
    process.exit(1);
  }

  let withPhoto = 0;
  let withPrice = 0;
  let withContact = 0;
  let cleanDescription = 0;
  let uiReady = 0;

  for (const r of records) {
    const photo = Array.isArray(r.photoUrls) && r.photoUrls.length > 0;
    const price = r.priceMin != null || r.priceMax != null;
    const contact = Boolean(r.contactPhone || r.contactWhatsapp);
    const desc = isCleanDescription(r.description);
    if (photo) withPhoto++;
    if (price) withPrice++;
    if (contact) withContact++;
    if (desc) cleanDescription++;
    if (photo && price && contact && desc && (r.completenessScore ?? 0) >= 0.55) {
      uiReady++;
    }
  }

  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

  console.log(`Venues audit UI — ${total} registros`);
  console.log(`  Con foto:              ${withPhoto} (${pct(withPhoto)})`);
  console.log(`  Con precio:            ${withPrice} (${pct(withPrice)})`);
  console.log(`  Con contacto:          ${withContact} (${pct(withContact)})`);
  console.log(`  Descripción limpia:  ${cleanDescription} (${pct(cleanDescription)})`);
  console.log(`  Listos para UI (≥0.55): ${uiReady} (${pct(uiReady)})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
