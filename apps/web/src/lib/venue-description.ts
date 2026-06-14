const IMPORT_FOOTER = /\n—\s*Catálogo QueGym[\s\S]*$/i;

export type ParsedVenueDescription = {
  summary: string | null;
  venueType: string | null;
  activities: string[];
  amenities: string[];
  schedule: string | null;
  instagramHandle: string | null;
  instagramUrl: string | null;
  priceReference: string | null;
  plans: string | null;
  locationHint: string | null;
};

function splitList(value: string): string[] {
  return value
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseInstagram(value: string): { handle: string | null; url: string | null } {
  const trimmed = value.trim();
  const handleMatch = trimmed.match(/@([a-zA-Z0-9._]+)/);
  if (handleMatch) {
    const handle = handleMatch[1]!;
    return {
      handle: `@${handle}`,
      url: `https://instagram.com/${handle}`,
    };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { handle: null, url: trimmed };
  }
  return { handle: null, url: null };
}

function isOpsLine(line: string): boolean {
  if (/^Calificación\s*\(fuente\):/i.test(line)) return true;
  if (/^Ubicación:\s*cache:\s*https?:\/\//i.test(line)) return true;
  if (/^https?:\/\//i.test(line)) return true;
  return false;
}

function buildSummary(parsed: Omit<ParsedVenueDescription, "summary">): string | null {
  const parts: string[] = [];
  if (parsed.venueType) parts.push(parsed.venueType);
  if (parsed.activities.length) {
    parts.push(`Actividades: ${parsed.activities.join(", ")}`);
  }
  if (parsed.amenities.length) {
    parts.push(`Amenidades: ${parsed.amenities.join(", ")}`);
  }
  if (parsed.schedule) parts.push(`Horario: ${parsed.schedule}`);
  if (parsed.priceReference) {
    parts.push(`Referencia de precio: ${parsed.priceReference}`);
  }
  if (parsed.plans) parts.push(`Planes: ${parsed.plans}`);
  return parts.length ? parts.join("\n") : null;
}

/** Limpia descripciones de import (`venues-import`) para UI pública. */
export function parseVenueDescription(
  raw: string | null | undefined,
): ParsedVenueDescription {
  const empty: ParsedVenueDescription = {
    summary: null,
    venueType: null,
    activities: [],
    amenities: [],
    schedule: null,
    instagramHandle: null,
    instagramUrl: null,
    priceReference: null,
    plans: null,
    locationHint: null,
  };

  if (!raw?.trim()) return empty;

  const text = raw.replace(IMPORT_FOOTER, "").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const parsed = { ...empty };

  for (const line of lines) {
    if (isOpsLine(line)) continue;

    const locationCache = line.match(/^Ubicación:\s*cache:\s*(.+)$/i);
    if (locationCache) {
      const addr = locationCache[1]!.trim();
      if (!/^https?:\/\//i.test(addr)) {
        parsed.locationHint = addr;
      }
      continue;
    }

    const colon = line.indexOf(":");
    if (colon <= 0) continue;

    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (!value) continue;

    switch (key) {
      case "tipo":
        parsed.venueType = value;
        break;
      case "actividades":
        parsed.activities = splitList(value);
        break;
      case "amenidades":
        parsed.amenities = splitList(value);
        break;
      case "horario":
        parsed.schedule = value;
        break;
      case "instagram": {
        const ig = parseInstagram(value);
        parsed.instagramHandle = ig.handle;
        parsed.instagramUrl = ig.url;
        break;
      }
      case "referencia de precio":
        parsed.priceReference = value;
        break;
      case "planes":
        parsed.plans = value;
        break;
      default:
        break;
    }
  }

  parsed.summary = buildSummary(parsed);
  return parsed;
}
