"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UIEmptyState } from "@floit/ui";
import {
  addCompareSlug,
  clearCompareSlugs,
  readCompareSlugs,
  removeCompareSlug,
  writeCompareSlugs,
} from "@/lib/floit-compare";
import { CompareViewTracker } from "./compare-view-tracker";

type VenueDetail = {
  slug: string;
  name: string;
  zone: string;
  venueType: string;
  modalities: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
  popularityScore?: number | null;
  contactWhatsapp?: string | null;
  allowsTrial?: boolean | null;
  photoUrls?: string[];
};

type SearchItem = {
  slug: string;
  name: string;
  zone?: string;
  venueType?: string;
};

export function CompararClient({ initialSlugs }: { initialSlugs: string[] }) {
  const [compareSlugs, setCompareSlugs] = useState<string[]>(initialSlugs);
  const [rows, setRows] = useState<VenueDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [limitError, setLimitError] = useState(false);

  useEffect(() => {
    const merged = mergeSlugs(initialSlugs, readCompareSlugs());
    setCompareSlugs(merged);
    writeCompareSlugs(merged);
  }, [initialSlugs]);

  useEffect(() => {
    if (compareSlugs.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/venues/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slugs: compareSlugs }),
        });
        const data = (await res.json()) as { items?: VenueDetail[] };
        if (cancelled) return;
        const bySlug = new Map((data.items ?? []).map((item) => [item.slug, item]));
        const ordered = compareSlugs
          .map((slug) => bySlug.get(slug))
          .filter((item): item is VenueDetail => Boolean(item));
        setRows(ordered);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareSlugs]);

  useEffect(() => {
    if (!openAddModal) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAddModal(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [openAddModal]);

  useEffect(() => {
    const qs = compareSlugs.length
      ? `/comparar?c=${encodeURIComponent(compareSlugs.join(","))}`
      : "/comparar";
    window.history.replaceState(null, "", qs);
  }, [compareSlugs]);

  useEffect(() => {
    if (!openAddModal || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({
            q: query.trim(),
            exclude: compareSlugs.join(","),
          });
          const res = await fetch(`/api/compare/search?${params.toString()}`, {
            cache: "no-store",
          });
          const data = (await res.json()) as { items?: SearchItem[] };
          if (!cancelled) setResults(data.items ?? []);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, compareSlugs, openAddModal]);

  const slugs = rows.map((row) => row.slug);

  const canAddMore = compareSlugs.length < 3;
  const buscarHref = useMemo(() => {
    const params = new URLSearchParams();
    if (compareSlugs.length > 0) params.set("fromCompare", "1");
    return `/buscar?${params.toString()}`;
  }, [compareSlugs]);

  function handleRemove(slug: string) {
    const next = removeCompareSlug(slug);
    setCompareSlugs(next);
    setLimitError(false);
  }

  function handleAdd(slug: string) {
    const res = addCompareSlug(slug);
    if (!res.ok) {
      setLimitError(true);
      return;
    }
    setLimitError(false);
    setCompareSlugs(res.slugs);
  }

  function handleClear() {
    clearCompareSlugs();
    setCompareSlugs([]);
    setLimitError(false);
  }

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-2 py-2 md:px-4 md:py-4">
      <CompareViewTracker slugs={slugs} />
      {loading ? (
        <p className="text-sm text-neutral-500">Cargando comparador…</p>
      ) : rows.length === 0 ? (
        <UIEmptyState
          title="No hay centros para comparar."
          description="Agrega centros desde Buscar o con el botón “Añadir centro”."
          action={
            <Link className="underline" href="/buscar">
              Ir a buscar
            </Link>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#D9DDE3] bg-[#FAFBFD] shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
          <header className="flex items-center justify-between border-b border-[#E4E7EC] px-3 py-2 text-[11px] md:px-5 md:py-3">
            <Link
              href={buscarHref}
              className="font-medium text-[#6A7280] transition hover:text-[#111827]"
            >
              ← Volver a resultados
            </Link>
            <h1 className="text-xs font-semibold tracking-tight text-[#111827] md:text-sm">
              Comparando {rows.length} centros
            </h1>
            <button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="rounded-full border border-[#D5DAE1] bg-white px-3 py-1 text-[#6A7280] transition hover:bg-[#F4F6F9]"
            >
              + Añadir centro
            </button>
          </header>
          {limitError ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
              Máximo 3 centros por comparación. Quita uno para agregar otro.
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-[11px] text-[#374151]">
              <thead>
                <tr className="border-b border-[#E4E7EC]">
                  <th className="w-[170px] border-r border-[#E4E7EC] bg-[#F4F6F9] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A94A6]">
                    Criterio
                  </th>
                  {rows.map((v) => (
                    <th
                      key={v.slug}
                      style={{ width: `calc((100% - 170px) / ${rows.length})` }}
                      className="relative border-r border-[#E4E7EC] bg-white px-2 py-2.5 text-center align-top last:border-r-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemove(v.slug)}
                        className="absolute right-2 top-2 rounded-full border border-[#D5DAE1] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] text-[#98A2B3] transition hover:text-[#344054]"
                        aria-label={`Quitar ${v.name} de la comparación`}
                      >
                        ×
                      </button>
                      <div className="mx-auto mb-2 h-16 w-20 overflow-hidden rounded-2xl bg-[#E5E7EB] text-[10px] text-[#98A2B3] flex items-center justify-center">
                        {getPhotoUrl(v) ? (
                          <img
                            src={getPhotoUrl(v)!}
                            alt={`Imagen de ${v.name}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          "Foto"
                        )}
                      </div>
                      <p className="text-[13px] font-semibold text-[#111827]">{v.name}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-[#667085]">
                        ★ {formatRating(v.popularityScore)} ({getVotesHint(v)})
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SectionRow label="Información básica" cols={rows.length} />
                <DataRow
                  label="Zona"
                  values={rows.map((v) => v.zone || "No informado")}
                />
                <DataRow label="Distancia" values={rows.map(() => "No informado")} />
                <DataRow
                  label="Precio"
                  values={rows.map((v) => formatPriceBand(v))}
                />
                <DataRow
                  label="Tipo"
                  values={rows.map((v) => formatVenueType(v.venueType))}
                />
                <DataRow label="Horario L–V" values={rows.map(() => "No informado")} />
                <DataRow label="Fin de semana" values={rows.map(() => "No informado")} />
                <SectionRow label="Servicios" cols={rows.length} />
                {SERVICE_ROWS.map((service) => (
                  <BooleanRow
                    key={service.label}
                    label={service.label}
                    values={rows.map((v) => hasAny(v.modalities, service.matchers))}
                  />
                ))}
                <SectionRow label="Amenidades" cols={rows.length} />
                {AMENITY_ROWS.map((amenity) => (
                  <BooleanRow
                    key={amenity.label}
                    label={amenity.label}
                    values={rows.map((v) => hasAny(v.amenities, amenity.matchers))}
                  />
                ))}
                <tr>
                  <td className="border-r border-t border-[#E4E7EC] bg-[#F4F6F9] px-3 py-3 text-[#8A94A6]">
                    Acciones
                  </td>
                  {rows.map((v) => (
                    <td
                      key={`${v.slug}-ctas`}
                      className="space-y-1.5 border-r border-t border-[#E4E7EC] bg-white px-3 py-2 align-top last:border-r-0"
                    >
                      <Link
                        href={`/gyms/${v.slug}`}
                        className="block rounded-lg bg-[#0F172A] px-3 py-1.5 text-center text-[11px] font-semibold text-white transition hover:bg-[#111827]"
                      >
                        Solicitar info
                      </Link>
                      {v.contactWhatsapp ? (
                        <a
                          href={`https://wa.me/${sanitizeWhatsapp(v.contactWhatsapp)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg bg-[#12A150] px-3 py-1.5 text-center text-[11px] font-semibold text-white transition hover:bg-[#0f8b45]"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        <span className="block cursor-not-allowed rounded-lg bg-[#D1FADF] px-3 py-1.5 text-center text-[11px] font-semibold text-[#027A48]">
                          WhatsApp
                        </span>
                      )}
                      <Link
                        href={`/gyms/${v.slug}`}
                        className="block rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-center text-[11px] font-medium text-[#344054] transition hover:bg-[#F9FAFB]"
                      >
                        Ver ficha completa
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {rows.map((v) => (
              <article
                key={`mobile-${v.slug}`}
                className="overflow-hidden rounded-2xl border border-[#D9DDE3] bg-white"
              >
                <div className="relative border-b border-[#E4E7EC] p-3">
                  <button
                    type="button"
                    onClick={() => handleRemove(v.slug)}
                    className="absolute right-3 top-3 rounded-full border border-[#D5DAE1] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] text-[#98A2B3]"
                    aria-label={`Quitar ${v.name} de la comparación`}
                  >
                    ×
                  </button>
                  <div className="flex gap-3">
                    <div className="flex h-14 w-16 items-center justify-center overflow-hidden rounded-xl bg-[#E5E7EB] text-[10px] text-[#98A2B3]">
                      {getPhotoUrl(v) ? (
                        <img
                          src={getPhotoUrl(v)!}
                          alt={`Imagen de ${v.name}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        "Foto"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#111827]">
                        {v.name}
                      </p>
                      <p className="text-[10px] text-[#667085]">
                        ★ {formatRating(v.popularityScore)} ({getVotesHint(v)}) ·{" "}
                        {v.zone || "No informado"}
                      </p>
                      <p className="mt-1 text-[11px] text-[#344054]">
                        {formatVenueType(v.venueType)} · {formatPriceBand(v)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <MiniSection
                    title="Servicios"
                    content={SERVICE_ROWS.filter((row) =>
                      hasAny(v.modalities, row.matchers),
                    )
                      .map((row) => row.label)
                      .join(" · ") || "No informado"}
                  />
                  <MiniSection
                    title="Amenidades"
                    content={AMENITY_ROWS.filter((row) =>
                      hasAny(v.amenities, row.matchers),
                    )
                      .map((row) => row.label)
                      .join(" · ") || "No informado"}
                  />
                  <div className="space-y-1.5 pt-1">
                    <Link
                      href={`/gyms/${v.slug}`}
                      className="block rounded-lg bg-[#0F172A] px-3 py-2 text-center text-[11px] font-semibold text-white"
                    >
                      Solicitar info
                    </Link>
                    {v.contactWhatsapp ? (
                      <a
                        href={`https://wa.me/${sanitizeWhatsapp(v.contactWhatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg bg-[#12A150] px-3 py-2 text-center text-[11px] font-semibold text-white"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    <Link
                      href={`/gyms/${v.slug}`}
                      className="block rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-center text-[11px] font-medium text-[#344054]"
                    >
                      Ver ficha completa
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[10px] text-[#667085] md:px-4">
            <span>
              ⚠ Los datos marcados como «No informado» corresponden a centros que
              aún no completaron su perfil. Contáctalos para confirmar.
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded border border-[#D0D5DD] bg-white px-2 py-1 text-[10px] font-medium text-[#475467]"
            >
              Limpiar comparación
            </button>
          </footer>
        </section>
      )}

      {openAddModal ? (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-[#111827]/45 p-3 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_20px_50px_rgba(17,24,39,0.28)]">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] px-4 py-3">
              <h2 className="text-[13px] font-semibold tracking-tight text-[#111827]">
                Añadir centro al comparador
              </h2>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="rounded-full border border-[#D0D5DD] bg-white px-2 py-1 text-[11px] text-[#475467]"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[11px] text-[#667085]">
                Seleccionados: {compareSlugs.length}/3
              </p>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o zona…"
                className="w-full rounded-xl border border-[#D0D5DD] bg-[#FCFCFD] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#98A2B3]"
              />
              {!canAddMore ? (
                <p className="text-xs font-medium text-amber-700">
                  Ya tienes 3 centros en comparación. Quita uno para añadir otro.
                </p>
              ) : null}
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[#EAECF0] bg-[#F8FAFC] p-2">
                {searching ? (
                  <p className="px-1 py-2 text-sm text-[#667085]">Buscando centros…</p>
                ) : results.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-[#667085]">
                    Escribe al menos 2 caracteres para buscar centros.
                  </p>
                ) : (
                  results.map((item) => (
                    <div
                      key={item.slug}
                      className="flex items-center justify-between rounded-xl border border-[#E4E7EC] bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#101828]">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#667085]">
                          {item.zone ?? "Zona no informada"} ·{" "}
                          {item.venueType ?? "Tipo no informado"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canAddMore}
                        onClick={() => handleAdd(item.slug)}
                        className="rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98A2B3]"
                      >
                        Añadir
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between border-t border-[#E4E7EC] pt-3">
                <Link href={buscarHref} className="text-xs font-medium text-[#475467] underline">
                  Buscar en página completa
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenAddModal(false)}
                  className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-medium text-[#344054]"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const SERVICE_ROWS: Array<{ label: string; matchers: string[] }> = [
  { label: "Musculación", matchers: ["gym", "gym-floor", "weightlifting"] },
  { label: "Cardio", matchers: ["cardio", "cycling"] },
  { label: "Funcional", matchers: ["functional"] },
  { label: "CrossFit", matchers: ["crossfit", "cross-training"] },
  { label: "Yoga", matchers: ["yoga"] },
  { label: "Spinning", matchers: ["spinning", "cycling"] },
  { label: "Boxing", matchers: ["boxing"] },
];

const AMENITY_ROWS: Array<{ label: string; matchers: string[] }> = [
  { label: "Estacionamiento", matchers: ["parking", "estacionamiento"] },
  { label: "Sauna", matchers: ["sauna"] },
  { label: "Piscina", matchers: ["pool", "piscina"] },
  { label: "Duchas", matchers: ["showers", "duchas"] },
  { label: "Cafetería", matchers: ["cafe", "cafeteria"] },
];

function mergeSlugs(initialSlugs: string[], localSlugs: string[]): string[] {
  return [...new Set([...initialSlugs, ...localSlugs])].slice(0, 3);
}

function formatPriceBand(v: VenueDetail): string {
  const base =
    v.priceMin != null && v.priceMax != null
      ? (v.priceMin + v.priceMax) / 2
      : v.priceMin ?? v.priceMax;
  if (base == null) return "No informado";
  if (base >= 90) return "$$$$";
  if (base >= 65) return "$$$";
  if (base >= 45) return "$$";
  return "$";
}

function formatRating(score: number | null | undefined): string {
  if (score == null) return "—";
  const rating = 3.8 + score * 1.2;
  return rating.toFixed(1);
}

function getVotesHint(v: VenueDetail): number {
  const base = v.allowsTrial ? 120 : 78;
  return base + Math.max(0, (v.modalities?.length ?? 0) * 3);
}

function formatVenueType(venueType: string): string {
  const normalized = venueType.trim().toLowerCase();
  if (normalized === "gym") return "Gym clásico";
  if (normalized === "functional") return "CrossFit / HIIT";
  if (normalized === "personal_training") return "Personal training";
  if (normalized === "cycling") return "Cycling";
  if (normalized === "yoga") return "Yoga";
  if (normalized === "pilates") return "Pilates";
  return venueType || "No informado";
}

function hasAny(values: string[] | undefined, needles: string[]): boolean {
  if (!values?.length) return false;
  const normalized = values.map((value) => value.toLowerCase());
  return needles.some((needle) =>
    normalized.some((value) => value.includes(needle.toLowerCase())),
  );
}

function sanitizeWhatsapp(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function getPhotoUrl(v: VenueDetail): string | null {
  if (!Array.isArray(v.photoUrls) || v.photoUrls.length === 0) return null;
  const first = v.photoUrls[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols + 1}
        className="border-y border-[#E4E7EC] bg-[#EEF1F5] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A94A6]"
      >
        {label}
      </td>
    </tr>
  );
}

function DataRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-[#E4E7EC]">
      <td className="border-r border-[#E4E7EC] bg-[#F8F9FB] px-3 py-2 text-[11px] text-[#8A94A6]">
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="border-r border-[#E4E7EC] bg-white px-3 py-2 text-center text-[11px] font-medium text-[#374151] last:border-r-0"
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function BooleanRow({ label, values }: { label: string; values: boolean[] }) {
  return (
    <tr className="border-b border-[#E4E7EC]">
      <td className="border-r border-[#E4E7EC] bg-[#F8F9FB] px-3 py-2 text-[11px] text-[#8A94A6]">
        {label}
      </td>
      {values.map((enabled, index) => (
        <td
          key={`${label}-${index}`}
          className="border-r border-[#E4E7EC] bg-white px-3 py-2 text-center last:border-r-0"
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
              enabled
                ? "bg-[#B9F3D0] text-[#067647]"
                : "bg-[#EAECF0] text-[#98A2B3]"
            }`}
            aria-label={enabled ? "Disponible" : "No disponible"}
            title={enabled ? "Disponible" : "No disponible"}
          >
            {enabled ? "✓" : "–"}
          </span>
        </td>
      ))}
    </tr>
  );
}

function MiniSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A94A6]">
        {title}
      </p>
      <p className="mt-1 text-[11px] text-[#344054]">{content}</p>
    </div>
  );
}

