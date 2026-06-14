const VENUE_TYPE_LABELS: Record<string, string> = {
  gym: "Gym clásico",
  functional: "Funcional",
  yoga: "Yoga",
  pilates: "Pilates",
  cycling: "Cycling",
  mixed: "Mixto",
  personal_training: "Personal training",
  crossfit: "CrossFit",
};

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
