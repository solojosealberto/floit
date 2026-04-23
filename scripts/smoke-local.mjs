#!/usr/bin/env node
/**
 * Smoke HTTP de servicios locales (Plan maestro — smoke post-deploy / dev).
 * No falla el proceso si un servicio está apagado; imprime estado por línea.
 */
const checks = [
  ["catalog", "http://localhost:4010/health"],
  ["search", "http://localhost:4011/health"],
  ["leads", "http://localhost:4012/health"],
  ["analytics", "http://localhost:4014/health"],
];

async function one(name, url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const ok = res.ok;
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }
    const label = ok ? "OK" : `HTTP ${res.status}`;
    console.log(`${name.padEnd(12)} ${label.padEnd(12)} ${url}`);
    if (!ok && body) console.log(`             ${body.slice(0, 120)}`);
  } catch (e) {
    console.log(`${name.padEnd(12)} FAIL         ${url}`);
    console.log(`             ${e instanceof Error ? e.message : String(e)}`);
  }
}

console.log("Floit smoke (localhost). Arranca Postgres + pnpm dev:services si falla catalog/search.\n");
for (const [name, url] of checks) {
  await one(name, url);
}
