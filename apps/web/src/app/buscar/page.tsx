import type { DiscoveryResponse } from "@floit/contracts";
import { BuscarClient } from "./buscar-client";

export const metadata = {
  title: "Buscar centros",
};

function emptyDiscovery(): DiscoveryResponse {
  return { items: [], meta: { total: 0 } };
}

export default async function BuscarPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") flat[k] = v;
    else if (Array.isArray(v) && v[0]) flat[k] = v[0];
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(flat)) {
    if (v) qs.set(k, v);
  }

  const base = process.env.SEARCH_SERVICE_URL ?? "http://localhost:4011";

  let data: DiscoveryResponse = emptyDiscovery();
  let zones: string[] = [];
  let taxonomyModalities: { slug: string; label: string }[] = [];

  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";

  try {
    const [searchRes, zonesRes, taxRes] = await Promise.all([
      fetch(`${base}/v1/search?${qs.toString()}`, { cache: "no-store" }),
      fetch(`${base}/v1/meta/zones`, { cache: "no-store" }),
      fetch(
        `${catalogBase.replace(/\/$/, "")}/v1/meta/taxonomy-attributes?kind=modality`,
        { cache: "no-store" },
      ),
    ]);

    if (searchRes.ok) {
      data = (await searchRes.json()) as DiscoveryResponse;
    }
    if (zonesRes.ok) {
      const z = (await zonesRes.json()) as { zones?: string[] };
      zones = z.zones ?? [];
    }
    if (taxRes.ok) {
      const tax = (await taxRes.json()) as {
        items?: Array<{ slug: string; label: string }>;
      };
      taxonomyModalities = (tax.items ?? []).map((i) => ({
        slug: i.slug,
        label: i.label,
      }));
    }
  } catch {
    data = emptyDiscovery();
  }

  return (
    <BuscarClient
      data={data}
      zones={zones}
      query={flat}
      taxonomyModalities={taxonomyModalities}
    />
  );
}
