"use client";

import Link from "next/link";

export type CompareActiveItem = {
  slug: string;
  name: string;
};

type Props = {
  items: CompareActiveItem[];
  compareHref: string;
  onClear: () => void;
  onRemove: (slug: string) => void;
};

/** Barra flotante del comparador — debe renderizarse fuera de contenedores con transform/overflow. */
export function CompareActiveBar({
  items,
  compareHref,
  onClear,
  onRemove,
}: Props) {
  const count = items.length;
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Comparador de centros activo"
      className="qg-surface pointer-events-auto fixed bottom-5 left-1/2 z-[1200] w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-quegym-border bg-quegym-elevated p-3 shadow-[var(--qg-shadow-lg)] max-lg:bottom-[5.75rem]"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-quegym-secondary">
            Comparador activo: {count}/3 centro{count === 1 ? "" : "s"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-quegym-border px-2 py-1 text-xs text-quegym-secondary hover:bg-quegym-subtle"
            >
              Limpiar
            </button>
            <Link
              href={compareHref}
              className="qg-btn-primary inline-flex rounded-lg bg-quegym-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-quegym-accent-hover"
            >
              Ir a comparar
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.slug}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-quegym-highlight/35 bg-quegym-highlight-soft px-2 py-1 text-[11px] text-quegym-highlight"
            >
              <span className="max-w-[140px] truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => onRemove(item.slug)}
                className="rounded-full border border-quegym-highlight/40 px-1 leading-none hover:bg-quegym-highlight/15"
                aria-label={`Quitar ${item.name} del comparador`}
                title={`Quitar ${item.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
