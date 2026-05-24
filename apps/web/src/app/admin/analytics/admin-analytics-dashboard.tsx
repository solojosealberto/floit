"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { UIButton, UICard } from "@floit/ui";

export type VenueLeadRow = {
  venueSlug: string;
  leads: number;
  venueViews: number;
  convRate: number;
};

export type FunnelPayload = {
  windowHours: number;
  device?: string;
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
  venuesLeadPerformance?: VenueLeadRow[];
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

export type TimeseriesPayload = {
  windowDays: number;
  device?: string;
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

export type LeadsDailyPayload = {
  windowHours: number;
  points: { date: string; form: number; whatsapp: number }[];
};

export type LeadsSlaPayload = {
  windowHours: number;
  targetMinutes: number;
  totalLeads: number;
  contactedLeads: number;
  contactedWithinTarget: number;
  partnerSlaRate: number;
  averageFirstResponseMinutes: number | null;
};

export type CtaExperimentPayload = {
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

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatRangeEnd(windowHours: number): string {
  const end = new Date();
  const start = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${start.toLocaleDateString("es-VE", opts)} — ${end.toLocaleDateString("es-VE", opts)}`;
}

/** Stacked leads: WhatsApp (oscuro) · Formulario (gris) — alineado a diseño QueGym */
const CHART_WHATSAPP = "#0a1430";
const CHART_FORM = "#cbd5e1";

const DEVICE_PALETTE: Record<string, string> = {
  mobile: "#0a1430",
  desktop: "#64748b",
  tablet: "#cbd5e1",
  bot: "#94a3b8",
  unknown: "#e2e8f0",
};

function donutSegmentPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  a0: number,
  a1: number,
): string {
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + rOut * Math.cos(a0);
  const y0 = cy + rOut * Math.sin(a0);
  const x1 = cx + rOut * Math.cos(a1);
  const y1 = cy + rOut * Math.sin(a1);
  const x2 = cx + rIn * Math.cos(a1);
  const y2 = cy + rIn * Math.sin(a1);
  const x3 = cx + rIn * Math.cos(a0);
  const y3 = cy + rIn * Math.sin(a0);
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x3} ${y3} Z`;
}

function formatChartDayLabel(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

function deviceLabelEs(device: string): string {
  const m: Record<string, string> = {
    mobile: "Mobile",
    desktop: "Desktop",
    tablet: "Tablet",
    bot: "Bot",
    unknown: "Desconocido",
  };
  return m[device] ?? device;
}

function KpiCard(props: {
  label: string;
  value: string;
  sub?: string;
  hint?: string;
}) {
  return (
    <UICard className="rounded-2xl border border-neutral-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-neutral-500">{props.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
        {props.value}
      </p>
      {props.sub ? (
        <p className="mt-1 text-xs text-neutral-500">{props.sub}</p>
      ) : null}
      {props.hint ? (
        <p className="mt-2 text-xs text-neutral-400">{props.hint}</p>
      ) : null}
    </UICard>
  );
}

function LineComparisonChart(props: {
  points: TimeseriesPayload["points"];
}) {
  const layout = useMemo(() => {
    const pts = props.points;
    if (pts.length === 0) {
      return {
        pathVenue: "",
        pathLead: "",
        maxY: 1,
        xStep: 0,
        padL: 40,
        padT: 28,
        innerH: 144,
        labelStep: 1,
      };
    }
    const w = 560;
    const padL = 40;
    const padR = 16;
    const padT = 28;
    const plotBottom = 172;
    const innerH = plotBottom - padT;
    const innerW = w - padL - padR;
    const maxV = Math.max(1, ...pts.flatMap((p) => [p.venueViews, p.leadSubmits]));
    const xStep = pts.length > 1 ? innerW / (pts.length - 1) : 0;
    const scaleY = (v: number) => padT + innerH - (v / maxV) * innerH;
    let pv = "";
    let pl = "";
    pts.forEach((p, i) => {
      const x = padL + i * xStep;
      const yv = scaleY(p.venueViews);
      const yl = scaleY(p.leadSubmits);
      pv += i === 0 ? `M ${x} ${yv}` : ` L ${x} ${yv}`;
      pl += i === 0 ? `M ${x} ${yl}` : ` L ${x} ${yl}`;
    });
    const labelStep =
      pts.length > 14 ? Math.ceil(pts.length / 7) : pts.length > 10 ? 2 : 1;
    return {
      pathVenue: pv,
      pathLead: pl,
      maxY: maxV,
      xStep,
      padL,
      padT,
      innerH,
      labelStep,
    };
  }, [props.points]);

  if (props.points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Sin puntos en la ventana para esta combinación de filtros.
      </p>
    );
  }

  const { pathVenue, pathLead, maxY, xStep, padL, padT, innerH, labelStep } = layout;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + innerH * (1 - t));

  return (
    <svg
      viewBox="0 0 560 220"
      className="h-auto w-full max-w-full text-neutral-900"
      role="img"
      aria-label="Vistas de ficha y leads por día"
    >
      <rect x="8" y="8" width="544" height="204" fill="#fafafa" rx="8" stroke="#e5e7eb" />
      {gridYs.map((gy) => (
        <line
          key={gy}
          x1={padL}
          x2={560 - 16}
          y1={gy}
          y2={gy}
          stroke="#e8ecf1"
          strokeWidth="1"
        />
      ))}
      {pathVenue ? (
        <path
          d={pathVenue}
          fill="none"
          stroke="#0a1430"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : null}
      {pathLead ? (
        <path
          d={pathLead}
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinejoin="round"
        />
      ) : null}
      <text x="52" y="22" className="fill-neutral-400 text-[10px]">
        máx. {maxY}
      </text>
      {props.points.map((p, i) =>
        i % labelStep === 0 ? (
          <text
            key={p.date}
            x={padL + i * xStep}
            y="208"
            textAnchor="middle"
            className="fill-neutral-500 text-[9px]"
          >
            {formatChartDayLabel(p.date)}
          </text>
        ) : null,
      )}
      <g transform="translate(52, 188)">
        <line x1="0" y1="6" x2="24" y2="6" stroke="#0a1430" strokeWidth="2" />
        <text x="30" y="10" className="fill-neutral-600 text-[10px]">
          Vistas de ficha
        </text>
        <line x1="130" y1="6" x2="154" y2="6" stroke="#64748b" strokeWidth="2" strokeDasharray="4 3" />
        <text x="160" y="10" className="fill-neutral-600 text-[10px]">
          Leads generados
        </text>
      </g>
    </svg>
  );
}

function StackedLeadsChart(props: { points: LeadsDailyPayload["points"] }) {
  const { bars } = useMemo(() => {
    const pts = props.points;
    if (pts.length === 0) return { bars: [] as { x: number; w: number; f: number; wa: number; max: number }[] };
    const max = Math.max(
      1,
      ...pts.map((p) => p.form + p.whatsapp),
    );
    const gap = 4;
    const totalW = 520;
    const w = Math.max(4, (totalW - gap * (pts.length - 1)) / pts.length);
    return {
      bars: pts.map((p, i) => ({
        x: i * (w + gap),
        w,
        f: p.form,
        wa: p.whatsapp,
        max,
      })),
    };
  }, [props.points]);

  if (bars.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Sin leads en la ventana temporal (leads-service).
      </p>
    );
  }

  const yBase = 170;
  const plotTop = 36;
  const gridYs = [0, 0.33, 0.66, 1].map((t) => plotTop + (yBase - plotTop) * (1 - t));

  return (
    <svg viewBox="0 0 560 200" className="h-auto w-full max-w-full" role="img">
      <rect x="8" y="8" width="544" height="184" fill="#fafafa" rx="8" stroke="#e5e7eb" />
      {gridYs.map((gy) => (
        <line
          key={gy}
          x1="20"
          x2="540"
          y1={gy}
          y2={gy}
          stroke="#e8ecf1"
          strokeWidth="1"
        />
      ))}
      {bars.map((b, i) => {
        const hTotal = (yBase - plotTop) * ((b.f + b.wa) / b.max);
        const hWa = b.f + b.wa > 0 ? (b.wa / (b.f + b.wa)) * hTotal : 0;
        const hF = hTotal - hWa;
        return (
          <g key={i}>
            <rect
              x={20 + b.x}
              y={yBase - hTotal}
              width={b.w}
              height={hF}
              fill={CHART_FORM}
              rx="2"
              className="ring-1 ring-neutral-200/60"
            />
            <rect
              x={20 + b.x}
              y={yBase - hWa - hF}
              width={b.w}
              height={hWa}
              fill={CHART_WHATSAPP}
              rx="2"
            />
          </g>
        );
      })}
      <text x="52" y="26" className="fill-neutral-400 text-[10px]">
        máx. {bars[0]?.max ?? 0} leads / día
      </text>
    </svg>
  );
}

function DeviceDonutChart(props: { devices: { device: string; count: number }[] }) {
  const rows = useMemo(() => {
    const list = props.devices.filter((d) => d.count > 0);
    const sum = list.reduce((a, d) => a + d.count, 0) || 1;
    return list.map((d) => ({
      device: d.device,
      count: d.count,
      pct: d.count / sum,
      color: DEVICE_PALETTE[d.device] ?? "#94a3b8",
    }));
  }, [props.devices]);

  const segments = useMemo(() => {
    const cx = 100;
    const cy = 100;
    const rOut = 78;
    const rIn = 48;
    let angle = -Math.PI / 2;
    return rows.map((r) => {
      const sweep = Math.min(r.pct * 2 * Math.PI, 2 * Math.PI - 1e-4);
      const a0 = angle;
      const a1 = angle + sweep;
      angle = a1;
      const path =
        rows.length === 1
          ? donutSegmentPath(cx, cy, rOut, rIn, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI - 1e-4)
          : donutSegmentPath(cx, cy, rOut, rIn, a0, a1);
      return { ...r, path, key: r.device };
    });
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-neutral-500">
        Sin datos de dispositivo.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8 lg:justify-start">
      <svg
        viewBox="0 0 200 200"
        className="h-[min(200px,70vw)] w-[min(200px,70vw)] shrink-0"
        role="img"
        aria-label="Distribución por dispositivo"
      >
        {segments.map((s) => (
          <path key={s.key} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1" />
        ))}
        <circle cx="100" cy="100" r="40" fill="#fafafa" />
        <text
          x="100"
          y="96"
          textAnchor="middle"
          className="fill-neutral-500 text-[10px] font-medium uppercase tracking-wide"
        >
          Eventos
        </text>
        <text x="100" y="118" textAnchor="middle" className="fill-neutral-900 text-lg font-semibold">
          {rows.reduce((a, r) => a + r.count, 0).toLocaleString("es-VE")}
        </text>
      </svg>
      <ul className="w-full min-w-[180px] space-y-2.5 text-sm">
        {rows.map((r) => (
          <li key={r.device} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-neutral-700">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: r.color }}
                aria-hidden
              />
              <span className="truncate capitalize">{deviceLabelEs(r.device)}</span>
            </span>
            <span className="shrink-0 tabular-nums text-neutral-600">
              {(r.pct * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Funnel: ancho relativo a la primera etapa (discovery). */
function FunnelStageChart(props: {
  steps: { key: string; label: string; value: number }[];
}) {
  const base = Math.max(1, props.steps[0]?.value ?? 1);
  return (
    <div className="space-y-3">
      {props.steps.map((s) => {
        const pct = (s.value / base) * 100;
        return (
          <div key={s.key}>
            <div className="mb-1 flex justify-between gap-2 text-xs text-neutral-600">
              <span className="min-w-0 truncate">{s.label}</span>
              <span className="shrink-0 tabular-nums font-medium text-neutral-900">
                {s.value.toLocaleString("es-VE")}{" "}
                <span className="font-normal text-neutral-400">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#0a1430]/85 to-[#64748b]/90 transition-all"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExperimentSubmitRateChart(props: {
  rows: FunnelPayload["experiments"]["ctaLeadForm"];
  winnerVariant: string | null;
}) {
  const maxRate = useMemo(() => {
    if (props.rows.length === 0) return 1;
    return Math.max(0.08, ...props.rows.map((r) => r.submitRateFromAssignments));
  }, [props.rows]);

  if (props.rows.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Tasa de envío / asignación (comparación)
      </p>
      {props.rows.map((row) => {
        const w = (row.submitRateFromAssignments / maxRate) * 100;
        const isWinner =
          props.winnerVariant != null && row.variant === props.winnerVariant;
        return (
          <div key={row.variant}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-neutral-800">{row.variant}</span>
              <span className="tabular-nums text-neutral-600">
                {formatPct(row.submitRateFromAssignments)}
                {isWinner ? (
                  <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                    Mejor en ventana
                  </span>
                ) : null}
              </span>
            </div>
            <div
              className={`h-2.5 overflow-hidden rounded-full bg-neutral-100 ${
                isWinner ? "ring-1 ring-emerald-200/90" : ""
              }`}
            >
              <div
                className={`h-2.5 rounded-full transition-all ${
                  isWinner ? "bg-emerald-600" : "bg-[#0a1430]/80"
                }`}
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyPersistedBars(props: { points: TimeseriesPayload["points"] }) {
  const layout = useMemo(() => {
    const pts = props.points;
    if (pts.length === 0) return { bars: [] as { x: number; w: number; h: number }[], max: 1 };
    const max = Math.max(1, ...pts.map((p) => p.leadPersisted));
    const gap = 3;
    const plotW = 520;
    const w = Math.max(3, (plotW - gap * (pts.length - 1)) / pts.length);
    const bars = pts.map((p, i) => ({
      x: i * (w + gap),
      w,
      h: (p.leadPersisted / max) * 72,
    }));
    return { bars, max };
  }, [props.points]);

  if (props.points.length === 0) return null;

  const { bars, max } = layout;
  const yBase = 92;

  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Leads persistidos por día (mini barras)
      </p>
      <svg viewBox="0 0 560 100" className="h-auto w-full max-w-full text-neutral-900" role="img">
        <rect x="8" y="8" width="544" height="84" fill="#fafafa" rx="6" stroke="#e5e7eb" />
        <text x="20" y="26" className="fill-neutral-400 text-[10px]">
          máx. {max} / día
        </text>
        {bars.map((b, i) => (
          <rect
            key={props.points[i].date}
            x={20 + b.x}
            y={yBase - b.h}
            width={b.w}
            height={b.h}
            fill="#64748b"
            rx="2"
          />
        ))}
      </svg>
    </div>
  );
}

function SlaComplianceDonut(props: { sla: LeadsSlaPayload }) {
  const { ratePath, restPath, rate } = useMemo(() => {
    const r = Math.min(1, Math.max(0, props.sla.partnerSlaRate));
    const cx = 80;
    const cy = 80;
    const rOut = 62;
    const rIn = 44;
    const a0 = -Math.PI / 2;
    const aEnd = a0 + 2 * Math.PI - 1e-4;
    const aSplit = a0 + r * 2 * Math.PI;
    let ratePathInner = "";
    let restPathInner = "";
    if (r <= 0) {
      restPathInner = donutSegmentPath(cx, cy, rOut, rIn, a0, aEnd);
    } else if (r >= 1) {
      ratePathInner = donutSegmentPath(cx, cy, rOut, rIn, a0, aEnd);
    } else {
      ratePathInner = donutSegmentPath(cx, cy, rOut, rIn, a0, aSplit);
      restPathInner = donutSegmentPath(cx, cy, rOut, rIn, aSplit, aEnd);
    }
    return { ratePath: ratePathInner, restPath: restPathInner, rate: r };
  }, [props.sla.partnerSlaRate]);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
      <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0" role="img" aria-label="Cumplimiento SLA">
        {ratePath ? <path d={ratePath} fill="#059669" opacity="0.92" /> : null}
        {restPath ? <path d={restPath} fill="#e5e7eb" /> : null}
        <circle cx="80" cy="80" r="38" fill="#fafafa" />
        <text x="80" y="76" textAnchor="middle" className="fill-neutral-500 text-[9px] font-medium uppercase">
          SLA ≤{props.sla.targetMinutes}m
        </text>
        <text x="80" y="98" textAnchor="middle" className="fill-neutral-900 text-xl font-semibold">
          {formatPct(rate)}
        </text>
      </svg>
      <div className="grid flex-1 grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-1">
        <p>
          <span className="text-neutral-500">Resp. media:</span>{" "}
          <span className="font-medium text-neutral-800">
            {props.sla.averageFirstResponseMinutes != null
              ? `${props.sla.averageFirstResponseMinutes} min`
              : "N/D"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
          Dentro del SLA ({props.sla.contactedWithinTarget} de {props.sla.totalLeads} leads)
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" aria-hidden />
          Resto de la ventana (incl. sin contacto a tiempo)
        </p>
      </div>
    </div>
  );
}

function DataTable(props: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <UICard className="rounded-2xl border border-neutral-200 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{props.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[240px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {props.columns.map((c) => (
                <th key={c} className="pb-2 pr-3">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-50">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`py-2 pr-3 ${j > 0 ? "text-right tabular-nums" : "text-neutral-800"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UICard>
  );
}

const tableHeadRowClass =
  "border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";

function TechnicalSubcard(props: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">{props.title}</h3>
        {props.description ? (
          <p className="mt-1 text-xs text-neutral-500">{props.description}</p>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}

export function AdminAnalyticsDashboard(props: {
  windowHours: number;
  device: string;
  funnel: FunnelPayload;
  timeseries: TimeseriesPayload;
  leadsDaily: LeadsDailyPayload;
  leadsSla: LeadsSlaPayload | null;
  ctaExperiment: CtaExperimentPayload | null;
  venueNames: Record<string, string>;
}) {
  const { funnel: data, timeseries, leadsDaily } = props;
  const f = data.funnel;
  const zones = data.segments.zones;
  const sources = data.segments.sources;
  const zoneTotal = zones.reduce((a, z) => a + z.count, 0) || 1;
  const sourceTotal = sources.reduce((a, s) => a + s.count, 0) || 1;
  const perf = data.venuesLeadPerformance ?? [];
  const discoveryToLead = useMemo(() => {
    if (f.discoveryViews <= 0) return 0;
    return f.leadSubmits / f.discoveryViews;
  }, [f.discoveryViews, f.leadSubmits]);

  const funnelSteps = useMemo(
    () => [
      { key: "discovery", label: "Discovery", value: f.discoveryViews },
      { key: "venue", label: "Vistas de ficha", value: f.venueViews },
      { key: "compare", label: "Comparador", value: f.compareOpens },
      { key: "cta", label: "CTA en ficha", value: f.ctaClicks },
      { key: "leadEvt", label: "Lead (evento)", value: f.leadSubmits },
      { key: "persisted", label: "Lead persistido", value: f.leadPersisted },
    ],
    [
      f.discoveryViews,
      f.venueViews,
      f.compareOpens,
      f.ctaClicks,
      f.leadSubmits,
      f.leadPersisted,
    ],
  );

  const ctaWinnerVariant = useMemo(() => {
    const rows = data.experiments.ctaLeadForm;
    if (rows.length === 0) return null;
    let best = rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].submitRateFromAssignments > best.submitRateFromAssignments) {
        best = rows[i];
      }
    }
    return best.variant;
  }, [data.experiments.ctaLeadForm]);

  const qs = (hours: number, device: string) => {
    const d = device === "all" ? "" : `&device=${encodeURIComponent(device)}`;
    return `windowHours=${hours}${d}`;
  };

  const dateLabel = formatRangeEnd(props.windowHours);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Admin &gt; Métricas</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            Dashboard de métricas MVP
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Datos del período seleccionado · {dateLabel} · Caracas / Distrito Capital
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="whitespace-nowrap">Período</span>
            <select
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={String(props.windowHours)}
              onChange={(e) => {
                const v = e.target.value;
                window.location.href = `/admin/analytics?${qs(Number(v), props.device)}`;
              }}
            >
              <option value="24">Últimas 24 h</option>
              <option value="168">Últimos 7 días</option>
              <option value="720">Últimos 30 días</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="whitespace-nowrap">Dispositivo</span>
            <select
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={props.device}
              onChange={(e) => {
                const d = e.target.value;
                window.location.href = `/admin/analytics?${qs(props.windowHours, d)}`;
              }}
            >
              <option value="all">Todos los dispositivos</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select>
          </label>
          <Link href="/admin/leads">
            <UIButton variant="secondary" size="sm">
              Ir a leads
            </UIButton>
          </Link>
        </div>
      </header>

      <div
        className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950"
        role="status"
      >
        <p className="font-medium">Eventos instrumentados (referencia)</p>
        <p className="mt-1 text-sky-900/90">
          En producción se espera capturar:{" "}
          <code className="rounded bg-white/80 px-1">discovery_view</code> (búsqueda),{" "}
          <code className="rounded bg-white/80 px-1">filter_apply</code>,{" "}
          <code className="rounded bg-white/80 px-1">venue_view</code> (ficha),{" "}
          <code className="rounded bg-white/80 px-1">compare_open</code>,{" "}
          <code className="rounded bg-white/80 px-1">cta_click</code>,{" "}
          <code className="rounded bg-white/80 px-1">lead_submit</code>,{" "}
          <code className="rounded bg-white/80 px-1">direct_contact_click</code>. Los totales
          dependen de tráfico real; el gráfico apilado Formulario/WhatsApp usa datos persistidos
          en <strong>leads-service</strong> (sin filtro por dispositivo).
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Eventos registrados"
          value={data.events.toLocaleString("es-VE")}
          sub="En la ventana y filtro activo"
        />
        <KpiCard
          label="Búsquedas / vistas discovery"
          value={f.discoveryViews.toLocaleString("es-VE")}
          sub={`Filtros aplicados: ${f.filterApplies}`}
        />
        <KpiCard
          label="Fichas vistas"
          value={f.venueViews.toLocaleString("es-VE")}
          sub={
            f.discoveryViews > 0
              ? `${(f.venueViews / f.discoveryViews).toFixed(2)} por vista discovery`
              : undefined
          }
        />
        <KpiCard
          label="Tasa discovery → lead"
          value={formatPct(discoveryToLead)}
          hint="Meta operativa: revisar con producto"
        />
        <KpiCard
          label="Leads generados (eventos)"
          value={f.leadSubmits.toLocaleString("es-VE")}
          sub={`Persistidos: ${f.leadPersisted}`}
        />
        <KpiCard
          label="Comparadores abiertos"
          value={f.compareOpens.toLocaleString("es-VE")}
          sub={
            f.discoveryViews > 0
              ? `${formatPct(f.compareOpens / f.discoveryViews)} de vistas discovery`
              : undefined
          }
        />
        <KpiCard
          label="CTR CTA en ficha"
          value={formatPct(data.rates.profileToCtaRate)}
          sub="Clicks / vistas de ficha"
        />
        <KpiCard
          label="SLA partner (≤120m)"
          value={props.leadsSla ? formatPct(props.leadsSla.partnerSlaRate) : "N/D"}
          sub={
            props.leadsSla?.averageFirstResponseMinutes != null
              ? `Resp. media ${props.leadsSla.averageFirstResponseMinutes} min`
              : undefined
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <UICard className="rounded-2xl border border-neutral-200 p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Leads por día (formulario vs WhatsApp)
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Fuente: leads persistidos por canal (misma ventana; sin filtro por dispositivo).
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-4 text-xs text-neutral-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0a1430]" aria-hidden />
                WhatsApp
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1] ring-1 ring-neutral-200"
                  aria-hidden
                />
                Formulario
              </span>
            </div>
          </div>
          <StackedLeadsChart points={leadsDaily.points} />
        </UICard>
        <UICard className="rounded-2xl border border-neutral-200 p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-neutral-900">
            Distribución por dispositivo
          </h2>
          <p className="mb-4 text-xs text-neutral-500">
            Eventos analytics · filtro actual ({data.device ?? "all"}).
          </p>
          <DeviceDonutChart devices={data.segments.devices} />
        </UICard>
      </section>

      <UICard className="rounded-2xl border border-neutral-200 p-4 shadow-sm md:p-5">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">
          Vistas de ficha y leads por día
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Leyenda dentro del gráfico · línea continua: vistas de ficha · discontinua: leads (evento).
        </p>
        <LineComparisonChart points={timeseries.points} />
      </UICard>

      <section className="grid gap-4 lg:grid-cols-3">
        <DataTable
          title="Leads por gimnasio (top 5)"
          columns={["Gimnasio", "Leads", "Conv %"]}
          rows={
            perf.length === 0
              ? [["Sin datos en ventana", "—", "—"]]
              : perf.map((r) => [
                  props.venueNames[r.venueSlug] ?? r.venueSlug,
                  r.leads,
                  formatPct(r.convRate),
                ])
          }
        />
        <DataTable
          title="Eventos por zona"
          columns={["Zona", "Eventos", "% total"]}
          rows={
            zones.length === 0
              ? [["—", "—", "—"]]
              : zones.slice(0, 5).map((z) => [
                  z.zone,
                  z.count,
                  `${((z.count / zoneTotal) * 100).toFixed(1)}%`,
                ])
          }
        />
        <DataTable
          title="Fuente de tráfico (path)"
          columns={["Fuente", "Sesiones", "%"]}
          rows={
            sources.length === 0
              ? [["—", "—", "—"]]
              : sources.slice(0, 5).map((s) => [
                  s.source.length > 22 ? `${s.source.slice(0, 22)}…` : s.source,
                  s.count,
                  `${((s.count / sourceTotal) * 100).toFixed(1)}%`,
                ])
          }
        />
      </section>

      <details className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow open:shadow-md">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50/90 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Referencia técnica
            </p>
            <h2 className="mt-1 text-sm font-semibold text-neutral-900">
              Detalle técnico: funnel, experimento A/B y SLA
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Conteos raw, variantes del experimento y SLA — mismo período y filtro que el dashboard.
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="mt-1 h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </summary>

        <div className="border-t border-neutral-100 bg-[#f7f9fc]/90 px-4 pb-5 pt-4 md:px-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <TechnicalSubcard
              title="Funnel (conteos)"
              description="Agregados en analytics para la ventana actual."
            >
              <p className="mb-3 text-xs text-neutral-500">
                Anchura relativa a Discovery · caída entre etapas principales.
              </p>
              <FunnelStageChart steps={funnelSteps} />
              <div className="mt-6 overflow-x-auto border-t border-neutral-100 pt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Tabla de referencia
                </p>
                <table className="w-full min-w-[260px] text-sm">
                  <thead>
                    <tr className={tableHeadRowClass}>
                      <th className="pb-2 pr-3">Etapa</th>
                      <th className="pb-2 text-right">Conteo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">Discovery views</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.discoveryViews}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">Filter applies</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.filterApplies}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">Venue views</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.venueViews}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">Compare opens</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.compareOpens}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">CTA clicks</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.ctaClicks}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">Lead submits</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.leadSubmits}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-50">
                      <td className="py-2 pr-3 text-neutral-700">Direct contact clicks</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.directContacts}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 text-neutral-700">Lead persisted</td>
                      <td className="py-2 text-right font-medium tabular-nums text-neutral-900">
                        {f.leadPersisted}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TechnicalSubcard>

            <TechnicalSubcard
              title="SLA respuesta partner"
              description="Fuente: leads-service vía API admin."
            >
              {!props.leadsSla ? (
                <p className="text-sm text-neutral-500">
                  Sin datos (auth admin o leads-service).
                </p>
              ) : (
                <>
                  <SlaComplianceDonut sla={props.leadsSla} />
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-2.5">
                      <p className="text-xs font-medium text-neutral-500">Leads ventana</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-neutral-900">
                        {props.leadsSla.totalLeads}
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-2.5">
                      <p className="text-xs font-medium text-neutral-500">Contactados</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-neutral-900">
                        {props.leadsSla.contactedLeads}
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-2.5">
                      <p className="text-xs font-medium text-neutral-500">
                        ≤{props.leadsSla.targetMinutes} min
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-neutral-900">
                        {props.leadsSla.contactedWithinTarget}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </TechnicalSubcard>
          </div>

          <div className="mt-5 space-y-5">
            <TechnicalSubcard
              title="Experimento CTA (US-6.3)"
              description="Variantes asignadas en la ventana temporal."
            >
              {data.experiments.ctaLeadForm.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin variantes en la ventana.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <table className="min-w-[640px] w-full text-left text-sm">
                    <thead>
                      <tr className={tableHeadRowClass}>
                        <th className="pb-2 pr-3">Variante</th>
                        <th className="pb-2 pr-3 text-right">Asignaciones</th>
                        <th className="pb-2 pr-3 text-right">CTA clicks</th>
                        <th className="pb-2 pr-3 text-right">Lead submits</th>
                        <th className="pb-2 pr-3 text-right">Submit / Asignación</th>
                        <th className="pb-2 text-right">Submit / Click</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.experiments.ctaLeadForm.map((row) => (
                        <tr key={row.variant} className="border-b border-neutral-50">
                          <td className="py-2 pr-3 text-neutral-800">{row.variant}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{row.assignments}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{row.ctaClicks}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{row.leadSubmits}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {formatPct(row.submitRateFromAssignments)}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {formatPct(row.submitRateFromClicks)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  <ExperimentSubmitRateChart
                    rows={data.experiments.ctaLeadForm}
                    winnerVariant={ctaWinnerVariant}
                  />
                </>
              )}
            </TechnicalSubcard>

            {props.ctaExperiment ? (
              <DecisionBlock experiment={props.ctaExperiment} />
            ) : null}

            <TechnicalSubcard
              title="Serie diaria (tabla)"
              description="Una fila por día en la ventana mostrada arriba."
            >
              {timeseries.points.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin puntos.</p>
              ) : (
                <>
                <DailyPersistedBars points={timeseries.points} />
                <div className="overflow-x-auto rounded-lg border border-neutral-100 bg-white">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead>
                      <tr className={`${tableHeadRowClass} bg-neutral-50/80`}>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2 text-right">Discovery</th>
                        <th className="px-3 py-2 text-right">Ficha</th>
                        <th className="px-3 py-2 text-right">Comparador</th>
                        <th className="px-3 py-2 text-right">CTA</th>
                        <th className="px-3 py-2 text-right">Lead submit</th>
                        <th className="px-3 py-2 text-right">Lead persisted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeseries.points.map((point) => (
                        <tr key={point.date} className="border-b border-neutral-50 last:border-0">
                          <td className="px-3 py-2 text-neutral-800">{point.date}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                            {point.discoveryViews}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                            {point.venueViews}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                            {point.compareOpens}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                            {point.ctaClicks}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                            {point.leadSubmits}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                            {point.leadPersisted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </TechnicalSubcard>

            <TechnicalSubcard
              title="Top venues (eventos con slug)"
              description="Enlaces a fichas públicas."
            >
              {data.topVenues.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin datos.</p>
              ) : (
                <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 bg-neutral-50/40">
                  {data.topVenues.map((item) => (
                    <li
                      key={item.venueSlug}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Link
                        className="min-w-0 truncate font-medium text-[#0a1430] underline decoration-neutral-300 underline-offset-2 hover:decoration-[#0a1430]"
                        href={`/gyms/${item.venueSlug}`}
                      >
                        {props.venueNames[item.venueSlug] ?? item.venueSlug}
                      </Link>
                      <span className="shrink-0 tabular-nums text-neutral-600">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </TechnicalSubcard>
          </div>
        </div>
      </details>
    </div>
  );
}

function ExperimentStableSummaryBars(props: {
  experiment: CtaExperimentPayload;
  highlightVariant: string;
}) {
  const { membership, trial, whatsapp_first } = props.experiment.summary;
  const rows = [
    {
      id: "membership",
      label: "membership",
      rate: membership.submitRateFromAssignments,
      assignments: membership.assignments,
    },
    {
      id: "trial",
      label: "trial",
      rate: trial.submitRateFromAssignments,
      assignments: trial.assignments,
    },
    {
      id: "whatsapp_first",
      label: "whatsapp_first",
      rate: whatsapp_first.submitRateFromAssignments,
      assignments: whatsapp_first.assignments,
    },
  ];
  const maxRate = Math.max(0.06, ...rows.map((r) => r.rate));

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Tasa submit / asignación (resumen por variante)
      </p>
      <div className="space-y-2.5">
        {rows.map((row) => {
          const w = (row.rate / maxRate) * 100;
          const hi = row.id === props.highlightVariant;
          return (
            <div key={row.id}>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-neutral-800">{row.label}</span>
                <span className="tabular-nums text-neutral-600">
                  {formatPct(row.rate)}
                  <span className="ml-2 text-neutral-400">n={row.assignments}</span>
                  {hi ? (
                    <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                      Prioritaria (trial vs WA)
                    </span>
                  ) : null}
                </span>
              </div>
              <div
                className={`h-2 overflow-hidden rounded-full bg-neutral-100 ${
                  hi ? "ring-1 ring-emerald-200/90" : ""
                }`}
              >
                <div
                  className={`h-2 rounded-full ${hi ? "bg-emerald-600" : "bg-[#0a1430]/75"}`}
                  style={{ width: `${w}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionBlock(props: { experiment: CtaExperimentPayload }) {
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
  const trialRate = trial.submitRateFromAssignments;
  const whatsappRate = whatsapp.submitRateFromAssignments;
  const bestName = trialRate >= whatsappRate ? "trial" : "whatsapp_first";
  const bestUplift = bestName === "trial" ? upliftTrial : upliftWhatsapp;
  const upliftReady = bestUplift >= minUplift;
  const isGo = sampleReady && stableReady && upliftReady;

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${
        isGo ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-amber-400"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Decisión automática A/B
          </p>
          <h3 className="mt-1 text-sm font-semibold text-neutral-900">
            Criterios GO / NO-GO (US-6.3)
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isGo
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
              : "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80"
          }`}
        >
          {isGo ? "GO" : "NO-GO"}
        </span>
      </div>
      <p className="mt-3 text-sm text-neutral-700">
        <span className={isGo ? "font-medium text-emerald-800" : "font-medium text-amber-900"}>
          {isGo
            ? `GO — ${bestName} como ganador provisional`
            : "NO-GO — seguir recolectando datos"}
        </span>
      </p>
      <ExperimentStableSummaryBars experiment={props.experiment} highlightVariant={bestName} />
      <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
        <li>
          Asignaciones: membership={membership.assignments}, trial={trial.assignments},
          whatsapp_first={whatsapp.assignments}
        </li>
        <li>Días estables (3 variantes): {props.experiment.stableDaysWithAllVariants}</li>
        <li>Uplift trial vs membership: {formatPct(upliftTrial)}</li>
        <li>Uplift whatsapp_first vs membership: {formatPct(upliftWhatsapp)}</li>
      </ul>
    </div>
  );
}
