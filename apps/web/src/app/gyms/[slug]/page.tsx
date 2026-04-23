import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GymContactSection } from "./gym-contact-section";
import { GymDirectContact } from "./gym-direct-contact";
import { VenueViewTracker } from "./venue-view-tracker";

type Props = { params: Promise<{ slug: string }> };

type VenueDetail = {
  name: string;
  slug: string;
  description: string | null;
  address: string;
  zone: string;
  lat: number;
  lng: number;
  venueType: string;
  modalities: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
  verificationStatus?: string;
  allowsTrial?: boolean;
  activePromotionTitle?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactEmail?: string | null;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  try {
    const res = await fetch(`${base}/v1/venues/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return { title: slug };
    const v = (await res.json()) as VenueDetail;
    const desc =
      v.description?.slice(0, 155) ??
      `${v.name} en ${v.zone}. ${v.venueType}.`;
    return {
      title: v.name,
      description: desc,
      openGraph: {
        title: v.name,
        description: desc,
      },
    };
  } catch {
    return { title: slug };
  }
}

export default async function GymPage(props: Props) {
  const { slug } = await props.params;

  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  let venue: VenueDetail | null = null;

  try {
    const res = await fetch(`${base}/v1/venues/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (res.status === 404) notFound();
    if (!res.ok) notFound();
    venue = (await res.json()) as VenueDetail;
  } catch {
    notFound();
  }

  if (!venue) notFound();

  const vBadge = verificationBadge(venue.verificationStatus);
  const allowsTrial = venue.allowsTrial === true;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <VenueViewTracker slug={venue.slug} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {venue.zone} · {venue.venueType}
          </p>
          <span
            className={
              vBadge.tone === "ok"
                ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900 dark:bg-green-950 dark:text-green-100"
                : vBadge.tone === "partner"
                  ? "rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                  : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            }
          >
            {vBadge.label}
          </span>
          {allowsTrial ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100">
              Prueba disponible
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
        {venue.activePromotionTitle ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            Promo: {venue.activePromotionTitle}
          </p>
        ) : null}
        {venue.description ? (
          <p className="text-neutral-600 dark:text-neutral-400">
            {venue.description}
          </p>
        ) : null}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {venue.address}
        </p>
        <p className="text-sm font-medium">{formatPrice(venue)}</p>
      </div>

      <section className="flex flex-col gap-2 text-sm">
        <h2 className="font-semibold">Modalidades</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {venue.modalities?.length ? venue.modalities.join(", ") : "—"}
        </p>
        <h2 className="font-semibold">Amenities</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {venue.amenities?.length ? venue.amenities.join(", ") : "—"}
        </p>
      </section>

      <GymDirectContact
        slug={venue.slug}
        venueName={venue.name}
        contactPhone={venue.contactPhone}
        contactWhatsapp={venue.contactWhatsapp}
        contactEmail={venue.contactEmail}
      />

      <GymContactSection
        slug={venue.slug}
        venueName={venue.name}
        allowsTrial={allowsTrial}
        contactWhatsapp={venue.contactWhatsapp}
      />

      <Link className="text-sm underline" href="/buscar">
        ← Volver a buscar
      </Link>
    </main>
  );
}

function verificationBadge(status: string | undefined): {
  label: string;
  tone: "ok" | "partner" | "ref";
} {
  switch (status) {
    case "floit_verified":
      return { label: "Verificado Floit", tone: "ok" };
    case "partner_verified":
      return { label: "Verificado por el centro", tone: "partner" };
    default:
      return { label: "Información referencial", tone: "ref" };
  }
}

function formatPrice(v: VenueDetail): string {
  if (v.priceMin == null && v.priceMax == null) return "Consultar precio";
  if (v.priceMin != null && v.priceMax != null)
    return `$${v.priceMin} – $${v.priceMax} / mes (referencial)`;
  if (v.priceMin != null) return `Desde $${v.priceMin} / mes (referencial)`;
  return `Hasta $${v.priceMax} / mes (referencial)`;
}
