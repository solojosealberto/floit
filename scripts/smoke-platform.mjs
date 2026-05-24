#!/usr/bin/env node
/**
 * Smoke funcional: salud de servicios, discovery con datos, ficha de catálogo,
 * y opcionalmente rutas de Next.js si defines SMOKE_WEB_BASE (ej. http://127.0.0.1:3000).
 */
const TIMEOUT_MS = 8000;

function base(u) {
  return u.replace(/\/$/, "");
}

async function fetchOk(label, url, { json } = {}) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.log(`${label.padEnd(22)} FAIL HTTP ${res.status} ${url}`);
      return { ok: false };
    }
    if (json) {
      const body = await res.json();
      console.log(`${label.padEnd(22)} OK`);
      return { ok: true, body };
    }
    const text = await res.text();
    console.log(`${label.padEnd(22)} OK`);
    return { ok: true, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`${label.padEnd(22)} FAIL ${msg}`);
    return { ok: false };
  }
}

let failures = 0;

function must(ok, msg) {
  if (!ok) {
    failures++;
    console.log(`                       ${msg}`);
  }
}

async function main() {
  const catalog = base(process.env.CATALOG_SERVICE_URL ?? "http://127.0.0.1:4010");
  const search = base(process.env.SEARCH_SERVICE_URL ?? "http://127.0.0.1:4011");
  const leads = base(process.env.LEADS_SERVICE_URL ?? "http://127.0.0.1:4012");
  const partner = base(process.env.PARTNER_SERVICE_URL ?? "http://127.0.0.1:4013");
  const analytics = base(process.env.ANALYTICS_SERVICE_URL ?? "http://127.0.0.1:4014");

  console.log("=== Salud HTTP /health ===\n");
  for (const [name, root] of [
    ["catalog", catalog],
    ["search", search],
    ["leads", leads],
    ["partner", partner],
    ["analytics", analytics],
  ]) {
    const r = await fetchOk(name, `${root}/health`);
    must(r.ok, "Arranca: pnpm dev:services y Postgres si catalog falla.");
  }

  console.log("\n=== Discovery (search /v1/search) ===\n");
  const disc = await fetchOk("GET /v1/search", `${search}/v1/search?limit=10`, {
    json: true,
  });
  let sampleSlug = "gym-fitness-caracas";
  if (disc.ok && disc.body) {
    const items = disc.body.items ?? [];
    const total = disc.body.meta?.total ?? items.length;
    console.log(
      `                       items en página: ${items.length}, meta.total: ${total}`,
    );
    must(items.length > 0 || total > 0, "Lista vacía: revisa seed (SEED_ON_BOOT) y Postgres.");
    if (items[0]?.slug) sampleSlug = items[0].slug;
  }

  console.log("\n=== Ficha catálogo (GET /v1/venues/:slug) ===\n");
  const venue = await fetchOk(
    `venue ${sampleSlug}`,
    `${catalog}/v1/venues/${encodeURIComponent(sampleSlug)}`,
    { json: true },
  );
  must(venue.ok, `Slug de prueba: ${sampleSlug}`);

  const web = process.env.SMOKE_WEB_BASE?.trim();
  if (web) {
    const wb = base(web);
    console.log("\n=== Next.js (SMOKE_WEB_BASE) ===\n");
    const home = await fetchOk("GET /", `${wb}/`);
    must(home.ok, "¿pnpm dev en marcha? Mira el puerto en la consola de Next.");

    const buscar = await fetchOk("GET /buscar", `${wb}/buscar`);
    must(buscar.ok && buscar.text?.includes("Buscar"), "/buscar no devuelve HTML esperado.");
    if (buscar.text && !buscar.text.includes(sampleSlug)) {
      console.log(
        `                       WARN: HTML de /buscar no contiene slug '${sampleSlug}' (payload RSC puede variar).`,
      );
    }

    const ficha = await fetchOk(`GET /gyms/${sampleSlug}`, `${wb}/gyms/${sampleSlug}`);
    must(ficha.ok, "Ficha de gimnasio no responde.");

    const compareApi = await fetchOk(
      "GET /api/compare/search?q=ox",
      `${wb}/api/compare/search?q=ox`,
      { json: true },
    );
    if (compareApi.ok && compareApi.body && Array.isArray(compareApi.body.items)) {
      console.log(
        `                       compare API items: ${compareApi.body.items.length}`,
      );
    }
  } else {
    console.log(
      "\n=== Next.js ===\n\n(Omitido) Exporta SMOKE_WEB_BASE=http://127.0.0.1:PUERTO para probar /buscar y fichas.",
    );
    console.log(
      "                       Tras `pnpm dev`, Next suele usar :3000 o el siguiente libre; E2E usa :3050.",
    );
  }

  console.log(
    failures === 0
      ? "\n=== Smoke platform: OK ===\n"
      : `\n=== Smoke platform: ${failures} fallo(s) ===\n`,
  );
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
