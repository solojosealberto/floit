import {
  isMissingValue,
  normalizeVenueName,
  normalizeZone,
  slugify,
} from "./utils.mjs";
import { mapAmenities, mapModalities, mapVenueType } from "./mappings.mjs";

const COL = {
  name: 0,
  zone: 1,
  category: 2,
  maps: 3,
  phone: 4,
  instagram: 5,
  priceRef: 6,
  plans: 7,
  amenities: 8,
  activities: 9,
  schedule: 10,
  rating: 11,
  images: 12,
};

export function parseSourceRow(row, index) {
  const source = {
    rowIndex: index + 2,
    name: cell(row, COL.name),
    zoneRaw: cell(row, COL.zone),
    category: cell(row, COL.category),
    mapsLink: cell(row, COL.maps),
    phone: cell(row, COL.phone),
    instagram: cell(row, COL.instagram),
    priceRef: cell(row, COL.priceRef),
    plans: cell(row, COL.plans),
    amenities: cell(row, COL.amenities),
    activities: cell(row, COL.activities),
    schedule: cell(row, COL.schedule),
    rating: cell(row, COL.rating),
    images: cell(row, COL.images),
  };
  return source;
}

function cell(row, i) {
  return row[i] != null ? String(row[i]).trim() : "";
}

export function extractCoordsFromUrl(url) {
  if (!url) return null;
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /@(-?\d+\.?\d*),(-?\d+\.?\d*),\d/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  const dms = url.match(
    /(\d+)°\s*(\d+)[′']?\s*([\d.]+).*?([NS]).*?(\d+)°\s*(\d+)[′']?\s*([\d.]+).*?([EW])/i,
  );
  if (dms) {
    const lat = dmsToDecimal(dms[1], dms[2], dms[3], dms[4]);
    const lng = dmsToDecimal(dms[5], dms[6], dms[7], dms[8]);
    if (lat != null && lng != null) return { lat, lng };
  }
  return null;
}

function dmsToDecimal(d, m, s, hemi) {
  const deg = Number(d) + Number(m) / 60 + Number(s) / 3600;
  if (!Number.isFinite(deg)) return null;
  const h = String(hemi).toUpperCase();
  if (h === "S" || h === "W") return -deg;
  return deg;
}

export function parsePhotoUrls(raw) {
  if (isMissingValue(raw) || raw.includes("data:image")) return [];
  const chunks = raw
    .replace(/\s+/g, " ")
    .split(/[\s,]+/)
    .flatMap((part) => part.split(/(?=https?:\/\/)/))
    .map((u) => u.trim().replace(/^["']|["']$/g, ""))
    .filter((u) => u.startsWith("http") && !u.includes("data:image"));
  const seen = new Set();
  const out = [];
  for (const u of chunks) {
    const clean = u.replace(/\.+$/, "");
    if (!seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
    if (out.length >= 12) break;
  }
  return out;
}

export function normalizePhone(raw) {
  if (isMissingValue(raw)) return { phone: null, whatsapp: null };
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `58${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("04")) digits = `58${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("4")) digits = `58${digits}`;
  if (digits.length < 10) return { phone: null, whatsapp: null };
  return { phone: digits, whatsapp: digits };
}

export function parsePriceRange(priceRef, plans = "") {
  const text = `${priceRef} ${plans}`.replace(/\s+/g, " ");
  const amounts = [];
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:\$|usd|us\$|eur|€)/gi,
    /(?:bs\.?|bol[ií]var(?:es)?)\s*(\d+(?:[.,]\d+)?)/gi,
    /(\d+(?:[.,]\d+)?)\s*bs\.?/gi,
    /(?:mensual|mes|\/\s*mes)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/gi,
    /(\d+(?:[.,]\d+)?)\s*(?:\/\s*mes|mensual)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1] ?? m[2];
      const n = Number(String(raw).replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(n) && n > 0 && n < 5000) amounts.push(Math.round(n));
    }
  }
  if (amounts.length === 0) return { priceMin: null, priceMax: null };
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return { priceMin: min, priceMax: max === min ? min : max };
}

export function parseRatingScore(ratingRaw) {
  const m = String(ratingRaw ?? "").match(/(\d+(?:\.\d+)?)\s*\/\s*5/);
  if (!m) return null;
  const r = Number(m[1]);
  if (!Number.isFinite(r)) return null;
  return Math.min(1, Math.max(0, r / 5));
}

