"use client";

import { Check, MessageCircle, Minus, X } from "lucide-react";
import Link from "next/link";
import { VenueImage } from "@floit/ui";
import { formatVenuePrice } from "@/lib/venue-price";
import { getVenuePhotoUrl } from "@/lib/venue-photo";

export type CompareGridVenue = {
  slug: string;
  name: string;
  zone: string;
  venueType: string;
  modalities: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
  contactWhatsapp?: string | null;
  photoUrls?: string[];
};

type MatcherRow = { label: string; matchers: string[] };

type Props = {
  rows: CompareGridVenue[];
  onRemove: (slug: string) => void;
};

const SERVICE_ROWS: MatcherRow[] = [
  { label: "Musculación", matchers: ["gym", "gym-floor", "weightlifting", "musculacion"] },
  { label: "Cardio", matchers: ["cardio", "cycling"] },
  { label: "Funcional", matchers: ["functional", "funcional"] },
  { label: "CrossFit", matchers: ["crossfit", "cross-training"] },
  { label: "Yoga", matchers: ["yoga"] },
  { label: "Spinning", matchers: ["spinning", "cycling"] },
  { label: "Boxing", matchers: ["boxing"] },
];

const AMENITY_ROWS: MatcherRow[] = [
  { label: "Estacionamiento", matchers: ["parking", "estacionamiento"] },
  { label: "Sauna", matchers: ["sauna"] },
  { label: "Piscina", matchers: ["pool", "piscina"] },
  { label: "Duchas", matchers: ["showers", "duchas"] },
  { label: "Cafetería", matchers: ["cafe", "cafeteria"] },
];

/** Ancho mínimo por columna de centro (móvil). */
const MOBILE_VENUE_COL = 108;
const MOBILE_LABEL_COL = 92;

