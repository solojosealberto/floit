/** Primera URL de foto válida en un venue con `photoUrls`. */
export function getVenuePhotoUrl(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const maybe = v as { photoUrls?: unknown };
  if (!Array.isArray(maybe.photoUrls) || maybe.photoUrls.length === 0) return null;
  const first = maybe.photoUrls[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}
