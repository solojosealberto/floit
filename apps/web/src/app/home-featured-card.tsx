"use client";

import { VenueCardGrid, type VenueCardGridVenue } from "@/components/venue-card-grid";
import { isFavoriteSlug, toggleFavoriteSlug } from "@/lib/floit-favorites";
import { useMemo, useState } from "react";

export type FeaturedVenueCard = VenueCardGridVenue & {
  distanceM?: number;
};

type Props = {
  gym: FeaturedVenueCard;
};

export function HomeFeaturedCard({ gym }: Props) {
  const [tick, setTick] = useState(0);
  const isFav = useMemo(() => isFavoriteSlug(gym.slug), [gym.slug, tick]);

  return (
    <VenueCardGrid
      venue={gym}
      isFavorite={isFav}
      onToggleFavorite={() => {
        toggleFavoriteSlug(gym.slug);
        setTick((v) => v + 1);
      }}
    />
  );
}
