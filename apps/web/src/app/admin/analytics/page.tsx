import type { Metadata } from "next";
import Link from "next/link";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export const metadata: Metadata = {
  title: "Analytics (MVP)",
  robots: { index: false, follow: false },
};

type FunnelResponse = {
  windowHours: number;
  events: number;
  funnel: {
    discoveryViews: number;
    filterApplies: number;
    venueViews: number;
    compareOpens: number;
    ctaClicks: number;
    leadSubmits: number;
    directContacts: number;
    leadPersisted: number;
  };
  rates: {
    searchToProfileRate: number;
    compareAdoptionRate: number;
    profileToLeadSubmitRate: number;
    profileToCtaRate: number;
  };
  segments: {
    zones: { zone: string; count: number }[];
    devices: { device: string; count: number }[];
    sources: { source: string; count: number }[];
  };
  topVenues: { venueSlug: string; count: number }[];
  experiments: {
    ctaLeadForm: {
      variant: string;
      assignments: number;
      ctaClicks: number;
      leadSubmits: number;
      submitRateFromAssignments: number;
      submitRateFromClicks: number;
    }[];
  };
};

type TimeseriesResponse = {
  windowDays: number;
  points: {
    date: string;
    discoveryViews: number;
    venueViews: number;
    compareOpens: number;
    ctaClicks: number;
    leadSubmits: number;
    leadPersisted: number;
  }[];
};

type LeadsSlaSummary = {
  windowHours: number;
  targetMinutes: number;
  totalLeads: number;
  contactedLeads: number;
  contactedWithinTarget: number;
  partnerSlaRate: number;
  averageFirstResponseMinutes: number | null;
};

type CtaExperimentResponse = {
  experiment: string;
  windowDays: number;
  stableDaysWithBothVariants: number;
  stableDaysWithAllVariants: number;
  summary: {
    membership: {
      assignments: number;
      leadSubmits: number;
      submitRateFromAssignments: number;
    };
    trial: {
      assignments: number;
      leadSubmits: number;
      submitRateFromAssignments: number;
    };
    whatsapp_first: {
      assignments: number;
      leadSubmits: number;
      submitRateFromAssignments: number;
    };
    upliftTrialVsMembership: number;
    upliftWhatsappVsMembership: number;
  };
};

