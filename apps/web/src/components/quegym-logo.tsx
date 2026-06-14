"use client";

import Image from "next/image";
import Link from "next/link";
import {
  logoSources,
  type QueGymLogoTheme,
  type QueGymLogoVariant,
} from "@/lib/brand-assets";

const SIZE = {
  symbol: { sm: 28, md: 32, lg: 48 },
  horizontal: { sm: 120, md: 148, lg: 180 },
} as const;

type Props = {
  variant?: QueGymLogoVariant;
  /** `auto` alterna según `data-theme` en `<html>`. */
  theme?: QueGymLogoTheme;
  size?: keyof typeof SIZE.symbol;
  className?: string;
  priority?: boolean;
  /** Enlace al inicio; `true` → `/`. */
  href?: boolean | string;
};

export function QueGymLogo({
  variant = "horizontal",
  theme = "auto",
  size = "md",
  className,
  priority,
  href,
}: Props) {
  const sources = logoSources(variant, theme);
  const height = variant === "symbol" ? SIZE.symbol[size] : undefined;
  const width =
    variant === "symbol"
      ? SIZE.symbol[size]
      : SIZE.horizontal[size];

  const img =
    "src" in sources ? (
      <Image
        src={sources.src}
        alt="QueGym"
        width={width}
        height={height ?? Math.round(width / 4)}
        priority={priority}
        className={className}
        style={variant === "horizontal" ? { height: SIZE.symbol[size] + 4, width: "auto" } : undefined}
      />
    ) : (
      <>
        <Image
          src={sources.light}
          alt=""
          aria-hidden
          width={width}
          height={height ?? Math.round(width / 4)}
          priority={priority}
          className={`qg-logo-theme-light ${className ?? ""}`}
          style={variant === "horizontal" ? { height: SIZE.symbol[size] + 4, width: "auto" } : undefined}
        />
        <Image
          src={sources.dark}
          alt=""
          aria-hidden
          width={width}
          height={height ?? Math.round(width / 4)}
          priority={priority}
          className={`qg-logo-theme-dark ${className ?? ""}`}
          style={variant === "horizontal" ? { height: SIZE.symbol[size] + 4, width: "auto" } : undefined}
        />
      </>
    );

  const labeled =
    "src" in sources ? (
      img
    ) : (
      <span className="relative inline-flex shrink-0 items-center">{img}</span>
    );

  if (href) {
    const to = href === true ? "/" : href;
    return (
      <Link href={to} className="inline-flex shrink-0 items-center" aria-label="QueGym — inicio">
        {labeled}
      </Link>
    );
  }

  return labeled;
}
