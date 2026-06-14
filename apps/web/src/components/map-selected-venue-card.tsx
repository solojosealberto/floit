"use client";

import { VenueImage } from "@floit/ui";
import { Heart } from "lucide-react";
import Link from "next/link";
import { VenuePriceDisplay } from "@/components/venue-price-display";
import { formatVenueMetaLine } from "@/lib/venue-labels";
import { getVenuePhotoUrl } from "@/lib/venue-photo";

type Venue = {
  slug: string;
  name: string;
  zone: string;
  venueType?: string;
  modalities?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  distanceM?: number | null;
};

type Props = {
  venue: Venue;
  onToggleFavorite?: () => void;
  compact?: boolean;
};

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Popup de venue seleccionado en mapa discovery. */
export function MapSelectedVenueCard({ venue, onToggleFavorite, compact }: Props) {
  const modality = venue.modalities?.[0] ?? venue.venueType ?? null;

  return (
    <>
      <div
        className={`overflow-hidden rounded-xl bg-quegym-subtle ${
          compact ? "h-14 w-full" : "h-20 w-full"
        }`}
      >
        <VenueImage
          src={getVenuePhotoUrl(venue)}
          name={venue.name}
          modality={modality}
          className="h-full w-full"
        />
      </div>
      <div className="px-1.5 pb-1 pt-2">
        <p
          className={`truncate font-semibold text-quegym-primary ${
            compact ? "text-[12px]" : "text-[13px]"
          }`}
        >
          {venue.name}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-quegym-secondary">
          {formatVenueMetaLine(venue.zone, venue.venueType)}
          {venue.distanceM != null ? ` · ${formatKm(venue.distanceM)}` : ""}
        </p>
        <VenuePriceDisplay
          priceMin={venue.priceMin}
          priceMax={venue.priceMax}
          inline
          className="mt-1 text-[11px]"
          primaryClassName="font-medium text-quegym-highlight"
          secondaryClassName="text-quegym-secondary"
        />
        <div className="mt-2 flex items-center justify-between">
          <Link
            href={`/gyms/${venue.slug}`}
            className="qg-btn-primary qg-motion rounded-lg bg-quegym-accent px-3 py-1.5 text-[11px] font-semibold text-white"
          >
            Ver ficha
          </Link>
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={onToggleFavorite}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-quegym-highlight/30 bg-quegym-highlight-soft text-quegym-highlight"
              aria-label="Guardar en favoritos"
            >
              <Heart className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
