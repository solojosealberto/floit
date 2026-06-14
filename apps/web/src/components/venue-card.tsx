"use client";

import { VenueImage } from "@floit/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { VenuePriceDisplay } from "@/components/venue-price-display";
import { formatVenueMetaLine } from "@/lib/venue-labels";
import { VenueProfileBadge } from "@/lib/venue-profile-badge";
import { getVenuePhotoUrl } from "@/lib/venue-photo";

export type VenueCardVenue = {
  slug: string;
  name: string;
  zone: string;
  venueType?: string | null;
  photoUrls?: string[] | null;
  modalities?: string[] | null;
  priceMin?: number | null;
  priceMax?: number | null;
  distanceM?: number | null;
  verificationStatus?: string | null;
  completenessScore?: number | null;
};

type VenueCardProps = {
  venue: VenueCardVenue;
  /** Acciones derecha (comparar, favoritos). */
  actions?: ReactNode;
  onSelect?: () => void;
  selected?: boolean;
  imageClassName?: string;
  className?: string;
};

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Tarjeta horizontal unificada para listados discovery (mapa, móvil). */
export function VenueCard({
  venue,
  actions,
  onSelect,
  selected,
  imageClassName = "h-20 w-24 shrink-0",
  className,
}: VenueCardProps) {
  const photoUrl = getVenuePhotoUrl(venue);
  const modality = venue.modalities?.[0] ?? venue.venueType ?? null;

  return (
    <article
      className={
        className ??
        `qg-surface-subtle qg-motion rounded-2xl border bg-quegym-elevated p-3 ${
          selected
            ? "border-quegym-accent shadow-[var(--qg-shadow-md)]"
            : "border-quegym-border"
        }`
      }
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex gap-3">
        <Link
          href={`/gyms/${venue.slug}`}
          className={`overflow-hidden rounded-xl ${imageClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <VenueImage
            src={photoUrl}
            name={venue.name}
            modality={modality}
            className={`h-full w-full ${imageClassName.includes("rounded") ? "" : "rounded-xl"}`}
          />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/gyms/${venue.slug}`}
              className="line-clamp-2 text-sm font-semibold leading-tight text-quegym-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {venue.name}
            </Link>
            {actions ? (
              <div
                className="flex shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {actions}
              </div>
            ) : null}
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-quegym-secondary">
            {formatVenueMetaLine(venue.zone, venue.venueType)}
            {venue.distanceM != null ? ` · ${formatKm(venue.distanceM)}` : ""}
          </p>
          <VenuePriceDisplay
            priceMin={venue.priceMin}
            priceMax={venue.priceMax}
            inline
            className="text-xs"
            primaryClassName="font-medium text-quegym-highlight"
            secondaryClassName="text-quegym-secondary"
          />
          <div className="flex flex-wrap items-center gap-1">
            <VenueProfileBadge
              completenessScore={venue.completenessScore}
              verificationStatus={venue.verificationStatus}
            />
            {(venue.modalities ?? []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-quegym-border bg-quegym-subtle px-2 py-0.5 text-[10px] text-quegym-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
