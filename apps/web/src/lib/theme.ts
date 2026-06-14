/** Preferencia de tema QueGym (persistida en localStorage). */
export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "quegym:theme";
export const THEME_STORAGE_KEY_LEGACY = "floit:theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

/** Default sin preferencia guardada: light en admin/partner, dark en flujo público. */
export function defaultThemeForPath(pathname: string): ThemeMode {
  if (pathname.startsWith("/admin") || pathname.startsWith("/partner")) {
    return "light";
  }
  return "dark";
}

export function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored =
      window.localStorage.getItem(THEME_STORAGE_KEY) ??
      window.localStorage.getItem(THEME_STORAGE_KEY_LEGACY);
    if (isThemeMode(stored)) {
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
        window.localStorage.setItem(THEME_STORAGE_KEY, stored);
      }
      return stored;
    }
  } catch {
    /* private mode */
  }
  return null;
}

export function resolveTheme(pathname: string): ThemeMode {
  return readStoredTheme() ?? defaultThemeForPath(pathname);
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function setStoredTheme(theme: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode */
  }
  applyTheme(theme);
}
