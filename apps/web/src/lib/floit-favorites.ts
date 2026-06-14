import {
  QG_STORAGE,
  readStorageItem,
  writeStorageItem,
} from "./storage-keys";

const KEY = QG_STORAGE.favorites;
const LEGACY = QG_STORAGE.legacy.favorites;

export function readFavoriteSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readStorageItem(KEY, LEGACY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeFavoriteSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  writeStorageItem(KEY, JSON.stringify([...new Set(slugs)]));
}

export function toggleFavoriteSlug(slug: string): boolean {
  const cur = readFavoriteSlugs();
  const set = new Set(cur);
  const was = set.has(slug);
  if (was) set.delete(slug);
  else set.add(slug);
  writeFavoriteSlugs([...set]);
  return !was;
}

export function isFavoriteSlug(slug: string): boolean {
  return readFavoriteSlugs().includes(slug);
}
