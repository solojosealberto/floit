import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UIButton } from "@floit/ui";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export const metadata: Metadata = {
  title: "Partner · Mis centros",
  robots: { index: false, follow: false },
};

type VenueItem = {
  venueSlug: string;
  status: string;
  updatedAt: string;
};

type CatalogVenue = {
  slug: string;
  name: string;
  zone: string;
  completenessScore: number | null;
  popularityScore: number;
  verificationStatus: string;
};

type PartnerProfile = {
  partnerEmail?: string;
  businessName?: string | null;
};

export default async function PartnerVenuesPage(props: {
  searchParams: Promise<{ venueSlug?: string }>;
}) {
  const sp = await props.searchParams;
  const auth = await getPartnerAuthHeader();
  const localPartnerLoginEnabled =
    process.env.PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localPartnerLoginEnabled) redirect("/partner/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-neutral-900">Acceso partner requerido</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Inicia sesión para gestionar tus centros.
          </p>
          <Link href="/partner/login" className="mt-4 inline-block">
            <UIButton>Ir a login partner</UIButton>
          </Link>
        </div>
      </main>
    );
  }

  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  const authHeaders = { [auth.headerName]: auth.headerValue };

  let items: VenueItem[] = [];
  let error: string | null = null;
  try {
    const res = await fetch(`${partnerBase.replace(/\/$/, "")}/v1/partner/me/venues`, {
      headers: authHeaders,
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as {
      items?: VenueItem[];
      error?: string;
    };
    if (!res.ok) {
      error = body.error ?? `HTTP ${res.status}`;
    } else {
      items = body.items ?? [];
    }
  } catch {
    error = "upstream_unavailable";
  }

  const selectedSlug =
    sp.venueSlug?.trim() ||
    items.find((it) => it.status === "active")?.venueSlug ||
    items[0]?.venueSlug ||
    "";

  const catalogBySlug = new Map<string, CatalogVenue | null>();
  const leadsBySlug = new Map<string, number>();

  await Promise.all(
    items.map(async (it) => {
      const [cat, leadsRes] = await Promise.all([
        fetchCatalogVenue(catalogBase, it.venueSlug),
        fetch(`${partnerBase.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(it.venueSlug)}/leads?limit=500`, {
          headers: authHeaders,
          cache: "no-store",
        }).catch(() => null),
      ]);
      catalogBySlug.set(it.venueSlug, cat);
      if (leadsRes?.ok) {
        const payload = (await leadsRes.json().catch(() => ({}))) as { items?: unknown[] };
        leadsBySlug.set(it.venueSlug, payload.items?.length ?? 0);
      } else {
        leadsBySlug.set(it.venueSlug, 0);
      }
    }),
  );

  let partnerDisplayName = "Partner";
  if (selectedSlug) {
    const profRes = await fetch(
      `${partnerBase.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(selectedSlug)}/profile`,
      { headers: authHeaders, cache: "no-store" },
    );
    if (profRes.ok) {
      const prof = (await profRes.json()) as PartnerProfile;
      partnerDisplayName =
        prof.businessName?.trim() ||
        prof.partnerEmail?.split("@")[0]?.replace(/\./g, " ") ||
        "Partner";
    }
  } else if (items[0]?.venueSlug) {
    const profRes = await fetch(
      `${partnerBase.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(items[0].venueSlug)}/profile`,
      { headers: authHeaders, cache: "no-store" },
    );
    if (profRes.ok) {
      const prof = (await profRes.json()) as PartnerProfile;
      partnerDisplayName =
        prof.businessName?.trim() ||
        prof.partnerEmail?.split("@")[0]?.replace(/\./g, " ") ||
        "Partner";
    }
  }

  const enriched = items.map((it) => {
    const cat = catalogBySlug.get(it.venueSlug) ?? null;
    const leads = leadsBySlug.get(it.venueSlug) ?? 0;
    const completenessPct =
      cat?.completenessScore == null
        ? null
        : cat.completenessScore <= 1
          ? Math.round(cat.completenessScore * 100)
          : Math.round(cat.completenessScore);
    const rating = popularityToRating(cat?.popularityScore ?? 0);
    const vistas = vistaEstimate(cat?.popularityScore ?? 0);
    const verification = cat?.verificationStatus ?? "";
    const isSelected = it.venueSlug === selectedSlug;
    const variant: "session" | "published" | "review" =
      verification === "reference" ? "review" : isSelected ? "session" : "published";

    return {
      ...it,
      cat,
      leads,
      completenessPct,
      rating,
      vistas,
      verification,
      isSelected,
      variant,
      displayName: cat?.name ?? formatVenueLabel(it.venueSlug),
      subtitle: `${it.venueSlug} · ${zoneLabel(cat?.zone ?? "")}`,
    };
  });

  const reviewCount = enriched.filter((e) => e.variant === "review").length;
  const totalLeads = enriched.reduce((s, e) => s + e.leads, 0);
  const withCompleteness = enriched.filter((e) => e.completenessPct != null);
  const avgCompleteness =
    withCompleteness.length === 0
      ? null
      : Math.round(
          withCompleteness.reduce((s, e) => s + (e.completenessPct ?? 0), 0) / withCompleteness.length,
        );
  const totalVistas = enriched.reduce((s, e) => s + e.vistas, 0);

  const panelBase = (slug: string) => `/partner/panel?venueSlug=${encodeURIComponent(slug)}`;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-8">
      {/* Partner header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Partner workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">{partnerDisplayName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={
              selectedSlug
                ? `${panelBase(selectedSlug)}&section=config`
                : "/partner/configuracion"
            }
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            <span aria-hidden>⚙</span>
            Configuración
          </Link>
          <form action="/partner/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              <span aria-hidden>⎋</span>
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {/* KPI strip */}
      <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="🏢"
          label="Centros"
          value={String(enriched.length)}
          hint={
            enriched.length === 0
              ? ""
              : reviewCount === 0
                ? `${enriched.length} activo${enriched.length !== 1 ? "s" : ""}`
                : `${enriched.length - reviewCount} activo${enriched.length - reviewCount !== 1 ? "s" : ""}, ${reviewCount} en revisión`
          }
        />
        <KpiCard
          icon="💬"
          label="Leads totales"
          value={String(totalLeads)}
          hint="+12 últimos 30 días"
          hintClass="text-emerald-600"
        />
        <KpiCard icon="👁" label="Vistas totales" value={String(totalVistas)} hint="Últimos 30 días" />
        <KpiCard
          icon="✓"
          label="Completitud promedio"
          value={avgCompleteness != null && !Number.isNaN(avgCompleteness) ? `${avgCompleteness}%` : "—"}
          hint={enriched.length ? `Entre tus ${enriched.length} centro${enriched.length !== 1 ? "s" : ""}` : ""}
        />
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          No se pudo cargar tus centros: {error}
        </div>
      ) : null}

      {/* Mis centros */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Mis centros</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Gestiona tus centros y accede a cada panel individual.
            </p>
          </div>
          <Link href="/partner/claim">
            <span className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800">
              <span className="text-lg leading-none">+</span>
              Agregar / Reclamar centro
            </span>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {enriched.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm sm:col-span-2">
              No tienes ownership activo todavía. Usa “Agregar / Reclamar centro” para empezar.
            </div>
          ) : (
            enriched.map((venue) => (
              <VenueCard key={venue.venueSlug} venue={venue} panelBase={panelBase} />
            ))
          )}

          <AddVenuePlaceholderCard />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="mt-12">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">Acciones rápidas</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickActionCard
            href={selectedSlug ? `${panelBase(selectedSlug)}&section=config` : "/partner/configuracion"}
            icon="⚙"
            title="Configuración"
            subtitle="Cuenta y preferencias"
          />
          <QuickActionCard
            href={selectedSlug ? `${panelBase(selectedSlug)}&section=dashboard` : "/partner/panel"}
            icon="📊"
            title="Estadísticas globales"
            subtitle="Todos tus centros"
          />
          <QuickActionCard
            href={selectedSlug ? `${panelBase(selectedSlug)}&section=config&configView=help` : "/partner/configuracion"}
            icon="💬"
            title="Centro de ayuda"
            subtitle="Guías y soporte"
          />
        </div>
      </section>
    </main>
  );
}

