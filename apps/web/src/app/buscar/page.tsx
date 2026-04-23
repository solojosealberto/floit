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

  try {
    const [searchRes, zonesRes] = await Promise.all([
      fetch(`${base}/v1/search?${qs.toString()}`, { cache: "no-store" }),
      fetch(`${base}/v1/meta/zones`, { cache: "no-store" }),
    ]);

    if (searchRes.ok) {
      data = (await searchRes.json()) as DiscoveryResponse;
    }
    if (zonesRes.ok) {
      const z = (await zonesRes.json()) as { zones?: string[] };
      zones = z.zones ?? [];
    }
  } catch {
    data = emptyDiscovery();
  }

  return <BuscarClient data={data} zones={zones} query={flat} />;
}
