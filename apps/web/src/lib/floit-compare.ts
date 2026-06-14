import {
  QG_STORAGE,
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "./storage-keys";

const KEY = QG_STORAGE.compare;
const LEGACY = QG_STORAGE.legacy.compare;
const MAX_COMPARE = 3;

function sanitizeSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))].slice(
    0,
    MAX_COMPARE,
  );
}

export function readCompareSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readStorageItem(KEY, LEGACY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return sanitizeSlugs(data.filter((x): x is string => typeof x === "string"));
  } catch {
    return [];
  }
}

export function writeCompareSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  writeStorageItem(KEY, JSON.stringify(sanitizeSlugs(slugs)));
}

export function clearCompareSlugs(): void {
  if (typeof window === "undefined") return;
  removeStorageItem(KEY, LEGACY);
}

export function removeCompareSlug(slug: string): string[] {
  const next = readCompareSlugs().filter((value) => value !== slug);
  writeCompareSlugs(next);
  return next;
}

export function addCompareSlug(slug: string): {
  ok: boolean;
  slugs: string[];
  reason?: "limit";
} {
  const cur = readCompareSlugs();
  if (cur.includes(slug)) return { ok: true, slugs: cur };
  if (cur.length >= MAX_COMPARE) {
    return { ok: false, slugs: cur, reason: "limit" };
  }
  const next = [...cur, slug];
  writeCompareSlugs(next);
  return { ok: true, slugs: next };
}

export function toggleCompareSlug(slug: string): {
  active: boolean;
  slugs: string[];
  reason?: "limit";
} {
  const cur = readCompareSlugs();
  if (cur.includes(slug)) {
    const next = cur.filter((value) => value !== slug);
    writeCompareSlugs(next);
    return { active: false, slugs: next };
  }
  if (cur.length >= MAX_COMPARE) {
    return { active: false, slugs: cur, reason: "limit" };
  }
  const next = [...cur, slug];
  writeCompareSlugs(next);
  return { active: true, slugs: next };
}
