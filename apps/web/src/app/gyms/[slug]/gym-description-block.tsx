import { parseVenueDescription } from "@/lib/venue-description";
import { formatVenueTypeLabel } from "@/lib/venue-labels";

type Props = {
  description: string | null | undefined;
  fallbackVenueType?: string;
  fallbackModalities?: string[];
  fallbackAmenities?: string[];
};

export function GymDescriptionBlock({
  description,
  fallbackVenueType,
  fallbackModalities = [],
  fallbackAmenities = [],
}: Props) {
  const parsed = parseVenueDescription(description);
  const activities =
    parsed.activities.length > 0 ? parsed.activities : fallbackModalities;
  const amenities =
    parsed.amenities.length > 0 ? parsed.amenities : fallbackAmenities;
  const venueTypeLabel =
    parsed.venueType ?? formatVenueTypeLabel(fallbackVenueType);

  if (!parsed.summary && activities.length === 0 && amenities.length === 0) {
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
      {parsed.instagramUrl ? (
        <p>
          <a
            href={parsed.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-quegym-highlight hover:underline"
          >
            {parsed.instagramHandle ?? "Instagram"}
          </a>
        </p>
      ) : null}
    </div>
  );
}
