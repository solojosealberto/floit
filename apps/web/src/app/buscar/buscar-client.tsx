"use client";

import type { DiscoveryResponse } from "@floit/contracts";
import {
  UIBadge,
  UIBanner,
  UIEmptyState,
} from "@floit/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Component,
  useCallback,
  type ErrorInfo,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readFavoriteSlugs,
  toggleFavoriteSlug,
} from "@/lib/floit-favorites";
import {
  clearCompareSlugs,
  readCompareSlugs,
  removeCompareSlug,
  toggleCompareSlug,
} from "@/lib/floit-compare";
import { BRAND_NAME } from "@/lib/brand";
import { trackEvent } from "@/lib/track";
import { computeVenueBadges } from "@/lib/venue-badges";
import { DiscoveryMap } from "./discovery-map";

const DEFAULT_CENTER: [number, number] = [10.48, -66.86];

const VENUE_TYPES: { value: string; label: string }[] = [
  { value: "", label: "Todos los tipos" },
  { value: "gym", label: "Gimnasio" },
  { value: "functional", label: "Functional / cross" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "cycling", label: "Cycling" },
  { value: "mixed", label: "Mixto" },
  { value: "personal_training", label: "Personal training" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: `Relevancia (${BRAND_NAME})` },
  { value: "popularity", label: "Popularidad interna" },
  { value: "distance", label: "Distancia (requiere ubicación)" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "name", label: "Nombre (A–Z)" },
];

type TaxonomyModality = { slug: string; label: string };

type Props = {
  data: DiscoveryResponse;
  zones: string[];
  /** query string actual para hidratar el formulario */
  query: Record<string, string | undefined>;
  taxonomyModalities?: TaxonomyModality[];
};

const FALLBACK_MODALITIES: TaxonomyModality[] = [
  { slug: "musculacion", label: "Musculación" },
  { slug: "cardio", label: "Cardio" },
  { slug: "funcional", label: "Funcional" },
  { slug: "crossfit", label: "Crossfit" },
];

