"use client";

import {
  UIBanner,
  UIButton,
  UICard,
  UITable,
  UITableCell,
  UITableContainer,
} from "@floit/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LeadDetailModal } from "./lead-detail-modal";

export type LeadRow = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  suspicious: boolean;
  clientIp: string | null;
  /** Origen del contacto (`form` por defecto si el backend no envía el campo). */
  entryChannel?: "form" | "whatsapp";
  clientUserAgent?: string | null;
  consentVersion: string | null;
  createdAt: string;
};

export type VenueMeta = { name: string; zone: string };

export type NotificationFailure = {
  id: string;
  failedAt: string;
  attempts: number;
  lastError: string | null;
  lead: {
    id: string;
    venueSlug: string;
    intent: string;
    name: string;
    phone: string;
    createdAt: string;
  };
};

type TabId = "todos" | "nuevos" | "atendidos" | "sospechosos" | "spam";

type Props = {
  items: LeadRow[];
  venueBySlug: Record<string, VenueMeta>;
  slaAttentionPct: number | null;
  leadsToday: number;
  suspiciousTotal: number;
  failures: NotificationFailure[];
};

export function AdminLeadsClient(props: Props) {
  const router = useRouter();
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [gym, setGym] = useState("");
  const [zone, setZone] = useState("");
  const [channel, setChannel] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [fecha, setFecha] = useState<"all" | "today" | "week">("all");
  const [tab, setTab] = useState<TabId>("todos");

  const zones = useMemo(() => {
    const s = new Set<string>();
    for (const row of props.items) {
      const z = props.venueBySlug[row.venueSlug]?.zone;
      if (z) s.add(z);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "es"));
  }, [props.items, props.venueBySlug]);

  const gyms = useMemo(() => {
    const s = new Set(props.items.map((r) => r.venueSlug));
    return [...s].sort((a, b) => a.localeCompare(b, "es"));
  }, [props.items]);

  const preFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return props.items.filter((row) => {
      if (fecha === "today" && !isToday(row.createdAt)) return false;
      if (fecha === "week" && !isWithinDays(row.createdAt, 7)) return false;
      if (gym && row.venueSlug !== gym) return false;
      const rowZone = props.venueBySlug[row.venueSlug]?.zone ?? "";
      if (zone && rowZone !== zone) return false;
      const ch = leadChannel(row);
      if (channel === "form" && ch !== "form") return false;
      if (channel === "wa" && ch !== "wa") return false;
      if (estadoFilter === "received" && row.status !== "received") return false;
      if (estadoFilter === "contacted" && row.status !== "contacted") return false;
      if (estadoFilter === "closed" && row.status !== "closed") return false;
      if (!needle) return true;
      const blob = [
        row.name,
        row.phone,
        row.email ?? "",
        row.venueSlug,
        props.venueBySlug[row.venueSlug]?.name ?? "",
        row.intent,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [
    props.items,
    props.venueBySlug,
    q,
    gym,
    zone,
    channel,
    estadoFilter,
    fecha,
  ]);

  const tabFiltered = useMemo(() => {
    return preFiltered.filter((row) => matchesTab(row, tab));
  }, [preFiltered, tab]);

  const tabs: { id: TabId; label: string; count: number }[] = useMemo(() => {
    const count = (t: TabId) => preFiltered.filter((r) => matchesTab(r, t)).length;
    return [
      { id: "todos", label: "Todos", count: preFiltered.length },
      { id: "nuevos", label: "Nuevos", count: count("nuevos") },
      { id: "atendidos", label: "Atendidos", count: count("atendidos") },
      { id: "sospechosos", label: "Sospechosos", count: count("sospechosos") },
      { id: "spam", label: "Spam", count: count("spam") },
    ];
  }, [preFiltered]);

  const attention =
    props.slaAttentionPct != null
      ? `${Math.round(props.slaAttentionPct)}%`
      : "N/D";

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Admin &gt; Leads</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 md:text-[26px]">
            Gestión de leads
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">{props.leadsToday}</span> leads
            hoy ·{" "}
            <span className="font-medium text-neutral-800">{props.suspiciousTotal}</span>{" "}
            sospechosos · Tasa atención (24h):{" "}
            <span className="font-medium text-emerald-700">{attention}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
            Admin
          </span>
          <Link href="/api/admin/leads/export" className="inline-flex">
            <UIButton
              variant="secondary"
              size="sm"
              className="!rounded-xl gap-1.5 border-neutral-200 font-semibold"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar CSV
            </UIButton>
          </Link>
        </div>
      </header>

      {props.suspiciousTotal > 0 ? (
        <div className="mb-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-950">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-medium">
              {props.suspiciousTotal} leads sospechosos (heurística anti-abuso por IP). Revisá
              antes de reenviar al partner.{" "}
              <button
                type="button"
                className="font-semibold text-rose-900 underline"
                onClick={() => setTab("sospechosos")}
              >
                Ver leads marcados →
              </button>
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
              tab === t.id
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-600 hover:bg-white"
            }`}
          >
            {t.label}{" "}
            <span className={tab === t.id ? "text-white/80" : "text-neutral-400"}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[200px] flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring-2"
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Link href="/api/admin/leads/export" className="inline-flex w-full lg:hidden">
          <UIButton variant="secondary" size="sm" className="w-full !rounded-xl font-semibold">
            Exportar CSV
          </UIButton>
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <select
          className="min-w-[140px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={gym}
          onChange={(e) => setGym(e.target.value)}
        >
          <option value="">Gimnasio</option>
          {gyms.map((g) => (
            <option key={g} value={g}>
              {truncate(props.venueBySlug[g]?.name ?? g, 36)}
            </option>
          ))}
        </select>
        <select
          className="min-w-[120px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">Zona</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <select
          className="min-w-[140px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="">Canal</option>
          <option value="form">Formulario</option>
          <option value="wa">WhatsApp</option>
        </select>
        <select
          className="min-w-[120px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        >
          <option value="">Estado</option>
          <option value="received">Recibido</option>
          <option value="contacted">Contactado</option>
          <option value="closed">Cerrado</option>
        </select>
        <select
          className="min-w-[140px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={fecha}
          onChange={(e) => setFecha(e.target.value as "all" | "today" | "week")}
        >
          <option value="all">Fecha: cualquiera</option>
          <option value="today">Hoy</option>
          <option value="week">Últimos 7 días</option>
        </select>
      </div>

      <UICard className="mb-6 overflow-hidden border-neutral-200 p-0 shadow-sm">
        <UITableContainer className="rounded-2xl border-0 shadow-none">
          <UITable className="min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80">
                <th className="px-4 py-3 font-medium text-neutral-700">Fecha/hora</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Usuario</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Gimnasio</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Interés</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Canal</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Estado</th>
                <th className="px-4 py-3 font-medium text-neutral-700">IP / Device</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tabFiltered.length === 0 ? (
                <tr>
                  <UITableCell colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    No hay leads en esta vista. Ajustá filtros o pestañas.
                  </UITableCell>
                </tr>
              ) : (
                tabFiltered.map((row) => {
                  const venueName =
                    props.venueBySlug[row.venueSlug]?.name ?? row.venueSlug;
                  const suspiciousRow = row.suspicious;
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-neutral-100 ${
                        suspiciousRow ? "bg-rose-50/90" : "bg-white"
                      }`}
                    >
                      <UITableCell className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {formatLeadWhen(row.createdAt)}
                      </UITableCell>
                      <UITableCell className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{row.name}</p>
                        <p className="text-xs text-neutral-500">
                          {row.phone}
                          {row.email ? ` · ${row.email}` : ""}
                        </p>
                      </UITableCell>
                      <UITableCell className="max-w-[140px] px-4 py-3">
                        <Link
                          href={`/gyms/${encodeURIComponent(row.venueSlug)}`}
                          className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
                          title={venueName}
                        >
                          {truncate(venueName, 18)}
                        </Link>
                      </UITableCell>
                      <UITableCell className="px-4 py-3 text-neutral-800">
                        {intentLabel(row.intent)}
                      </UITableCell>
                      <UITableCell className="px-4 py-3">
                        <ChannelPill channel={leadChannel(row)} />
                      </UITableCell>
                      <UITableCell className="px-4 py-3">
                        <StatusBadge row={row} />
                      </UITableCell>
                      <UITableCell className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                        {maskIp(row.clientIp)} · {deviceLabel(row.clientUserAgent)}
                      </UITableCell>
                      <UITableCell className="px-4 py-3">
                        <UIButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="!rounded-lg"
                          onClick={() => setDetailLeadId(row.id)}
                        >
                          Ver
                        </UIButton>
                      </UITableCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </UITable>
        </UITableContainer>
      </UICard>

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900">DLQ notificaciones</h2>
          <form method="post" action="/api/admin/notifications/retry?limit=50">
            <UIButton type="submit" variant="secondary" size="sm" className="!rounded-xl">
              Reintentar 50
            </UIButton>
          </form>
        </div>
        {props.failures.length === 0 ? (
          <UIBanner variant="info">Sin fallos acumulados.</UIBanner>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80">
                  <th className="px-3 py-2 font-medium text-neutral-700">Fallo</th>
                  <th className="px-3 py-2 font-medium text-neutral-700">Centro</th>
                  <th className="px-3 py-2 font-medium text-neutral-700">Intent</th>
                  <th className="px-3 py-2 font-medium text-neutral-700">Intentos</th>
                  <th className="px-3 py-2 font-medium text-neutral-700">Error</th>
                </tr>
              </thead>
              <tbody>
                {props.failures.map((f) => (
                  <tr key={f.id} className="border-b border-neutral-100">
                    <td className="px-3 py-2 text-neutral-500">{formatIsoShort(f.failedAt)}</td>
                    <td className="px-3 py-2">{f.lead.venueSlug}</td>
                    <td className="px-3 py-2">{f.lead.intent}</td>
                    <td className="px-3 py-2">{f.attempts}</td>
                    <td className="px-3 py-2 text-xs text-red-600">
                      {f.lastError ?? "unknown_error"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <LeadDetailModal
        leadId={detailLeadId}
        venueBySlug={props.venueBySlug}
        onClose={() => setDetailLeadId(null)}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}

function ChannelPill(props: { channel: "form" | "wa" }) {
  if (props.channel === "wa") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
        WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800">
      Formulario
    </span>
  );
}

function leadChannel(row: LeadRow): "form" | "wa" {
  return row.entryChannel === "whatsapp" ? "wa" : "form";
}

function deviceLabel(ua: string | null | undefined): string {
  if (!ua?.trim()) return "Web";
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return "Tablet";
  if (/mobile|iphone|ipod|android.*mobile/.test(u)) return "Mobile";
  if (/android/.test(u)) return "Mobile";
  return "Desktop";
}

function StatusBadge({ row }: { row: LeadRow }) {
  if (row.suspicious) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-900">
        <span aria-hidden>⚠</span> Sospechoso
      </span>
    );
  }
  if (row.status === "received") {
    return (
      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900">
        Nuevo
      </span>
    );
  }
  if (row.status === "contacted") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
        Atendido
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
      Cerrado
    </span>
  );
}

function matchesTab(row: LeadRow, t: TabId): boolean {
  switch (t) {
    case "todos":
      return true;
    case "nuevos":
      return row.status === "received" && !row.suspicious;
    case "atendidos":
      return row.status === "contacted" || (row.status === "closed" && !row.suspicious);
    case "sospechosos":
      return row.suspicious;
    case "spam":
      return row.status === "closed";
    default:
      return true;
  }
}

function intentLabel(intent: string): string {
  switch (intent) {
    case "membership":
      return "Memb. mensual";
    case "trial":
      return "Prueba / visita";
    case "info":
      return "Info precios";
    default:
      return intent;
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

function maskIp(ip: string | null): string {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  return ip.length > 12 ? `${ip.slice(0, 8)}…` : ip;
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

function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso).getTime();
  const limit = Date.now() - days * 24 * 60 * 60 * 1000;
  return d >= limit;
}

function formatLeadWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const time = d.toLocaleTimeString("es-VE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (d >= startOfToday) return `Hoy ${time}`;
    if (d >= startOfYesterday) return `Ayer ${time}`;
    return d.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatIsoShort(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
