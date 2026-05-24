import type { VenueSummary } from "@floit/contracts";

/** Badges locales por página de resultados — reglas transparentes (US-2.3). */
export type VenueBadge = { key: string; label: string };

export function computeVenueBadges(
  items: readonly VenueSummary[],
): Record<string, VenueBadge[]> {
  const out: Record<string, VenueBadge[]> = {};
  if (items.length === 0) return out;

  let closestSlug: string | undefined;
  let best = Infinity;
  for (const v of items) {
    if (v.distanceM != null && v.distanceM < best) {
      best = v.distanceM;
      closestSlug = v.slug;
    }
  }
  if (closestSlug) {
    out[closestSlug] = [...(out[closestSlug] ?? [])];
    out[closestSlug]!.push({ key: "closest", label: "Más cercano" });
  }

  const priced = items.filter(
    (v): v is VenueSummary & { priceMin: number } => v.priceMin != null,
  );
  if (priced.length) {
    const minP = Math.min(...priced.map((v) => v.priceMin));
    for (const v of priced) {
      if (v.priceMin === minP) {
        out[v.slug] = [...(out[v.slug] ?? [])];
        out[v.slug]!.push({ key: "price", label: "Mejor precio ref." });
      }
    }
  }

  const sorted = [...items].sort(
    (a, b) =>
      (b.completenessScore ?? 0) - (a.completenessScore ?? 0),
  );
  const top = sorted[0];
  if (top && (top.completenessScore ?? 0) >= 0.75) {
    out[top.slug] = [...(out[top.slug] ?? [])];
    out[top.slug]!.push({ key: "complete", label: "Perfil más completo" });
  }

  return out;
}
