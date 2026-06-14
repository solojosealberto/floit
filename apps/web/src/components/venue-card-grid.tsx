"use client";

import { VenueImage } from "@floit/ui";
import { ArrowLeftRight, Check, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { VenuePriceDisplay } from "@/components/venue-price-display";
import { formatVenueMetaLine } from "@/lib/venue-labels";
import { getVenuePhotoUrl } from "@/lib/venue-photo";

export type VenueCardGridVenue = {
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
  featured?: boolean;
  contactWhatsapp?: string | null;
};

type VenueCardGridProps = {
  venue: VenueCardGridVenue;
  isFavorite?: boolean;
  isCompare?: boolean;
  onToggleFavorite?: () => void;
  onToggleCompare?: () => void;
  /** Contenido extra sobre la imagen (badges discovery). */
  imageOverlay?: ReactNode;
  className?: string;
  onSelect?: () => void;
  selected?: boolean;
};

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function isVerified(status?: string | null): boolean {
  return (
    status === "floit_verified" || status === "partner_verified"
  );
}

function buildWhatsappHref(venue: VenueCardGridVenue): string | null {
  const digits = venue.contactWhatsapp?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hola, vi ${venue.name} en QueGym y quiero información.`,
  )}`;
}

/** Tarjeta vertical unificada (home destacados + grid buscar). */
export function VenueCardGrid({
  venue,
  isFavorite = false,
  isCompare = false,
  onToggleFavorite,
  onToggleCompare,
  imageOverlay,
  className,
  onSelect,
  selected,
}: VenueCardGridProps) {
  const photoUrl = getVenuePhotoUrl(venue);
  const modality = venue.modalities?.[0] ?? venue.venueType ?? null;
  const verified = isVerified(venue.verificationStatus);
  const whatsappHref = buildWhatsappHref(venue);
  const tags = (venue.modalities ?? []).slice(0, 3);

  return (
    <article
      className={
        className ??
        `qg-surface qg-motion flex flex-col overflow-hidden rounded-2xl border bg-quegym-elevated ${
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
      <div className="relative">
        <Link
          href={`/gyms/${venue.slug}`}
          className="block"
          onClick={(e) => e.stopPropagation()}
        >
          <VenueImage
            src={photoUrl}
            name={venue.name}
            modality={modality}
            className="aspect-[3/1] w-full md:aspect-[16/9]"
          />
        </Link>
        {venue.featured ? (
          <span className="absolute left-2 top-2 rounded-md bg-quegym-highlight px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            Destacado
          </span>
        ) : null}
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`qg-motion absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm ${
              isFavorite
                ? "border-quegym-highlight bg-quegym-highlight text-white"
                : "border-quegym-border/60 bg-black/40 text-white hover:bg-black/55"
            }`}
            aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Heart
              className="h-4 w-4"
              aria-hidden
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        ) : null}
        {imageOverlay}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <div className="flex items-start gap-1.5">
            <Link
              href={`/gyms/${venue.slug}`}
              className="min-w-0 flex-1 truncate font-semibold text-quegym-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {venue.name}
            </Link>
            {verified ? (
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-quegym-highlight text-black"
                title="Verificado QueGym"
                aria-label="Verificado"
              >
                <Check className="h-2.5 w-2.5" aria-hidden strokeWidth={3} />
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-quegym-secondary">
            {formatVenueMetaLine(venue.zone, venue.venueType)}
            {venue.distanceM != null ? ` · ${formatKm(venue.distanceM)}` : ""}
          </p>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-quegym-border bg-quegym-subtle px-2 py-0.5 text-[10px] text-quegym-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <VenuePriceDisplay
          priceMin={venue.priceMin}
          priceMax={venue.priceMax}
          variant="card"
          className="mt-auto"
        />

        <div className="grid grid-cols-2 gap-2 pt-1">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="qg-btn-primary qg-motion inline-flex items-center justify-center gap-1.5 rounded-xl bg-quegym-highlight px-3 py-2 text-xs font-semibold text-black hover:bg-quegym-highlight-hover"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          ) : (
            <Link
              href={`/gyms/${venue.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="qg-btn-primary qg-motion inline-flex items-center justify-center gap-1.5 rounded-xl bg-quegym-highlight px-3 py-2 text-xs font-semibold text-black hover:bg-quegym-highlight-hover"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Ver centro
            </Link>
          )}
          {onToggleCompare ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`qg-motion inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium ${
                isCompare
                  ? "border-quegym-highlight bg-quegym-highlight-soft text-quegym-highlight"
                  : "border-quegym-border bg-quegym-subtle text-quegym-primary hover:bg-quegym-input"
              }`}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
              {isCompare ? "Comparando" : "Comparar"}
            </button>
          ) : (
            <Link
              href={`/gyms/${venue.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-xs font-medium text-quegym-primary hover:bg-quegym-input"
            >
              Ver ficha
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
