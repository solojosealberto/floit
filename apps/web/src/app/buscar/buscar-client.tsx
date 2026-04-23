"use client";

import type { DiscoveryResponse } from "@floit/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readFavoriteSlugs,
  toggleFavoriteSlug,
} from "@/lib/floit-favorites";
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
  { value: "relevance", label: "Relevancia (Floit)" },
  { value: "popularity", label: "Popularidad interna" },
  { value: "distance", label: "Distancia (requiere ubicación)" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "name", label: "Nombre (A–Z)" },
];

type Props = {
  data: DiscoveryResponse;
  zones: string[];
  /** query string actual para hidratar el formulario */
  query: Record<string, string | undefined>;
};

export function BuscarClient({ data, zones, query }: Props) {
  const router = useRouter();
  const [geoPending, setGeoPending] = useState(false);
  const [, bumpFavorites] = useState(0);

  const badgeMap = useMemo(
    () => computeVenueBadges(data.items),
    [data.items],
  );

  useEffect(() => {
    trackEvent("discovery_view", {
      sort: data.meta.sort,
      total: data.meta.total,
      zone: query.zone,
      exp: query.exp,
    });
  }, [data.meta.sort, data.meta.total, query.zone, query.exp]);

  const mapCenter: [number, number] = useMemo(() => {
    const lat = query.lat ? Number(query.lat) : NaN;
    const lng = query.lng ? Number(query.lng) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    if (data.items.length > 0) {
      const sum = data.items.reduce(
        (acc, v) => ({ lat: acc.lat + v.lat, lng: acc.lng + v.lng }),
        { lat: 0, lng: 0 },
      );
      return [sum.lat / data.items.length, sum.lng / data.items.length];
    }
    return DEFAULT_CENTER;
  }, [data.items, query.lat, query.lng]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setGeoPending(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
          if (v && k !== "lat" && k !== "lng" && k !== "sort") p.set(k, v);
        });
        p.set("lat", String(pos.coords.latitude));
        p.set("lng", String(pos.coords.longitude));
        p.set("sort", "distance");
        setGeoPending(false);
        router.push(`/buscar?${p.toString()}`);
      },
      () => setGeoPending(false),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Buscar centros
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Lista y mapa comparten los mismos filtros (URL). Si el mapa falla,
          puedes seguir con la lista.
        </p>
      </header>

      <form
        className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 md:grid-cols-2 lg:grid-cols-3"
        action="/buscar"
        method="get"
        onSubmit={(e) => {
          const fd = new FormData(e.currentTarget);
          trackEvent("filter_apply", {
            zone: String(fd.get("zone") ?? "").trim() || undefined,
            venueType: String(fd.get("venue_type") ?? "").trim() || undefined,
            modality: String(fd.get("modality") ?? "").trim() || undefined,
            sort: String(fd.get("sort") ?? "").trim() || undefined,
            hasBudget:
              Boolean(String(fd.get("budget_min") ?? "").trim()) ||
              Boolean(String(fd.get("budget_max") ?? "").trim()),
            hasLocation:
              Boolean(String(query.lat ?? "").trim()) &&
              Boolean(String(query.lng ?? "").trim()),
          });
        }}
      >
        {query.exp ? (
          <input type="hidden" name="exp" value={query.exp} />
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Zona
          </span>
          <select
            name="zone"
            defaultValue={query.zone ?? ""}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Tipo de centro
          </span>
          <select
            name="venue_type"
            defaultValue={query.venue_type ?? ""}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {VENUE_TYPES.map((t) => (
              <option key={t.value || "all"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Modalidad
          </span>
          <input
            name="modality"
            defaultValue={query.modality ?? ""}
            placeholder="ej. yoga"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Buscar texto
          </span>
          <input
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="nombre, zona, dirección"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Presupuesto mensual (mín)
          </span>
          <input
            name="budget_min"
            type="number"
            min={0}
            defaultValue={query.budget_min ?? ""}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Presupuesto mensual (máx)
          </span>
          <input
            name="budget_max"
            type="number"
            min={0}
            defaultValue={query.budget_max ?? ""}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-2 lg:col-span-1">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Ordenar por
          </span>
          <select
            name="sort"
            defaultValue={query.sort ?? "relevance"}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Radio (km, con ubicación)
          </span>
          <input
            name="radius_km"
            type="number"
            min={1}
            max={40}
            step={1}
            defaultValue={query.radius_km ?? "12"}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <div className="flex flex-wrap items-end gap-2 md:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {geoPending ? "Ubicando…" : "Usar mi ubicación"}
          </button>
          <Link
            className="rounded-lg px-2 py-2 text-sm text-neutral-600 underline dark:text-neutral-400"
            href="/buscar"
          >
            Limpiar
          </Link>
          <Link
            className="rounded-lg px-2 py-2 text-sm text-neutral-600 underline dark:text-neutral-400"
            href="/favoritos"
          >
            Favoritos
          </Link>
        </div>
      </form>

      <p className="text-xs text-neutral-500">
        {data.meta.total} resultado{data.meta.total === 1 ? "" : "s"}
        {query.lat && query.lng
          ? ` · orden: ${data.meta.sort ?? "—"} · radio ~${query.radius_km ?? data.meta.radius_km ?? 12} km`
          : ""}
      </p>

      <section className="grid gap-8 lg:grid-cols-2">
        <ul className="flex flex-col gap-3">
          {data.items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
              No hay centros con estos filtros. Prueba otra zona o amplía el
              presupuesto.
            </li>
          ) : (
            data.items.map((v) => {
              const favOn = readFavoriteSlugs().includes(v.slug);
              const badges = badgeMap[v.slug] ?? [];
              return (
                <li key={v.id} className="flex gap-2">
                  <Link
                    href={`/gyms/${v.slug}`}
                    className="block min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{v.name}</span>
                        {badges.map((b) => (
                          <span
                            key={b.key}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                      {v.activePromotionTitle ? (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Promo: {v.activePromotionTitle}
                        </span>
                      ) : null}
                      <span className="text-xs text-neutral-500">
                        {v.zone} · {v.venueType}
                        {v.distanceM != null
                          ? ` · ${formatKm(v.distanceM)}`
                          : ""}
                      </span>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatPrice(v)}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    title={
                      favOn ? "Quitar de favoritos" : "Guardar en favoritos"
                    }
                    aria-pressed={favOn}
                    className={`mt-3 shrink-0 self-start rounded-lg border px-3 py-2 text-sm ${
                      favOn
                        ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-950 dark:text-rose-200"
                        : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                    }`}
                    onClick={() => {
                      toggleFavoriteSlug(v.slug);
                      bumpFavorites((k) => k + 1);
                      trackEvent("favorite_toggle", { slug: v.slug });
                    }}
                  >
                    {favOn ? "♥" : "♡"}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <MapErrorBoundary>
          <DiscoveryMap venues={data.items} center={mapCenter} />
        </MapErrorBoundary>
      </section>

      <footer>
        <Link href="/" className="text-sm underline">
          ← Inicio
        </Link>
      </footer>
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
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          El mapa no está disponible en este dispositivo o red. Usa la lista a
          la izquierda.
        </div>
      );
    }
    return this.props.children;
  }
}
