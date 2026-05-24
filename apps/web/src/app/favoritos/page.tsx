"use client";

import { UIButton, UIEmptyState } from "@floit/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
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
      <section className="overflow-hidden rounded-2xl border border-[#D9DDE3] bg-[#F8FAFC] shadow-[0_6px_20px_rgba(17,24,39,0.06)]">
        <header className="border-b border-[#E4E7EC] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1 text-lg text-rose-500">♥</span>
              <div>
                <h1 className="text-[30px] font-semibold leading-none tracking-tight text-[#111827]">
                  Favoritos
                </h1>
                <p className="mt-1 text-xs text-[#667085]">
                  {items.length} gimnasio{items.length === 1 ? "" : "s"} guardado
                  {items.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <ToolbarPill active={false} label="Filtros" icon="⚙︎" />
              <ToolbarPill active label="Lista" icon="≣" />
              <ToolbarPill active={false} label="Grilla" icon="⊞" />
              <ToolbarPill active={false} label="Mapa" icon="◍" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FilterChip active label={`Todos (${items.length})`} />
            <FilterChip label="Cercanos" />
            <FilterChip
              label={`Verificados (${Math.max(
                0,
                items.filter((item) => item.venueType !== "reference").length,
              )})`}
            />
            <FilterChip label="Abierto ahora" />
            <FilterChip label="Nuevo" />
          </div>
        </header>

        <div className="space-y-3 px-4 py-4">
          {loading ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : items.length === 0 ? (
            <UIEmptyState
              title="Aún no tienes favoritos."
              description="Usa el corazón en Buscar para guardar centros."
              action={
                <Link className="underline" href="/buscar">
                  Ir a Buscar
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {items.map((v, index) => {
                const compareOn = compareSlugs.includes(v.slug);
                return (
                  <li key={v.slug}>
                    <article
                      className={`overflow-hidden rounded-2xl border bg-white transition hover:border-neutral-300 ${
                        index === 1 ? "border-[#94A3B8] shadow-[0_4px_14px_rgba(71,85,105,0.18)]" : "border-[#D5DAE1]"
                      }`}
                    >
                      <div className="flex gap-3 p-3">
                        <Link
                          href={`/gyms/${v.slug}`}
                          className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-xs text-neutral-400"
                        >
                          {getPhotoUrl(v) ? (
                            <img
                              src={getPhotoUrl(v)!}
                              alt={`Imagen de ${v.name}`}
                              className="h-full w-full object-cover object-center"
                              loading="lazy"
                            />
                          ) : (
                            "Foto"
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <Link href={`/gyms/${v.slug}`} className="truncate text-sm font-semibold text-neutral-800 hover:underline">
                              {v.name}
                            </Link>
                            <p className="text-xs text-neutral-500">
                              {v.zone} · {fakeDistance(index)}
                            </p>
                            <p className="text-xs text-neutral-600">
                              ★ {fakeRating(index)} ({fakeVotes(index)}) · {priceBand(v)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {getTags(v)
                                .slice(0, 2)
                                .map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const stillFavorite = toggleFavoriteSlug(v.slug);
                                if (!stillFavorite) {
                                  setItems((cur) =>
                                    cur.filter((item) => item.slug !== v.slug),
                                  );
                                  setCompareSlugs((cur) =>
                                    cur.filter((slug) => slug !== v.slug),
                                  );
                                }
                              }}
                              className="rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 transition hover:bg-rose-100"
                              aria-label={`Quitar ${v.name} de favoritos`}
                              title="Quitar de favoritos"
                            >
                              Guardado
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCompareToggle(v.slug)}
                              className={`rounded-full border px-2 py-1 text-xs ${
                                compareOn
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                  : "border-neutral-300 text-neutral-600"
                              }`}
                              aria-label={compareOn ? "Quitar del comparador" : "Agregar al comparador"}
                            >
                              {compareOn ? "Comparando" : "Comparar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-[#E4E7EC] bg-white px-4 py-3">
          <Link href="/buscar">
            <UIButton variant="secondary">Seguir explorando</UIButton>
          </Link>
        </footer>
      </section>

      {compareModalOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-[#111827]/45 p-3 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_20px_50px_rgba(17,24,39,0.28)]">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] px-4 py-3">
              <h2 className="text-[13px] font-semibold tracking-tight text-[#111827]">
                Comparar centros
              </h2>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="rounded-full border border-[#D0D5DD] bg-white px-2 py-1 text-[11px] text-[#475467]"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[11px] text-[#667085]">
                Seleccionados para comparar: {compareSlugs.length}/3
              </p>
              {compareLimitError ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  Máximo 3 centros por comparación. Quita uno para agregar otro.
                </p>
              ) : null}
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-[#EAECF0] bg-[#F8FAFC] p-2">
                {compareSlugs.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-[#667085]">
                    Aún no hay centros seleccionados.
                  </p>
                ) : (
                  compareSlugs.map((slug) => {
                    const venue = items.find((item) => item.slug === slug);
                    return (
                      <div
                        key={slug}
                        className="flex items-center justify-between rounded-xl border border-[#E4E7EC] bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#101828]">
                            {venue?.name ?? slug}
                          </p>
                          <p className="text-[11px] text-[#667085]">
                            {venue?.zone ?? "Zona no informada"} · {venue?.venueType ?? "Tipo no informado"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between border-t border-[#E4E7EC] pt-3">
                <Link href="/buscar" className="text-xs font-medium text-[#475467] underline">
                  Buscar más centros
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

function ToolbarPill({
  label,
  icon,
  active,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs ${
        active
          ? "border-[#CBD5E1] bg-[#EEF2F6] text-[#344054]"
          : "border-[#D0D5DD] bg-white text-[#667085]"
      }`}
    >
      <span className="text-[11px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-[#111827] bg-[#1F2937] text-white"
          : "border-[#D0D5DD] bg-white text-[#344054]"
      }`}
    >
      {label}
    </button>
  );
}

function priceBand(v: VenueRow): string {
  const avg =
    v.priceMin != null && v.priceMax != null
      ? (v.priceMin + v.priceMax) / 2
      : v.priceMin ?? v.priceMax ?? 45;
  if (avg >= 90) return "$$$$";
  if (avg >= 65) return "$$$";
  if (avg >= 45) return "$$";
  return "$";
}

function fakeDistance(index: number): string {
  const values = ["1.2 km", "2.5 km", "3.1 km", "1.8 km", "2.0 km"];
  return values[index % values.length];
}

function fakeRating(index: number): string {
  const values = ["4.7", "4.9", "4.5", "4.6", "4.8"];
  return values[index % values.length];
}

function fakeVotes(index: number): string {
  const values = ["128", "89", "45", "92", "76"];
  return values[index % values.length];
}

function getTags(v: VenueRow): string[] {
  const normalized = v.venueType.toLowerCase();
  if (normalized.includes("cross") || normalized.includes("functional")) {
    return ["CrossFit", "Funcional"];
  }
  if (normalized.includes("yoga") || normalized.includes("pilates")) {
    return ["Yoga", "Pilates"];
  }
  if (normalized.includes("cycling")) {
    return ["Spinning", "Cardio"];
  }
  return ["Musculación", "Cardio"];
}

function getPhotoUrl(v: VenueRow): string | null {
  if (!Array.isArray(v.photoUrls) || v.photoUrls.length === 0) return null;
  const first = v.photoUrls[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}
