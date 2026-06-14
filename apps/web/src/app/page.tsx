import Link from "next/link";
import {
  Dumbbell,
  Flame,
  MapPin,
  Search,
  MapPinned,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  BRAND_HERO_LEAD,
  BRAND_PARTNER_BANNER_LEAD,
  BRAND_PARTNER_BANNER_TITLE,
  BRAND_PARTNER_CTA,
  BRAND_SEARCH_PLACEHOLDER,
} from "@/lib/brand";
import { HomeFeaturedSection } from "./home-featured-section";
import { HomeHowItWorks } from "./home-how-it-works";
import { HomeLocationButton } from "./home-location-button";
import { HomeSearchActions, HomeZoneChips } from "./home-search-actions";
import type { FeaturedVenueCard } from "./home-featured-card";

type Category = {
  label: string;
  Icon: LucideIcon;
  query: string;
};

const CATEGORIES: Category[] = [
  { label: "Gym clásico", Icon: Dumbbell, query: "venue_type=gym" },
  { label: "CrossFit", Icon: Zap, query: "modality=crossfit" },
  { label: "Yoga & Pilates", Icon: Flame, query: "venue_type=yoga" },
  { label: "Funcional", Icon: Flame, query: "venue_type=functional" },
  { label: "Boxing", Icon: Dumbbell, query: "modality=boxing" },
  { label: "Spinning", Icon: Zap, query: "venue_type=cycling" },
  { label: "Pilates", Icon: Flame, query: "venue_type=pilates" },
  { label: "Natación", Icon: Waves, query: "modality=natacion" },
];

const QUICK_ZONES = ["Las Mercedes", "Altamira", "Chacao", "El Rosal"];

