/** Iniciales visibles (1–2 letras) a partir del nombre del centro. */
export function venueInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    const w = words[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

const MODALITY_TINTS: Record<string, string> = {
  musculacion: "var(--qg-accent)",
  cardio: "var(--qg-highlight)",
  funcional: "#6366f1",
  crossfit: "#f97316",
  yoga: "#a855f7",
  pilates: "#ec4899",
  cycling: "#0ea5e9",
  natacion: "#06b6d4",
};

/** Tinte de fondo según modalidad principal (fallback hash del nombre). */
export function venueModalityTint(
  modality: string | null | undefined,
  name: string,
): string {
  const key = (modality ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (key && MODALITY_TINTS[key]) return MODALITY_TINTS[key]!;

  const normalized = key.replace(/[^a-z0-9_]/g, "");
  for (const [slug, color] of Object.entries(MODALITY_TINTS)) {
    if (normalized.includes(slug)) return color;
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue} 45% 42%)`;
}
