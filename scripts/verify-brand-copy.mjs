#!/usr/bin/env node
/**
 * Gate anti-voseo para copy UI QueGym (Fase 7 / QUEGYM_BRAND_COPY_PLAN.md).
 * Escanea apps/web/src — falla si encuentra patrones rioplatenses en strings visibles.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIR = path.join(ROOT, "apps/web/src");

/** Patrones prohibidos (voseo / copy legacy). */
const FORBIDDEN = [
  "Encontrá",
  "Compará",
  "Contactá",
  "Registrá",
  "Reclamá",
  "Tenés",
  "Podés",
  "Elegí",
  "Completá",
  "Buscá",
  "Iniciá",
  "Agregá",
  "Descubrí",
  "Empezá",
  "Configurá",
  "Revisá",
  "Aprobá",
  "Arrastrá",
  "Seleccioná",
  "Adjuntá",
  "Cambá",
  "Ampliá",
  "buscás",
  "comparalos",
  "contactá directo",
  "gestioná",
  "recibí leads",
  " vos podés",
  "sos administrador",
];

function runRg(pattern) {
  try {
    const out = execSync(
      `rg -n --no-heading -F "${pattern.replace(/"/g, '\\"')}" "${SCAN_DIR}"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    );
    return out.trim();
  } catch (err) {
    if (err.status === 1) return "";
    throw err;
  }
}

const violations = [];

for (const pattern of FORBIDDEN) {
  const hits = runRg(pattern);
  if (hits) {
    violations.push({ pattern, hits });
  }
}

if (violations.length === 0) {
  console.log("verify-brand-copy: OK (0 voseo patterns in apps/web/src)");
  process.exit(0);
}

console.error("verify-brand-copy: FAILED — voseo or legacy copy detected:\n");
for (const { pattern, hits } of violations) {
  console.error(`  [${pattern}]`);
  console.error(hits.split("\n").map((l) => `    ${l}`).join("\n"));
  console.error("");
}
console.error("See docs/ux/QUEGYM_BRAND_COPY_PLAN.md");
process.exit(1);
