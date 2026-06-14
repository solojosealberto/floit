import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UIButton, UICard } from "@floit/ui";
import { BRAND_NAME, BRAND_PARTNERS } from "@/lib/brand";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export const metadata: Metadata = {
  title: BRAND_PARTNERS,
  robots: { index: false, follow: false },
};

type VenueItem = {
  venueSlug: string;
  status: string;
};

export default async function PartnerEntryPage() {
  const auth = await getPartnerAuthHeader();
  const localPartnerLoginEnabled =
    process.env.PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localPartnerLoginEnabled) {
      redirect("/partner/login");
    }
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <UICard className="space-y-3 border-quegym-border">
          <h1 className="text-lg font-semibold text-quegym-primary">
            Acceso partner requerido
          </h1>
          <p className="text-sm text-quegym-secondary">
            Inicia sesión para acceder al panel de partner.
          </p>
          <Link href="/partner/login">
            <UIButton>Ir a login partner</UIButton>
          </Link>
        </UICard>
      </main>
    );
  }

  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  let items: VenueItem[] = [];
  try {
    const res = await fetch(`${base}/v1/partner/me/venues`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as {
      items?: VenueItem[];
    };
    if (res.ok) {
      items = body.items ?? [];
    }
  } catch {
    // If upstream is temporarily unavailable, fall back to selector page.
    redirect("/partner/venues");
  }

  const active = items.find((it) => it.status === "active") ?? items[0];
  if (active?.venueSlug) {
    redirect(`/partner/panel?venueSlug=${encodeURIComponent(active.venueSlug)}`);
  }

  const partnerEmail =
    auth.headerName === "x-partner-email" ? auth.headerValue : null;
  const displayName = partnerEmail
    ? partnerEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Partner";

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6 md:max-w-2xl md:py-10">
      <header className="mb-6 flex items-center justify-between gap-3 border-b border-quegym-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-quegym-accent text-sm font-bold text-white shadow-[var(--qg-shadow-accent)]">
            Q
          </span>
          <span className="text-sm font-medium text-quegym-secondary">Partner</span>
        </div>
        <h1 className="text-base font-bold text-quegym-primary md:text-lg">Mi cuenta</h1>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-quegym-secondary"
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </span>
      </header>

      <section className="mb-8 flex items-start justify-between gap-3 border-b border-quegym-border pb-6">
        <div>
          <p className="text-xs text-quegym-secondary">Partner workspace</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-quegym-primary md:text-2xl">
            {displayName}
          </p>
          <p className="mt-0.5 text-sm text-quegym-secondary">
            {partnerEmail ?? "Sesión partner activa"}
          </p>
        </div>
        <Link
          href="/partner/configuracion"
          className="qg-btn-ghost qg-motion flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-quegym-secondary"
          aria-label="Configuración"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      </section>

      <div className="flex flex-col items-center text-center">
        <div className="qg-surface-subtle mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-quegym-subtle md:h-28 md:w-28">
          <svg
            className="h-12 w-12 text-quegym-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-quegym-primary md:text-2xl">
          No tienes centros registrados
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-quegym-secondary md:text-base">
          Comienza reclamando tu gimnasio existente o registra uno nuevo para
          empezar a recibir leads.
        </p>
        <Link href="/partner/claim" className="mt-8 block w-full max-w-md">
          <UIButton className="w-full justify-center rounded-xl py-3.5 text-base font-semibold">
            + Agregar mi primer centro
          </UIButton>
        </Link>
      </div>

      <UICard className="qg-surface mt-10 bg-quegym-subtle p-5 md:p-6">
        <h3 className="text-base font-semibold text-quegym-primary">
          ¿Qué puedes hacer con {BRAND_NAME}?
        </h3>
        <ul className="mt-4 space-y-3 text-left text-sm text-quegym-primary">
          {[
            "Aumenta tu visibilidad en Caracas",
            "Recibe leads de clientes potenciales",
            "Gestiona múltiples centros desde un panel",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-quegym-accent text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {line}
            </li>
          ))}
        </ul>
      </UICard>

      <div className="mt-8 flex flex-wrap justify-center gap-3 pb-8">
        <Link href="/partner/venues">
          <UIButton variant="secondary" className="rounded-xl">
            Ver mis centros
          </UIButton>
        </Link>
      </div>
    </main>
  );
}
