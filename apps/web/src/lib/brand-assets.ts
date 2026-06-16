/**
 * Rutas de marca QueGym (PNG transparentes en /public/brand).
 */

export type QueGymLogoVariant = "symbol" | "horizontal";

export type QueGymLogoTheme = "light" | "dark" | "auto";

const BRAND = "/brand";

export const BRAND_ASSETS = {
  /** Símbolo verde — mismo asset en light/dark. */
  symbol: `${BRAND}/quegym-symbol-source.png`,
  horizontal: {
    light: `${BRAND}/quegym-horizontal-light.png`,
    dark: `${BRAND}/quegym-horizontal-dark.png`,
  },
} as const;

export function logoSources(
  variant: QueGymLogoVariant,
  theme: QueGymLogoTheme,
): { src: string } | { light: string; dark: string } {
  if (variant === "symbol") {
    return { src: BRAND_ASSETS.symbol };
  }

  if (theme === "light") {
    return { src: BRAND_ASSETS.horizontal.light };
  }
  if (theme === "dark") {
    return { src: BRAND_ASSETS.horizontal.dark };
  }
  return {
    light: BRAND_ASSETS.horizontal.light,
    dark: BRAND_ASSETS.horizontal.dark,
  };
}