export default async function AdminAnalyticsPage(props: {
  searchParams: Promise<{ windowHours?: string }>;
}) {
  const auth = getAdminAuthHeader();
  const analyticsBase = process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:4014";
  const searchParams = await props.searchParams;
  const windowHours = Number(searchParams.windowHours ?? "168");
  const windowSafe = Number.isFinite(windowHours)
    ? Math.max(1, Math.min(24 * 30, Math.floor(windowHours)))
    : 168;

  if (!auth) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Analytics</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-neutral-100 px-1">
            ADMIN_OIDC_ACCESS_TOKEN
          </code>{" "}
          (recomendado) o{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code> en{" "}
          <code className="rounded bg-neutral-100 px-1">apps/web</code>.
        </p>
      </main>
    );
  }

  let err: string | null = null;
  let data: FunnelResponse | null = null;
  let timeseries: TimeseriesResponse | null = null;
  let leadsSla: LeadsSlaSummary | null = null;
  let ctaExperiment: CtaExperimentResponse | null = null;
  const leadsBase = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  try {
    const [funnelRes, timeseriesRes, ctaExperimentRes, slaRes] = await Promise.all([
      fetch(`${analyticsBase}/v1/metrics/funnel?windowHours=${windowSafe}`, {
        cache: "no-store",
      }),
      fetch(
        `${analyticsBase}/v1/metrics/timeseries?windowDays=${Math.max(1, Math.min(90, Math.ceil(windowSafe / 24)))}`,
        { cache: "no-store" },
      ),
      fetch(
        `${analyticsBase}/v1/metrics/experiments/cta-lead-form?windowDays=${Math.max(1, Math.min(90, Math.ceil(windowSafe / 24)))}`,
        { cache: "no-store" },
      ),
      fetch(
        `${leadsBase}/v1/admin/leads/sla-summary?windowHours=${windowSafe}&targetMinutes=120`,
        {
          cache: "no-store",
          headers: { [auth.headerName]: auth.headerValue },
        },
      ),
    ]);
    if (!funnelRes.ok) {
      err = `HTTP ${funnelRes.status}`;
    } else {
      data = (await funnelRes.json()) as FunnelResponse;
      if (timeseriesRes.ok) {
        timeseries = (await timeseriesRes.json()) as TimeseriesResponse;
      }
      if (ctaExperimentRes.ok) {
        ctaExperiment = (await ctaExperimentRes.json()) as CtaExperimentResponse;
      }
      if (slaRes.ok) {
        leadsSla = (await slaRes.json()) as LeadsSlaSummary;
      }
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  if (err || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm">
        <h1 className="text-lg font-semibold">Analytics MVP</h1>
        <p className="mt-2 text-red-600">No se pudo cargar: {err ?? "unknown"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Analytics MVP</h1>
        <p className="text-sm text-neutral-500">
          Sprint 5: funnel US-6.1/US-6.2 con segmentación por zona, dispositivo y
          fuente.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/admin/leads">
            ← Volver a operación
          </Link>
          <Link className="underline" href={`/admin/analytics?windowHours=24`}>
            24h
          </Link>
          <Link className="underline" href={`/admin/analytics?windowHours=168`}>
            7d
          </Link>
          <Link className="underline" href={`/admin/analytics?windowHours=720`}>
            30d
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Eventos" value={String(data.events)} />
        <MetricCard label="Search → Profile" value={formatRate(data.rates.searchToProfileRate)} />
        <MetricCard label="Profile → Lead" value={formatRate(data.rates.profileToLeadSubmitRate)} />
        <MetricCard label="Adopción comparador" value={formatRate(data.rates.compareAdoptionRate)} />
        <MetricCard
          label="SLA partner (<=120m)"
          value={leadsSla ? formatRate(leadsSla.partnerSlaRate) : "N/D"}
        />
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Funnel</h2>
        <table className="w-full min-w-[620px] text-left text-sm">
          <tbody>
            <Row label="Discovery views" value={data.funnel.discoveryViews} />
            <Row label="Filter applies" value={data.funnel.filterApplies} />
            <Row label="Venue views" value={data.funnel.venueViews} />
            <Row label="Compare opens" value={data.funnel.compareOpens} />
            <Row label="CTA clicks" value={data.funnel.ctaClicks} />
            <Row label="Lead submits" value={data.funnel.leadSubmits} />
            <Row label="Direct contact clicks" value={data.funnel.directContacts} />
            <Row label="Lead persisted" value={data.funnel.leadPersisted} />
          </tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <ListCard
          title="Top zonas"
          empty="Sin datos de zona aún."
          items={data.segments.zones.slice(0, 10).map((r) => `${r.zone}: ${r.count}`)}
        />
        <ListCard
          title="Dispositivos"
          empty="Sin datos de dispositivo."
          items={data.segments.devices.map((r) => `${r.device}: ${r.count}`)}
        />
        <ListCard
          title="Fuentes (paths)"
          empty="Sin fuente de navegación."
          items={data.segments.sources.slice(0, 10).map((r) => `${r.source}: ${r.count}`)}
        />
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Top venues por eventos</h2>
        {data.topVenues.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin venues agregados en la ventana.</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {data.topVenues.map((item) => (
              <li key={item.venueSlug} className="flex items-center justify-between">
                <Link className="underline" href={`/gyms/${item.venueSlug}`}>
                  {item.venueSlug}
                </Link>
                <span className="text-neutral-600">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Experimento CTA lead form (US-6.3)</h2>
        {data.experiments.ctaLeadForm.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Sin datos de variantes A/B en la ventana seleccionada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Variante</th>
                  <th className="px-2 py-2 font-medium">Asignaciones</th>
                  <th className="px-2 py-2 font-medium">CTA clicks</th>
                  <th className="px-2 py-2 font-medium">Lead submits</th>
                  <th className="px-2 py-2 font-medium">Submit / Asignación</th>
                  <th className="px-2 py-2 font-medium">Submit / Click</th>
                </tr>
              </thead>
              <tbody>
                {data.experiments.ctaLeadForm.map((row) => (
                  <tr key={row.variant} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2">{row.variant}</td>
                    <td className="px-2 py-2">{row.assignments}</td>
                    <td className="px-2 py-2">{row.ctaClicks}</td>
                    <td className="px-2 py-2">{row.leadSubmits}</td>
                    <td className="px-2 py-2">{formatRate(row.submitRateFromAssignments)}</td>
                    <td className="px-2 py-2">{formatRate(row.submitRateFromClicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Decisión automática A/B</h2>
        {!ctaExperiment ? (
          <p className="text-sm text-neutral-500">Sin datos de experimento.</p>
        ) : (
          <DecisionCard experiment={ctaExperiment} />
        )}
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">SLA de respuesta partner</h2>
        {!leadsSla ? (
          <p className="text-sm text-neutral-500">
            Sin datos SLA (verifica `leads-service` y auth admin).
          </p>
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Leads ventana" value={String(leadsSla.totalLeads)} />
            <Stat label="Leads contactados" value={String(leadsSla.contactedLeads)} />
            <Stat
              label="Contactados <=120m"
              value={String(leadsSla.contactedWithinTarget)}
            />
            <Stat
              label="SLA rate"
              value={formatRate(leadsSla.partnerSlaRate)}
            />
            <Stat
              label="Promedio 1ra respuesta"
              value={
                leadsSla.averageFirstResponseMinutes != null
                  ? `${leadsSla.averageFirstResponseMinutes} min`
                  : "N/D"
              }
            />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Serie diaria (funnel)</h2>
        {!timeseries || timeseries.points.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin puntos en la ventana seleccionada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Fecha</th>
                  <th className="px-2 py-2 font-medium">Discovery</th>
                  <th className="px-2 py-2 font-medium">Ficha</th>
                  <th className="px-2 py-2 font-medium">Comparador</th>
                  <th className="px-2 py-2 font-medium">CTA</th>
                  <th className="px-2 py-2 font-medium">Lead submit</th>
                  <th className="px-2 py-2 font-medium">Lead persisted</th>
                </tr>
              </thead>
              <tbody>
                {timeseries.points.map((point) => (
                  <tr
                    key={point.date}
                    className="border-b border-neutral-100 dark:border-neutral-900"
                  >
                    <td className="px-2 py-2">{point.date}</td>
                    <td className="px-2 py-2">{point.discoveryViews}</td>
                    <td className="px-2 py-2">{point.venueViews}</td>
                    <td className="px-2 py-2">{point.compareOpens}</td>
                    <td className="px-2 py-2">{point.ctaClicks}</td>
                    <td className="px-2 py-2">{point.leadSubmits}</td>
                    <td className="px-2 py-2">{point.leadPersisted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-xs text-neutral-500">{props.label}</p>
      <p className="mt-1 text-lg font-semibold">{props.value}</p>
    </article>
  );
}

function Row(props: { label: string; value: number }) {
  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-900">
      <td className="px-2 py-2 text-neutral-600">{props.label}</td>
      <td className="px-2 py-2 font-medium">{props.value}</td>
    </tr>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <article className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
      <p className="text-xs text-neutral-500">{props.label}</p>
      <p className="mt-1 font-medium">{props.value}</p>
    </article>
  );
}

function DecisionCard(props: { experiment: CtaExperimentResponse }) {
  const minAssignments = 30;
  const minStableDays = 7;
  const minUplift = 0.02;
  const trial = props.experiment.summary.trial;
  const membership = props.experiment.summary.membership;
  const whatsapp = props.experiment.summary.whatsapp_first;
  const upliftTrial = props.experiment.summary.upliftTrialVsMembership;
  const upliftWhatsapp = props.experiment.summary.upliftWhatsappVsMembership;
  const sampleReady =
    trial.assignments >= minAssignments &&
    membership.assignments >= minAssignments &&
    whatsapp.assignments >= minAssignments;
  const stableReady = props.experiment.stableDaysWithAllVariants >= minStableDays;
  const bestVariant = [trial, whatsapp].sort(
    (a, b) => b.submitRateFromAssignments - a.submitRateFromAssignments,
  )[0];
  const bestName = bestVariant === trial ? "trial" : "whatsapp_first";
  const bestUplift =
    bestName === "trial" ? upliftTrial : upliftWhatsapp;
  const upliftReady = bestUplift >= minUplift;
  const isGo = sampleReady && stableReady && upliftReady;

  return (
    <div className="space-y-2 text-sm">
      <p>
        Estado:{" "}
        <span className={isGo ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
          {isGo
            ? `GO ${bestName} como ganador provisional`
            : "NO-GO (seguir recolectando datos)"}
        </span>
      </p>
      <p className="text-neutral-600 dark:text-neutral-400">
        Criterios: asignaciones por variante &gt;= {minAssignments}, días estables con 3 variantes &gt;= {minStableDays}, uplift del mejor candidato
        vs membership &gt;= {(minUplift * 100).toFixed(1)}%.
      </p>
      <ul className="space-y-1 text-neutral-700 dark:text-neutral-300">
        <li>
          Asignaciones: membership={membership.assignments}, trial={trial.assignments}, whatsapp_first={whatsapp.assignments}
        </li>
        <li>
          Días estables con ambas variantes: {props.experiment.stableDaysWithBothVariants}
        </li>
        <li>
          Días estables con 3 variantes: {props.experiment.stableDaysWithAllVariants}
        </li>
        <li>
          Uplift trial vs membership: {formatRate(upliftTrial)}
        </li>
        <li>
          Uplift whatsapp_first vs membership: {formatRate(upliftWhatsapp)}
        </li>
      </ul>
    </div>
  );
}

function ListCard(props: { title: string; items: string[]; empty: string }) {
  return (
    <article className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-2 text-sm font-semibold">{props.title}</h3>
      {props.items.length === 0 ? (
        <p className="text-sm text-neutral-500">{props.empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
