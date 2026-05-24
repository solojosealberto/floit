import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UIBadge, UIButton, UICard } from "@floit/ui";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

type LeadRow = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  status: string;
  suspicious: boolean;
  createdAt: string;
};

type ClaimRow = {
  id: string;
  venueSlug: string;
  representativeName: string;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
};

type SlaSummary = {
  totalLeads: number;
  contactedLeads: number;
  contactedWithinTarget: number;
  partnerSlaRate: number;
};

type CatalogList = { items?: Array<{ slug: string }> };

export default async function AdminDashboardPage() {
  const auth = await getAdminAuthHeader();
  const localAdminLoginEnabled =
    process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";
  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard admin</h1>
        <p className="mt-2">
          Configura <code className="rounded bg-neutral-100 px-1">ADMIN_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code>.
        </p>
      </main>
    );
  }

  const leadsBase = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";

  let leads: LeadRow[] = [];
  let claims: ClaimRow[] = [];
  let sla: SlaSummary | null = null;
  let publishedGyms = 0;
  const warnings: string[] = [];

  const [leadsRes, claimsRes, slaRes, catalogRes] = await Promise.allSettled([
    fetch(`${leadsBase}/v1/admin/leads?limit=100`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    }),
    fetch(`${partnerBase}/v1/admin/partner/claims?limit=100`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    }),
    fetch(`${leadsBase}/v1/admin/leads/sla-summary?windowHours=24&targetMinutes=120`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    }),
    fetch(`${catalogBase}/v1/venues?limit=200`, { cache: "no-store" }),
  ]);

  if (leadsRes.status === "fulfilled") {
    if (leadsRes.value.ok) {
      const leadsData = (await leadsRes.value.json()) as { items?: LeadRow[] };
      leads = leadsData.items ?? [];
    } else {
      warnings.push(`Leads no disponible (HTTP ${leadsRes.value.status}).`);
    }
  } else {
    warnings.push("Leads no disponible (fetch failed).");
  }

  if (claimsRes.status === "fulfilled") {
    if (claimsRes.value.ok) {
      const claimsData = (await claimsRes.value.json()) as { items?: ClaimRow[] };
      claims = claimsData.items ?? [];
    } else {
      warnings.push(`Claims no disponible (HTTP ${claimsRes.value.status}).`);
    }
  } else {
    warnings.push("Claims no disponible (fetch failed).");
  }

  if (slaRes.status === "fulfilled") {
    if (slaRes.value.ok) {
      sla = (await slaRes.value.json()) as SlaSummary;
    } else {
      warnings.push(`SLA no disponible (HTTP ${slaRes.value.status}).`);
    }
  } else {
    warnings.push("SLA no disponible (fetch failed).");
  }

  if (catalogRes.status === "fulfilled") {
    if (catalogRes.value.ok) {
      const c = (await catalogRes.value.json()) as CatalogList;
      publishedGyms = c.items?.length ?? 0;
    } else {
      warnings.push(`Catálogo no disponible (HTTP ${catalogRes.value.status}).`);
    }
  } else {
    warnings.push("Catálogo no disponible (fetch failed).");
  }

  const pendingClaims = claims.filter((c) => c.status === "pending_review").length;
  const leadsReceivedCount = leads.filter((l) => l.status === "received").length;
  const suspiciousLeads = leads.filter((l) => l.suspicious).length;
  const leadsToday = leads.filter((l) => isToday(l.createdAt)).length;
  const profilesIncomplete = Math.max(0, pendingClaims);
  const pendingReview = pendingClaims + (suspiciousLeads > 0 ? 1 : 0);
  const latestLeads = [...leads]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);
  const recentClaims = [...claims]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar
          active="dashboard"
          catalogBadge={pendingClaims}
          leadsBadge={leadsReceivedCount}
        />

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Dashboard operativo</h1>
              <p className="text-sm text-neutral-500">{new Date().toLocaleString("es-VE")}</p>
            </div>
            <div className="flex items-center gap-2">
              <UIBadge>Admin</UIBadge>
              <Link href="/admin">
                <UIButton variant="secondary" size="sm">Actualizar</UIButton>
              </Link>
            </div>
          </header>

          {warnings.length > 0 ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">Dashboard cargado con datos parciales.</p>
              <p>{warnings.join(" ")}</p>
            </div>
          ) : null}

          <div className="mb-4 space-y-2">
            <AlertRow
              tone="amber"
              text={`${pendingReview} items requieren atención`}
              href="/admin/partner-claims"
              action="Revisar"
            />
            <AlertRow
              tone="amber"
              text={`${pendingClaims} claims con evidencia pendiente`}
              href="/admin/partner-claims"
              action="Ver"
            />
            <AlertRow
              tone="rose"
              text={`${suspiciousLeads} leads marcados como sospechosos`}
              href="/admin/leads"
              action="Revisar"
            />
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric title="Gimnasios publicados" value={String(publishedGyms)} subtitle="+ datos de catálogo" />
            <Metric title="Requiere atención" value={String(pendingReview)} subtitle="Pendientes de revisión" accent />
            <Metric title="Leads hoy" value={String(leadsToday)} subtitle="+ vs ayer" />
            <Metric title="Claims en revisión" value={String(pendingClaims)} subtitle="Pendientes" />
            <Metric title="Perfiles incompletos" value={String(profilesIncomplete)} subtitle="< 60% completitud" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
            <UICard className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">Últimos leads recibidos</h2>
                <Link href="/admin/leads" className="text-sm text-neutral-500 underline">Ver todos</Link>
              </div>
              <div className="space-y-2">
                {latestLeads.length === 0 ? (
                  <p className="text-sm text-neutral-500">No hay leads aún.</p>
                ) : (
                  latestLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                        <p className="text-xs text-neutral-500">{lead.venueSlug} · {lead.intent}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">{formatTime(lead.createdAt)}</span>
                        <Link href="/admin/leads">
                          <UIButton variant="secondary" size="sm">Ver</UIButton>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </UICard>

            <div className="space-y-4">
              <UICard className="p-3">
                <h2 className="mb-2 text-base font-semibold">Actividad reciente</h2>
                {recentClaims.length === 0 ? (
                  <p className="text-sm text-neutral-500">Sin actividad reciente.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {recentClaims.map((c) => (
                      <li key={c.id} className="rounded-lg border border-neutral-200 px-3 py-2">
                        <p className="font-medium text-neutral-900">{c.venueSlug}</p>
                        <p className="text-xs text-neutral-500">{c.status} · {formatTime(c.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </UICard>
              <UICard className="p-3">
                <h2 className="mb-2 text-base font-semibold">Accesos rápidos</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Quick href="/admin/catalogo" title="Catálogo" value={String(publishedGyms)} />
                  <Quick href="/admin/leads" title="Leads" value={String(leads.length)} />
                  <Quick href="/admin/partner-claims" title="Taxonomías" value={String(pendingClaims)} />
                  <Quick href="/admin/analytics" title="Métricas" value={sla ? `${Math.round(sla.partnerSlaRate * 100)}%` : "N/D"} />
                </div>
              </UICard>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AlertRow(props: { tone: "amber" | "rose"; text: string; href: string; action: string }) {
  const cls =
    props.tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-rose-200 bg-rose-50 text-rose-900";
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${cls}`}>
      <span>{props.text}</span>
      <Link className="font-semibold underline" href={props.href}>
        {props.action}
      </Link>
    </div>
  );
}

function Metric(props: { title: string; value: string; subtitle: string; accent?: boolean }) {
  return (
    <UICard className={`p-3 ${props.accent ? "border-amber-300" : ""}`}>
      <p className="text-xs text-neutral-500">{props.title}</p>
      <p className="mt-1 text-3xl font-semibold text-neutral-900">{props.value}</p>
      <p className={`text-xs ${props.accent ? "text-amber-700" : "text-emerald-600"}`}>{props.subtitle}</p>
    </UICard>
  );
}

function Quick(props: { href: string; title: string; value: string }) {
  return (
    <Link href={props.href} className="rounded-xl border border-neutral-200 p-2 hover:bg-neutral-50">
      <p className="text-xs text-neutral-500">{props.title}</p>
      <p className="text-lg font-semibold text-neutral-900">{props.value}</p>
    </Link>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
