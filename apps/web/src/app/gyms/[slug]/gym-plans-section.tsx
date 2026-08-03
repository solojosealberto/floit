import Link from "next/link";
import { FeatureCheck } from "@/components/feature-check";
import { Star } from "lucide-react";

export type PublicVenuePlan = {
  name: string;
  description?: string | null;
  period?: string | null;
  priceLabel?: string | null;
  active?: boolean;
};

function periodSuffix(period: string | null | undefined): string {
  const p = (period ?? "").toLowerCase();
  if (!p) return "";
  if (p.includes("anual") || p.includes("año")) return "/año";
  if (p.includes("3") || p.includes("trim")) return "/3m";
  if (p.includes("una") || p.includes("clase") || p.includes("sesión")) return "";
  if (p.includes("mens")) return "/mes";
  return "";
}

function displayPrice(priceLabel: string | null | undefined): string {
  const raw = priceLabel?.trim();
  if (!raw) return "Consultar";
  if (/consultar/i.test(raw)) return "Consultar";
  if (raw.startsWith("$")) return raw;
  const digits = raw.replace(/[^0-9.,]/g, "");
  return digits ? `$${digits}` : raw;
}

function featureLines(plan: PublicVenuePlan): string[] {
  const lines: string[] = [];
  if (plan.period?.trim()) lines.push(plan.period.trim());
  if (plan.description?.trim()) {
    for (const part of plan.description.split(/[;\n•]/).map((s) => s.trim()).filter(Boolean)) {
      lines.push(part);
      if (lines.length >= 4) break;
    }
  }
  if (lines.length === 0) lines.push("Precio referencial · confirma con el centro");
  return lines.slice(0, 4);
}

type Props = {
  plans: PublicVenuePlan[];
  /** denser layout for mobile stack */
  compact?: boolean;
};

export function GymPlansSection({ plans, compact = false }: Props) {
  const active = plans.filter((p) => p.active !== false && p.name?.trim());
  if (active.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-quegym-border px-4 py-6 text-center text-sm text-quegym-secondary">
        Este centro aún no publicó planes referenciales. Puedes solicitar información
        directamente.
      </div>
    );
  }

  const highlightIdx = active.length >= 2 ? Math.min(1, active.length - 1) : 0;

  return (
    <>
      <div className={compact ? "space-y-3" : "grid gap-3 md:grid-cols-3"}>
        {active.map((plan, idx) => {
          const highlighted = idx === highlightIdx && active.length > 1;
          return (
            <article
              key={`${plan.name}-${idx}`}
              className={`rounded-2xl border bg-quegym-elevated p-3 ${
                highlighted
                  ? "border-quegym-accent shadow-sm"
                  : "border-quegym-border"
              }`}
            >
              {highlighted ? (
                <p className="mb-1 inline-flex items-center gap-1 text-xs text-quegym-secondary">
                  <Star
                    className="h-3 w-3 fill-quegym-highlight text-quegym-highlight"
                    aria-hidden
                  />
                  Destacado
                </p>
              ) : null}
              <p className="text-sm font-medium text-quegym-primary">{plan.name}</p>
              <p className="text-3xl font-semibold text-quegym-primary">
                {displayPrice(plan.priceLabel)}
                {plan.priceLabel?.trim() && !/consultar/i.test(plan.priceLabel) ? (
                  <span className="ml-1 text-xs font-normal text-quegym-secondary">
                    {periodSuffix(plan.period)}
                  </span>
                ) : null}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-quegym-secondary">
                {featureLines(plan).map((line) => (
                  <li key={line}>
                    <FeatureCheck>{line}</FeatureCheck>
                  </li>
                ))}
              </ul>
              <Link
                href="#contactar-modal"
                className={
                  highlighted
                    ? "qg-btn-primary qg-motion mt-3 inline-flex w-full items-center justify-center rounded-xl bg-quegym-accent px-3 py-2 text-xs font-medium text-white hover:bg-quegym-accent-hover"
                    : "mt-3 inline-flex w-full items-center justify-center rounded-xl border border-quegym-border px-3 py-2 text-xs"
                }
              >
                {highlighted ? "Solicitar este plan" : "Más información"}
              </Link>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-quegym-secondary">
        * Precios orientativos. Consulta al centro para confirmar.
      </p>
    </>
  );
}
