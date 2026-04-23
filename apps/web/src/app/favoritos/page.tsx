"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readFavoriteSlugs } from "@/lib/floit-favorites";

type VenueRow = {
  slug: string;
  name: string;
  zone: string;
  venueType: string;
  priceMin: number | null;
  priceMax: number | null;
};

export default function FavoritosPage() {
  const [items, setItems] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slugs = readFavoriteSlugs();
    if (slugs.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/venues/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slugs }),
        });
        const data = (await res.json()) as { items?: VenueRow[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const compareHref =
    items.length > 0
      ? `/comparar?c=${items.map((i) => encodeURIComponent(i.slug)).join(",")}`
      : "/comparar";

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Favoritos</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Guardados solo en este navegador (localStorage). Puedes compararlos o
          ir a contacto desde cada ficha.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          Aún no tienes favoritos. Usa el corazón en{" "}
          <Link className="underline" href="/buscar">
            Buscar
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/gyms/${v.slug}`}
                className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{v.name}</span>
                  <span className="text-xs text-neutral-500">
                    {v.zone} · {v.venueType}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
          href={compareHref}
        >
          Comparar estos centros
        </Link>
        <Link className="underline" href="/buscar">
          Seguir explorando
        </Link>
      </div>
    </main>
  );
}
