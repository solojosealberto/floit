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
  useTransition,
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
import {
  DiscoveryVenueCardGrid,
  DiscoveryVenueCardList,
  DiscoveryVenueCardMobile,
} from "@/components/discovery-venue-card";
import { ActiveFilterChip } from "@/components/active-filter-chip";
import { DiscoveryFilterLink } from "@/components/discovery-filter-link";
import { CompareActiveBar } from "@/components/compare-active-bar";
import { MapSelectedVenueCard } from "@/components/map-selected-venue-card";
import {
  VenueCardSkeletonGrid,
  VenueListSkeleton,
} from "@/components/venue-card-skeleton";
import { MapPin, Search } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();
  const navigateFilters = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );
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

  const venueCardHandlers = useCallback(
    (v: DiscoveryResponse["items"][number]) => ({
      venue: v as DiscoveryResponse["items"][number] & {
        photoUrls?: string[] | null;
      },
      isFavorite: readFavoriteSlugs().includes(v.slug),
      isCompare: compareSlugs.includes(v.slug),
      onToggleFavorite: () => {
        toggleFavoriteSlug(v.slug);
        bumpFavorites((k) => k + 1);
        trackEvent("favorite_toggle", { slug: v.slug });
      },
      onToggleCompare: () => toggleCompare(v.slug),
    }),
    [compareSlugs, toggleCompare],
  );

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
    navigateFilters(buildHref({ amenities: [...cur].join(",") || undefined }));
  }

  function onUseLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = new URLSearchParams();
        p.set("lat", String(pos.coords.latitude));
        p.set("lng", String(pos.coords.longitude));
        p.set("sort", "distance");
        p.set("radius_km", "12");
        navigateFilters(`/buscar?${p.toString()}`);
      },
      () => {
        navigateFilters("/buscar");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; href: string }> = [];
    const mk = (next: Record<string, string | undefined>) => {
      const p = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v) p.set(k, v);
      });
      Object.entries(next).forEach(([k, v]) => {
        if (!v) p.delete(k);
        else p.set(k, v);
      });
      return `/buscar?${p.toString()}`;
    };

    if (query.zone) {
      chips.push({ key: "zone", label: query.zone, href: mk({ zone: undefined }) });
    }
    if (query.venue_type) {
      const label =
        VENUE_TYPES.find((t) => t.value === query.venue_type)?.label ??
        query.venue_type;
      chips.push({
        key: "venue_type",
        label,
        href: mk({ venue_type: undefined }),
      });
    }
    if (query.modality) {
      const label =
        modalityFilters.find((m) => m.slug === query.modality)?.label ??
        query.modality;
      chips.push({
        key: "modality",
        label,
        href: mk({ modality: undefined }),
      });
    }
    if (query.budget_min || query.budget_max) {
      chips.push({
        key: "budget",
        label: `$${query.budget_min ?? "0"} – $${query.budget_max ?? "∞"}`,
        href: mk({ budget_min: undefined, budget_max: undefined }),
      });
    }
    amenitiesFilter.forEach((amenity) => {
      const next = amenitiesFilter.filter((a) => a !== amenity);
      chips.push({
        key: `amenity-${amenity}`,
        label: amenity,
        href: mk({ amenities: next.length ? next.join(",") : undefined }),
      });
    });
    return chips;
  }, [query, amenitiesFilter, modalityFilters]);

  const compareBarItems = useMemo(
    () =>
      compareSlugs.map((slug) => {
        const found = compareItems.find((item) => item.slug === slug);
        return found ?? { slug, name: slug };
      }),
    [compareSlugs, compareItems],
  );

  return (
    <>
    <div className="mx-auto max-w-[1280px] px-3 py-3">
      <div className="qg-surface qg-motion overflow-hidden rounded-2xl border border-quegym-border bg-quegym-elevated">
        <section className="lg:hidden">
          <div className="border-b border-quegym-border px-3 py-3">
            <form action="/buscar" method="get" className="qg-field qg-surface-subtle qg-motion flex items-center gap-2 rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-quegym-secondary" aria-hidden />
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder={query.zone ? `${query.zone} — ${query.modality ?? "Musculación"}` : "Zona o modalidad"}
                className="w-full bg-transparent text-sm text-quegym-primary placeholder:text-quegym-secondary focus:outline-none"
              />
              <button type="submit" className="text-xs text-quegym-secondary">
                Buscar
              </button>
            </form>
          </div>

          <div className="border-b border-quegym-border px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {query.zone ? <UIBadge>{query.zone}</UIBadge> : null}
              {query.modality ? <UIBadge>{query.modality}</UIBadge> : null}
              {query.budget_min || query.budget_max ? (
                <UIBadge>{query.budget_min ?? "$"} - {query.budget_max ?? "$$$$"}</UIBadge>
              ) : null}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="rounded-full border border-quegym-border px-3 py-1 text-xs text-quegym-secondary"
              >
                + Filtros
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-quegym-secondary">
              <span>
                {filteredItems.length} gimnasio{filteredItems.length === 1 ? "" : "s"} encontrados
              </span>
              <div className="flex items-center gap-2">
                <span>↕ {query.sort ?? "Cercanía"}</span>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className={`rounded-md px-2 py-1 ${!showMap ? "bg-quegym-accent text-white" : "bg-quegym-subtle text-quegym-secondary"}`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className={`rounded-md px-2 py-1 ${showMap ? "bg-quegym-accent text-white" : "bg-quegym-subtle text-quegym-secondary"}`}
                >
                  Mapa
                </button>
              </div>
            </div>
            {mobileFiltersOpen ? (
              <div className="mt-3 space-y-3 rounded-xl border border-quegym-border bg-quegym-subtle p-3 text-xs">
                <div>
                  <p className="mb-1 font-medium text-quegym-primary">Zona</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zones.slice(0, 6).map((zone) => (
                      <DiscoveryFilterLink
                        key={zone}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({ zone: query.zone === zone ? undefined : zone })}
                        className={`rounded-full border px-2 py-1 ${
                          query.zone === zone
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary"
                        }`}
                      >
                        {zone}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium text-quegym-primary">Precio</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "$", min: "0", max: "20" },
                      { label: "$$", min: "20", max: "40" },
                      { label: "$$$", min: "40", max: "80" },
                    ].map((p) => (
                      <DiscoveryFilterLink
                        key={p.label}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({ budget_min: p.min, budget_max: p.max })}
                        className={`rounded-full border px-2 py-1 ${
                          query.budget_min === p.min
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary"
                        }`}
                      >
                        {p.label}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium text-quegym-primary">Modalidad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {modalityFilters.map((mod) => (
                      <DiscoveryFilterLink
                        key={mod.slug}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({
                          modality: query.modality === mod.slug ? undefined : mod.slug,
                        })}
                        className={`rounded-full border px-2 py-1 ${
                          query.modality === mod.slug
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary"
                        }`}
                      >
                        {mod.label}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative px-3 py-3">
            {isPending ? (
              showMap ? (
                <div className="space-y-2">
                  <div className="h-[340px] animate-pulse rounded-2xl border border-quegym-border bg-quegym-input motion-safe:animate-pulse" />
                  <VenueListSkeleton count={4} />
                </div>
              ) : (
                <VenueListSkeleton count={6} />
              )
            ) : filteredItems.length === 0 ? (
              <div className="space-y-4 py-6 text-center">
                <p className="text-xs text-quegym-secondary">0 resultados exactos</p>
                <Search className="mx-auto h-10 w-10 text-quegym-secondary" aria-hidden />
                <h2 className="text-lg font-semibold text-quegym-primary">Sin resultados en {query.zone ?? "esta zona"}</h2>
                <p className="mx-auto max-w-xs text-sm text-quegym-secondary">
                  No hay centros registrados para esta combinación de zona y tipo.
                  Puedes ampliar tu búsqueda.
                </p>
                <DiscoveryFilterLink
                  onFilterNavigate={navigateFilters}
                  href="/buscar"
                  className="qg-btn-primary qg-motion inline-flex rounded-xl bg-quegym-accent px-5 py-3 text-sm font-medium text-white"
                >
                  Ampliar búsqueda
                </DiscoveryFilterLink>
                <div className="pt-2">
                  <p className="mb-2 text-xs text-quegym-secondary">Zonas cercanas</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {zones.slice(0, 4).map((zone) => (
                      <DiscoveryFilterLink
                        key={zone}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({ zone })}
                        className="rounded-full border border-quegym-border px-3 py-1 text-xs text-quegym-secondary"
                      >
                        {zone}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </div>
                <div className="pt-2 text-left">
                  <p className="mb-2 text-xs text-quegym-secondary">Resultados relacionados (otras zonas)</p>
                  <div className="space-y-2 opacity-80">
                    {data.items.slice(0, 2).map((v) => (
                      <Link key={v.id} href={`/gyms/${v.slug}`} className="qg-surface-subtle qg-motion block rounded-2xl border border-quegym-border bg-quegym-elevated p-3">
                        <p className="text-sm font-medium text-quegym-primary">{v.name}</p>
                        <p className="text-xs text-quegym-secondary">{v.zone}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : showMap ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl border border-quegym-border">
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
                      className="rounded-full border border-quegym-border bg-quegym-elevated px-2.5 py-1 text-xs text-quegym-secondary"
                    >
                      Ver lista
                    </button>
                  </div>

                  {selectedVenue && selectedCardStyle ? (
                    <div
                      className="qg-surface qg-motion absolute z-[500] rounded-2xl border border-quegym-border bg-quegym-elevated p-1.5"
                      style={selectedCardStyle}
                    >
                      <MapSelectedVenueCard
                        venue={selectedVenue}
                        compact
                        onToggleFavorite={() => {
                          toggleFavoriteSlug(selectedVenue.slug);
                          bumpFavorites((k) => k + 1);
                        }}
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={onUseLocation}
                    className="absolute bottom-3 right-3 rounded-full border border-quegym-border bg-quegym-elevated p-2 text-quegym-secondary shadow hover:bg-quegym-subtle"
                    aria-label="Usar mi ubicación"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="qg-surface-subtle qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-2">
                  <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-quegym-subtle" />
                  <div className="mb-2 flex items-center justify-between px-1 text-xs text-quegym-secondary">
                    <span>{filteredItems.length} gimnasios en la zona</span>
                    <span>Ordenar ▾</span>
                  </div>
                  <div className="max-h-[44vh] space-y-2 overflow-y-auto pr-1">
                    {mobileVisibleItems.map((v) => (
                      <DiscoveryVenueCardList
                        key={v.id}
                        {...venueCardHandlers(v)}
                        selected={selectedVenue?.slug === v.slug}
                        onSelect={() => setSelectedSlug(v.slug)}
                      />
                    ))}
                  </div>
                  {mobileMapVisibleCount < filteredItems.length ? (
                    <button
                      type="button"
                      onClick={() => setMobileMapVisibleCount((n) => n + 8)}
                      className="mt-2 w-full rounded-xl border border-quegym-border px-3 py-2 text-xs font-medium text-quegym-primary hover:bg-quegym-subtle"
                    >
                      Mostrar 8 más
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className={`space-y-2 ${compareSlugs.length > 0 ? "pb-32" : "pb-16"}`}>
                  {filteredItems.map((v) => (
                    <DiscoveryVenueCardMobile
                      key={v.id}
                      {...venueCardHandlers(v)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="qg-fab qg-motion fixed bottom-6 right-4 rounded-full bg-quegym-accent px-4 py-3 text-sm font-medium text-white"
                >
                  Ver mapa
                </button>
              </>
            )}
          </div>
        </section>

        <div className="hidden lg:block">

        <div className="border-b border-quegym-border px-4 py-3">
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
            <div className="qg-field qg-surface-subtle qg-motion flex min-w-[320px] flex-1 items-center gap-2 rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-quegym-secondary" aria-hidden />
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Zona, modalidad o nombre"
                className="w-full bg-transparent text-sm text-quegym-primary placeholder:text-quegym-secondary focus:outline-none"
              />
            </div>
            <select
              name="sort"
              defaultValue={query.sort ?? "distance"}
              className="rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-sm text-quegym-secondary"
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
              className={`rounded-xl px-3 py-2 text-sm ${!showMap ? "bg-quegym-accent text-white" : "border border-quegym-border text-quegym-secondary"}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className={`rounded-xl px-3 py-2 text-sm ${showMap ? "bg-quegym-accent text-white" : "border border-quegym-border text-quegym-secondary"}`}
            >
              Mapa
            </button>
            <button className="rounded-xl border border-quegym-border px-3 py-2 text-sm text-quegym-secondary hover:bg-quegym-subtle">
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setDesktopMapFiltersOpen((v) => !v)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                showMap && desktopMapFiltersOpen
                  ? "border-quegym-accent bg-quegym-accent text-white"
                  : "border-quegym-border text-quegym-secondary hover:bg-quegym-subtle"
              }`}
            >
              Filtros ({activeFiltersCount})
            </button>
          </form>
        </div>

        {!showMap ? (
        <div className="mx-auto flex max-w-[1220px] items-center justify-between border-b border-quegym-border px-4 py-3 text-sm text-quegym-secondary">
          <div className="flex flex-wrap items-center gap-2">
            <span>Filtros activos:</span>
            {activeFilterChips.map((chip) => (
              <ActiveFilterChip
                key={chip.key}
                label={chip.label}
                href={chip.href}
                onFilterNavigate={navigateFilters}
              />
            ))}
            {activeFilterChips.length === 0 ? (
              <span className="text-xs text-quegym-secondary">Ninguno</span>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <DiscoveryFilterLink
              onFilterNavigate={navigateFilters}
              href="/buscar"
              className="text-quegym-highlight hover:underline"
            >
              Limpiar todos
            </DiscoveryFilterLink>
            <span>{filteredItems.length} resultados</span>
          </div>
        </div>
        ) : (
          <div className="mx-auto flex max-w-[1220px] items-center justify-between border-b border-quegym-border px-4 py-2 text-sm text-quegym-secondary">
            <span>{filteredItems.length} resultados</span>
            <DiscoveryFilterLink
              onFilterNavigate={navigateFilters}
              href="/buscar"
              className="text-quegym-highlight hover:underline"
            >
              Limpiar filtros
            </DiscoveryFilterLink>
          </div>
        )}

        {showMap && desktopMapFiltersOpen ? (
          <div className="mx-auto max-w-[1220px] border-b border-quegym-border px-4 py-3">
            <div className="qg-surface-subtle qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-quegym-primary">Filtros de mapa</p>
                <button
                  type="button"
                  onClick={() => setDesktopMapFiltersOpen(false)}
                  className="rounded-full border border-quegym-border px-2 py-1 text-xs text-quegym-secondary hover:bg-quegym-subtle"
                >
                  Cerrar
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-quegym-secondary">Zona</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zones.slice(0, 8).map((zone) => (
                      <DiscoveryFilterLink
                        key={zone}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({ zone: query.zone === zone ? undefined : zone })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.zone === zone
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary hover:bg-quegym-subtle"
                        }`}
                      >
                        {zone}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-quegym-secondary">Tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VENUE_TYPES.filter((v) => v.value).slice(0, 6).map((type) => (
                      <DiscoveryFilterLink
                        key={type.value}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({ venue_type: query.venue_type === type.value ? undefined : type.value })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.venue_type === type.value
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary hover:bg-quegym-subtle"
                        }`}
                      >
                        {type.label}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-quegym-secondary">Precio</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "$", min: "0", max: "20" },
                      { label: "$$", min: "20", max: "40" },
                      { label: "$$$", min: "40", max: "80" },
                      { label: "$$$$", min: "80", max: undefined },
                    ].map((p) => (
                      <DiscoveryFilterLink
                        key={p.label}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({ budget_min: p.min, budget_max: p.max })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.budget_min === p.min
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary hover:bg-quegym-subtle"
                        }`}
                      >
                        {p.label}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-quegym-secondary">Modalidad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {modalityFilters.map((mod) => (
                      <DiscoveryFilterLink
                        key={mod.slug}
                        onFilterNavigate={navigateFilters}
                        href={buildHref({
                          modality: query.modality === mod.slug ? undefined : mod.slug,
                        })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          query.modality === mod.slug
                            ? "border-quegym-accent bg-quegym-accent text-white"
                            : "border-quegym-border text-quegym-secondary hover:bg-quegym-subtle"
                        }`}
                      >
                        {mod.label}
                      </DiscoveryFilterLink>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}

        <div className={`grid gap-0 ${showMap ? "lg:grid-cols-1" : "lg:grid-cols-[260px_1fr]"}`}>
          {!showMap ? (
          <aside className="border-r border-quegym-border p-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium text-quegym-primary">Filtros</span>
              <DiscoveryFilterLink
                onFilterNavigate={navigateFilters}
                href="/buscar"
                className="text-quegym-highlight hover:underline"
              >
                Limpiar todo
              </DiscoveryFilterLink>
            </div>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-quegym-primary">Zona / Municipio</p>
              <div className="space-y-1">
                {zones.slice(0, 8).map((zone) => (
                  <DiscoveryFilterLink
                    key={zone}
                    onFilterNavigate={navigateFilters}
                    href={buildHref({ zone: query.zone === zone ? undefined : zone })}
                    className={`block rounded-lg px-2 py-1 text-sm ${
                      query.zone === zone ? "bg-quegym-accent text-white" : "text-quegym-secondary hover:bg-quegym-subtle"
                    }`}
                  >
                    {zone}
                  </DiscoveryFilterLink>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-quegym-primary">Tipo de centro</p>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.filter((v) => v.value).map((type) => (
                  <DiscoveryFilterLink
                    key={type.value}
                    onFilterNavigate={navigateFilters}
                    href={buildHref({ venue_type: query.venue_type === type.value ? undefined : type.value })}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      query.venue_type === type.value
                        ? "border-quegym-accent bg-quegym-accent text-white"
                        : "border-quegym-border text-quegym-secondary"
                    }`}
                  >
                    {type.label}
                  </DiscoveryFilterLink>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-quegym-primary">Rango de precio</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "$", min: "0", max: "20" },
                  { label: "$$", min: "20", max: "40" },
                  { label: "$$$", min: "40", max: "80" },
                  { label: "$$$$", min: "80", max: undefined },
                ].map((p) => (
                  <DiscoveryFilterLink
                    key={p.label}
                    onFilterNavigate={navigateFilters}
                    href={buildHref({
                      budget_min: p.min,
                      budget_max: p.max,
                    })}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      query.budget_min === p.min ? "border-quegym-accent bg-quegym-accent text-white" : "border-quegym-border text-quegym-secondary"
                    }`}
                  >
                    {p.label}
                  </DiscoveryFilterLink>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-quegym-primary">Modalidades</p>
              <div className="space-y-1">
                {modalityFilters.map((mod) => (
                  <DiscoveryFilterLink
                    key={mod.slug}
                    onFilterNavigate={navigateFilters}
                    href={buildHref({
                      modality: query.modality === mod.slug ? undefined : mod.slug,
                    })}
                    className={`block rounded-lg px-2 py-1 text-sm ${
                      query.modality === mod.slug
                        ? "bg-quegym-accent text-white"
                        : "text-quegym-secondary hover:bg-quegym-subtle"
                    }`}
                  >
                    {mod.label}
                  </DiscoveryFilterLink>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <p className="mb-2 text-sm font-medium text-quegym-primary">Amenidades clave</p>
              <div className="space-y-1">
                {availableAmenities.map((am) => {
                  const active = amenitiesFilter.includes(am.toLowerCase());
                  return (
                    <button
                      key={am}
                      type="button"
                      onClick={() => toggleAmenity(am)}
                      className={`block w-full rounded-lg px-2 py-1 text-left text-sm ${
                        active ? "bg-quegym-accent text-white" : "text-quegym-secondary hover:bg-quegym-subtle"
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
              className="qg-btn-primary qg-motion w-full rounded-xl bg-quegym-accent px-4 py-2 text-sm font-medium text-white"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Ver {filteredItems.length} resultados
            </button>
          </aside>
          ) : null}

          <section className="p-4">
            {isPending ? (
              showMap ? (
                <div className="grid h-[calc(100vh-215px)] gap-0 xl:grid-cols-[30%_70%]">
                  <VenueListSkeleton count={5} />
                  <div className="h-full animate-pulse rounded-none bg-quegym-input motion-safe:animate-pulse" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <VenueCardSkeletonGrid count={6} />
                </div>
              )
            ) : filteredItems.length === 0 ? (
              <UIEmptyState
                title="No hay centros con estos filtros."
                description="Prueba otra zona o amplía el presupuesto."
              />
            ) : showMap ? (
              <div className="grid h-[calc(100vh-215px)] gap-0 xl:grid-cols-[30%_70%]">
                <div className="border-r border-quegym-border">
                  <div className="mb-2 flex items-center justify-between px-2 text-xs text-quegym-secondary">
                    <span>{filteredItems.length} resultados</span>
                    <span>Ordenar ▾</span>
                  </div>
                  <div className="h-[calc(100vh-270px)] space-y-2 overflow-y-auto pr-2">
                    {filteredItems.map((v) => (
                      <DiscoveryVenueCardList
                        key={v.id}
                        {...venueCardHandlers(v)}
                        selected={selectedVenue?.slug === v.slug}
                        onSelect={() => setSelectedSlug(v.slug)}
                      />
                    ))}
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
                      className="qg-surface qg-motion absolute z-[500] rounded-2xl border border-quegym-border bg-quegym-elevated p-1.5"
                      style={selectedCardStyle}
                    >
                      <MapSelectedVenueCard
                        venue={selectedVenue}
                        onToggleFavorite={() => {
                          toggleFavoriteSlug(selectedVenue.slug);
                          bumpFavorites((k) => k + 1);
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((v) => {
                  const badges = badgeMap[v.slug] ?? [];
                  return (
                    <DiscoveryVenueCardGrid
                      key={v.id}
                      {...venueCardHandlers(v)}
                      extraBadges={
                        badges.length > 0 ? (
                          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                            {badges.slice(0, 1).map((b) => (
                              <UIBadge key={b.key}>{b.label}</UIBadge>
                            ))}
                          </div>
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
        </div>
      </div>
    </div>

    <CompareActiveBar
      items={compareBarItems}
      compareHref={compareHref}
      onClear={() => {
        clearCompareSlugs();
        setCompareSlugs([]);
      }}
      onRemove={(slug) => {
        setCompareSlugs(removeCompareSlug(slug));
      }}
    />
    </>
  );
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
