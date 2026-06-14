"use client";

import { UIButton, UIEmptyState } from "@floit/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { VenueCardGrid } from "@/components/venue-card-grid";
import { readFavoriteSlugs, toggleFavoriteSlug } from "@/lib/floit-favorites";
import { readCompareSlugs, toggleCompareSlug } from "@/lib/floit-compare";

type VenueRow = {
  slug: string;
  name: string;
  zone: string;
  venueType: string;
  priceMin: number | null;
  priceMax: number | null;
  photoUrls?: string[];
  modalities?: string[];
  verificationStatus?: string | null;
  contactWhatsapp?: string | null;
};

export default function FavoritosPage() {
  const [items, setItems] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareLimitError, setCompareLimitError] = useState(false);

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

  useEffect(() => {
    setCompareSlugs(readCompareSlugs());
    const onStorage = () => setCompareSlugs(readCompareSlugs());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const compareHref =
    compareSlugs.length > 0
      ? `/comparar?c=${encodeURIComponent(compareSlugs.join(","))}`
      : "/comparar";

  function handleCompareToggle(slug: string) {
    const res = toggleCompareSlug(slug);
    setCompareSlugs(res.slugs);
    setCompareLimitError(res.reason === "limit");
    setCompareModalOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-3 py-3">
      <section className="overflow-hidden rounded-2xl border border-quegym-border bg-quegym-subtle shadow-[var(--qg-shadow-sm)]">
        <header className="border-b border-quegym-border px-4 py-4">
          <h1 className="font-display text-2xl font-semibold text-quegym-primary md:text-3xl">
            Favoritos
          </h1>
          <p className="mt-1 text-sm text-quegym-secondary">
            {loading
              ? "Cargando…"
              : `${items.length} gimnasio${items.length === 1 ? "" : "s"} guardado${items.length === 1 ? "" : "s"}`}
          </p>
        </header>

        <div className="px-4 py-4">
          {loading ? (
            <p className="text-sm text-quegym-secondary">Cargando centros…</p>
          ) : items.length === 0 ? (
            <UIEmptyState
              title="Aún no tienes favoritos."
              description="Usa el corazón en Buscar para guardar centros."
              action={
                <Link className="underline" href="/buscar">
                  Ir a buscar
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((v) => (
                <VenueCardGrid
                  key={v.slug}
                  venue={v}
                  isFavorite
                  isCompare={compareSlugs.includes(v.slug)}
                  onToggleFavorite={() => {
                    toggleFavoriteSlug(v.slug);
                    setItems((cur) => cur.filter((item) => item.slug !== v.slug));
                    setCompareSlugs((cur) => cur.filter((slug) => slug !== v.slug));
                  }}
                  onToggleCompare={() => handleCompareToggle(v.slug)}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-quegym-border bg-quegym-elevated px-4 py-3">
          {compareSlugs.length > 0 ? (
            <Link href={compareHref}>
              <UIButton>Ir a comparar ({compareSlugs.length})</UIButton>
            </Link>
          ) : null}
          <Link href="/buscar">
            <UIButton variant="secondary">Seguir explorando</UIButton>
          </Link>
        </footer>
      </section>

      {compareModalOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-quegym-ink/45 p-3 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="w-full max-w-lg rounded-2xl border border-quegym-border bg-quegym-elevated shadow-[var(--qg-shadow-lg)]">
            <div className="flex items-center justify-between border-b border-quegym-border px-4 py-3">
              <h2 className="text-sm font-semibold text-quegym-primary">
                Comparar centros
              </h2>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="rounded-full border border-quegym-border px-2 py-1 text-xs text-quegym-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs text-quegym-secondary">
                Seleccionados: {compareSlugs.length}/3
              </p>
              {compareLimitError ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  Máximo 3 centros. Quita uno para agregar otro.
                </p>
              ) : null}
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-quegym-border bg-quegym-subtle p-2">
                {compareSlugs.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-quegym-secondary">
                    Aún no hay centros seleccionados.
                  </p>
                ) : (
                  compareSlugs.map((slug) => {
                    const venue = items.find((item) => item.slug === slug);
                    return (
                      <div
                        key={slug}
                        className="rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2"
                      >
                        <p className="truncate text-sm font-semibold text-quegym-primary">
                          {venue?.name ?? slug}
                        </p>
                        <p className="text-xs text-quegym-secondary">
                          {venue?.zone ?? "Zona no informada"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between border-t border-quegym-border pt-3">
                <Link href="/buscar" className="text-xs font-medium text-quegym-secondary underline">
                  Buscar más
                </Link>
                <Link href={compareHref}>
                  <UIButton>Ir a comparar</UIButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
