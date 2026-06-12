#!/usr/bin/env node
/**
 * Load docs/env/staging.local into process.env (does not override existing vars).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
export const STAGING_ENV_PATH = join(REPO_ROOT, "docs/env/staging.local");

export function loadStagingEnv({ requiredKeys = [] } = {}) {
  if (existsSync(STAGING_ENV_PATH)) {
    for (const line of readFileSync(STAGING_ENV_PATH, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const key = t.slice(0, i).trim();
      if (process.env[key]?.trim()) continue;
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

  const missing = requiredKeys.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(
      `Faltan variables (${missing.join(", ")}). Copia docs/env/staging.local.example → docs/env/staging.local`,
    );
    process.exit(1);
  }
}
