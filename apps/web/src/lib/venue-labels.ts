/** Shared venue-type options for claim + admin/partner profile. */
export const VENUE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "gym", label: "Gimnasio clásico" },
  { value: "functional", label: "Functional / CrossFit" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "cycling", label: "Cycling" },
  { value: "mixed", label: "Mixto" },
  { value: "personal_training", label: "Personal training" },
];

const VENUE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  VENUE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/** Etiqueta legible para `venueType` (UI tarjetas). */
export function formatVenueTypeLabel(venueType?: string | null): string {
  if (!venueType?.trim()) return "Centro fitness";
  const key = venueType.trim().toLowerCase();
  return VENUE_TYPE_LABELS[key] ?? venueType.replace(/_/g, " ");
}

/** Línea meta zona · tipo en mayúsculas (referencia v0). */
export function formatVenueMetaLine(
  zone: string,
  venueType?: string | null,
): string {
  const type = formatVenueTypeLabel(venueType).toUpperCase();
  return `${zone.toUpperCase()} · ${type}`;
}

/** Catalog stores a single venueType; multi-select collapses to one slug. */
export function derivePrimaryVenueType(types: string[]): string | null {
  const cleaned = Array.from(
    new Set(types.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  );
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.includes("mixed")) return "mixed";
  return "mixed";
}
