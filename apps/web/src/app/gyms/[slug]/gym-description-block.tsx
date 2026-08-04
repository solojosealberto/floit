import { parseVenueDescription } from "@/lib/venue-description";
import { formatVenueTypeLabel } from "@/lib/venue-labels";
import {
  formatInstagramHandle,
  instagramProfileUrl,
  normalizeInstagramHandle,
  normalizeWebsiteUrl,
  websiteDisplayLabel,
} from "@/lib/venue-social";

type Props = {
  description: string | null | undefined;
  fallbackVenueType?: string;
  fallbackModalities?: string[];
  fallbackAmenities?: string[];
  /** Structured fields from catalog (preferred over description parse). */
  instagramHandle?: string | null;
  websiteUrl?: string | null;
};

export function GymDescriptionBlock({
  description,
  fallbackVenueType,
  fallbackModalities = [],
  fallbackAmenities = [],
  instagramHandle,
  websiteUrl,
}: Props) {
  const parsed = parseVenueDescription(description);
  const activities =
    parsed.activities.length > 0 ? parsed.activities : fallbackModalities;
  const amenities =
    parsed.amenities.length > 0 ? parsed.amenities : fallbackAmenities;
  const venueTypeLabel =
    parsed.venueType ?? formatVenueTypeLabel(fallbackVenueType);

  const igHandle =
    formatInstagramHandle(instagramHandle) ??
    parsed.instagramHandle ??
    null;
  const igUrl =
    instagramProfileUrl(instagramHandle) ??
    (normalizeInstagramHandle(parsed.instagramHandle)
      ? instagramProfileUrl(parsed.instagramHandle)
      : null) ??
    parsed.instagramUrl;
  const webUrl =
    normalizeWebsiteUrl(websiteUrl) ??
    null;

  if (
    !parsed.summary &&
    activities.length === 0 &&
    amenities.length === 0 &&
    !igUrl &&
    !webUrl
  ) {
    return (
      <p className="text-sm text-quegym-secondary">
        Este centro aún no publicó una descripción detallada.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm text-quegym-secondary">
      {parsed.summary ? (
        <p className="whitespace-pre-line leading-relaxed">{parsed.summary}</p>
      ) : venueTypeLabel ? (
        <p>
          Centro de tipo <strong className="text-quegym-primary">{venueTypeLabel}</strong>
          .
        </p>
      ) : null}
      {activities.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
            Actividades
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activities.map((item) => (
              <span
                key={item}
                className="rounded-full border border-quegym-border bg-quegym-subtle px-2.5 py-0.5 text-xs text-quegym-primary"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {amenities.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
            Amenidades
          </p>
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((item) => (
              <span
                key={item}
                className="rounded-full border border-quegym-border bg-quegym-subtle px-2.5 py-0.5 text-xs text-quegym-primary"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {parsed.schedule ? (
        <p>
          <span className="font-medium text-quegym-primary">Horario: </span>
          {parsed.schedule}
        </p>
      ) : null}
      {igUrl ? (
        <p>
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-quegym-highlight hover:underline"
          >
            {igHandle ?? "Instagram"}
          </a>
        </p>
      ) : null}
      {webUrl ? (
        <p>
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-quegym-highlight hover:underline"
          >
            {websiteDisplayLabel(webUrl)}
          </a>
        </p>
      ) : null}
    </div>
  );
}
