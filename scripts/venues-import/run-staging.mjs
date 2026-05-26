#!/usr/bin/env node
/**
 * Import staging: lee `.env.staging.local` en la raíz del monorepo.
 * Plantilla: docs/env/staging.local.example
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "./lib/utils.mjs";

const STAGING_ENV_CANDIDATES = [
  path.join(REPO_ROOT, "docs/env/staging.local"),
  path.join(REPO_ROOT, ".env.staging.local"),
];
const EXAMPLE = path.join(REPO_ROOT, "docs/env/staging.local.example");

function resolveStagingEnvPath() {
  return STAGING_ENV_CANDIDATES.find((p) => existsSync(p));
}

function loadStagingEnv() {
  const STAGING_ENV = resolveStagingEnvPath();
  if (!STAGING_ENV) {
    console.error("Falta docs/env/staging.local (o .env.staging.local en la raíz)");
    console.error("Copia", EXAMPLE, "→ docs/env/staging.local");
    process.exit(1);
  }
  const env = { ...process.env };
  for (const line of readFileSync(STAGING_ENV, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function run(nodeArgs, env) {
  const r = spawnSync(process.execPath, nodeArgs, {
    cwd: REPO_ROOT,
    env,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const env = loadStagingEnv();
const base = (env.CATALOG_SERVICE_URL || "").replace(/\/$/, "");
const token = env.CATALOG_INTERNAL_API_TOKEN?.trim();
if (!base) {
  console.error("Define CATALOG_SERVICE_URL en .env.staging.local");
  process.exit(1);
}
if (!token || token.includes("<") || token === "change-me-dev-only") {
  console.error(
    "Define CATALOG_INTERNAL_API_TOKEN en .env.staging.local (mismo valor que Railway → catalog → CATALOG_INTERNAL_API_TOKEN).",
  );
  process.exit(1);
}

const skipGeocode = process.argv.includes("--skip-geocode");
const normalizeArgs = ["scripts/venues-import/normalize.mjs"];
if (skipGeocode) normalizeArgs.push("--", "--skip-geocode");

console.log("Staging import →", base);
run(normalizeArgs, env);
run(["scripts/venues-import/import.mjs", ...process.argv.filter((a) => a !== "--skip-geocode")], env);
