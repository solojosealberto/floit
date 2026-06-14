import type { Metadata } from "next";
import { UIBadge, UIBanner, UIButton, UICard } from "@floit/ui";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GymContactSection } from "./gym-contact-section";
import { GymDescriptionBlock } from "./gym-description-block";
import { GymGallery } from "./gym-gallery";
import {
  GymHeaderActionControls,
  GymMobileActionRow,
} from "./gym-action-controls";
import { GymLocationMap } from "./gym-location-map";
import { GymMobileSectionTabs } from "./gym-mobile-section-tabs";
import { VenueViewTracker } from "./venue-view-tracker";
import { VenueImage } from "@floit/ui";
import { MessageCircle, Star } from "lucide-react";
import { VenuePriceDisplay } from "@/components/venue-price-display";
import { FeatureCheck } from "@/components/feature-check";
import { parseVenueDescription } from "@/lib/venue-description";

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
    const parsed = parseVenueDescription(v.description);
    const desc =
      parsed.summary?.slice(0, 155) ??
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

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 bg-quegym-page px-3 py-4 text-quegym-primary lg:px-4">
      <VenueViewTracker slug={venue.slug} />

      <div className="flex items-center justify-between gap-2 border-b border-quegym-border pb-2">
        <div className="flex items-center gap-2 text-xs text-quegym-secondary">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-quegym-accent text-[11px] font-semibold text-white">
            Q
          </span>
          <Link href="/" className="hover:underline">{BRAND_NAME}</Link>
          <span>›</span>
          <Link href={`/buscar?zone=${encodeURIComponent(venue.zone)}`} className="hover:underline">{venue.zone}</Link>
          <span>›</span>
          <span className="text-quegym-primary">{venue.name}</span>
        </div>
        <GymHeaderActionControls slug={venue.slug} venueName={venue.name} />
      </div>

      <section className="lg:hidden">
        <div className="overflow-hidden rounded-3xl border border-quegym-border bg-quegym-elevated shadow-sm">
          <div id="m-galeria" className="relative h-56 scroll-mt-24">
            {galleryPhotos[0] ? (
              <img
                src={galleryPhotos[0]}
                alt={`Foto principal de ${venue.name}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <VenueImage
                src={null}
                name={venue.name}
                modality={modalityList[0] ?? venue.venueType}
                className="h-full w-full"
              />
            )}
            <Link
              href="/buscar"
              className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-quegym-elevated/90 text-sm text-quegym-primary shadow"
            >
              ←
            </Link>
            <a
              href={`/comparar?c=${encodeURIComponent(venue.slug)}`}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-quegym-elevated/90 text-sm text-quegym-primary shadow"
            >
              ⇄
            </a>
            {galleryPhotos.length > 1 ? (
              <div className="absolute bottom-4 left-3 flex items-center gap-1.5">
                {galleryPhotos.slice(1, 4).map((url, idx) => (
                  <img
                    key={`${url}-${idx}`}
                    src={url}
                    alt={`Miniatura ${idx + 2} de ${venue.name}`}
                    className="h-6 w-6 rounded-lg border border-white/80 bg-quegym-elevated object-cover"
                  />
                ))}
                {galleryPhotos.length > 4 ? (
                  <span className="rounded-lg bg-quegym-secondary px-2 py-1 text-[11px] font-medium text-white">
                    +{galleryPhotos.length - 4}
                  </span>
                ) : null}
              </div>
            ) : null}
            {galleryPhotos.length > 0 ? (
              <span className="absolute bottom-4 right-3 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white">
                1 / {galleryPhotos.length}
              </span>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-quegym-border p-4">
            <h1 className="text-2xl font-semibold leading-tight text-quegym-primary">
              {venue.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <UIBadge variant={vBadge.tone === "ok" ? "success" : "neutral"}>
                {vBadge.label}
              </UIBadge>
              {allowsTrial ? (
                <UIBadge variant="neutral">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    Destacado
                  </span>
                </UIBadge>
              ) : null}
            </div>
            <p className="text-xs text-quegym-secondary">
              {venue.address} · {venue.zone}
            </p>
            <VenuePriceDisplay
              priceMin={venue.priceMin}
              priceMax={venue.priceMax}
              variant="card"
              className="max-w-xs"
            />

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
              <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
                Sobre el centro
              </p>
              <GymDescriptionBlock
                description={venue.description}
                fallbackVenueType={venue.venueType}
                fallbackModalities={modalityList}
                fallbackAmenities={amenityList}
              />
            </div>

            <div className="space-y-2 pt-1">
              <Link href="#contactar-modal">
                <UIButton className="w-full !bg-quegym-accent-hover hover:!bg-quegym-accent">
                  Solicitar información
                </UIButton>
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qg-btn-primary qg-motion inline-flex w-full items-center justify-center gap-2 rounded-xl bg-quegym-highlight px-3 py-2.5 text-sm font-medium text-white hover:bg-quegym-highlight-hover"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Contactar por WhatsApp ahora
                </a>
              ) : null}
              <Link
                href="#reportar-modal"
                className="inline-flex w-full items-center justify-center rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm font-medium text-quegym-primary hover:bg-quegym-subtle"
              >
                Reportar datos incorrectos
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-quegym-border pt-3 text-xs text-quegym-secondary">
              <div className="rounded-xl bg-quegym-subtle px-3 py-2">
                <p className="text-[10px] text-quegym-secondary">Horario L–V</p>
                <p>5:00am – 11:00pm</p>
              </div>
              <div className="rounded-xl bg-quegym-subtle px-3 py-2">
                <p className="text-[10px] text-quegym-secondary">Fin de semana</p>
                <p>7:00am – 8:00pm</p>
              </div>
            </div>

            <div id="m-servicios" className="space-y-2 border-t border-quegym-border pt-3 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
                Servicios y amenidades
              </p>
              <div className="flex flex-wrap gap-2">
                {amenityList.map((item) => (
                  <span
                    key={`m-am-${item}`}
                    className="rounded-full border border-quegym-border bg-quegym-subtle px-3 py-1 text-xs text-quegym-primary"
                  >
                    <FeatureCheck>{item}</FeatureCheck>
                  </span>
                ))}
              </div>
            </div>

            <div id="m-planes" className="space-y-3 border-t border-quegym-border pt-3 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
                Planes disponibles
              </p>
              <article className="rounded-2xl border border-quegym-border bg-quegym-elevated p-3">
                <p className="text-sm text-quegym-secondary">Mensualidad básica</p>
                <p className="text-3xl font-semibold text-quegym-primary">
                  ${venue.priceMin ?? 45}
                  <span className="ml-1 text-xs font-normal text-quegym-secondary">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-quegym-secondary">
                  <li><FeatureCheck>Acceso full equipos</FeatureCheck></li>
                  <li><FeatureCheck>Vestuarios incluidos</FeatureCheck></li>
                  <li><FeatureCheck>Lunes a domingo</FeatureCheck></li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-quegym-border px-3 py-2 text-xs"
                >
                  Más información
                </Link>
              </article>
              <article className="rounded-2xl border border-quegym-accent bg-quegym-elevated p-3 shadow-sm">
                <p className="inline-flex items-center gap-1 text-xs text-quegym-secondary">
                  <Star className="h-3 w-3 fill-quegym-highlight text-quegym-highlight" aria-hidden />
                  Más popular
                </p>
                <p className="text-sm text-quegym-secondary">Mensualidad premium</p>
                <p className="text-3xl font-semibold text-quegym-primary">
                  ${venue.priceMax ?? 75}
                  <span className="ml-1 text-xs font-normal text-quegym-secondary">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-quegym-secondary">
                  <li><FeatureCheck>Todo lo básico</FeatureCheck></li>
                  <li><FeatureCheck>Clases grupales ilimitadas</FeatureCheck></li>
                  <li><FeatureCheck>Acceso sauna</FeatureCheck></li>
                  <li><FeatureCheck>Estacionamiento</FeatureCheck></li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="qg-btn-primary qg-motion mt-3 inline-flex w-full items-center justify-center rounded-xl bg-quegym-accent px-3 py-2 text-xs font-medium text-white"
                >
                  Solicitar este plan
                </Link>
              </article>
              <p className="text-xs text-quegym-secondary">
                * Precios orientativos en USD equivalente. Consulta al centro para
                confirmar.
              </p>
            </div>

            <div id="m-ubicacion" className="space-y-3 border-t border-quegym-border pt-3 scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
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
                className="inline-flex text-xs font-medium text-quegym-primary underline"
              >
                Ver en buscar
              </Link>
              <p className="text-xs text-quegym-secondary">{venue.address}</p>
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
          <GymGallery
            name={venue.name}
            venueType={venue.venueType}
            modalities={modalityList}
            photoUrls={galleryPhotos}
          />

          <UICard id="resumen" className="space-y-3 border-quegym-border bg-quegym-elevated scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[34px] font-semibold leading-none tracking-tight text-quegym-primary">
                {venue.name}
              </h1>
              <UIBadge variant={vBadge.tone === "ok" ? "success" : "neutral"}>
                {vBadge.label}
              </UIBadge>
              {allowsTrial ? (
                <UIBadge variant="neutral">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    Destacado
                  </span>
                </UIBadge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-quegym-secondary">
              <span>{venue.address}</span>
              <span>•</span>
              <span>{venue.zone}</span>
            </div>
            <VenuePriceDisplay
              priceMin={venue.priceMin}
              priceMax={venue.priceMax}
              variant="card"
              className="max-w-sm"
            />
            {venue.activePromotionTitle ? (
              <UIBanner variant="warning">Promo: {venue.activePromotionTitle}</UIBanner>
            ) : null}
            <GymDescriptionBlock
              description={venue.description}
              fallbackVenueType={venue.venueType}
              fallbackModalities={modalityList}
              fallbackAmenities={amenityList}
            />
          </UICard>

          <UICard id="servicios" className="space-y-3 border-quegym-border bg-quegym-elevated scroll-mt-24">
            <h2 className="text-sm font-semibold text-quegym-primary">Servicios y amenidades</h2>
            <div className="flex flex-wrap gap-2">
              {amenityList.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-quegym-border bg-quegym-subtle px-3 py-1 text-xs text-quegym-primary"
                >
                  <FeatureCheck>{item}</FeatureCheck>
                </span>
              ))}
              {modalityList.map((item) => (
                <span
                  key={`mod-${item}`}
                  className="rounded-full border border-quegym-border bg-quegym-elevated px-3 py-1 text-xs text-quegym-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          </UICard>

          <UICard id="planes" className="space-y-3 border-quegym-border bg-quegym-elevated scroll-mt-24">
            <h2 className="text-sm font-semibold text-quegym-primary">Planes disponibles</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-quegym-border bg-quegym-elevated p-3">
                <p className="text-sm text-quegym-secondary">Mensualidad básica</p>
                <p className="text-3xl font-semibold text-quegym-primary">
                  ${venue.priceMin ?? 45}
                  <span className="ml-1 text-xs font-normal text-quegym-secondary">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-quegym-secondary">
                  <li><FeatureCheck>Acceso full equipos</FeatureCheck></li>
                  <li><FeatureCheck>Vestuarios</FeatureCheck></li>
                  <li><FeatureCheck>Lun–Dom</FeatureCheck></li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-quegym-border px-3 py-2 text-xs"
                >
                  Más información
                </Link>
              </article>
              <article className="rounded-2xl border border-neutral-900 bg-quegym-elevated p-3 shadow-sm">
                <p className="inline-flex items-center gap-1 text-xs text-quegym-secondary">
                  <Star className="h-3 w-3 fill-quegym-highlight text-quegym-highlight" aria-hidden />
                  Más popular
                </p>
                <p className="text-sm text-quegym-secondary">Mensualidad premium</p>
                <p className="text-3xl font-semibold text-quegym-primary">
                  ${venue.priceMax ?? 75}
                  <span className="ml-1 text-xs font-normal text-quegym-secondary">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-quegym-secondary">
                  <li><FeatureCheck>Todo lo básico</FeatureCheck></li>
                  <li><FeatureCheck>Clases grupales</FeatureCheck></li>
                  <li><FeatureCheck>Acceso sauna + parking</FeatureCheck></li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="qg-btn-primary qg-motion mt-3 inline-flex w-full items-center justify-center rounded-xl bg-quegym-accent px-3 py-2 text-xs font-medium text-white hover:bg-quegym-accent-hover"
                >
                  Solicitar este plan
                </Link>
              </article>
              <article className="rounded-2xl border border-quegym-border bg-quegym-elevated p-3">
                <p className="text-sm text-quegym-secondary">Trimestral</p>
                <p className="text-3xl font-semibold text-quegym-primary">
                  ${Math.max((venue.priceMax ?? 75) * 2, 180)}
                  <span className="ml-1 text-xs font-normal text-quegym-secondary">/3m</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-quegym-secondary">
                  <li><FeatureCheck>Plan premium</FeatureCheck></li>
                  <li><FeatureCheck>3 meses</FeatureCheck></li>
                  <li><FeatureCheck>Ahorro aplicado</FeatureCheck></li>
                </ul>
                <Link
                  href="#contactar-modal"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-quegym-border px-3 py-2 text-xs"
                >
                  Más información
                </Link>
              </article>
            </div>
            <p className="text-xs text-quegym-secondary">
              * Precios orientativos en USD equivalente. Consulta al centro para confirmar.
            </p>
          </UICard>

          <UICard className="space-y-3 border-quegym-border bg-quegym-elevated">
            <h2 className="text-sm font-semibold text-quegym-primary">Horarios</h2>
            <div className="grid gap-2 text-xs text-quegym-secondary sm:grid-cols-2">
              <div className="rounded-lg border border-quegym-border bg-quegym-subtle px-3 py-2">Lunes – Viernes <span className="float-right">5:00am – 11:00pm</span></div>
              <div className="rounded-lg border border-quegym-border bg-quegym-subtle px-3 py-2">Sábado <span className="float-right">6:00am – 8:00pm</span></div>
              <div className="rounded-lg border border-quegym-border bg-quegym-subtle px-3 py-2">Domingo <span className="float-right">7:00am – 2:00pm</span></div>
              <div className="rounded-lg border border-quegym-border bg-quegym-subtle px-3 py-2">Feriados <span className="float-right">Horario reducido</span></div>
            </div>
          </UICard>

          <UICard id="ubicacion" className="space-y-3 border-quegym-border bg-quegym-elevated scroll-mt-24">
            <h2 className="text-sm font-semibold text-quegym-primary">Ubicación</h2>
            <GymLocationMap
              lat={venue.lat}
              lng={venue.lng}
              name={venue.name}
              className="h-44"
            />
            <Link
              href={`/buscar?lat=${venue.lat}&lng=${venue.lng}&sort=distance`}
              className="inline-flex text-xs font-medium text-quegym-primary underline"
            >
              Ver en buscar
            </Link>
            <p className="text-xs text-quegym-secondary">{venue.address}</p>
          </UICard>
        </section>

        <aside className="space-y-3">
          <UICard className="qg-surface qg-motion sticky top-4 space-y-3 border-quegym-border bg-quegym-elevated">
            <div className="mx-auto h-14 w-14 overflow-hidden rounded-2xl">
              <VenueImage
                src={galleryPhotos[0] ?? null}
                name={venue.name}
                modality={modalityList[0] ?? venue.venueType}
                className="h-full w-full"
              />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-semibold text-quegym-primary">{venue.name}</h3>
              <VenuePriceDisplay
                priceMin={venue.priceMin}
                priceMax={venue.priceMax}
                inline
                className="text-xs"
                primaryClassName="font-medium text-quegym-highlight"
                secondaryClassName="text-quegym-secondary"
              />
            </div>
            <div className="space-y-1 border-y border-quegym-border py-2 text-xs text-quegym-secondary">
              <p>{venue.zone}, Caracas · ~800m</p>
              <p>Hoy: 5:00am – 11:00pm</p>
            </div>
            <Link href="#contactar-modal">
              <UIButton className="w-full !bg-quegym-accent-hover hover:!bg-quegym-accent">
                Solicitar información
              </UIButton>
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-quegym-highlight px-3 py-2 text-sm font-medium text-white hover:bg-quegym-highlight-hover"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Contactar por WhatsApp ahora
              </a>
            ) : null}
            <Link
              href="#reportar-modal"
              className="inline-flex w-full items-center justify-center rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-sm font-medium text-quegym-primary hover:bg-quegym-subtle"
            >
              Reportar datos incorrectos
            </Link>
            <div className="grid grid-cols-2 gap-2">
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="inline-flex items-center justify-center rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-xs text-quegym-primary hover:bg-quegym-subtle"
                >
                  ☎ Llamar
                </a>
              ) : null}
              {emailHref ? (
                <a
                  href={emailHref}
                  className="inline-flex items-center justify-center rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-xs text-quegym-primary hover:bg-quegym-subtle"
                >
                  ✉ Email
                </a>
              ) : null}
            </div>
            <Link
              href={`/comparar?c=${encodeURIComponent(venue.slug)}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-xs text-quegym-primary hover:bg-quegym-elevated"
            >
              + Agregar al comparador
            </Link>
            <p className="text-center text-[11px] text-quegym-secondary">
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
