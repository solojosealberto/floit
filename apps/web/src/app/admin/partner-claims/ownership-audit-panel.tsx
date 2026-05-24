"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  actorInitials,
  formatDateTimeLong,
} from "@/app/admin/partner-claims/partner-ops-format";
import { AdminRefreshButton } from "@/app/admin/partner-claims/admin-refresh-button";

export type OwnershipAuditRowData = {
  id: string;
  action: "revoked";
  partnerEmail: string;
  venueSlug: string;
  actor: string;
  reason: string | null;
  createdAt: string;
};

const PAGE_SIZE = 10;

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
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push("ellipsis");
    result.push(sorted[i]!);
  }
  return result;
}

function escapeCsvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function ActionBadge() {
  return (
    <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-900 ring-1 ring-rose-200/90">
      Revocación
    </span>
  );
}

export function OwnershipAuditPanel(props: {
  items: OwnershipAuditRowData[];
  initialEmail?: string;
  initialVenueSlug?: string;
}) {
  const { items, initialEmail = "", initialVenueSlug = "" } = props;
  const [q, setQ] = useState(() =>
    [initialEmail.trim(), initialVenueSlug.trim()].filter(Boolean).join(" ").trim(),
  );
  const [actionFilter, setActionFilter] = useState<"all" | "revoked">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = items;
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter(
        (r) =>
          r.partnerEmail.toLowerCase().includes(ql) ||
          r.venueSlug.toLowerCase().includes(ql) ||
          r.actor.toLowerCase().includes(ql) ||
          (r.reason ?? "").toLowerCase().includes(ql),
      );
    }
    if (actionFilter === "revoked") list = list.filter((r) => r.action === "revoked");
    if (dateFilter.trim()) {
      const target = dateFilter.trim();
      list = list.filter((r) => {
        const d = new Date(r.createdAt);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return iso === target;
      });
    }
    return list;
  }, [items, q, actionFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const pageButtons = buildPageNumbers(pageSafe, totalPages);

  useEffect(() => {
    setPage(1);
  }, [q, actionFilter, dateFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function downloadCsv() {
    const headers = ["fecha", "accion", "partnerEmail", "venueSlug", "actor", "motivo"];
    const lines = [
      headers.join(","),
      ...filtered.map((r) =>
        [
          r.createdAt,
          r.action,
          r.partnerEmail,
          r.venueSlug,
          r.actor,
          r.reason ?? "",
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
    a.download = `ownership-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] px-4 py-3 text-white md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Auditoría ownership</h2>
            <p className="text-sm text-white/70">Historial de eventos y revocaciones</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Exportar CSV
          </button>
          <AdminRefreshButton className="inline-flex items-center rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15" />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 md:flex-row md:flex-wrap md:items-end md:gap-4 md:px-5">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Filtrar por partner email o venue slug…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-[#0f172a]/35 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/12"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Acción
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as typeof actionFilter);
                setPage(1);
              }}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-[#0f172a]/40 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/12"
            >
              <option value="all">Todas las acciones</option>
              <option value="revoked">Solo revocación</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-[#0f172a]/40 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/12"
            />
          </div>
          <div className="flex items-end pb-0.5">
            <Link
              href="/admin/partner-claims"
              className="text-sm font-medium text-[#0a1430] underline decoration-neutral-300 underline-offset-2 hover:decoration-[#0a1430]"
            >
              Limpiar URL
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-4 md:px-4">
        {slice.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-600">
            {items.length === 0 ? "Sin eventos recientes." : "Sin resultados para los filtros."}
          </p>
        ) : (
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-white">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Fecha / hora
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Acción</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Partner</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Venue</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Actor (admin)
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((a) => (
                <tr key={a.id} className="border-b border-neutral-100 bg-white hover:bg-neutral-50/80">
                  <td className="px-4 py-3 align-middle text-neutral-800">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDateTimeLong(a.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <ActionBadge />
                  </td>
                  <td className="px-4 py-3 align-middle break-all text-neutral-900">{a.partnerEmail}</td>
                  <td className="px-4 py-3 align-middle font-medium text-neutral-900">{a.venueSlug}</td>
                  <td className="px-4 py-3 align-middle">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
                        {actorInitials(a.actor)}
                      </span>
                      <span className="text-neutral-900">{a.actor}</span>
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-middle text-xs text-neutral-700">{a.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <p className="text-xs text-neutral-600">
            Mostrando {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)} de{" "}
            {filtered.length} eventos
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 disabled:opacity-40"
            >
              Anterior
            </button>
            <div className="flex flex-wrap items-center gap-1">
              {pageButtons.map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-1 text-neutral-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-xs font-semibold ${
                      pageSafe === item
                        ? "bg-[#0f172a] text-white"
                        : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
