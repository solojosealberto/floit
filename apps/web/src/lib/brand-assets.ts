/**
 * Rutas de marca QueGym (PNG transparentes en /public/brand).
 * Generados con `node scripts/brand/install-logos.mjs`.
 */

export type QueGymLogoVariant =
  | "symbol"
  | "wordmark"
  | "horizontal"
  | "lockup"
  /** Lockup horizontal con tagline «Encuentra tu próximo gym». */
  | "horizontal-tagline";

export type QueGymLogoTheme = "light" | "dark" | "auto";

const BRAND = "/brand";

export const BRAND_ASSETS = {
  symbol: `${BRAND}/symbol.png`,
  wordmark: {
    light: `${BRAND}/wordmark-on-light.png`,
    dark: `${BRAND}/wordmark-on-dark.png`,
  },
  horizontal: {
    light: `${BRAND}/horizontal-on-light.png`,
    dark: `${BRAND}/horizontal-on-light.png`,
  },
  horizontalTagline: {
    light: `${BRAND}/horizontal-on-light.png`,
    dark: `${BRAND}/horizontal-on-light-alt.png`,
  },
  lockup: {
    light: `${BRAND}/lockup-on-light.png`,
    dark: `${BRAND}/lockup-on-dark.png`,
  },
  favicon: "/icons/favicon/favicon-32x32.png",
  appleTouch: "/icons/app/apple-touch-icon.png",
  og: "/social/og-image.png",
} as const;

export function logoSources(
  variant: QueGymLogoVariant,
  theme: QueGymLogoTheme,
): { src: string } | { light: string; dark: string } {
  if (variant === "symbol") {
    return { src: BRAND_ASSETS.symbol };
  }

  if (variant === "wordmark") {
    if (theme === "light") return { src: BRAND_ASSETS.wordmark.light };
    if (theme === "dark") return { src: BRAND_ASSETS.wordmark.dark };
    return {
      light: BRAND_ASSETS.wordmark.light,
      dark: BRAND_ASSETS.wordmark.dark,
    };
  }

  if (variant === "horizontal-tagline") {
    if (theme === "light") return { src: BRAND_ASSETS.horizontalTagline.light };
    if (theme === "dark") return { src: BRAND_ASSETS.horizontalTagline.dark };
    return {
      light: BRAND_ASSETS.horizontalTagline.light,
      dark: BRAND_ASSETS.horizontalTagline.dark,
    };
  }

  if (variant === "lockup") {
    if (theme === "light") return { src: BRAND_ASSETS.lockup.light };
    if (theme === "dark") return { src: BRAND_ASSETS.lockup.dark };
    return {
      light: BRAND_ASSETS.lockup.light,
      dark: BRAND_ASSETS.lockup.dark,
    };
  }

  if (theme === "light") {
    return { src: BRAND_ASSETS.wordmark.light };
  }
  if (theme === "dark") {
    return { src: BRAND_ASSETS.wordmark.dark };
  }
  return {
    light: BRAND_ASSETS.wordmark.light,
    dark: BRAND_ASSETS.wordmark.dark,
  };
}
