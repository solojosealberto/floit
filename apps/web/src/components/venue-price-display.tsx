import { formatVenuePrice } from "@/lib/venue-price";

type Props = {
  priceMin?: number | null;
  priceMax?: number | null;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  /** Una sola línea (primary + secondary inline). */
  inline?: boolean;
  /** Layout tarjeta vertical (DESDE + monto verde + /mes). */
  variant?: "default" | "card";
};

export function VenuePriceDisplay({
  priceMin,
  priceMax,
  className,
  primaryClassName,
  secondaryClassName,
  inline = false,
  variant = "default",
}: Props) {
  const { primary, secondary, hasPrice } = formatVenuePrice({ priceMin, priceMax });

  if (variant === "card") {
    if (!hasPrice) {
      return (
        <p className={className ?? "text-sm text-quegym-secondary"}>
          Precio a consultar
        </p>
      );
    }
    return (
      <div className={className}>
        <p className="text-[10px] font-medium uppercase tracking-wider text-quegym-secondary">
          Desde
        </p>
        <div className="mt-0.5 flex items-end justify-between gap-2">
          <p className="leading-none">
            <span
              className={
                primaryClassName ??
                "text-2xl font-bold text-quegym-highlight"
              }
            >
              {primary}
            </span>
            <span className="text-sm font-normal text-quegym-primary">/mes</span>
          </p>
          {secondary ? (
            <span
              className={
                secondaryClassName ??
                "shrink-0 text-[11px] text-quegym-secondary"
              }
            >
              {secondary}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (inline) {
    const inlinePrimary = hasPrice ? `Desde ${primary}/mes` : primary;
    return (
      <p className={className}>
        <span className={primaryClassName}>{inlinePrimary}</span>
        {secondary ? (
          <span className={secondaryClassName ?? "text-quegym-secondary"}>
            {" "}
            {secondary}
          </span>
        ) : null}
      </p>
    );
  }

  const blockPrimary = hasPrice ? `Desde ${primary}/mes` : primary;
  return (
    <div className={className}>
      <p className={primaryClassName ?? "text-xs font-medium text-quegym-primary"}>
        {blockPrimary}
      </p>
      {secondary ? (
        <p className={secondaryClassName ?? "text-[11px] text-quegym-secondary"}>
          {secondary}
        </p>
      ) : null}
    </div>
  );
}
