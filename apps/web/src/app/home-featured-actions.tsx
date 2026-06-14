"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isFavoriteSlug, toggleFavoriteSlug } from "@/lib/floit-favorites";

type Props = {
  slug: string;
};

export function HomeFeaturedActions({ slug }: Props) {
  const [tick, setTick] = useState(0);
  const isFav = useMemo(() => isFavoriteSlug(slug), [slug, tick]);

  return (
    <div className="flex items-center gap-2 pt-1">
      <Link
        href={`/comparar?c=${encodeURIComponent(slug)}`}
        className="qg-chip qg-motion rounded-lg border border-quegym-border px-2.5 py-1 text-xs text-quegym-primary"
      >
        Comparar
      </Link>
      <button
        type="button"
        onClick={() => {
          toggleFavoriteSlug(slug);
          setTick((v) => v + 1);
        }}
        className={`qg-chip qg-motion rounded-lg px-2.5 py-1 text-xs ${
          isFav
            ? "border border-rose-300 bg-rose-50 text-rose-700"
            : "border border-quegym-border text-quegym-primary"
        }`}
      >
        {isFav ? "Guardado" : "Guardar"}
      </button>
    </div>
  );
}
