import Link from "next/link";
import { HomeLocationButton } from "./home-location-button";
import { HomeFeaturedActions } from "./home-featured-actions";

type VenueCard = {
  slug: string;
  name: string;
  zone: string;
  distanceM?: number;
  priceMin?: number | null;
  priceMax?: number | null;
  modalities?: string[];
  photoUrls?: string[];
};

export default async function Home() {
  const quickZones = ["Las Mercedes", "Altamira", "Chacao", "El Rosal"];
  const categories = [
    { label: "Gym clásico", venueType: "gym", emoji: "🏋️" },
    { label: "CrossFit", modality: "crossfit", emoji: "⚡" },
    { label: "Yoga", venueType: "yoga", emoji: "🧘" },
    { label: "Pilates", venueType: "pilates", emoji: "🤸" },
    { label: "Funcional", venueType: "functional", emoji: "🔥" },
    { label: "Boxing", modality: "boxing", emoji: "🥊" },
    { label: "Natación", modality: "natacion", emoji: "🏊" },
    { label: "Spinning", venueType: "cycling", emoji: "🎽" },
  ];
  const searchBase = process.env.SEARCH_SERVICE_URL ?? "http://localhost:4011";
  let zones: string[] = quickZones;
  let featured: VenueCard[] = [];
  try {
    const [zonesRes, featuredRes] = await Promise.all([
      fetch(`${searchBase}/v1/meta/zones`, { cache: "no-store" }),
      fetch(`${searchBase}/v1/search?sort=popularity`, { cache: "no-store" }),
    ]);
    if (zonesRes.ok) {
      const payload = (await zonesRes.json()) as { zones?: string[] };
      if (payload.zones && payload.zones.length > 0) zones = payload.zones;
    }
    if (featuredRes.ok) {
      const payload = (await featuredRes.json()) as { items?: VenueCard[] };
      featured = (payload.items ?? []).slice(0, 4);
    }
  } catch {
    // fallback a contenido estático si no hay servicios arriba
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-3 py-3">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <section className="bg-neutral-50 px-4 py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500">
              <span aria-hidden>📍</span>
              Caracas · Distrito Capital · Venezuela
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
              Encontrá tu próximo
              <br />
              gimnasio en Caracas
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-500">
              Comparalos por zona, precio, modalidades y amenidades. Contactá directo
              por WhatsApp sin intermediarios.
            </p>

            <form
              action="/buscar"
              method="get"
              className="mx-auto mt-8 max-w-4xl rounded-2xl border border-neutral-200 bg-white p-3 shadow-md"
            >
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-400">
                  <span aria-hidden>🔍</span>
                  <input
                    name="q"
                    placeholder="¿Qué tipo de gimnasio buscás?"
                    className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-400 md:min-w-56">
                  <span aria-hidden>📌</span>
                  <select
                    name="zone"
                    defaultValue=""
                    className="w-full bg-transparent text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="">Zona o municipio</option>
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 px-7 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Buscar
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 px-1 text-xs text-neutral-500">
                <HomeLocationButton />
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-400">Accesos rápidos:</span>
                {quickZones.map((zone) => (
                  <Link
                    key={zone}
                    href={`/buscar?zone=${encodeURIComponent(zone)}`}
                    className="hover:text-neutral-800"
                  >
                    {zone}
                  </Link>
                ))}
              </div>
            </form>
          </div>
        </section>

        <section className="border-t border-neutral-100 px-4 py-6">
          <div className="mx-auto max-w-[1220px]">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-500">
              Explorar por tipo de centro
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
              {categories.map((item) => (
                <Link
                  key={item.label}
                  href={`/buscar?${
                    item.venueType
                      ? `venue_type=${encodeURIComponent(item.venueType)}`
                      : `modality=${encodeURIComponent(item.modality ?? "")}`
                  }`}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 hover:border-neutral-300"
                >
                  <span>{item.emoji}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">Destacados en Caracas</h2>
              <Link href="/buscar" className="text-sm text-neutral-500 hover:text-neutral-700">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {featured.map((gym) => (
                <div
                  key={gym.slug}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300"
                >
                  <Link href={`/gyms/${gym.slug}`}>
                    {gym.photoUrls?.[0] ? (
                      <img
                        src={gym.photoUrls[0]}
                        alt={`Imagen de ${gym.name}`}
                        className="h-36 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-neutral-100 text-sm text-neutral-400">
                        Imagen gimnasio
                      </div>
                    )}
                  </Link>
                  <div className="space-y-2 p-3">
                    {gym === featured[0] ? (
                      <span className="inline-flex rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] text-white">
                        Destacado
                      </span>
                    ) : null}
                    <Link href={`/gyms/${gym.slug}`} className="block text-sm font-semibold text-neutral-800 hover:underline">
                      {gym.name}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {gym.zone}
                      {gym.distanceM != null ? ` · ${formatKm(gym.distanceM)}` : ""}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {formatPrice(gym)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(gym.modalities ?? []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <HomeFeaturedActions slug={gym.slug} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-4">
          <div className="mx-auto flex max-w-[1220px] flex-col items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-neutral-800">¿Tenés un gimnasio en Caracas?</p>
              <p className="text-xs text-neutral-500">
                Registrá tu centro, recibí leads y gestioná tu perfil gratis
              </p>
            </div>
            <Link
              href="/partner/login"
              className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-white"
            >
              Reclamar mi centro -&gt;
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatPrice(v: VenueCard): string {
  if (v.priceMin == null && v.priceMax == null) return "Consultar precio";
  if (v.priceMin != null && v.priceMax != null) return `$${v.priceMin} - $${v.priceMax} / mes`;
  if (v.priceMin != null) return `Desde $${v.priceMin} / mes`;
  return `Hasta $${v.priceMax} / mes`;
}
