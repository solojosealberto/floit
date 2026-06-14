/** Claves canónicas QueGym + legacy Floit (migración Fase 2 rebrand). */

export const QG_STORAGE = {
  favorites: "quegym:favorites",
  compare: "quegym:compare",
  adminDuplicateDismiss: "quegym-admin-duplicate-dismissed",
  legacy: {
    favorites: "floit:favorites",
    compare: "floit:compare",
    adminDuplicateDismiss: "floit-admin-duplicate-dismissed",
  },
} as const;

/** Copia legacy → canónica si la canónica aún no existe. */
export function migrateStorageKey(canonical: string, legacy: string): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(canonical) != null) return;
  const legacyValue = window.localStorage.getItem(legacy);
  if (legacyValue == null) return;
  window.localStorage.setItem(canonical, legacyValue);
}

export function readStorageItem(canonical: string, legacy: string): string | null {
  if (typeof window === "undefined") return null;
  migrateStorageKey(canonical, legacy);
  return window.localStorage.getItem(canonical);
}

export function writeStorageItem(canonical: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(canonical, value);
}

export function removeStorageItem(canonical: string, legacy?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(canonical);
  if (legacy) window.localStorage.removeItem(legacy);
}
