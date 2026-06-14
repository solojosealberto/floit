"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeFeaturedCard, type FeaturedVenueCard } from "./home-featured-card";
import { VenueCardSkeletonGrid } from "@/components/venue-card-skeleton";

type Props = {
  initialFeatured: FeaturedVenueCard[];
};

export function HomeFeaturedSection({ initialFeatured }: Props) {
  const [items, setItems] = useState(initialFeatured);
  const [loading, setLoading] = useState(initialFeatured.length === 0);

  useEffect(() => {
    if (initialFeatured.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/search/featured", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { items?: FeaturedVenueCard[] };
        if (!cancelled) {
          setItems(
            (payload.items ?? []).slice(0, 4).map((item, index) => ({
              ...item,
              featured: index === 0,
            })),
          );
        }
      } catch {
        /* mantener vacío */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialFeatured.length]);

  return (
    <section className="mt-8 px-1 md:px-4">
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-quegym-primary md:text-xl">
            Gimnasios destacados
          </h2>
          <p className="mt-1 text-sm text-quegym-secondary">
            Perfiles completos y verificados en cada centro
          </p>
        </div>
        <Link
          href="/buscar"
          className="qg-link-hover qg-motion shrink-0 text-sm text-quegym-secondary hover:text-quegym-highlight"
        >
          Ver todos →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <VenueCardSkeletonGrid count={4} />
        ) : items.length > 0 ? (
          items.map((gym) => <HomeFeaturedCard key={gym.slug} gym={gym} />)
        ) : (
          <p className="col-span-full text-sm text-quegym-secondary">
            No hay destacados disponibles en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
