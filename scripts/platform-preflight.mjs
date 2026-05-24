#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const checks = [];

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

function ok(name, detail) {
  checks.push({ name, status: "PASS", detail });
}

function fail(name, detail) {
  checks.push({ name, status: "FAIL", detail });
}

function warn(name, detail) {
  checks.push({ name, status: "WARN", detail });
}

const nodeVersion = process.version;
if (Number(nodeVersion.replace(/^v/, "").split(".")[0]) >= 20) {
  ok("Node.js >= 20", nodeVersion);
} else {
  fail("Node.js >= 20", `Actual: ${nodeVersion}`);
}

const pnpm = run("npx", ["pnpm", "--version"]);
if (pnpm.status === 0) {
  ok("pnpm disponible", pnpm.stdout.trim());
} else {
  fail("pnpm disponible", pnpm.stderr.trim() || "No encontrado");
}

const docker = run("docker", ["--version"]);
if (docker.status === 0) {
  ok("Docker disponible", docker.stdout.trim());
} else {
  fail("Docker disponible", "Instala/activa Docker o Colima para Testcontainers");
}

const remote = run("git", ["remote", "get-url", "origin"]);
if (remote.status === 0) {
  ok("Git remote origin", remote.stdout.trim());
} else {
  fail("Git remote origin", "No existe remote origin");
}

const explicitWeb = process.env.PREFLIGHT_WEB_URL?.trim();
const webCandidates = explicitWeb
  ? [explicitWeb]
  : [
      "http://127.0.0.1:3050/",
      "http://127.0.0.1:3000/",
      "http://127.0.0.1:3001/",
      "http://127.0.0.1:3002/",
    ];

let webOk = false;
for (const url of webCandidates) {
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      ok("web health", `${res.status} ${url}`);
      webOk = true;
      break;
    }
  } catch {
    /* siguiente puerto */
  }
}
if (!webOk) {
  warn(
    "web health",
    explicitWeb
      ? `No responde: ${explicitWeb}`
      : `No responde en ${webCandidates.join(", ")}. Ejecuta pnpm dev y abre el puerto que indica Next (E2E usa 3050).`,
  );
}

const urls = [
  ["catalog", process.env.CATALOG_SERVICE_URL ?? "http://127.0.0.1:4010/health"],
  ["search", process.env.SEARCH_SERVICE_URL ?? "http://127.0.0.1:4011/health"],
  ["leads", process.env.LEADS_SERVICE_URL ?? "http://127.0.0.1:4012/health"],
  ["partner", process.env.PARTNER_SERVICE_URL ?? "http://127.0.0.1:4013/health"],
  ["analytics", process.env.ANALYTICS_SERVICE_URL ?? "http://127.0.0.1:4014/health"],
];

for (const [name, url] of urls) {
  try {
    const res = await fetch(url, { method: "GET" });
    if (res.ok) ok(`${name} health`, `${res.status} ${url}`);
    else warn(`${name} health`, `${res.status} ${url}`);
  } catch {
    warn(`${name} health`, `No responde: ${url}`);
  }
}

console.log("=== Floit Platform Preflight ===");
for (const c of checks) {
  const icon = c.status === "PASS" ? "✅" : c.status === "WARN" ? "⚠️" : "❌";
  console.log(`${icon} [${c.status}] ${c.name}: ${c.detail}`);
}

const fails = checks.filter((c) => c.status === "FAIL").length;
if (fails > 0) {
  console.error(`\nPreflight con ${fails} falla(s).`);
  process.exit(1);
}

console.log("\nPreflight sin fallas críticas.");
