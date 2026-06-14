"use client";

import type { VenueSummary } from "@floit/contracts";
import { ArrowLeftRight, Check, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { VenueCard } from "@/components/venue-card";
import { VenueCardGrid } from "@/components/venue-card-grid";

type DiscoveryVenue = VenueSummary & {
  photoUrls?: string[] | null;
  contactWhatsapp?: string | null;
  featured?: boolean;
};

type CommonProps = {
  venue: DiscoveryVenue;
  isFavorite: boolean;
  isCompare: boolean;
  onToggleFavorite: () => void;
  onToggleCompare: () => void;
  selected?: boolean;
  onSelect?: () => void;
  extraBadges?: ReactNode;
};

function CompareButton({
  active,
  onClick,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      title={active ? "Quitar del comparador" : "Agregar al comparador"}
      onClick={onClick}
      aria-label={active ? "Quitar del comparador" : "Agregar al comparador"}
      className={
        compact
          ? `inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
              active
                ? "border-quegym-accent bg-quegym-highlight-soft text-quegym-highlight"
                : "border-quegym-border text-quegym-secondary"
            }`
          : `rounded-full border px-2 py-1 text-[10px] ${
              active
                ? "border-quegym-accent bg-quegym-highlight-soft text-quegym-highlight"
                : "border-quegym-border text-quegym-secondary"
            }`
      }
    >
      {compact ? (
        active ? (
          <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
        ) : (
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
        )
      ) : active ? (
        "Comparando"
      ) : (
        "Comparar"
      )}
    </button>
  );
}

function FavoriteButton({
  active,
  onClick,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      title={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={onClick}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={
        compact
          ? `inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
              active
                ? "border-quegym-accent bg-quegym-accent text-white"
                : "border-quegym-border text-quegym-secondary"
            }`
          : `rounded-full border px-2 py-1 text-xs ${
              active
                ? "border-quegym-highlight bg-quegym-highlight-soft text-quegym-highlight"
                : "border-quegym-border text-quegym-secondary"
            }`
      }
    >
      {compact ? (
        <Heart
          className={`h-3.5 w-3.5 ${active ? "fill-current" : ""}`}
          aria-hidden
        />
      ) : active ? (
        "Guardado"
      ) : (
        "Guardar"
      )}
    </button>
  );
}

export function DiscoveryVenueCardList(props: CommonProps) {
  const { venue, isFavorite, isCompare, onToggleFavorite, onToggleCompare, selected, onSelect } =
    props;

  return (
    <VenueCard
      venue={venue}
      selected={selected}
      onSelect={onSelect}
      actions={
        <>
          <CompareButton active={isCompare} onClick={onToggleCompare} compact />
          <FavoriteButton active={isFavorite} onClick={onToggleFavorite} compact />
        </>
      }
    />
  );
}

export function DiscoveryVenueCardGrid(props: CommonProps) {
  const {
    venue,
    isFavorite,
    isCompare,
    onToggleFavorite,
    onToggleCompare,
    selected,
    onSelect,
    extraBadges,
  } = props;

  return (
    <VenueCardGrid
      venue={venue}
      isFavorite={isFavorite}
      isCompare={isCompare}
      onToggleFavorite={onToggleFavorite}
      onToggleCompare={onToggleCompare}
      selected={selected}
      onSelect={onSelect}
      imageOverlay={extraBadges}
    />
  );
}

export function DiscoveryVenueCardMobile(props: CommonProps) {
  const { venue, isFavorite, isCompare, onToggleFavorite, onToggleCompare } = props;

  return (
    <VenueCard
      venue={venue}
      actions={
        <>
          <CompareButton active={isCompare} onClick={onToggleCompare} />
          <FavoriteButton active={isFavorite} onClick={onToggleFavorite} compact />
        </>
      }
    />
  );
}