export function BuscarClient({
  data,
  zones,
  query,
  taxonomyModalities = [],
}: Props) {
  const modalityFilters =
    taxonomyModalities.length > 0 ? taxonomyModalities : FALLBACK_MODALITIES;
  const router = useRouter();
  const [showMap, setShowMap] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopMapFiltersOpen, setDesktopMapFiltersOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null | undefined>(
    undefined,
  );
  const [selectedMarkerPos, setSelectedMarkerPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [mobileMapVisibleCount, setMobileMapVisibleCount] = useState(8);
  const [, bumpFavorites] = useState(0);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [compareItems, setCompareItems] = useState<Array<{ slug: string; name: string }>>([]);
  const amenitiesFilter = (query.amenities ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const availableAmenities = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((v) => v.amenities.forEach((a) => set.add(a)));
    return [...set].slice(0, 8);
  }, [data.items]);

  const badgeMap = useMemo(
    () => computeVenueBadges(data.items),
    [data.items],
  );
  const activeFiltersCount = [
    query.zone,
    query.venue_type,
    query.modality,
    query.budget_min || query.budget_max ? "budget" : undefined,
    ...(amenitiesFilter ?? []),
  ].filter(Boolean).length;

  useEffect(() => {
    trackEvent("discovery_view", {
      sort: data.meta.sort,
      total: data.meta.total,
      zone: query.zone,
      exp: query.exp,
    });
  }, [data.meta.sort, data.meta.total, query.zone, query.exp]);

  const filteredItems = useMemo(() => {
    if (amenitiesFilter.length === 0) return data.items;
    return data.items.filter((v) =>
      amenitiesFilter.every((needle) =>
        v.amenities.some((a) => a.toLowerCase().includes(needle)),
      ),
    );
  }, [data.items, amenitiesFilter]);

  const mapCenter: [number, number] = useMemo(() => {
    const lat = query.lat ? Number(query.lat) : NaN;
    const lng = query.lng ? Number(query.lng) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    if (filteredItems.length > 0) {
      const sum = filteredItems.reduce(
        (acc, v) => ({ lat: acc.lat + v.lat, lng: acc.lng + v.lng }),
        { lat: 0, lng: 0 },
      );
      return [sum.lat / filteredItems.length, sum.lng / filteredItems.length];
    }
    return DEFAULT_CENTER;
  }, [filteredItems, query.lat, query.lng]);
  const selectedVenue = useMemo(() => {
    if (filteredItems.length === 0) return null;
    if (selectedSlug === null) return null;
    if (selectedSlug === undefined) return filteredItems[0];
    return filteredItems.find((v) => v.slug === selectedSlug) ?? filteredItems[0];
  }, [filteredItems, selectedSlug]);
  const mobileVisibleItems = useMemo(
    () => filteredItems.slice(0, mobileMapVisibleCount),
    [filteredItems, mobileMapVisibleCount],
  );
  const selectedCardStyle = useMemo<CSSProperties | undefined>(() => {
    if (!selectedMarkerPos) return undefined;
    const cardWidth = 220;
    const left = clamp(selectedMarkerPos.x + 18, 8, selectedMarkerPos.width - cardWidth - 8);
    const top = clamp(selectedMarkerPos.y - 44, 8, selectedMarkerPos.height - 120);
    return {
      left,
      top,
      width: `${cardWidth}px`,
      transform: "none",
    };
  }, [selectedMarkerPos]);
  const handleSelectVenue = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);
  const handleClearSelection = useCallback(() => {
    setSelectedSlug(null);
  }, []);
  const handleSelectedMarkerPositionChange = useCallback(
    (
      pos: { x: number; y: number; width: number; height: number } | null,
    ) => {
      setSelectedMarkerPos(pos);
    },
    [],
  );

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedSlug(undefined);
      return;
    }
    if (selectedSlug === undefined) {
      setSelectedSlug(filteredItems[0].slug);
      return;
    }
    if (selectedSlug && !filteredItems.some((v) => v.slug === selectedSlug)) {
      setSelectedSlug(filteredItems[0].slug);
    }
  }, [filteredItems, selectedSlug]);

  useEffect(() => {
    if (showMap) setMobileMapVisibleCount(8);
  }, [
    showMap,
    query.q,
    query.zone,
    query.modality,
    query.budget_min,
    query.budget_max,
    query.amenities,
    query.sort,
  ]);

  useEffect(() => {
    if (!showMap) setDesktopMapFiltersOpen(false);
  }, [showMap]);

  useEffect(() => {
    setCompareSlugs(readCompareSlugs());
    const onStorage = () => setCompareSlugs(readCompareSlugs());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (compareSlugs.length === 0) {
      setCompareItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/venues/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slugs: compareSlugs }),
        });
        const data = (await res.json()) as {
          items?: Array<{ slug: string; name: string }>;
        };
        if (cancelled) return;
        const bySlug = new Map(
          (data.items ?? []).map((item) => [item.slug, item]),
        );
        setCompareItems(
          compareSlugs.map((slug) => bySlug.get(slug) ?? { slug, name: slug }),
        );
      } catch {
        if (!cancelled) {
          setCompareItems(compareSlugs.map((slug) => ({ slug, name: slug })));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareSlugs]);

  const compareHref = useMemo(
    () =>
      compareSlugs.length > 0
        ? `/comparar?c=${encodeURIComponent(compareSlugs.join(","))}`
        : "/comparar",
    [compareSlugs],
  );

  const toggleCompare = useCallback((slug: string) => {
    const res = toggleCompareSlug(slug);
    setCompareSlugs(res.slugs);
    if (res.reason === "limit") {
      window.alert("Solo puedes comparar hasta 3 centros.");
      return;
    }
    trackEvent("compare_toggle", { slug, active: res.active });
  }, []);

  function buildHref(next: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    Object.entries(next).forEach(([k, v]) => {
      if (!v) p.delete(k);
      else p.set(k, v);
    });
    return `/buscar?${p.toString()}`;
  }

  function toggleAmenity(amenity: string) {
    const cur = new Set(
      (query.amenities ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    );
    if (cur.has(amenity)) cur.delete(amenity);
    else cur.add(amenity);
    router.push(buildHref({ amenities: [...cur].join(",") || undefined }));
  }

  return (
    <div className="mx-auto max-w-[1280px] px-3 py-3">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <section className="lg:hidden">
          <div className="border-b border-neutral-100 px-3 py-3">
            <form action="/buscar" method="get" className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <span className="text-neutral-400">🔎</span>
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder={query.zone ? `${query.zone} — ${query.modality ?? "Musculación"}` : "Zona o modalidad"}
                className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-500 focus:outline-none"
              />
              <button type="submit" className="text-xs text-neutral-500">
                Buscar
              </button>
            </form>
          </div>

          <div className="border-b border-neutral-100 px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {query.zone ? <UIBadge>{query.zone}</UIBadge> : null}
              {query.modality ? <UIBadge>{query.modality}</UIBadge> : null}
              {query.budget_min || query.budget_max ? (
                <UIBadge>{query.budget_min ?? "$"} - {query.budget_max ?? "$$$$"}</UIBadge>
              ) : null}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600"
              >
                + Filtros
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>
                {filteredItems.length} gimnasio{filteredItems.length === 1 ? "" : "s"} encontrados
              </span>
              <div className="flex items-center gap-2">
                <span>↕ {query.sort ?? "Cercanía"}</span>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className={`rounded-md px-2 py-1 ${!showMap ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className={`rounded-md px-2 py-1 ${showMap ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
                >
                  Mapa
                </button>
              </div>
            </div>
            {mobileFiltersOpen ? (
              <div className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs">
                <div>
                  <p className="mb-1 font-medium text-neutral-700">Zona</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zones.slice(0, 6).map((zone) => (
                      <Link
                        key={zone}
                        href={buildHref({ zone: query.zone === zone ? undefined : zone })}
                        className={`rounded-full border px-2 py-1 ${
                          query.zone === zone
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600"
                        }`}
                      >
                        {zone}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium text-neutral-700">Precio</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "$", min: "0", max: "20" },
                      { label: "$$", min: "20", max: "40" },
                      { label: "$$$", min: "40", max: "80" },
                    ].map((p) => (
                      <Link
                        key={p.label}
                        href={buildHref({ budget_min: p.min, budget_max: p.max })}
                        className={`rounded-full border px-2 py-1 ${
                          query.budget_min === p.min
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600"
                        }`}
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium text-neutral-700">Modalidad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {modalityFilters.map((mod) => (
                      <Link
                        key={mod.slug}
                        href={buildHref({
                          modality: query.modality === mod.slug ? undefined : mod.slug,
                        })}
                        className={`rounded-full border px-2 py-1 ${
                          query.modality === mod.slug
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600"
                        }`}
                      >
                        {mod.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative px-3 py-3">
            {filteredItems.length === 0 ? (
              <div className="space-y-4 py-6 text-center">
                <p className="text-xs text-neutral-400">0 resultados exactos</p>
                <div className="text-4xl">🔍</div>
                <h2 className="text-lg font-semibold text-neutral-800">Sin resultados en {query.zone ?? "esta zona"}</h2>
                <p className="mx-auto max-w-xs text-sm text-neutral-500">
                  No hay centros registrados para esta combinación de zona y tipo.
                  Podés ampliar tu búsqueda.
                </p>
                <Link
                  href="/buscar"
                  className="inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
                >
                  Ampliar búsqueda
                </Link>
                <div className="pt-2">
                  <p className="mb-2 text-xs text-neutral-400">Zonas cercanas</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {zones.slice(0, 4).map((zone) => (
                      <Link
                        key={zone}
                        href={buildHref({ zone })}
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600"
                      >
                        {zone}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="pt-2 text-left">
                  <p className="mb-2 text-xs text-neutral-500">Resultados relacionados (otras zonas)</p>
                  <div className="space-y-2 opacity-80">
                    {data.items.slice(0, 2).map((v) => (
                      <Link key={v.id} href={`/gyms/${v.slug}`} className="block rounded-2xl border border-neutral-200 bg-white p-3">
                        <p className="text-sm font-medium text-neutral-800">{v.name}</p>
                        <p className="text-xs text-neutral-500">{v.zone}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : showMap ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200">
                  <div className="h-[340px]">
                    <MapErrorBoundary>
                      <DiscoveryMap
                        venues={filteredItems}
                        center={mapCenter}
                        selectedSlug={selectedVenue?.slug}
                        onSelectVenue={handleSelectVenue}
                        onClearSelection={handleClearSelection}
                        onSelectedMarkerPositionChange={
                          handleSelectedMarkerPositionChange
                        }
                        className="h-[340px]"
                      />
                    </MapErrorBoundary>
                  </div>
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {query.modality ? <UIBadge>{query.modality}</UIBadge> : null}
                    {query.budget_min || query.budget_max ? (
                      <UIBadge>{query.budget_min ?? "$"} - {query.budget_max ?? "$$$$"}</UIBadge>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowMap(false)}
                      className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-600"
                    >
                      Ver lista
                    </button>
                  </div>

                  {selectedVenue && selectedCardStyle ? (
                    <div
                      className="absolute z-[500] rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl"
                      style={selectedCardStyle}
                    >
                      <div className="flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-[11px] text-neutral-400">
                        {getPhotoUrl(selectedVenue) ? (
                          <img
                            src={getPhotoUrl(selectedVenue)!}
                            alt={`Imagen de ${selectedVenue.name}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          "Foto centro"
                        )}
                      </div>
                      <div className="px-1.5 pb-1 pt-2">
                        <p className="truncate text-[12px] font-semibold text-neutral-800">
                          {selectedVenue.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          ★ 4.8 (203) · {selectedVenue.zone}
                          {selectedVenue.distanceM != null ? ` · ${formatKm(selectedVenue.distanceM)}` : ""}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            href={`/gyms/${selectedVenue.slug}`}
                            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold text-white"
                          >
                            Ver ficha
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              toggleFavoriteSlug(selectedVenue.slug);
                              bumpFavorites((k) => k + 1);
                            }}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700"
                          >
                            ♡
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="absolute bottom-3 right-3 rounded-full border border-neutral-300 bg-white p-2 text-xs text-neutral-600 shadow"
                  >
                    📍
                  </button>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-2">
                  <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-neutral-200" />
                  <div className="mb-2 flex items-center justify-between px-1 text-xs text-neutral-600">
                    <span>{filteredItems.length} gimnasios en la zona</span>
                    <span>Ordenar ▾</span>
                  </div>
                  <div className="max-h-[44vh] space-y-2 overflow-y-auto pr-1">
                    {mobileVisibleItems.map((v) => {
                      const favOn = readFavoriteSlugs().includes(v.slug);
                    const compareOn = compareSlugs.includes(v.slug);
                      return (
                        <article key={v.id} className="rounded-xl border border-neutral-200 p-2">
                          <div className="flex gap-2">
                            <Link href={`/gyms/${v.slug}`} className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] text-neutral-400">
                              {getPhotoUrl(v) ? (
                                <img
                                  src={getPhotoUrl(v)!}
                                  alt={`Imagen de ${v.name}`}
                                  className="h-full w-full rounded-lg object-cover object-center"
                                  loading="lazy"
                                />
                              ) : (
                                "Foto"
                              )}
                            </Link>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSlug(v.slug)}
                                  className="truncate text-left text-sm font-medium text-neutral-800"
                                >
                                  {v.name}
                                </button>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleCompare(v.slug)}
                                    className={`rounded-full border px-2 py-1 text-[10px] ${
                                      compareOn
                                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                        : "border-neutral-300 text-neutral-600"
                                    }`}
                                  >
                                    {compareOn ? "✓" : "+"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toggleFavoriteSlug(v.slug);
                                      bumpFavorites((k) => k + 1);
                                    }}
                                    className={`h-7 w-7 rounded-full border text-[11px] ${
                                      favOn
                                        ? "border-neutral-900 bg-neutral-900 text-white"
                                        : "border-neutral-300 text-neutral-600"
                                    }`}
                                  >
                                    {favOn ? "★" : "☆"}
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500">
                                {v.zone}
                                {v.distanceM != null ? ` · ${formatKm(v.distanceM)}` : ""}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {mobileMapVisibleCount < filteredItems.length ? (
                    <button
                      type="button"
                      onClick={() => setMobileMapVisibleCount((n) => n + 8)}
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Mostrar 8 más
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 pb-16">
                  {filteredItems.map((v) => {
                    const favOn = readFavoriteSlugs().includes(v.slug);
                    const compareOn = compareSlugs.includes(v.slug);
                    const badges = badgeMap[v.slug] ?? [];
                    return (
                      <article key={v.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                        <div className="flex gap-3">
                          <Link href={`/gyms/${v.slug}`} className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
                            {getPhotoUrl(v) ? (
                              <img
                                src={getPhotoUrl(v)!}
                                alt={`Imagen de ${v.name}`}
                                className="h-full w-full rounded-xl object-cover object-center"
                                loading="lazy"
                              />
                            ) : (
                              "Foto"
                            )}
                          </Link>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link href={`/gyms/${v.slug}`} className="truncate text-sm font-semibold text-neutral-800">
                                {v.name}
                              </Link>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleCompare(v.slug)}
                                  className={`rounded-full border px-2 py-1 text-[10px] ${
                                    compareOn
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                      : "border-neutral-300 text-neutral-600"
                                  }`}
                                >
                                  {compareOn ? "Comparando" : "Comparar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleFavoriteSlug(v.slug);
                                    bumpFavorites((k) => k + 1);
                                  }}
                                  className={`h-7 w-7 rounded-full border text-[11px] ${
                                    favOn
                                      ? "border-neutral-900 bg-neutral-900 text-white"
                                      : "border-neutral-300 text-neutral-600"
                                  }`}
                                >
                                  {favOn ? "★" : "☆"}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500">
                              {v.zone}
                              {v.distanceM != null ? ` · ${formatKm(v.distanceM)}` : ""}
                            </p>
                            <p className="text-xs text-neutral-600">{formatPrice(v)}</p>
                            <div className="flex flex-wrap gap-1">
                              {badges.slice(0, 1).map((b) => (
                                <UIBadge key={b.key}>{b.label}</UIBadge>
                              ))}
                              {(v.modalities ?? []).slice(0, 2).map((m) => (
                                <span key={m} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="fixed bottom-6 right-4 rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
                >
                  Ver mapa
                </button>
              </>
            )}
          </div>
        </section>

        <div className="hidden lg:block">

        <div className="border-b border-neutral-100 px-4 py-3">
          <form
            action="/buscar"
            method="get"
            className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-2"
            onSubmit={(e) => {
              const fd = new FormData(e.currentTarget);
              trackEvent("filter_apply", {
                zone: String(fd.get("zone") ?? "").trim() || undefined,
                venueType: String(fd.get("venue_type") ?? "").trim() || undefined,
                modality: String(fd.get("modality") ?? "").trim() || undefined,
                sort: String(fd.get("sort") ?? "").trim() || undefined,
              });
            }}
          >
            <input type="hidden" name="zone" value={query.zone ?? ""} />
            <input type="hidden" name="venue_type" value={query.venue_type ?? ""} />
            <input type="hidden" name="modality" value={query.modality ?? ""} />
            <input type="hidden" name="budget_min" value={query.budget_min ?? ""} />
            <input type="hidden" name="budget_max" value={query.budget_max ?? ""} />
            <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <span className="text-neutral-400">🔎</span>
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Zona, modalidad o nombre"
                className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
            <select
              name="sort"
              defaultValue={query.sort ?? "distance"}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  Ordenar: {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className={`rounded-xl px-3 py-2 text-sm ${!showMap ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-600"}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className={`rounded-xl px-3 py-2 text-sm ${showMap ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-600"}`}
            >
              Mapa
            </button>
            <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setDesktopMapFiltersOpen((v) => !v)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                showMap && desktopMapFiltersOpen
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              Filtros ({activeFiltersCount})
            </button>
          </form>
        </div>

        {!showMap ? (
        <div className="mx-auto flex max-w-[1220px] items-center justify-between border-b border-neutral-100 px-4 py-3 text-sm text-neutral-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>Filtros activos:</span>
            {query.zone ? <UIBadge>{query.zone}</UIBadge> : null}
            {query.venue_type ? <UIBadge>{query.venue_type}</UIBadge> : null}
            {query.modality ? <UIBadge>{query.modality}</UIBadge> : null}
            {query.budget_min || query.budget_max ? (
              <UIBadge>{query.budget_min ?? "$"} - {query.budget_max ?? "$$$$"}</UIBadge>
            ) : null}
            {amenitiesFilter.map((a) => (
              <UIBadge key={a}>{a}</UIBadge>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/buscar" className="hover:underline">
              Limpiar todos
            </Link>
            <span>{filteredItems.length} resultados</span>
          </div>
        </div>
        ) : (
          <div className="mx-auto flex max-w-[1220px] items-center justify-between border-b border-neutral-100 px-4 py-2 text-sm text-neutral-500">
            <span>{filteredItems.length} resultados</span>
            <Link href="/buscar" className="hover:underline">
              Limpiar filtros
            </Link>
          </div>
        )}

        {showMap && desktopMapFiltersOpen ? (
          <div className="mx-auto max-w-[1220px] border-b border-neutral-100 px-4 py-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-800">Filtros de mapa</p>
                <button
                  type="button"
                  onClick={() => setDesktopMapFiltersOpen(false)}
                  className="rounded-full border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  Cerrar
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Zona</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zones.slice(0, 8).map((zone) => (
                      <Link
                        key={zone}
                        href={buildHref({ zone: query.zone === zone ? undefined : zone })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.zone === zone
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {zone}
                      </Link>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VENUE_TYPES.filter((v) => v.value).slice(0, 6).map((type) => (
                      <Link
                        key={type.value}
                        href={buildHref({ venue_type: query.venue_type === type.value ? undefined : type.value })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.venue_type === type.value
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {type.label}
                      </Link>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Precio</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "$", min: "0", max: "20" },
                      { label: "$$", min: "20", max: "40" },
                      { label: "$$$", min: "40", max: "80" },
                      { label: "$$$$", min: "80", max: undefined },
                    ].map((p) => (
                      <Link
                        key={p.label}
                        href={buildHref({ budget_min: p.min, budget_max: p.max })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.budget_min === p.min
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Modalidad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {modalityFilters.map((mod) => (
                      <Link
                        key={mod.slug}
                        href={buildHref({
                          modality: query.modality === mod.slug ? undefined : mod.slug,
                        })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.modality === mod.slug
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {mod.label}
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}

        <div className={`grid gap-0 ${showMap ? "lg:grid-cols-1" : "lg:grid-cols-[260px_1fr]"}`}>
          {!showMap ? (
          <aside className="border-r border-neutral-100 p-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700">Filtros</span>
              <Link href="/buscar" className="text-neutral-500 hover:underline">
                Limpiar todo
              </Link>
            </div>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-neutral-700">Zona / Municipio</p>
              <div className="space-y-1">
                {zones.slice(0, 8).map((zone) => (
                  <Link
                    key={zone}
                    href={buildHref({ zone: query.zone === zone ? undefined : zone })}
                    className={`block rounded-lg px-2 py-1 text-sm ${
                      query.zone === zone ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {zone}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-neutral-700">Tipo de centro</p>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.filter((v) => v.value).map((type) => (
                  <Link
                    key={type.value}
                    href={buildHref({ venue_type: query.venue_type === type.value ? undefined : type.value })}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      query.venue_type === type.value
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 text-neutral-600"
                    }`}
                  >
                    {type.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-neutral-700">Rango de precio</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "$", min: "0", max: "20" },
                  { label: "$$", min: "20", max: "40" },
                  { label: "$$$", min: "40", max: "80" },
                  { label: "$$$$", min: "80", max: undefined },
                ].map((p) => (
                  <Link
                    key={p.label}
                    href={buildHref({
                      budget_min: p.min,
                      budget_max: p.max,
                    })}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      query.budget_min === p.min ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-600"
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-neutral-700">Modalidades</p>
              <div className="space-y-1">
                {modalityFilters.map((mod) => (
                  <Link
                    key={mod.slug}
                    href={buildHref({
                      modality: query.modality === mod.slug ? undefined : mod.slug,
                    })}
                    className={`block rounded-lg px-2 py-1 text-sm ${
                      query.modality === mod.slug
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {mod.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-neutral-700">Amenidades clave</p>
              <div className="space-y-1">
                {availableAmenities.map((am) => {
                  const active = amenitiesFilter.includes(am.toLowerCase());
                  return (
                    <button
                      key={am}
                      type="button"
                      onClick={() => toggleAmenity(am)}
                      className={`block w-full rounded-lg px-2 py-1 text-left text-sm ${
                        active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </section>

            <button
              type="button"
              className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Ver {filteredItems.length} resultados
            </button>
          </aside>
          ) : null}

          <section className="p-4">
            {filteredItems.length === 0 ? (
              <UIEmptyState
                title="No hay centros con estos filtros."
                description="Prueba otra zona o amplía el presupuesto."
              />
            ) : showMap ? (
              <div className="grid h-[calc(100vh-215px)] gap-0 xl:grid-cols-[30%_70%]">
                <div className="border-r border-neutral-100">
                  <div className="mb-2 flex items-center justify-between px-2 text-xs text-neutral-500">
                    <span>{filteredItems.length} resultados</span>
                    <span>Ordenar ▾</span>
                  </div>
                  <div className="h-[calc(100vh-270px)] space-y-2 overflow-y-auto pr-2">
                    {filteredItems.map((v) => {
                      const favOn = readFavoriteSlugs().includes(v.slug);
                    const compareOn = compareSlugs.includes(v.slug);
                      const badges = badgeMap[v.slug] ?? [];
                      return (
                        <article
                          key={v.id}
                          className={`cursor-pointer overflow-hidden rounded-2xl border bg-white px-2 py-2 transition ${
                            selectedVenue?.slug === v.slug
                              ? "border-neutral-900 shadow-[0_6px_18px_rgba(15,23,42,0.12)]"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                          onClick={() => setSelectedSlug(v.slug)}
                        >
                          <div className="flex gap-2">
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
                            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={`/gyms/${v.slug}`}
                                  className="line-clamp-1 min-w-0 pr-2 text-[15px] font-semibold leading-tight text-neutral-800 hover:underline"
                                >
                                  {v.name}
                                </Link>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  title={
                                    compareOn
                                      ? "Quitar del comparador"
                                      : "Agregar al comparador"
                                  }
                                  onClick={() => toggleCompare(v.slug)}
                                  aria-label={
                                    compareOn
                                      ? "Quitar del comparador"
                                      : "Agregar al comparador"
                                  }
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                                    compareOn
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                      : "border-neutral-300 text-neutral-600"
                                  }`}
                                >
                                  {compareOn ? "✓" : "⇄"}
                                </button>
                                <button
                                  type="button"
                                  title={favOn ? "Quitar de favoritos" : "Guardar en favoritos"}
                                  onClick={() => {
                                    toggleFavoriteSlug(v.slug);
                                    bumpFavorites((k) => k + 1);
                                    trackEvent("favorite_toggle", { slug: v.slug });
                                  }}
                                  aria-label={favOn ? "Quitar de favoritos" : "Guardar en favoritos"}
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                                    favOn
                                      ? "border-neutral-900 bg-neutral-900 text-white"
                                      : "border-neutral-300 text-neutral-600"
                                  }`}
                                >
                                  {favOn ? "★" : "☆"}
                                </button>
                              </div>
                              </div>
                              <p className="text-sm text-neutral-500">
                                {v.zone}
                                {v.distanceM != null ? ` · ${formatKm(v.distanceM)}` : ""}
                              </p>
                              <p className="text-sm text-neutral-700">★ 4.8 (203) · {priceTier(v)}</p>
                              <div className="flex flex-wrap gap-1">
                                {badges.slice(0, 2).map((b) => (
                                  <UIBadge key={b.key}>{b.label}</UIBadge>
                                ))}
                                {(v.modalities ?? []).slice(0, 2).map((m) => (
                                  <span key={m} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
                <div className="relative h-[calc(100vh-215px)]">
                  <MapErrorBoundary>
                    <DiscoveryMap
                      venues={filteredItems}
                      center={mapCenter}
                      selectedSlug={selectedVenue?.slug}
                      onSelectVenue={handleSelectVenue}
                      onClearSelection={handleClearSelection}
                      onSelectedMarkerPositionChange={
                        handleSelectedMarkerPositionChange
                      }
                      className="h-full rounded-none border-0"
                    />
                  </MapErrorBoundary>
                  {selectedVenue && selectedCardStyle ? (
                    <div
                      className="absolute z-[500] rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl"
                      style={selectedCardStyle}
                    >
                      <div className="flex h-20 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-xs text-neutral-400">
                        {getPhotoUrl(selectedVenue) ? (
                          <img
                            src={getPhotoUrl(selectedVenue)!}
                            alt={`Imagen de ${selectedVenue.name}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          "Foto centro"
                        )}
                      </div>
                      <div className="px-1.5 pb-1 pt-2">
                        <p className="truncate text-[13px] font-semibold text-neutral-800">
                          {selectedVenue.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          ★ 4.8 (203) · {selectedVenue.zone}
                          {selectedVenue.distanceM != null
                            ? ` · ${formatKm(selectedVenue.distanceM)}`
                            : ""}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            href={`/gyms/${selectedVenue.slug}`}
                            className="rounded-lg bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white"
                          >
                            Ver ficha
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              toggleFavoriteSlug(selectedVenue.slug);
                              bumpFavorites((k) => k + 1);
                            }}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700"
                          >
                            ♡
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((v) => {
                  const favOn = readFavoriteSlugs().includes(v.slug);
                  const compareOn = compareSlugs.includes(v.slug);
                  const badges = badgeMap[v.slug] ?? [];
                  return (
                    <article key={v.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                      <Link href={`/gyms/${v.slug}`}>
                        <div className="flex h-28 items-center justify-center overflow-hidden bg-neutral-100 text-sm text-neutral-400">
                          {getPhotoUrl(v) ? (
                            <img
                              src={getPhotoUrl(v)!}
                              alt={`Imagen de ${v.name}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            "Imagen gimnasio"
                          )}
                        </div>
                      </Link>
                      <div className="space-y-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/gyms/${v.slug}`} className="font-semibold text-neutral-800 hover:underline">
                            {v.name}
                          </Link>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleCompare(v.slug)}
                              className={`rounded-full border px-2 py-1 text-xs ${
                                compareOn
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                  : "border-neutral-300 text-neutral-600"
                              }`}
                            >
                              {compareOn ? "Comparando" : "Comparar"}
                            </button>
                            <button
                              type="button"
                              title={favOn ? "Quitar de favoritos" : "Guardar en favoritos"}
                              onClick={() => {
                                toggleFavoriteSlug(v.slug);
                                bumpFavorites((k) => k + 1);
                                trackEvent("favorite_toggle", { slug: v.slug });
                              }}
                              className={`rounded-full border px-2 py-1 text-xs ${
                                favOn ? "border-rose-300 bg-rose-50 text-rose-700" : "border-neutral-300 text-neutral-600"
                              }`}
                            >
                              {favOn ? "Guardado" : "Guardar"}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {v.zone}
                          {v.distanceM != null ? ` · ${formatKm(v.distanceM)}` : ""}
                        </p>
                        <p className="text-xs text-neutral-600">{formatPrice(v)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {badges.map((b) => (
                            <UIBadge key={b.key}>{b.label}</UIBadge>
                          ))}
                          {(v.modalities ?? []).slice(0, 2).map((m) => (
                            <span key={m} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          {compareSlugs.length > 0 ? (
            <div className="fixed bottom-5 left-1/2 z-[1100] w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-neutral-600">
                    Comparador activo: {compareSlugs.length}/3 centro
                    {compareSlugs.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearCompareSlugs();
                        setCompareSlugs([]);
                      }}
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-600"
                    >
                      Limpiar
                    </button>
                    <Link
                      href={compareHref}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Ir a comparar
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {compareItems.map((item) => (
                    <span
                      key={item.slug}
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700"
                    >
                      <span className="max-w-[140px] truncate">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = removeCompareSlug(item.slug);
                          setCompareSlugs(next);
                        }}
                        className="rounded-full border border-indigo-300 px-1 leading-none hover:bg-indigo-100"
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
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatPrice(v: DiscoveryResponse["items"][number]): string {
  if (v.priceMin == null && v.priceMax == null) return "Consultar precio";
  if (v.priceMin != null && v.priceMax != null)
    return `$${v.priceMin} – $${v.priceMax} / mes (ref.)`;
  if (v.priceMin != null) return `Desde $${v.priceMin} / mes (ref.)`;
  return `Hasta $${v.priceMax} / mes (ref.)`;
}

function priceTier(v: DiscoveryResponse["items"][number]): string {
  const value = v.priceMax ?? v.priceMin ?? 0;
  if (value <= 20) return "$";
  if (value <= 40) return "$$";
  if (value <= 80) return "$$$";
  return "$$$$";
}

function getPhotoUrl(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const maybe = v as { photoUrls?: unknown };
  if (!Array.isArray(maybe.photoUrls) || maybe.photoUrls.length === 0) return null;
  const first = maybe.photoUrls[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Map error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <UIBanner variant="warning">
          El mapa no está disponible en este dispositivo o red. Usa la lista de
          resultados para continuar.
        </UIBanner>
      );
    }
    return this.props.children;
  }
}
