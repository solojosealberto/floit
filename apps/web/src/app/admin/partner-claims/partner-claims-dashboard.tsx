"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { UIButton } from "@floit/ui";
import { ClaimDetailModal } from "@/app/admin/partner-claims/claim-detail-modal";
import { ClaimStatusActions } from "@/app/admin/partner-claims/claim-status-actions";
import type { PartnerClaimRow } from "@/app/admin/partner-claims/partner-claim-row";

export type DashboardClaimRow = PartnerClaimRow;

type FilterChip = "all" | "pending" | "new_venue" | "today";

const PAGE_SIZE = 10;

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    const diffMs = Date.now() - d;
    if (diffMs < 0) return "";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "hace un momento";
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `hace ${days} día${days === 1 ? "" : "s"}`;
    const weeks = Math.floor(days / 7);
    if (days < 60) return `hace ${weeks} sem`;
    return "";
  } catch {
    return "";
  }
}

function escapeCsvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadClaimsCsv(rows: DashboardClaimRow[]) {
  const headers = [
    "id",
    "venueSlug",
    "representativeName",
    "representativeEmail",
    "representativePhone",
    "claimKind",
    "status",
    "createdAt",
    "evidence",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.venueSlug,
        r.representativeName,
        r.representativeEmail,
        r.representativePhone,
        r.claimKind ?? "",
        r.status,
        r.createdAt,
        r.evidence ?? "",
      ]
        .map((x) => escapeCsvCell(String(x)))
        .join(","),
    ),
  ];
  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `claims-partner-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: DashboardClaimRow["status"] }) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/90">
        <span aria-hidden className="text-amber-600">
          ●
        </span>
        Pendiente
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/90">
        <span aria-hidden className="text-emerald-600">
          ✓
        </span>
        Aprobado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-900 ring-1 ring-rose-200/90">
      <span aria-hidden className="text-rose-600">
        ✕
      </span>
      Rechazado
    </span>
  );
}

function KpiCard(props: {
  label: string;
  value: number;
  hint: string;
  tone: "neutral" | "amber" | "sky" | "emerald" | "rose";
  icon: ReactNode;
}) {
  const shell =
    props.tone === "neutral"
      ? "border-neutral-200 bg-white"
      : props.tone === "amber"
        ? "border-amber-200/90 bg-amber-50/90"
        : props.tone === "sky"
          ? "border-sky-200/90 bg-sky-50/90"
          : props.tone === "emerald"
            ? "border-emerald-200/90 bg-emerald-50/90"
            : "border-rose-200/90 bg-rose-50/90";
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 shadow-sm ${shell}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-600">{props.label}</p>
        <span className="text-neutral-500">{props.icon}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-neutral-900">{props.value}</p>
      <p className="text-xs text-neutral-600">{props.hint}</p>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

function PaginationBar(props: {
  totalPages: number;
  pageSafe: number;
  onSelect: (n: number) => void;
}) {
  const { totalPages, pageSafe, onSelect } = props;
  const nums = buildPageNumbers(pageSafe, totalPages);

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-neutral-500">
        Página 1 de 1
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <UIButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={pageSafe <= 1}
        onClick={() => onSelect(Math.max(1, pageSafe - 1))}
      >
        Anterior
      </UIButton>
      <div className="flex flex-wrap items-center gap-1">
        {nums.map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`g-${idx}`} className="px-1 text-neutral-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-xs font-semibold ${
                pageSafe === item
                  ? "bg-[#0a1430] text-white"
                  : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <UIButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={pageSafe >= totalPages}
        onClick={() => onSelect(Math.min(totalPages, pageSafe + 1))}
      >
        Siguiente
      </UIButton>
    </div>
  );
}

export function PartnerClaimsDashboard(props: { items: DashboardClaimRow[] }) {
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<FilterChip>("all");
  const [page, setPage] = useState(1);
  const [detailClaim, setDetailClaim] = useState<DashboardClaimRow | null>(null);

  const kpis = useMemo(() => {
    const items = props.items;
    const total = items.length;
    const pending = items.filter((c) => c.status === "pending_review").length;
    const newVenues = items.filter((c) => c.claimKind === "new").length;
    const approved = items.filter((c) => c.status === "approved").length;
    const rejected = items.filter((c) => c.status === "rejected").length;
    const today = items.filter((c) => new Date(c.createdAt).getTime() >= startOfTodayMs()).length;
    return { total, pending, newVenues, approved, rejected, today };
  }, [props.items]);

  const filtered = useMemo(() => {
    let list = props.items;
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter((c) =>
        [c.venueSlug, c.representativeName, c.representativeEmail, c.representativePhone].some(
          (f) => (f ?? "").toLowerCase().includes(ql),
        ),
      );
    }
    if (chip === "pending") list = list.filter((c) => c.status === "pending_review");
    if (chip === "new_venue") list = list.filter((c) => c.claimKind === "new");
    if (chip === "today") list = list.filter((c) => new Date(c.createdAt).getTime() >= startOfTodayMs());
    return list;
  }, [props.items, q, chip]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, chip]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-8">
      <ClaimDetailModal
        claim={detailClaim}
        open={detailClaim != null}
        onClose={() => setDetailClaim(null)}
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Solicitudes</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            Claims de partners
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Gestiona solicitudes de registro y reclamo de centros.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link className="font-medium text-[#0a1430] underline underline-offset-2" href="/admin/catalogo">
              Catálogo
            </Link>
            <Link className="font-medium text-[#0a1430] underline underline-offset-2" href="/admin/leads">
              Leads
            </Link>
            <Link className="font-medium text-[#0a1430] underline underline-offset-2" href="/admin/analytics">
              Métricas
            </Link>
            <Link className="font-medium text-[#0a1430] underline underline-offset-2" href="/partner/claim">
              Formulario público
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UIButton
            type="button"
            variant="secondary"
            size="sm"
            leadingIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            }
            onClick={() => downloadClaimsCsv(filtered)}
          >
            Exportar CSV
          </UIButton>
          <Link href="#operaciones-y-sync" className="inline-flex">
            <UIButton
              type="button"
              size="sm"
              variant="primary"
              className="border-0 bg-[#0a1430] text-white hover:bg-[#152447] dark:bg-[#0a1430] dark:text-white dark:hover:bg-[#152447]"
              leadingIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              }
            >
              Operaciones avanzadas
            </UIButton>
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total solicitudes"
          value={kpis.total}
          hint="Resultados cargados (máx. 200)"
          tone="neutral"
          icon={
            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <KpiCard
          label="Pendientes"
          value={kpis.pending}
          hint="Requieren revisión"
          tone="amber"
          icon={
            <svg className="h-5 w-5 text-amber-600/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Alta nueva"
          value={kpis.newVenues}
          hint="Tipo registro nuevo"
          tone="sky"
          icon={
            <svg className="h-5 w-5 text-sky-600/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Aprobados"
          value={kpis.approved}
          hint="En la lista actual"
          tone="emerald"
          icon={
            <svg className="h-5 w-5 text-emerald-600/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <KpiCard
          label="Rechazados"
          value={kpis.rejected}
          hint="En la lista actual"
          tone="rose"
          icon={
            <svg className="h-5 w-5 text-rose-600/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      </section>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por centro (slug), nombre, email o teléfono…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-[#0a1430]/40 focus:outline-none focus:ring-2 focus:ring-[#0a1430]/15"
            aria-label="Buscar solicitudes"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["all", `Todos (${kpis.total})`],
              ["pending", `Pendientes (${kpis.pending})`],
              ["new_venue", `Alta nueva (${kpis.newVenues})`],
              ["today", `Hoy (${kpis.today})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setChip(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                chip === id
                  ? "bg-[#0a1430] text-white shadow-sm"
                  : "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Centro / Partner
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Contacto
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Evidencia
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-600">
                    No hay solicitudes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                slice.map((c) => {
                  const pendingHighlight = c.status === "pending_review";
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-neutral-100 last:border-0 ${
                        pendingHighlight ? "bg-amber-50/45" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a1430]/8 text-[#0a1430]">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/gyms/${c.venueSlug}`}
                              className="font-semibold text-[#0a1430] underline decoration-neutral-300 underline-offset-2 hover:decoration-[#0a1430]"
                            >
                              {c.venueSlug}
                            </Link>
                            <p className="truncate text-xs text-neutral-600">{c.representativeName}</p>
                            <Link
                              href={`/admin/catalogo/${encodeURIComponent(c.venueSlug)}/panel`}
                              className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900"
                            >
                              Panel catálogo
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={
                            c.claimKind === "new"
                              ? "inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/90"
                              : "inline-flex rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200/90"
                          }
                        >
                          {c.claimKind === "new" ? "Alta nueva" : "Reclamo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="break-all text-neutral-900">{c.representativeEmail}</span>
                          <span className="text-xs text-neutral-600">{c.representativePhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-neutral-900">{formatDateShort(c.createdAt)}</span>
                          <span className="text-xs text-neutral-600">{formatRelative(c.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="max-w-[180px] px-4 py-3 align-top">
                        {c.evidence ? (
                          <span className="break-words text-xs font-medium text-[#0a1430]" title={c.evidence}>
                            {c.evidence.length > 48 ? `${c.evidence.slice(0, 48)}…` : c.evidence}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-neutral-600">Sin evidencia</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2">
                          <UIButton
                            type="button"
                            size="sm"
                            variant="primary"
                            className="border-0 bg-[#0a1430] text-white hover:bg-[#152447]"
                            onClick={() => setDetailClaim(c)}
                          >
                            Ver detalle
                          </UIButton>
                          <ClaimStatusActions claimId={c.id} currentStatus={c.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-600">
              Mostrando {(pageSafe - 1) * PAGE_SIZE + 1}–
              {Math.min(pageSafe * PAGE_SIZE, filtered.length)} de {filtered.length} solicitudes
              {q.trim() ? " (filtrado)" : ""}
            </p>
            <PaginationBar
              totalPages={totalPages}
              pageSafe={pageSafe}
              onSelect={(n) => setPage(n)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
