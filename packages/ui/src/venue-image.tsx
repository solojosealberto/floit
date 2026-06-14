"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";
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

function GymIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 10h3v8H4zM17 10h3v8h-3z" strokeLinecap="round" />
      <path d="M7 14h10M9 10V6h6v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  const tint = venueModalityTint(modality, name);
  const initials = venueInitials(name);

  if (hasPhoto) {
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
        />
      </div>
    );
  }

  const fallbackStyle = {
    "--venue-tint": tint,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-[var(--qg-bg-subtle)]",
        className,
      )}
      style={fallbackStyle}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{ background: "var(--venue-tint)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--qg-border) 1px, transparent 1px), linear-gradient(90deg, var(--qg-border) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="relative flex flex-col items-center justify-center gap-1 text-[var(--qg-text-secondary)]">
        <GymIcon className="h-7 w-7 opacity-50" />
        <span className="text-lg font-bold tracking-wider text-[var(--qg-text-primary)]">
          {initials}
        </span>
      </div>
    </div>
  );
}

export { venueInitials, venueModalityTint } from "./venue-image-utils";