async function fetchSearchMeta(
  searchBase: string,
  query: string,
): Promise<number> {
  try {
    const res = await fetch(`${searchBase}/v1/search?${query}&limit=1`, {
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const payload = (await res.json()) as {
      meta?: { total?: number };
      items?: unknown[];
    };
    return payload.meta?.total ?? payload.items?.length ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const searchBase = process.env.SEARCH_SERVICE_URL ?? "http://localhost:4011";
  let zones: string[] = QUICK_ZONES;
  let featured: FeaturedVenueCard[] = [];
  let totalVenues = 0;

  try {
    const [zonesRes, featuredRes] = await Promise.all([
      fetch(`${searchBase}/v1/meta/zones`, { cache: "no-store" }),
      fetch(`${searchBase}/v1/search?sort=popularity`, { cache: "no-store" }),
    ]);
    if (zonesRes.ok) {
      const payload = (await zonesRes.json()) as { zones?: string[] };
      if (payload.zones && payload.zones.length > 0) zones = payload.zones;
    }
    if (featuredRes.ok) {
      const payload = (await featuredRes.json()) as {
        items?: FeaturedVenueCard[];
        meta?: { total?: number };
      };
      featured = (payload.items ?? []).slice(0, 4).map((item, index) => ({
        ...item,
        featured: index === 0,
      })) as FeaturedVenueCard[];
      totalVenues = payload.meta?.total ?? featured.length;
    }
  } catch {
    /* fallback estático */
  }

  const categoryCounts = await Promise.all(
    CATEGORIES.map(async (cat) => ({
      ...cat,
      count: await fetchSearchMeta(searchBase, cat.query),
    })),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-3 py-3 pb-8">
      <section className="rounded-2xl bg-quegym-hero px-4 py-10 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="qg-surface-subtle qg-motion mb-4 inline-flex items-center gap-1.5 rounded-full border border-quegym-border bg-quegym-elevated px-3 py-1 text-xs text-quegym-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-quegym-highlight" aria-hidden />
            Caracas · Distrito Capital · Venezuela
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-quegym-primary md:text-5xl">
            Encuentra tu próximo{" "}
            <span className="text-quegym-highlight">gym</span> en Caracas
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-quegym-secondary">
            {BRAND_HERO_LEAD}
          </p>

          <form
            action="/buscar"
            method="get"
            className="qg-surface-subtle qg-motion mx-auto mt-8 max-w-4xl rounded-2xl border border-quegym-border bg-quegym-elevated p-3"
          >
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="qg-field flex flex-1 items-center gap-2 rounded-xl border border-quegym-border bg-quegym-input px-4 py-3 text-sm">
                <Search className="h-4 w-4 shrink-0 text-quegym-secondary" aria-hidden />
                <input
                  name="q"
                  placeholder={BRAND_SEARCH_PLACEHOLDER}
                  className="w-full bg-transparent text-sm text-quegym-primary placeholder:text-quegym-secondary focus:outline-none"
                />
              </div>
              <div className="qg-field flex items-center gap-2 rounded-xl border border-quegym-border bg-quegym-input px-4 py-3 text-sm md:min-w-56">
                <MapPinned className="h-4 w-4 shrink-0 text-quegym-secondary" aria-hidden />
                <select
                  name="zone"
                  defaultValue=""
                  className="w-full bg-transparent text-sm text-quegym-primary focus:outline-none"
                >
                  <option value="">Zona o municipio</option>
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="qg-btn-primary qg-motion rounded-xl bg-quegym-accent px-7 py-3 text-sm font-medium text-white hover:bg-quegym-accent-hover"
              >
                Buscar
              </button>
            </div>
            <div className="mt-2 hidden flex-wrap items-center gap-3 px-1 text-xs text-quegym-secondary md:flex">
              <HomeLocationButton />
              <span className="text-quegym-border">|</span>
              <span>Accesos rápidos:</span>
              {QUICK_ZONES.map((zone) => (
                <Link
                  key={zone}
                  href={`/buscar?zone=${encodeURIComponent(zone)}`}
                  className="qg-link-hover qg-motion hover:text-quegym-highlight"
                >
                  {zone}
                </Link>
              ))}
            </div>
            <div className="md:hidden">
              <HomeSearchActions />
            </div>
          </form>
        </div>
      </section>

      <HomeZoneChips zones={zones.length ? zones : QUICK_ZONES} />

      <section className="mt-6 px-1 md:px-4">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-quegym-secondary">
          Explora por tipo de centro
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-4">
          {categoryCounts.map((item) => (
            <Link
              key={item.label}
              href={`/buscar?${item.query}`}
              className="qg-chip qg-surface-subtle qg-motion flex items-center gap-2 rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-xs text-quegym-primary"
            >
              <item.Icon className="h-4 w-4 shrink-0 text-quegym-highlight" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.count > 0 ? (
                <span className="shrink-0 text-quegym-secondary">({item.count})</span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <HomeFeaturedSection initialFeatured={featured} />

      <HomeHowItWorks />

      {totalVenues > 0 ? (
        <section className="mt-8 px-1 md:px-4">
          <div className="qg-surface-subtle flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-quegym-border bg-quegym-elevated px-4 py-4 text-center text-sm text-quegym-secondary">
            <span>
              <strong className="text-quegym-primary">{totalVenues}</strong> centros
            </span>
            <span className="hidden text-quegym-border sm:inline">·</span>
            <span>
              <strong className="text-quegym-primary">{zones.length}</strong> zonas
            </span>
            <span className="hidden text-quegym-border sm:inline">·</span>
            <span>Contacto directo por WhatsApp</span>
          </div>
        </section>
      ) : null}

      <section className="mt-8 px-1 md:px-4">
        <div className="qg-surface qg-motion flex flex-col items-start justify-between gap-4 rounded-2xl border border-quegym-border bg-quegym-banner px-5 py-5 md:flex-row md:items-center">
          <div>
            <p className="font-display text-base font-semibold text-quegym-primary">
              {BRAND_PARTNER_BANNER_TITLE}
            </p>
            <p className="mt-1 text-sm text-quegym-secondary">{BRAND_PARTNER_BANNER_LEAD}</p>
          </div>
          <Link
            href="/partner/claim"
            className="qg-btn-primary qg-motion inline-flex w-full items-center justify-center rounded-xl bg-quegym-accent px-5 py-3 text-sm font-medium text-white hover:bg-quegym-accent-hover md:w-auto"
          >
            {BRAND_PARTNER_CTA} →
          </Link>
        </div>
      </section>
    </main>
  );
}
