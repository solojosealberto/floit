"use client";

import { useEffect, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { cn } from "./cn";
import { venueInitials, venueModalityTint } from "./venue-image-utils";

export type VenueImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  src?: string | null;
  name: string;
  modality?: string | null;
  /** Clases del contenedor (define tamaño vía h/w en className). */
  className?: string;
  imageClassName?: string;
  /** Si hay foto, alt descriptivo; fallback siempre decorativo. */
  decorative?: boolean;
};

function VenueImagePlaceholder({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = venueInitials(name);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden border border-[var(--qg-border)]/40 bg-[var(--qg-bg-subtle)]",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 50%, var(--qg-highlight-soft), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--qg-bg-elevated) 30%, transparent), transparent 55%)",
        }}
      />
      <span className="relative select-none text-base font-bold tracking-[0.14em] text-[var(--qg-highlight)] md:text-lg">
        {initials}
      </span>
    </div>
  );
}

export function VenueImage({
  src,
  name,
  modality,
  className,
  imageClassName,
  decorative = false,
  loading = "lazy",
  ...imgProps
}: VenueImageProps) {
  const hasPhoto = typeof src === "string" && src.length > 0;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  if (!hasPhoto || loadFailed) {
    return (
      <VenueImagePlaceholder name={name} className={className} />
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--qg-bg-subtle)]",
        className,
      )}
    >
      <img
        {...imgProps}
        src={src}
        alt={decorative ? "" : name}
        loading={loading}
        className={cn("h-full w-full object-cover object-center", imageClassName)}
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
}

export { venueInitials, venueModalityTint } from "./venue-image-utils";
