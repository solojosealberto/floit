#!/usr/bin/env node
/**
 * Gate anti-voseo para copy UI QueGym (Fase 7 / QUEGYM_BRAND_COPY_PLAN.md).
 * Escanea apps/web/src — falla si encuentra patrones rioplatenses en strings visibles.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIR = path.join(ROOT, "apps/web/src");

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx"]);

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

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (SOURCE_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function scanPattern(pattern, files) {
  const hits = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (line.includes(pattern)) {
        const rel = path.relative(ROOT, file);
        hits.push(`${rel}:${index + 1}:${line.trim()}`);
      }
    });
  }
  return hits.join("\n");
}

const files = walkFiles(SCAN_DIR);
const violations = [];

for (const pattern of FORBIDDEN) {
  const hits = scanPattern(pattern, files);
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
