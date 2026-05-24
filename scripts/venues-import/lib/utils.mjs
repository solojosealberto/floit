/** Utilidades compartidas del pipeline venues-import. */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../../..");

export function slugify(input) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Municipios / zonas canónicas para discovery y mapa. */
export const CANONICAL_ZONES = [
  "Chacao",
  "Baruta",
  "Libertador",
  "Sucre",
  "El Hatillo",
  "Guatire",
  "Guarenas",
  "San Antonio de los Altos",
  "Caracas",
];

/** Centroide aproximado por zona (fallback de geocodificación). */
export const ZONE_CENTROIDS = {
  Chacao: { lat: 10.4961, lng: -66.8536 },
  Baruta: { lat: 10.4347, lng: -66.8733 },
  Libertador: { lat: 10.5069, lng: -66.8953 },
  Sucre: { lat: 10.487, lng: -66.824 },
  "El Hatillo": { lat: 10.426, lng: -66.825 },
  Guatire: { lat: 10.468, lng: -66.542 },
  Guarenas: { lat: 10.468, lng: -66.614 },
  "San Antonio de los Altos": { lat: 10.378, lng: -66.954 },
  Caracas: { lat: 10.480594, lng: -66.903606 },
};

export function getZoneCentroid(zone) {
  return ZONE_CENTROIDS[zone] ?? ZONE_CENTROIDS.Caracas;
}

export function normalizeZone(raw) {
  const z = String(raw ?? "")
    .trim()
    .replace(/\.$/, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!z) return "Caracas";
  const map = {
    "los palos grandes": "Chacao",
    "la castellana": "Chacao",
    altamira: "Chacao",
    chuao: "Chacao",
    "el rosal": "Chacao",
    "los samanes": "Chacao",
    "la carlota": "Chacao",
    "cerro verde": "Chacao",
    caurimare: "Chacao",
    "los campitos": "Chacao",
    "santa paula": "Chacao",
    "las mercedes": "Baruta",
    "el cafetal": "Baruta",
    "la boyera": "Baruta",
    "prados del este": "Baruta",
    "santa fe": "Baruta",
    "santa monica": "Baruta",
    "la lagunita": "Baruta",
    "la tahona": "Baruta",
    "la floresta": "Baruta",
    boleita: "Baruta",
    "el hatillo": "El Hatillo",
    "la candelaria": "Libertador",
    "sabana grande": "Libertador",
    "bello monte": "Libertador",
    montalban: "Libertador",
    "bellas artes": "Libertador",
    "santa marta": "Libertador",
    propatria: "Libertador",
    "el paraiso": "Libertador",
    paraiso: "Libertador",
    "la california": "Libertador",
    "los chaguaramos": "Libertador",
    "av baralt": "Libertador",
    "av jalisco": "Libertador",
    "av urdaneta": "Libertador",
    "av solano": "Libertador",
    "av andres bello": "Libertador",
    "calle la florencia": "Libertador",
    "c.c galerias sebucan": "Libertador",
    vizcaya: "Libertador",
    "los ruices": "Sucre",
    macaracuay: "Sucre",
    "los dos caminos": "Sucre",
    "la trinidad": "Sucre",
    guatire: "Guatire",
    guarenas: "Guarenas",
    "san antonio de los altos": "San Antonio de los Altos",
  };
  const key = z.toLowerCase();
  for (const [needle, canon] of Object.entries(map)) {
    if (key === needle || key.includes(needle)) return canon;
  }
  if (key.includes("chacao") || key.includes("rosal") || key.includes("samanes"))
    return "Chacao";
  if (key.includes("baruta") || key.includes("mercedes") || key.includes("cafetal"))
    return "Baruta";
  if (
    key.includes("libertador") ||
    key.startsWith("av ") ||
    key.startsWith("av.") ||
    key.includes("calle ") ||
    key.includes("c.c ")
  )
    return "Libertador";
  if (key.includes("hatillo")) return "El Hatillo";
  if (key.includes("sucre") || key.includes("ruices")) return "Sucre";
  if (key.includes("guatire")) return "Guatire";
  if (key.includes("guarenas")) return "Guarenas";
  if (key.includes("san antonio")) return "San Antonio de los Altos";
  return "Libertador";
}

/** Nombre comercial homogéneo (trim, espacios, capitalización). */
export function normalizeVenueName(raw) {
  let n = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*([,/])\s*/g, "$1 ");
  if (!n) return n;
  const keepUpper = new Set(["TRX", "MMA", "HIIT", "CC"]);
  const words = n.split(" ");
  const out = words.map((w, i) => {
    const bare = w.replace(/[()]/g, "");
    if (keepUpper.has(bare.toUpperCase())) return bare.toUpperCase();
    if (/^gold'?s$/i.test(bare)) return "Gold's";
    if (w === w.toUpperCase() && w.length > 3 && !/[a-z]/.test(w)) {
      return w.charAt(0) + w.slice(1).toLowerCase();
    }
    if (i === 0 || w.length > 2) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w.toLowerCase();
  });
  return out.join(" ").slice(0, 240);
}

export function isMissingValue(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return (
    !s ||
    s === "no dice" ||
    s === "no hay" ||
    s === "no respondio" ||
    s === "no respondieron" ||
    s === "inactivo" ||
    s === "n/a" ||
    s === "no disponible"
  );
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function readJson(path) {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(path, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(path, data) {
  const fs = await import("node:fs/promises");
  await fs.writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
