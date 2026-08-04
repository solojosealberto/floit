/** Shared helpers for venue social / web fields (partner + catalog sync). */

export function normalizeInstagramHandle(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  s = s.replace(/\/.*$/, "").replace(/^@+/, "").trim();
  if (!/^[a-zA-Z0-9._]{1,60}$/.test(s)) return null;
  return s.toLowerCase();
}

export function formatInstagramHandle(handle: string | null | undefined): string | null {
  const n = normalizeInstagramHandle(handle);
  return n ? `@${n}` : null;
}

export function instagramProfileUrl(handle: string | null | undefined): string | null {
  const n = normalizeInstagramHandle(handle);
  return n ? `https://instagram.com/${n}` : null;
}

export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Extract @handle from free-text venue description (import format). */
export function extractInstagramFromDescription(
  description: string | null | undefined,
): string | null {
  if (!description?.trim()) return null;
  for (const line of description.split("\n")) {
    const m = line.match(/^Instagram:\s*(.+)$/i);
    if (!m) continue;
    return normalizeInstagramHandle(m[1]);
  }
  return null;
}

export function extractWebsiteFromDescription(
  description: string | null | undefined,
): string | null {
  if (!description?.trim()) return null;
  for (const line of description.split("\n")) {
    const m = line.match(/^(?:Web|Website|Sitio web|Página web):\s*(.+)$/i);
    if (!m) continue;
    return normalizeWebsiteUrl(m[1]);
  }
  return null;
}

/** Upsert or remove Instagram:/Web: lines in a catalog description blob. */
export function rewriteSocialLinesInDescription(
  description: string | null | undefined,
  opts: { instagramHandle?: string | null; websiteUrl?: string | null },
): string | null {
  const lines = (description ?? "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => {
      if (/^Instagram:\s*/i.test(l.trim())) return false;
      if (/^(?:Web|Website|Sitio web|Página web):\s*/i.test(l.trim())) return false;
      return true;
    });

  const ig = normalizeInstagramHandle(opts.instagramHandle);
  const web = normalizeWebsiteUrl(opts.websiteUrl);
  if (ig) lines.push(`Instagram: @${ig}`);
  if (web) lines.push(`Web: ${web}`);

  const out = lines.join("\n").trim();
  return out || null;
}
