"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

type Props = Omit<ComponentProps<typeof Link>, "onClick"> & {
  onFilterNavigate: (href: string) => void;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/** Link de filtro en `/buscar` con navegación en transición (skeleton pending). */
export function DiscoveryFilterLink({
  href,
  onFilterNavigate,
  onClick,
  ...rest
}: Props) {
  const resolved = typeof href === "string" ? href : href.pathname ?? "";

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        onFilterNavigate(resolved);
      }}
      {...rest}
    />
  );
}
