/** Shared helpers for venue social / web fields (catalog sync). */

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
