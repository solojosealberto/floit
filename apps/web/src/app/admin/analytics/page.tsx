import type { Metadata } from "next";
import type { VenueSummary } from "@floit/contracts";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
import {
  AdminAnalyticsDashboard,
  type CtaExperimentPayload,
  type FunnelPayload,
  type LeadsDailyPayload,
  type LeadsSlaPayload,
  type TimeseriesPayload,
} from "./admin-analytics-dashboard";

export const metadata: Metadata = {
  title: "Métricas (admin)",
  robots: { index: false, follow: false },
};

type ClaimRow = { venueSlug: string; status: string };

export default async function AdminAnalyticsPage(props: {
  searchParams: Promise<{ windowHours?: string; device?: string }>;
}) {
  const auth = await getAdminAuthHeader();
  const analyticsBase = process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:4014";
  const leadsBase = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";

  const localAdminLoginEnabled = isAdminLocalPasswordLoginEnabled();

  const searchParams = await props.searchParams;
  const windowHours = Number(searchParams.windowHours ?? "168");
  const windowSafe = Number.isFinite(windowHours)
    ? Math.max(1, Math.min(24 * 30, Math.floor(windowHours)))
    : 168;

  const deviceRaw = searchParams.device?.trim().toLowerCase() ?? "all";
  const device =
    deviceRaw === "mobile" || deviceRaw === "tablet" || deviceRaw === "desktop"
      ? deviceRaw
      : "all";
  const deviceQuery =
    device === "all" ? "" : `&device=${encodeURIComponent(device)}`;

  const windowDays = Math.max(1, Math.min(90, Math.ceil(windowSafe / 24)));

  if (!auth) {
    if (localAdminLoginEnabled) {
      redirect("/admin/login");
    }
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Métricas</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code> en{" "}
          <code className="rounded bg-neutral-100 px-1">apps/web</code>.
        </p>
      </main>
    );
  }

  let err: string | null = null;
  let funnel: FunnelPayload | null = null;
  let timeseries: TimeseriesPayload | null = null;
  let leadsDaily: LeadsDailyPayload | null = null;
  let leadsSla: LeadsSlaPayload | null = null;
  let ctaExperiment: CtaExperimentPayload | null = null;
  const venueNames: Record<string, string> = {};
  let catalogBadge = 0;
  let leadsReceived = 0;
  const pendingClaimSlugs = new Set<string>();

  try {
    const [
      funnelRes,
      timeseriesRes,
      leadsDailyRes,
      ctaExperimentRes,
      slaRes,
      venuesRes,
      claimsRes,
      leadsListRes,
    ] = await Promise.all([
      fetch(
        `${analyticsBase.replace(/\/$/, "")}/v1/metrics/funnel?windowHours=${windowSafe}${deviceQuery}`,
        { cache: "no-store" },
      ),
      fetch(
        `${analyticsBase.replace(/\/$/, "")}/v1/metrics/timeseries?windowDays=${windowDays}${deviceQuery}`,
        { cache: "no-store" },
      ),
      fetch(
        `${leadsBase.replace(/\/$/, "")}/v1/admin/leads/daily-by-channel?windowHours=${windowSafe}`,
        {
          cache: "no-store",
          headers: { [auth.headerName]: auth.headerValue },
        },
      ),
      fetch(
        `${analyticsBase.replace(/\/$/, "")}/v1/metrics/experiments/cta-lead-form?windowDays=${windowDays}`,
        { cache: "no-store" },
      ),
      fetch(
        `${leadsBase.replace(/\/$/, "")}/v1/admin/leads/sla-summary?windowHours=${windowSafe}&targetMinutes=120`,
        {
          cache: "no-store",
          headers: { [auth.headerName]: auth.headerValue },
        },
      ),
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/venues?limit=500&sort=name`, {
        cache: "no-store",
      }),
      fetch(`${partnerBase.replace(/\/$/, "")}/v1/admin/partner/claims?limit=200`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(`${leadsBase.replace(/\/$/, "")}/v1/admin/leads?limit=300`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
    ]);

    if (!funnelRes.ok) {
      err = `analytics funnel HTTP ${funnelRes.status}`;
    } else {
      funnel = (await funnelRes.json()) as FunnelPayload;
      if (!funnel.venuesLeadPerformance) {
        funnel.venuesLeadPerformance = [];
      }
      if (timeseriesRes.ok) {
        timeseries = (await timeseriesRes.json()) as TimeseriesPayload;
      }
      if (leadsDailyRes.ok) {
        leadsDaily = (await leadsDailyRes.json()) as LeadsDailyPayload;
      }
      if (ctaExperimentRes.ok) {
        ctaExperiment = (await ctaExperimentRes.json()) as CtaExperimentPayload;
      }
      if (slaRes.ok) {
        leadsSla = (await slaRes.json()) as LeadsSlaPayload;
      }
      if (claimsRes.ok) {
        const data = (await claimsRes.json()) as { items?: ClaimRow[] };
        for (const c of data.items ?? []) {
          if (c.status === "pending_review") pendingClaimSlugs.add(c.venueSlug);
        }
      }
      if (venuesRes.ok) {
        const data = (await venuesRes.json()) as { items?: VenueSummary[] };
        const items = data.items ?? [];
        for (const v of items) {
          venueNames[v.slug] = v.name;
        }
        catalogBadge = items.filter(
          (v) =>
            v.verificationStatus === "reference" || pendingClaimSlugs.has(v.slug),
        ).length;
      }
      if (leadsListRes.ok) {
        const data = (await leadsListRes.json()) as {
          items?: Array<{ status?: string }>;
        };
        leadsReceived =
          data.items?.filter((x) => x.status === "received").length ?? 0;
      }
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  if (err || !funnel) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <AdminSidebar active="metrics" />
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h1 className="text-lg font-semibold text-neutral-900">Métricas</h1>
            <p className="mt-3 text-sm text-red-600">
              No se pudo cargar: {err ?? "unknown"}. Verifica que{" "}
              <code className="rounded bg-neutral-100 px-1">analytics-service</code>{" "}
              responda en {analyticsBase}.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar
          active="metrics"
          catalogBadge={catalogBadge}
          leadsBadge={leadsReceived}
        />
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <AdminAnalyticsDashboard
            windowHours={windowSafe}
            device={device}
            funnel={funnel}
            timeseries={timeseries ?? { windowDays, points: [] }}
            leadsDaily={leadsDaily ?? { windowHours: windowSafe, points: [] }}
            leadsSla={leadsSla}
            ctaExperiment={ctaExperiment}
            venueNames={venueNames}
          />
        </section>
      </div>
    </main>
  );
}
