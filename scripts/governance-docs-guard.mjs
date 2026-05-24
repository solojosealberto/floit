#!/usr/bin/env node

import { execSync } from "node:child_process";

const DOC_SPRINTS = "docs/operations/sprints.md";
const DOC_EPICS = "docs/operations/EPICS_USER_STORIES_STATUS.md";
const DOC_HANDOVER = "docs/operations/PROJECT_CONTEXT_HANDOVER.md";
const REQUIRED_DOCS = [DOC_SPRINTS, DOC_EPICS, DOC_HANDOVER];

const FEATURE_PATTERNS = [
  /^apps\/web\//,
  /^services\//,
  /^packages\//,
  /^openapi\//,
  /^contracts\/events\//,
];

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function getMergeBase() {
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    try {
      return run(`git merge-base HEAD origin/${baseRef}`);
    } catch {
      // fall back below
    }
  }
  return run("git rev-parse HEAD~1");
}

function getChangedFiles() {
  const base = getMergeBase();
  const output = run(`git diff --name-only ${base}...HEAD`);
  if (!output) return [];
  return output.split("\n").map((line) => line.trim()).filter(Boolean);
}

function isFeatureFile(path) {
  return FEATURE_PATTERNS.some((pattern) => pattern.test(path));
}

function main() {
  const changedFiles = getChangedFiles();
  if (changedFiles.length === 0) {
    console.log("[governance-docs-guard] No hay cambios detectados.");
    return;
  }

  const featureChanged = changedFiles.some(isFeatureFile);
  if (!featureChanged) {
    console.log("[governance-docs-guard] No hay cambios funcionales en runtime.");
    return;
  }

  const changedSet = new Set(changedFiles);
  const missingDocs = REQUIRED_DOCS.filter((doc) => !changedSet.has(doc));

  if (missingDocs.length > 0) {
    console.error("[governance-docs-guard] Cambios funcionales detectados sin actualizar documentos de estado requeridos.");
    console.error(`[governance-docs-guard] Faltan: ${missingDocs.join(", ")}`);
    process.exit(1);
  }

  console.log("[governance-docs-guard] Guardrail OK: documentos de estado actualizados.");
}

main();