function KpiCard(props: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
  hintClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl opacity-90" aria-hidden>
          {props.icon}
        </span>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-neutral-500">{props.label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-neutral-900">{props.value}</p>
      {props.hint ? (
        <p className={`mt-1 text-xs ${props.hintClass ?? "text-neutral-500"}`}>{props.hint}</p>
      ) : null}
    </div>
  );
}

function VenueCard(props: {
  venue: {
    venueSlug: string;
    variant: "session" | "published" | "review";
    displayName: string;
    subtitle: string;
    completenessPct: number | null;
    rating: string;
    leads: number;
    vistas: number;
    isSelected: boolean;
  };
  panelBase: (slug: string) => string;
}) {
  const { venue } = props;
  const v = venue.variant;

  const borderClass =
    v === "session"
      ? "border-emerald-400 bg-emerald-50/50 shadow-[0_1px_0_rgba(16,185,129,0.15)]"
      : v === "review"
        ? "border-amber-300 bg-white shadow-sm"
        : "border-neutral-200 bg-white shadow-sm";

  const buildingIcon = v === "session" ? "text-emerald-600" : "text-neutral-400";

  const metricsMuted = v === "review";

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {v === "session" ? (
            <>
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Activo en sesión
              </span>
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                Publicado
              </span>
            </>
          ) : v === "review" ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
              En revisión
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Publicado
            </span>
          )}
        </div>
        <span className={`text-2xl ${buildingIcon}`} aria-hidden>
          🏢
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-neutral-900">{venue.displayName}</h3>
      <p className="text-sm text-neutral-500">{venue.subtitle}</p>

      {v === "review" ? (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-snug text-amber-950">
          <span aria-hidden>🕐</span>
          <p>
            Cambios pendientes de aprobación. Tu perfil se revisará en las próximas 24–48 horas. Te notificaremos por
            correo cuando esté listo.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricBox
          label="Completitud"
          value={venue.completenessPct != null ? `${venue.completenessPct}%` : "—"}
        />
        <MetricBox label="Rating" value={metricsMuted ? "—" : venue.rating} muted={metricsMuted} />
        <MetricBox label="Leads" value={metricsMuted ? "—" : String(venue.leads)} muted={metricsMuted} />
        <MetricBox label="Vistas" value={metricsMuted ? "—" : String(venue.vistas)} muted={metricsMuted} />
      </div>

      <div className="mt-4 space-y-2">
        {v === "session" ? (
          <>
            <Link
              href={`${props.panelBase(venue.venueSlug)}&section=dashboard`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Abrir dashboard
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={`/gyms/${encodeURIComponent(venue.venueSlug)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              <span aria-hidden>👁</span>
              Ver público
            </Link>
          </>
        ) : v === "review" && venue.isSelected ? (
          <>
            <Link
              href={`${props.panelBase(venue.venueSlug)}&section=dashboard`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Abrir dashboard
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={`/gyms/${encodeURIComponent(venue.venueSlug)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              <span aria-hidden>👁</span>
              Ver público
            </Link>
          </>
        ) : (
          <Link
            href={`/partner/venues?venueSlug=${encodeURIComponent(venue.venueSlug)}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200"
          >
            Cambiar a este centro
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function MetricBox(props: { label: string; value: string; muted?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-2 py-2 text-center ${props.muted ? "border-neutral-100 bg-neutral-50" : "border-neutral-200 bg-white"}`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{props.label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-900">{props.value}</p>
    </div>
  );
}

function AddVenuePlaceholderCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-3xl font-light text-neutral-400 shadow-sm">
        +
      </div>
      <p className="mt-4 text-base font-semibold text-neutral-800">Agregar nuevo centro</p>
      <p className="mt-1 max-w-xs text-sm text-neutral-500">Reclama o registra otro gimnasio</p>
      <Link href="/partner/claim" className="mt-6">
        <span className="inline-flex rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">
          Comenzar
        </span>
      </Link>
    </div>
  );
}

function QuickActionCard(props: { href: string; icon: string; title: string; subtitle: string }) {
  return (
    <Link
      href={props.href}
      className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
    >
      <span className="text-2xl" aria-hidden>
        {props.icon}
      </span>
      <div>
        <p className="font-semibold text-neutral-900">{props.title}</p>
        <p className="text-sm text-neutral-500">{props.subtitle}</p>
      </div>
    </Link>
  );
}

async function fetchCatalogVenue(catalogBase: string, slug: string): Promise<CatalogVenue | null> {
  try {
    const res = await fetch(`${catalogBase.replace(/\/$/, "")}/v1/venues/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CatalogVenue;
  } catch {
    return null;
  }
}

function formatVenueLabel(venueSlug: string): string {
  return venueSlug
    .split("-")
    .map((part) => (part.length > 0 ? `${part[0]!.toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

function zoneLabel(zone: string): string {
  const z = zone.trim();
  if (!z) return "Caracas";
  if (z.includes(",")) return z;
  return `${z}, Miranda`;
}

function popularityToRating(score: number): string {
  const scaled = score <= 1 ? score * 5 : Math.min(5, score / 20);
  const s = Math.min(5, Math.max(1, scaled));
  return s.toFixed(1);
}

function vistaEstimate(popularityScore: number): number {
  const p = popularityScore <= 1 ? popularityScore : popularityScore / 100;
  return Math.max(12, Math.round(80 + p * 420));
}
