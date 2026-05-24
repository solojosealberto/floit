import { extractCoordsFromUrl } from "./parse-source.mjs";
import { isMissingValue, sleep } from "./utils.mjs";

const NOMINATIM_DELAY_MS = 1100;

export async function resolveMapsUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw.startsWith("http")) return raw;
  try {
    const res = await fetch(raw, {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "QueGymVenuesImport/1.0 (catalog-import)" },
    });
    return res.url || raw;
  } catch {
    return raw;
  }
}

export async function geocodeVenue(draft, cache, { skipNetwork = false } = {}) {
  const key = draft.slug;
  if (cache[key]?.lat != null && cache[key]?.lng != null) {
    return { ...cache[key], method: "cache" };
  }

  let mapsUrl = draft.source.mapsLink;
  if (!isMissingValue(mapsUrl) && mapsUrl.startsWith("http") && !skipNetwork) {
    mapsUrl = await resolveMapsUrl(mapsUrl);
    draft.source.mapsLinkResolved = mapsUrl;
    const fromUrl = extractCoordsFromUrl(mapsUrl);
    if (fromUrl) {
      const hit = { lat: fromUrl.lat, lng: fromUrl.lng, method: "maps-url", query: mapsUrl };
      cache[key] = hit;
      return hit;
    }
  } else if (!isMissingValue(mapsUrl)) {
    const fromText = extractCoordsFromUrl(mapsUrl);
    if (fromText) {
      const hit = { lat: fromText.lat, lng: fromText.lng, method: "coords-text", query: mapsUrl };
      cache[key] = hit;
      return hit;
    }
  }

  if (skipNetwork) {
    return { lat: null, lng: null, method: "skipped", query: null };
  }

  const query = `${draft.name}, ${draft.zone}, Caracas, Venezuela`;
  await sleep(NOMINATIM_DELAY_MS);
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "ve",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "QueGymVenuesImport/1.0 (contact: dev@quegym.local)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!res.ok) throw new Error(`nominatim HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const hit = { lat, lng, method: "nominatim", query };
        cache[key] = hit;
        return hit;
      }
    }
  } catch (err) {
    return {
      lat: null,
      lng: null,
      method: "nominatim-error",
      query,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const query2 = `${draft.zone}, Caracas, Venezuela`;
  if (query2 !== query) {
    await sleep(NOMINATIM_DELAY_MS);
    try {
      const params2 = new URLSearchParams({
        q: query2,
        format: "json",
        limit: "1",
        countrycodes: "ve",
      });
      const res2 = await fetch(
        `https://nominatim.openstreetmap.org/search?${params2}`,
        {
          headers: {
            "User-Agent": "QueGymVenuesImport/1.0 (contact: dev@quegym.local)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        },
      );
      if (res2.ok) {
        const data2 = await res2.json();
        if (Array.isArray(data2) && data2[0]) {
          const lat = Number(data2[0].lat);
          const lng = Number(data2[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const hit = { lat, lng, method: "nominatim-zone", query: query2 };
            cache[key] = hit;
            return hit;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return { lat: null, lng: null, method: "not-found", query };
}

/** Centro de Caracas — último recurso para no dejar null en BD (marcado en geocodeNote). */
export const CARACAS_FALLBACK = { lat: 10.480594, lng: -66.903606 };
