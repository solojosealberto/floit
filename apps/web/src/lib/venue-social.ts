/** Client-side helpers for Instagram / website fields. */

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

export function websiteDisplayLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