export function parsePlansForSync(plansText, priceRef = "") {
  const chunks = [];
  const combined = [plansText, priceRef].filter((x) => !isMissingValue(x)).join(" | ");
  if (!combined) return [];
  for (const part of combined.split(/[,;|](?![^()]*\))/)) {
    const t = part.trim();
    if (t.length < 3) continue;
    chunks.push({
      name: t.slice(0, 120),
      priceLabel: t.slice(0, 80),
      period: null,
      description: null,
      active: true,
    });
  }
  return chunks.slice(0, 20);
}

export function buildAddress(name, zone, mapsLink) {
  const canonZone = normalizeZone(zone);
  if (mapsLink && !mapsLink.startsWith("http") && mapsLink.length > 8) {
    const street = mapsLink.slice(0, 200).trim();
    return `${street}, ${canonZone}, Caracas, Venezuela`.slice(0, 320);
  }
  return `${name}, ${canonZone}, Caracas, Venezuela`.slice(0, 320);
}

export function buildDescription(source) {
  const lines = [];
  if (!isMissingValue(source.category)) lines.push(`Tipo: ${source.category.trim()}`);
  if (!isMissingValue(source.activities))
    lines.push(`Actividades: ${source.activities.trim()}`);
  if (!isMissingValue(source.amenities))
    lines.push(`Amenidades: ${source.amenities.trim()}`);
  if (!isMissingValue(source.schedule))
    lines.push(`Horario: ${source.schedule.trim()}`);
  if (!isMissingValue(source.instagram))
    lines.push(`Instagram: ${source.instagram.trim()}`);
  if (!isMissingValue(source.priceRef))
    lines.push(`Referencia de precio: ${source.priceRef.trim()}`);
  if (!isMissingValue(source.plans)) lines.push(`Planes: ${source.plans.trim()}`);
  const body = lines.join("\n");
  return body ? body.slice(0, 7900) : null;
}

export function computeCompleteness(record) {
  let score = 0.15;
  if (record.lat != null && record.lng != null) score += 0.12;
  if (record.zone?.trim()) score += 0.05;
  if (record.contactPhone || record.contactWhatsapp) score += 0.12;
  if (record.photoUrls?.length) score += 0.18;
  if (record.priceMin != null) score += 0.12;
  if (record.priceMax != null && record.priceMax !== record.priceMin) score += 0.03;
  if (record.modalities?.length) score += 0.08;
  if (record.amenities?.length) score += 0.08;
  if (record.description?.includes("Tipo:")) score += 0.04;
  if (!isMissingValue(record.source?.schedule)) score += 0.04;
  if (!isMissingValue(record.source?.instagram)) score += 0.04;
  return Math.min(1, Math.round(score * 100) / 100);
}

export function buildSlugCandidates(source, usedSlugs) {
  const zonePart = slugify(normalizeZone(source.zoneRaw)).slice(0, 24);
  const base = slugify(normalizeVenueName(source.name));
  const candidates = [
    base,
    `${base}-${zonePart}`,
    `${base}-${source.rowIndex}`,
  ].filter(Boolean);
  for (const c of candidates) {
    const slug = c.slice(0, 160);
    if (!usedSlugs.has(slug)) {
      usedSlugs.add(slug);
      return slug;
    }
  }
  const fallback = `${base}-${source.rowIndex}`;
  usedSlugs.add(fallback);
  return fallback.slice(0, 160);
}

export function sourceToDraft(source, slug) {
  const zone = normalizeZone(source.zoneRaw);
  const venueType = mapVenueType(source.category, source.activities);
  const modalities = mapModalities(source.activities, source.category);
  const amenities = mapAmenities(source.amenities);
  const { priceMin, priceMax } = parsePriceRange(source.priceRef, source.plans);
  const { phone, whatsapp } = normalizePhone(source.phone);
  const photoUrls = parsePhotoUrls(source.images);
  const popularityScore = parseRatingScore(source.rating);
  const address = buildAddress(source.name, source.zoneRaw, source.mapsLink);

  const name = normalizeVenueName(source.name);

  return {
    slug,
    name: name.slice(0, 240),
    address,
    zone,
    venueType,
    modalities,
    amenities,
    priceMin,
    priceMax,
    contactPhone: phone,
    contactWhatsapp: whatsapp,
    contactEmail: null,
    photoUrls,
    allowsTrial: true,
    popularityScore: popularityScore ?? 0.5,
    source,
    plans: parsePlansForSync(source.plans, source.priceRef),
  };
}
