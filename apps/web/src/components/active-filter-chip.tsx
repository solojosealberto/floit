"use client";

import Link from "next/link";

type FilterChipProps = {
  label: string;
  href: string;
  onFilterNavigate?: (href: string) => void;
};

/** Chip de filtro activo con ✕ para quitar sin limpiar todo. */
export function ActiveFilterChip({ label, href, onFilterNavigate }: FilterChipProps) {
  return (
    <Link
      href={href}
      onClick={
        onFilterNavigate
          ? (e) => {
              e.preventDefault();
              onFilterNavigate(href);
            }
          : undefined
      }
      className="qg-motion inline-flex items-center gap-1 rounded-full border border-quegym-highlight/40 bg-quegym-highlight-soft px-2.5 py-1 text-xs font-medium text-quegym-highlight hover:bg-quegym-highlight/15"
      aria-label={`Quitar filtro ${label}`}
    >
      {label}
      <span aria-hidden className="text-sm leading-none opacity-80">
        ×
      </span>
    </Link>
  );
}