export function CompareGrid({ rows, onRemove }: Props) {
  const colCount = rows.length;
  const minTableWidth = MOBILE_LABEL_COL + colCount * MOBILE_VENUE_COL;

  return (
    <div
      className="compare-grid-scroll max-h-[calc(100dvh-11rem)] overflow-auto overscroll-x-contain md:max-h-none"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table
        className="w-full border-collapse text-[11px] text-quegym-primary md:min-w-[760px]"
        style={{ minWidth: `max(100%, ${minTableWidth}px)` }}
      >
        <thead>
          <tr className="border-b border-quegym-border">
            <th
              className="compare-grid-corner sticky left-0 top-0 z-40 border-r border-quegym-border bg-quegym-subtle px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-quegym-secondary shadow-[4px_0_6px_-2px_rgba(0,0,0,0.12)] md:w-[170px] md:px-3 md:py-2.5 md:shadow-none"
              style={{ width: MOBILE_LABEL_COL, minWidth: MOBILE_LABEL_COL }}
            >
              <span className="md:hidden">Criterio</span>
              <span className="hidden md:inline">Criterio</span>
            </th>
            {rows.map((v) => (
              <th
                key={v.slug}
                className="compare-grid-header relative sticky top-0 z-30 border-r border-quegym-border bg-quegym-elevated px-1.5 py-2 text-center align-top shadow-[0_4px_6px_-2px_rgba(0,0,0,0.1)] last:border-r-0 md:px-2 md:py-2.5 md:shadow-none"
                style={{ width: MOBILE_VENUE_COL, minWidth: MOBILE_VENUE_COL }}
              >
                <button
                  type="button"
                  onClick={() => onRemove(v.slug)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-quegym-border bg-quegym-subtle text-quegym-secondary hover:bg-quegym-elevated md:right-2 md:top-2"
                  aria-label={`Quitar ${v.name} de la comparación`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
                <div className="relative mx-auto mb-1.5 h-12 w-[4.5rem] overflow-hidden rounded-xl md:mb-2 md:h-16 md:w-20 md:rounded-2xl">
                  <VenueImage
                    src={getVenuePhotoUrl(v)}
                    name={v.name}
                    modality={v.modalities?.[0] ?? v.venueType}
                    className="h-full w-full"
                  />
                </div>
                <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-quegym-primary md:text-[13px]">
                  {v.name}
                </p>
                <p className="mt-0.5 hidden text-[10px] font-medium text-quegym-secondary md:block">
                  {v.zone || "No informado"}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SectionRow label="Información básica" cols={colCount} />
          <DataRow label="Zona" values={rows.map((v) => v.zone || "—")} />
          <DataRow label="Distancia" values={rows.map(() => "—")} />
          <DataRow label="Precio" values={rows.map((v) => formatPriceCell(v))} />
          <DataRow
            label="Tipo"
            values={rows.map((v) => formatVenueType(v.venueType))}
          />
          <DataRow label="Horario L–V" values={rows.map(() => "—")} />
          <DataRow label="Fin de sem." values={rows.map(() => "—")} />
          <SectionRow label="Servicios" cols={colCount} />
          {SERVICE_ROWS.map((service) => (
            <BooleanRow
              key={service.label}
              label={service.label}
              values={rows.map((v) => hasAny(v.modalities, service.matchers))}
            />
          ))}
          <SectionRow label="Amenidades" cols={colCount} />
          {AMENITY_ROWS.map((amenity) => (
            <BooleanRow
              key={amenity.label}
              label={amenity.label}
              values={rows.map((v) => hasAny(v.amenities, amenity.matchers))}
            />
          ))}
          <tr>
            <td
              className="compare-grid-label sticky left-0 z-20 border-r border-t border-quegym-border bg-quegym-subtle px-2 py-2 text-[10px] text-quegym-secondary shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)] md:px-3 md:py-3 md:shadow-none"
              style={{ width: MOBILE_LABEL_COL, minWidth: MOBILE_LABEL_COL }}
            >
              Acciones
            </td>
            {rows.map((v) => (
              <td
                key={`${v.slug}-ctas`}
                className="space-y-1 border-r border-t border-quegym-border bg-quegym-elevated px-1.5 py-2 align-top last:border-r-0 md:space-y-1.5 md:px-3"
                style={{ width: MOBILE_VENUE_COL, minWidth: MOBILE_VENUE_COL }}
              >
                <Link
                  href={`/gyms/${v.slug}`}
                  className="block rounded-lg bg-quegym-ink px-2 py-1.5 text-center text-[10px] font-semibold text-white hover:bg-quegym-accent-hover md:px-3 md:text-[11px]"
                >
                  <span className="md:hidden">Ver ficha</span>
                  <span className="hidden md:inline">Solicitar info</span>
                </Link>
                {v.contactWhatsapp ? (
                  <a
                    href={`https://wa.me/${sanitizeWhatsapp(v.contactWhatsapp)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 rounded-lg bg-quegym-highlight px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-quegym-highlight-hover md:px-3 md:text-[11px]"
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 md:hidden" aria-hidden />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <span className="block cursor-not-allowed rounded-lg bg-quegym-highlight-soft px-2 py-1.5 text-center text-[10px] font-semibold text-quegym-accent md:text-[11px]">
                    WhatsApp
                  </span>
                )}
                <Link
                  href={`/gyms/${v.slug}`}
                  className="hidden rounded-lg border border-quegym-border bg-quegym-elevated px-3 py-1.5 text-center text-[11px] font-medium text-quegym-primary hover:bg-quegym-subtle md:block"
                >
                  Ver ficha completa
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols + 1}
        className="border-y border-quegym-border bg-quegym-subtle px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-quegym-secondary md:px-3 md:py-2"
      >
        {label}
      </td>
    </tr>
  );
}

function DataRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-quegym-border">
      <td
        className="compare-grid-label sticky left-0 z-20 border-r border-quegym-border bg-quegym-subtle px-2 py-1.5 text-[10px] text-quegym-secondary shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)] md:px-3 md:py-2 md:text-[11px] md:shadow-none"
        style={{ width: MOBILE_LABEL_COL, minWidth: MOBILE_LABEL_COL }}
      >
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="border-r border-quegym-border bg-quegym-elevated px-1.5 py-1.5 text-center text-[10px] font-medium leading-snug text-quegym-primary last:border-r-0 md:px-3 md:py-2 md:text-[11px]"
          style={{ width: MOBILE_VENUE_COL, minWidth: MOBILE_VENUE_COL }}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function BooleanRow({ label, values }: { label: string; values: boolean[] }) {
  return (
    <tr className="border-b border-quegym-border">
      <td
        className="compare-grid-label sticky left-0 z-20 border-r border-quegym-border bg-quegym-subtle px-2 py-1.5 text-[10px] text-quegym-secondary shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)] md:px-3 md:py-2 md:text-[11px] md:shadow-none"
        style={{ width: MOBILE_LABEL_COL, minWidth: MOBILE_LABEL_COL }}
      >
        {label}
      </td>
      {values.map((enabled, index) => (
        <td
          key={`${label}-${index}`}
          className="border-r border-quegym-border bg-quegym-elevated px-1.5 py-1.5 text-center last:border-r-0 md:px-3 md:py-2"
          style={{ width: MOBILE_VENUE_COL, minWidth: MOBILE_VENUE_COL }}
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
              enabled
                ? "bg-quegym-highlight-soft text-quegym-highlight"
                : "bg-quegym-subtle text-quegym-secondary"
            }`}
            aria-label={enabled ? "Disponible" : "No disponible"}
            title={enabled ? "Disponible" : "No disponible"}
          >
            {enabled ? (
              <Check className="h-3 w-3" aria-hidden strokeWidth={2.5} />
            ) : (
              <Minus className="h-3 w-3" aria-hidden />
            )}
          </span>
        </td>
      ))}
    </tr>
  );
}

function formatPriceCell(v: CompareGridVenue): string {
  const { primary, hasPrice } = formatVenuePrice({
    priceMin: v.priceMin,
    priceMax: v.priceMax,
  });
  if (!hasPrice) return "Consultar";
  const num = primary.replace(/[^\d]/g, "");
  if (num) return `Desde $${num}`;
  return primary.length > 14 ? `${primary.slice(0, 12)}…` : primary;
}

function formatVenueType(venueType: string): string {
  const normalized = venueType.trim().toLowerCase();
  if (normalized === "gym") return "Gym clásico";
  if (normalized === "functional") return "Funcional";
  if (normalized === "personal_training") return "PT";
  if (normalized === "cycling") return "Cycling";
  if (normalized === "yoga") return "Yoga";
  if (normalized === "pilates") return "Pilates";
  if (normalized === "mixed") return "Mixto";
  return venueType || "—";
}

function hasAny(values: string[] | undefined, needles: string[]): boolean {
  if (!values?.length) return false;
  const normalized = values.map((value) => value.toLowerCase());
  return needles.some((needle) =>
    normalized.some((value) => value.includes(needle.toLowerCase())),
  );
}

function sanitizeWhatsapp(value: string): string {
  return value.replace(/[^\d]/g, "");
}
