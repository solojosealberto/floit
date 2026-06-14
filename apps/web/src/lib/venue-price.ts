export type VenuePriceInput = {
  priceMin?: number | null;
  priceMax?: number | null;
};

export type VenuePriceFormatted = {
  primary: string;
  secondary: string | null;
  hasPrice: boolean;
};

/** Jerarquía “Desde $X/mes” + rango secundario o “Precio a consultar”. */
export function formatVenuePrice(v: VenuePriceInput): VenuePriceFormatted {
  const { priceMin, priceMax } = v;

  if (priceMin == null && priceMax == null) {
    return {
      primary: "Precio a consultar",
      secondary: null,
      hasPrice: false,
    };
  }

  if (priceMin != null && priceMax != null && priceMin !== priceMax) {
    return {
      primary: `$${priceMin}`,
      secondary: `hasta $${priceMax} · ref.`,
      hasPrice: true,
    };
  }

  const ref = priceMin ?? priceMax!;
  return {
    primary: `$${ref}`,
    secondary: "ref.",
    hasPrice: true,
  };
}

/** Nivel $–$$$$ para chips secundarios (compat legacy). */
export function formatVenuePriceTier(v: VenuePriceInput): string {
  const value = v.priceMax ?? v.priceMin ?? 0;
  if (value <= 20) return "$";
  if (value <= 40) return "$$";
  if (value <= 80) return "$$$";
  return "$$$$";
}
