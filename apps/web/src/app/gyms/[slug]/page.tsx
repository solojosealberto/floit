import type { Metadata } from "next";
import { UIBadge, UIBanner, UIButton, UICard } from "@floit/ui";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GymContactSection } from "./gym-contact-section";
import {
  GymHeaderActionControls,
  GymMobileActionRow,
} from "./gym-action-controls";
import { GymLocationMap } from "./gym-location-map";
import { GymMobileSectionTabs } from "./gym-mobile-section-tabs";
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
  photoUrls?: string[];
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
        images: v.photoUrls?.[0]
          ? [
              {
                url: v.photoUrls[0],
                alt: `Portada de ${v.name}`,
              },
            ]
          : undefined,
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
  const waDigits = venue.contactWhatsapp?.replace(/\D/g, "") ?? "";
  const whatsappHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
        `Hola, vi ${venue.name} en ${BRAND_NAME} y quiero información.`,
      )}`
    : null;
  const phoneHref = venue.contactPhone?.trim()
    ? `tel:${venue.contactPhone.replace(/\s/g, "")}`
    : null;
  const emailHref = venue.contactEmail?.trim()
    ? `mailto:${encodeURIComponent(venue.contactEmail.trim())}?subject=${encodeURIComponent(
        `Consulta desde ${BRAND_NAME} — ${venue.name}`,
      )}`
    : null;
  const amenityList = venue.amenities?.length ? venue.amenities : ["Musculación", "Cardio", "Funcional"];
  const modalityList = venue.modalities?.length ? venue.modalities : ["Musculación", "Funcional"];
  const galleryPhotos = (venue.photoUrls ?? []).filter(Boolean);
  const mainPhoto = galleryPhotos[0];
  const extraPhotos = galleryPhotos.slice(1);

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 bg-white px-3 py-4 text-neutral-900 lg:px-4">
      <VenueViewTracker slug={venue.slug} />

      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
            F
          </span>
          <Link href="/" className="hover:underline">{BRAND_NAME}</Link>
          <span>›</span>
          <Link href={`/buscar?zone=${encodeURIComponent(venue.zone)}`} className="hover:underline">{venue.zone}</Link>
          <span>›</span>
          <span className="text-neutral-700">{venue.name}</span>
        </div>
        <GymHeaderActionControls slug={venue.slug} venueName={venue.name} />
      </div>

      <section className="lg:hidden">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div id="m-galeria" className="relative h-56 scroll-mt-24 bg-neutral-200">
            {mainPhoto ? (
              <img
                src={mainPhoto}
                alt={`Foto principal de ${venue.name}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <Link
              href="/buscar"
              className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-neutral-700 shadow"
            >
              ←
            </Link>
            <a
              href={`/comparar?c=${encodeURIComponent(venue.slug)}`}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm text-neutral-700 shadow"
            >
              ⇄
            </a>
            {!mainPhoto ? (
              <p className="absolute inset-x-0 top-24 text-center text-xs text-neutral-500">
                Galería del centro · sin fotos cargadas
              </p>
            ) : null}
            <div className="absolute bottom-4 left-3 flex items-center gap-1.5">
              {extraPhotos.slice(0, 3).map((url, idx) => (
                <img
                  key={`${url}-${idx}`}
                  src={url}
                  alt={`Miniatura ${idx + 2} de ${venue.name}`}
                  className="h-6 w-6 rounded-lg border border-white/80 bg-white object-cover"
                />
              ))}
              {galleryPhotos.length > 4 ? (
                <span className="rounded-lg bg-neutral-500 px-2 py-1 text-[11px] font-medium text-white">
                  +{galleryPhotos.length - 4}
                </span>
              ) : null}
            </div>
            <span className="absolute bottom-4 right-3 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white">
              {galleryPhotos.length > 0 ? `1 / ${galleryPhotos.length}` : "0 / 0"}
            </span>
          </div>

          <div className="space-y-3 border-t border-neutral-200 p-4">
            <h1 className="text-2xl font-semibold leading-tight text-neutral-900">
              {venue.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <UIBadge variant={vBadge.tone === "ok" ? "success" : "neutral"}>
                {vBadge.label}
              </UIBadge>
              {allowsTrial ? <UIBadge variant="neutral">⭐ Destacado</UIBadge> : null}
            </div>
            <p className="text-xs text-neutral-500">
              ◉ Av. Luis Roche, 2da Transversal · Altamira
            </p>
            <p className="text-xs text-neutral-600">
              ★ 4.8 (203) &nbsp; $$$ &nbsp; ◉ Abierto hasta las 11pm
            </p>

            <GymMobileActionRow
              slug={venue.slug}
              venueName={venue.name}
              whatsappHref={whatsappHref}
              phoneHref={phoneHref}
              emailHref={emailHref}
            />

            <GymMobileSectionTabs
              sections={[
                { id: "m-resumen", label: "Resumen" },
                { id: "m-servicios", label: "Servicios" },
                { id: "m-galeria", label: "Galería" },
                { id: "m-planes", label: "Planes" },
                { id: "m-ubicacion", label: "Ubicación" },
              ]}
            />

            <div id="m-resumen" className="space-y-2 pt-1 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Sobre el centro
              </p>
              {venue.description ? (
                <p className="text-sm text-neutral-600">{venue.description}</p>
              ) : (
                <p className="text-sm text-neutral-500">
                  Este centro aún no publicó una descripción detallada.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <Link href="#contactar-modal">
                <UIButton className="w-full">Solicitar información</UIButton>
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#3FA76A] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#348e5a]"
                >
                  ☏ Contactar por WhatsApp ahora
                </a>
              ) : null}
              <Link
                href="#reportar-modal"
                className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Reportar datos incorrectos
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 pt-3 text-xs text-neutral-600">
              <div className="rounded-xl bg-neutral-100 px-3 py-2">
                <p className="text-[10px] text-neutral-500">Horario L–V</p>
                <p>5:00am – 11:00pm</p>
              </div>
              <div className="rounded-xl bg-neutral-100 px-3 py-2">
                <p className="text-[10px] text-neutral-500">Fin de semana</p>
                <p>7:00am – 8:00pm</p>
              </div>
            </div>

            <div id="m-servicios" className="space-y-2 border-t border-neutral-200 pt-3 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Servicios y amenidades
              </p>
              <div className="flex flex-wrap gap-2">
                {amenityList.map((item) => (
                  <span
                    key={`m-am-${item}`}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                  >
                    <span className="text-emerald-600">✓</span> {item}
                  </span>
                ))}
              </div>
            </div>

            <div id="m-planes" className="space-y-3 border-t border-neutral-200 pt-3 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Planes disponibles
              </p>
              <article className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-sm text-neutral-600">Mensualidad básica</p>
                <p className="text-3xl font-semibold text-neutral-900">
                  ${venue.priceMin ?? 45}
                  <span className="ml-1 text-xs font-normal text-neutral-500">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  <li>✓ Acceso full equipos</li>
                  <li>✓ Vestuarios incluidos</li>
                  <li>✓ Lunes a domingo</li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 px-3 py-2 text-xs"
                >
                  Más información
                </Link>
              </article>
              <article className="rounded-2xl border border-neutral-900 bg-white p-3 shadow-sm">
                <p className="text-xs text-neutral-600">⭐ Más popular</p>
                <p className="text-sm text-neutral-600">Mensualidad premium</p>
                <p className="text-3xl font-semibold text-neutral-900">
                  ${venue.priceMax ?? 75}
                  <span className="ml-1 text-xs font-normal text-neutral-500">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  <li>✓ Todo lo básico</li>
                  <li>✓ Clases grupales ilimitadas</li>
                  <li>✓ Acceso sauna</li>
                  <li>✓ Estacionamiento</li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white"
                >
                  Solicitar este plan
                </Link>
              </article>
              <p className="text-xs text-neutral-500">
                * Precios orientativos en USD equivalente. Consulta al centro para
                confirmar.
              </p>
            </div>

            <div id="m-ubicacion" className="space-y-3 border-t border-neutral-200 pt-3 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Ubicación
              </p>
              <GymLocationMap
                lat={venue.lat}
                lng={venue.lng}
                name={venue.name}
                className="h-24"
              />
              <Link
                href={`/buscar?lat=${venue.lat}&lng=${venue.lng}&sort=distance`}
                className="inline-flex text-xs font-medium text-neutral-700 underline"
              >
                Ver en buscar
              </Link>
              <p className="text-xs text-neutral-500">{venue.address}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_300px]">
        <section className="space-y-4">
          <GymMobileSectionTabs
            sections={[
              { id: "resumen", label: "Resumen" },
              { id: "servicios", label: "Servicios" },
              { id: "galeria", label: "Galería" },
              { id: "planes", label: "Planes" },
              { id: "ubicacion", label: "Ubicación" },
            ]}
          />
          <div id="galeria" className="grid gap-2 scroll-mt-24 md:grid-cols-[2fr_1fr]">
            {mainPhoto ? (
              <img
                src={mainPhoto}
                alt={`Foto principal de ${venue.name}`}
                className="h-44 w-full rounded-2xl bg-neutral-200 object-cover md:h-56"
              />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-2xl bg-neutral-200 text-sm text-neutral-500 md:h-56">
                Foto principal
              </div>
            )}
            <div className="grid gap-2">
              {extraPhotos[0] ? (
                <img
                  src={extraPhotos[0]}
                  alt={`Foto secundaria de ${venue.name}`}
                  className="h-[108px] w-full rounded-2xl bg-neutral-200 object-cover"
                />
              ) : (
                <div className="flex h-[108px] items-center justify-center rounded-2xl bg-neutral-200 text-xs text-neutral-500">
                  Foto 2
                </div>
              )}
              <div className="flex h-[108px] items-center justify-center rounded-2xl bg-neutral-500 text-xs font-medium text-white">
                {galleryPhotos.length > 0
                  ? `Ver ${galleryPhotos.length} fotos`
                  : "Sin fotos cargadas"}
              </div>
            </div>
          </div>

          <UICard id="resumen" className="space-y-3 border-neutral-200 bg-white scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[34px] font-semibold leading-none tracking-tight text-neutral-900">
                {venue.name}
              </h1>
              <UIBadge variant={vBadge.tone === "ok" ? "success" : "neutral"}>
                {vBadge.label}
              </UIBadge>
              {allowsTrial ? <UIBadge variant="neutral">⭐ Destacado</UIBadge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span>◉ {venue.address}</span>
              <span>•</span>
              <span>◷ Lun–Dom · 5am–11pm</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
              <span>★ 4.8 (203)</span>
              <span>{formatPrice(venue)}</span>
            </div>
            {venue.activePromotionTitle ? (
              <UIBanner variant="warning">Promo: {venue.activePromotionTitle}</UIBanner>
            ) : null}
            {venue.description ? (
              <p className="text-sm text-neutral-600">{venue.description}</p>
            ) : null}
          </UICard>

          <UICard id="servicios" className="space-y-3 border-neutral-200 bg-white scroll-mt-24">
            <h2 className="text-sm font-semibold text-neutral-700">Servicios y amenidades</h2>
            <div className="flex flex-wrap gap-2">
              {amenityList.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                >
                  <span className="text-emerald-600">✓</span> {item}
                </span>
              ))}
              {modalityList.map((item) => (
                <span
                  key={`mod-${item}`}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </UICard>

          <UICard id="planes" className="space-y-3 border-neutral-200 bg-white scroll-mt-24">
            <h2 className="text-sm font-semibold text-neutral-700">Planes disponibles</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-sm text-neutral-600">Mensualidad básica</p>
                <p className="text-3xl font-semibold text-neutral-900">
                  ${venue.priceMin ?? 45}
                  <span className="ml-1 text-xs font-normal text-neutral-500">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  <li>✓ Acceso full equipos</li>
                  <li>✓ Vestuarios</li>
                  <li>✓ Lun–Dom</li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 px-3 py-2 text-xs"
                >
                  Más información
                </Link>
              </article>
              <article className="rounded-2xl border border-neutral-900 bg-white p-3 shadow-sm">
                <p className="text-xs text-neutral-600">⭐ Más popular</p>
                <p className="text-sm text-neutral-600">Mensualidad premium</p>
                <p className="text-3xl font-semibold text-neutral-900">
                  ${venue.priceMax ?? 75}
                  <span className="ml-1 text-xs font-normal text-neutral-500">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  <li>✓ Todo lo básico</li>
                  <li>✓ Clases grupales</li>
                  <li>✓ Acceso sauna + parking</li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Solicitar este plan
                </Link>
              </article>
              <article className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-sm text-neutral-600">Trimestral</p>
                <p className="text-3xl font-semibold text-neutral-900">
                  ${Math.max((venue.priceMax ?? 75) * 2, 180)}
                  <span className="ml-1 text-xs font-normal text-neutral-500">/3m</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  <li>✓ Plan premium</li>
                  <li>✓ 3 meses</li>
                  <li>✓ Ahorro aplicado</li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 px-3 py-2 text-xs"
                >
                  Más información
                </Link>
              </article>
            </div>
            <p className="text-xs text-neutral-500">
              * Precios orientativos en USD equivalente. Consulta al centro para confirmar.
            </p>
          </UICard>

          <UICard className="space-y-3 border-neutral-200 bg-white">
            <h2 className="text-sm font-semibold text-neutral-700">Horarios</h2>
            <div className="grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Lunes – Viernes <span className="float-right">5:00am – 11:00pm</span></div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Sábado <span className="float-right">6:00am – 8:00pm</span></div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Domingo <span className="float-right">7:00am – 2:00pm</span></div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Feriados <span className="float-right">Horario reducido</span></div>
            </div>
          </UICard>

          <UICard id="ubicacion" className="space-y-3 border-neutral-200 bg-white scroll-mt-24">
            <h2 className="text-sm font-semibold text-neutral-700">Ubicación</h2>
            <GymLocationMap
              lat={venue.lat}
              lng={venue.lng}
              name={venue.name}
              className="h-44"
            />
            <Link
              href={`/buscar?lat=${venue.lat}&lng=${venue.lng}&sort=distance`}
              className="inline-flex text-xs font-medium text-neutral-700 underline"
            >
              Ver en buscar
            </Link>
            <p className="text-xs text-neutral-500">{venue.address}</p>
          </UICard>
        </section>

        <aside className="space-y-3">
          <UICard className="sticky top-4 space-y-3 border-neutral-200 bg-white">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-200 text-[10px] text-neutral-500">
              Logo
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-semibold text-neutral-900">{venue.name}</h3>
              <p className="text-xs text-neutral-600">★ 4.8 (203)</p>
            </div>
            <div className="space-y-1 border-y border-neutral-100 py-2 text-xs text-neutral-500">
              <p>{venue.zone}, Caracas · ~800m</p>
              <p>Hoy: 5:00am – 11:00pm</p>
            </div>
            <Link href="#contactar-modal">
              <UIButton className="w-full">Solicitar información</UIButton>
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#3FA76A] px-3 py-2 text-sm font-medium text-white hover:bg-[#348e5a]"
              >
                ☏ Contactar por WhatsApp ahora
              </a>
            ) : null}
            <Link
              href="#reportar-modal"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Reportar datos incorrectos
            </Link>
            <div className="grid grid-cols-2 gap-2">
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  ☎ Llamar
                </a>
              ) : null}
              {emailHref ? (
                <a
                  href={emailHref}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  ✉ Email
                </a>
              ) : null}
            </div>
            <Link
              href={`/comparar?c=${encodeURIComponent(venue.slug)}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 hover:bg-white"
            >
              + Agregar al comparador
            </Link>
            <p className="text-center text-[11px] text-neutral-400">
              {BRAND_NAME} no procesa pagos. Contacta directo con el centro.
            </p>
          </UICard>
        </aside>
      </div>

      <section id="solicitar-info">
        <GymContactSection
          slug={venue.slug}
          venueName={venue.name}
          allowsTrial={allowsTrial}
          contactWhatsapp={venue.contactWhatsapp}
        />
      </section>

    </main>
  );
}

function verificationBadge(status: string | undefined): {
  label: string;
  tone: "ok" | "partner" | "ref";
} {
  switch (status) {
    case "floit_verified":
      return { label: `Verificado ${BRAND_NAME}`, tone: "ok" };
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
