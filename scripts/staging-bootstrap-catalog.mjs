#!/usr/bin/env node
/**
 * Bootstrap catálogo staging: schema en Neon + import 95 venues.
 *
 * Requiere docs/env/staging.local (ver docs/env/staging.local.example):
 *   DATABASE_URL, CATALOG_INTERNAL_API_TOKEN
 *
 * Uso:
 *   pnpm staging:bootstrap
 *   pnpm staging:bootstrap -- --import-only   # solo import (schema ya existe)
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const STAGING_ENV = join(REPO_ROOT, "docs/env/staging.local");
const LOCAL_CATALOG = "http://127.0.0.1:4019";
const DEFAULT_RAILWAY_CATALOG =
  "https://floitcatalog-service-production.up.railway.app";

const args = new Set(process.argv.slice(2));
const importOnly = args.has("--import-only");

function loadStagingEnv() {
  if (!existsSync(STAGING_ENV)) {
    console.error(`Falta ${STAGING_ENV}`);
    console.error("Copia docs/env/staging.local.example → docs/env/staging.local");
    process.exit(1);
  }
  for (const line of readFileSync(STAGING_ENV, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd: REPO_ROOT,
      stdio: "inherit",
      env: { ...process.env, ...opts.env },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

async function waitUrl(url, { attempts = 90, intervalMs = 2000 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) return;
      const text = await res.text();
      console.warn(`Intento ${i}/${attempts} ${url} → HTTP ${res.status}: ${text.slice(0, 120)}`);
    } catch (e) {
      console.warn(
        `Intento ${i}/${attempts} ${url} → ${e instanceof Error ? e.message : e}`,
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timeout esperando ${url}`);
}

function startCatalogChild(env) {
  return spawn("pnpm", ["--filter", "@floit/catalog-service", "start"], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main() {
  loadStagingEnv();

  const databaseUrl =
    process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_CATALOG?.trim();
  const token = process.env.CATALOG_INTERNAL_API_TOKEN?.trim();
  const railwayCatalog =
    process.env.CATALOG_SERVICE_URL?.trim() || DEFAULT_RAILWAY_CATALOG;

  if (!databaseUrl) {
    console.error("DATABASE_URL requerido en staging.local");
    process.exit(1);
  }
  if (!token) {
    console.error("CATALOG_INTERNAL_API_TOKEN requerido en staging.local");
    process.exit(1);
  }

  let child = null;

  if (!importOnly) {
    console.log("\n=== 1) Build catalog ===\n");
    await run("pnpm", ["--filter", "@floit/catalog-service", "build"]);

    console.log("\n=== 2) Schema sync en Neon (catalog local → DATABASE_URL) ===\n");
    child = startCatalogChild({
      DATABASE_URL: databaseUrl,
      DATABASE_SYNC: "true",
      SEED_ON_BOOT: "false",
      CATALOG_INTERNAL_API_TOKEN: token,
      PORT: "4019",
      HOST: "127.0.0.1",
      NODE_ENV: "development",
    });

    child.stdout?.on("data", (d) => process.stdout.write(d));
    child.stderr?.on("data", (d) => process.stderr.write(d));

    await waitUrl(`${LOCAL_CATALOG}/health`);
    await waitUrl(`${LOCAL_CATALOG}/health/ready`).catch(() =>
      waitUrl(`${LOCAL_CATALOG}/v1/meta/zones`),
    );
    console.log("Schema local OK");

    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 2000));
    child = null;
  }

  console.log("\n=== 3) Import vía catalog local → Neon ===\n");
  child = startCatalogChild({
    DATABASE_URL: databaseUrl,
    DATABASE_SYNC: "false",
    SEED_ON_BOOT: "false",
    CATALOG_INTERNAL_API_TOKEN: token,
    PORT: "4019",
    HOST: "127.0.0.1",
    NODE_ENV: "development",
  });
  child.stdout?.on("data", (d) => process.stdout.write(d));
  child.stderr?.on("data", (d) => process.stderr.write(d));
  await waitUrl(`${LOCAL_CATALOG}/health`);

  await run("node", ["scripts/venues-import/import.mjs"], {
    env: {
      CATALOG_SERVICE_URL: LOCAL_CATALOG,
      CATALOG_INTERNAL_API_TOKEN: token,
    },
  });

  child.kill("SIGTERM");
  child = null;

  console.log("\n=== 4) Validar Railway catalog ===\n");
  const readyRes = await fetch(`${railwayCatalog}/health/ready`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (readyRes.ok) {
    console.log("Railway /health/ready:", await readyRes.text());
  } else {
    console.warn(
      "Railway /health/ready aún no OK (redeploy catalog con CATALOG_ENSURE_SCHEMA=true o DATABASE_SYNC=true una vez)",
    );
  }

  console.log("\n=== 5) Import HTTP a Railway (mismo token en Railway) ===\n");
  try {
    await waitUrl(`${railwayCatalog}/health`, { attempts: 5, intervalMs: 3000 });
    await run("node", ["scripts/venues-import/import.mjs"], {
      env: {
        CATALOG_SERVICE_URL: railwayCatalog,
        CATALOG_INTERNAL_API_TOKEN: token,
      },
    });
  } catch (e) {
    console.warn("Import Railway omitido o fallido:", e instanceof Error ? e.message : e);
    console.warn(
      "Si 401: alinea CATALOG_INTERNAL_API_TOKEN en Railway con staging.local",
    );
  }

  await run("node", ["scripts/venues-import/validate.mjs", "--live"], {
    env: { CATALOG_SERVICE_URL: railwayCatalog },
  }).catch(() =>
    run("node", ["scripts/venues-import/validate.mjs", "--live"], {
      env: { CATALOG_SERVICE_URL: LOCAL_CATALOG },
    }),
  );

  console.log("\n=== Listo. Actualiza Vercel: CATALOG + SEARCH → URLs Railway; redeploy web ===\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
