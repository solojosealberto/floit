import type { MetadataRoute } from "next";

type VenueRow = { slug: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const catalog = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly" },
    { url: `${base}/buscar`, lastModified: new Date(), changeFrequency: "daily" },
    {
      url: `${base}/comparar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
    },
    {
      url: `${base}/favoritos`,
      lastModified: new Date(),
      changeFrequency: "weekly",
    },
    {
      url: `${base}/lead/confirmacion`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${base}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
  ];

  let gymSlugs: string[] = [];
  try {
    const res = await fetch(`${catalog}/v1/venues`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items?: VenueRow[] };
      gymSlugs = (data.items ?? []).map((v) => v.slug);
    }
  } catch {
    /* catalog offline */
  }

  const gymRoutes: MetadataRoute.Sitemap = gymSlugs.map((slug) => ({
    url: `${base}/gyms/${encodeURIComponent(slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...gymRoutes];
}
