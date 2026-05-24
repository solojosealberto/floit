"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UIButton } from "@floit/ui";
import {
  formatDateShort,
  formatDateTimeLong,
  formatRelativeShort,
} from "@/app/admin/partner-claims/partner-ops-format";
import { AdminRefreshButton } from "@/app/admin/partner-claims/admin-refresh-button";

export type OwnershipRowData = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
};

function StatusPill(props: { status: OwnershipRowData["status"] }) {
  if (props.status === "active") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/90">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200/90">
      Revoked
    </span>
  );
}

export function OwnershipPartnerVenuePanel(props: { items: OwnershipRowData[] }) {
  const { items } = props;
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [detail, setDetail] = useState<OwnershipRowData | null>(null);

  const filtered = useMemo(() => {
    let list = items;
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter(
        (r) =>
          r.partnerEmail.toLowerCase().includes(ql) ||
          r.venueSlug.toLowerCase().includes(ql),
      );
    }
    if (statusFilter === "active") list = list.filter((r) => r.status === "active");
    if (statusFilter === "revoked") list = list.filter((r) => r.status === "revoked");
    return list;
  }, [items, q, statusFilter]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#4c1d95] px-4 py-3 text-white md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Ownership partner↔venue</h2>
            <p className="text-sm text-white/75">Relaciones activas y revocadas entre partners y centros</p>
          </div>
        </div>
        <AdminRefreshButton className="inline-flex items-center rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15" />
      </div>

      <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="relative max-w-xl flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por partner email o venue slug…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-[#4c1d95]/35 focus:outline-none focus:ring-2 focus:ring-[#4c1d95]/15"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="ownership-status-filter">
            Estado
          </label>
          <select
            id="ownership-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-[#4c1d95]/40 focus:outline-none focus:ring-2 focus:ring-[#4c1d95]/15"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="revoked">Revocados</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-4 md:px-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-600">
            {items.length === 0 ? "Sin ownerships registrados." : "Sin resultados para los filtros."}
          </p>
        ) : (
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-white">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Partner email
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Venue slug
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Creado</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Actualizado
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className={`border-b border-neutral-100 ${o.status === "revoked" ? "bg-neutral-50/90 text-neutral-500" : "bg-white"}`}
                >
                  <td className="px-4 py-3 align-middle">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="break-all font-medium">{o.partnerEmail}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="flex items-center gap-2 font-medium">
                      <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <Link
                        href={`/gyms/${encodeURIComponent(o.venueSlug)}`}
                        className={
                          o.status === "revoked"
                            ? "text-neutral-500 underline decoration-neutral-300"
                            : "text-[#0a1430] underline decoration-neutral-300"
                        }
                      >
                        {o.venueSlug}
                      </Link>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 py-3 align-middle text-neutral-800">
                    {formatDateTimeLong(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-col gap-0.5 text-neutral-800">
                      <span>{formatDateShort(o.updatedAt)}</span>
                      <span className="text-xs text-neutral-500">{formatRelativeShort(o.updatedAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      {o.status === "active" ? (
                        <form
                          method="post"
                          action={`/api/admin/partner/ownerships/${encodeURIComponent(o.id)}/revoke`}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input
                            type="text"
                            name="reason"
                            placeholder="Motivo (opcional)"
                            maxLength={500}
                            className="w-36 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-500"
                          />
                          <UIButton type="submit" variant="secondary" size="sm" className="border-rose-300 bg-rose-600 text-white hover:bg-rose-700">
                            Revocar
                          </UIButton>
                        </form>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDetail(o)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
                        title="Ver detalle"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden />
          <div className="relative z-[111] w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/10">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900">Ownership</h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">ID</dt>
                <dd className="font-mono text-xs">{detail.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Partner</dt>
                <dd className="break-all">{detail.partnerEmail}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Venue</dt>
                <dd>{detail.venueSlug}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Estado</dt>
                <dd>
                  <StatusPill status={detail.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Creado</dt>
                <dd>{formatDateTimeLong(detail.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Actualizado</dt>
                <dd>{formatDateTimeLong(detail.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
