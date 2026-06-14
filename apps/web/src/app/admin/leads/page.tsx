import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
import { getAdminEmailFromSession } from "@/lib/admin-session";
import {
  AdminLeadsClient,
  type LeadRow,
  type NotificationFailure,
  type VenueMeta,
} from "./admin-leads-client";

export const metadata: Metadata = {
  title: "Gestión de leads",
  robots: { index: false, follow: false },
};

type ClaimRow = {
  status: "pending_review" | "approved" | "rejected";
};

type CatalogVenues = {
  items?: Array<{ slug: string; name: string; zone: string }>;
};

type SlaSummary = {
  partnerSlaRate: number;
};

export default async function AdminLeadsPage() {
  const auth = await getAdminAuthHeader();
  const sessionEmail = await getAdminEmailFromSession();
  const localAdminLoginEnabled = isAdminLocalPasswordLoginEnabled();

  if (!auth) {
    if (localAdminLoginEnabled) {
      redirect("/admin/login");
    }
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-quegym-secondary">
        <h1 className="text-lg font-semibold text-quegym-primary">Leads</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-quegym-subtle px-1">ADMIN_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o{" "}
          <code className="rounded bg-quegym-subtle px-1">ADMIN_API_TOKEN</code> en{" "}
          <code className="rounded bg-quegym-subtle px-1">apps/web</code>.
        </p>
      </main>
    );
  }

  const leadsBase = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";

  let items: LeadRow[] = [];
  let failures: NotificationFailure[] = [];
  let slaAttentionPct: number | null = null;
  const venueBySlug: Record<string, VenueMeta> = {};
  let catalogBadge = 0;
  let err: string | null = null;

  try {
    const [leadsRes, slaRes, catalogRes, failuresRes, claimsRes] = await Promise.all([
      fetch(`${leadsBase}/v1/admin/leads?limit=500`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(
        `${leadsBase}/v1/admin/leads/sla-summary?windowHours=24&targetMinutes=120`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      ),
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/venues?limit=500`, {
        cache: "no-store",
      }),
      fetch(`${leadsBase}/v1/admin/notifications/failures?limit=50`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(`${partnerBase}/v1/admin/partner/claims?limit=100`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
    ]);

    if (!leadsRes.ok) {
      err = `HTTP ${leadsRes.status}`;
    } else {
      const data = (await leadsRes.json()) as { items?: LeadRow[] };
      items = data.items ?? [];
    }

    if (slaRes.ok) {
      const sla = (await slaRes.json()) as SlaSummary;
      slaAttentionPct = sla.partnerSlaRate * 100;
    }

    if (catalogRes.ok) {
      const c = (await catalogRes.json()) as CatalogVenues;
      for (const v of c.items ?? []) {
        venueBySlug[v.slug] = { name: v.name, zone: v.zone };
      }
    }

    if (failuresRes.ok) {
      const failuresData = (await failuresRes.json()) as {
        items?: NotificationFailure[];
      };
      failures = failuresData.items ?? [];
    }

    if (claimsRes.ok) {
      const claimsData = (await claimsRes.json()) as { items?: ClaimRow[] };
      catalogBadge =
        claimsData.items?.filter((c) => c.status === "pending_review").length ?? 0;
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  if (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm">
        <h1 className="text-lg font-semibold">Leads</h1>
        <p className="mt-2 text-red-600">No se pudo cargar: {err}</p>
        <p className="mt-1 text-quegym-secondary">
          Verifica que leads esté en marcha y que el token OIDC/audiencia coincidan.
        </p>
      </main>
    );
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const leadsToday = items.filter((l) => new Date(l.createdAt) >= startOfToday).length;
  const suspiciousTotal = items.filter((l) => l.suspicious).length;
  const leadsNavBadge = items.filter((l) => l.status === "received").length;

  const displayEmail =
    sessionEmail ?? process.env.ADMIN_LOCAL_LOGIN_EMAIL?.trim() ?? undefined;

  return (
    <main className="min-h-screen bg-quegym-page p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar
          active="leads"
          catalogBadge={catalogBadge > 0 ? catalogBadge : undefined}
          leadsBadge={leadsNavBadge}
          userEmail={displayEmail}
        />
        <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-6">
          <AdminLeadsClient
            items={items}
            venueBySlug={venueBySlug}
            slaAttentionPct={slaAttentionPct}
            leadsToday={leadsToday}
            suspiciousTotal={suspiciousTotal}
            failures={failures}
          />
        </section>
      </div>
    </main>
  );
}
