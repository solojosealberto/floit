import Link from "next/link";
import { CompareViewTracker } from "./compare-view-tracker";

export const metadata = {
  title: "Comparar centros",
};

type VenueDetail = {
  slug: string;
  name: string;
  zone: string;
  venueType: string;
  modalities: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
};

export default async function CompararPage(props: {
  searchParams: Promise<{ c?: string }>;
}) {
  const sp = await props.searchParams;
  const slugs =
    typeof sp.c === "string"
      ? sp.c.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)
      : [];

  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";

  const rows: VenueDetail[] = [];
  for (const slug of slugs) {
    try {
      const res = await fetch(`${base}/v1/venues/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      rows.push((await res.json()) as VenueDetail);
    } catch {
      /* skip */
    }
  }

  const fields = [
    { key: "zone", label: "Zona" },
    { key: "venueType", label: "Tipo" },
    {
      key: "modalities",
      label: "Modalidades",
      format: (v: VenueDetail) =>
        v.modalities?.length ? v.modalities.join(", ") : "—",
    },
    {
      key: "amenities",
      label: "Amenities",
      format: (v: VenueDetail) =>
        v.amenities?.length ? v.amenities.join(", ") : "—",
    },
    {
      key: "price",
      label: "Precio ref.",
      format: (v: VenueDetail) => formatPrice(v),
    },
  ];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
      <CompareViewTracker slugs={slugs} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Comparar hasta 3 centros
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Añade slugs con <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">?c=slug1,slug2</code> o
          entra desde Favoritos. Los campos vacíos se muestran como «no
          informado».
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          No hay centros para comparar.{" "}
          <Link className="underline" href="/buscar">
            Buscar
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="px-4 py-3 font-semibold">Campo</th>
                {rows.map((v) => (
                  <th key={v.slug} className="px-4 py-3 font-semibold">
                    {v.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr
                  key={f.key}
                  className="border-b border-neutral-100 dark:border-neutral-900"
                >
                  <td className="px-4 py-3 text-neutral-500">{f.label}</td>
                  {rows.map((v) => (
                    <td key={`${v.slug}-${f.key}`} className="px-4 py-3">
                      {"format" in f && f.format
                        ? f.format(v)
                        : String((v as never)[f.key] ?? "no informado")}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3 text-neutral-500">Acciones</td>
                {rows.map((v) => (
                  <td key={`${v.slug}-cta`} className="px-4 py-3">
                    <Link className="font-medium underline" href={`/gyms/${v.slug}`}>
                      Ver ficha
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <footer className="flex gap-4 text-sm">
        <Link className="underline" href="/buscar">
          ← Buscar
        </Link>
        <Link className="underline" href="/favoritos">
          Favoritos
        </Link>
      </footer>
    </main>
  );
}

function formatPrice(v: VenueDetail): string {
  if (v.priceMin == null && v.priceMax == null) return "no informado";
  if (v.priceMin != null && v.priceMax != null)
    return `$${v.priceMin} – $${v.priceMax}`;
  if (v.priceMin != null) return `Desde $${v.priceMin}`;
  return `Hasta $${v.priceMax}`;
}
