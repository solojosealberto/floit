"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDateShort,
  formatDateTimeLong,
  formatRelativeShort,
} from "@/app/admin/partner-claims/partner-ops-format";
import { AdminRefreshButton } from "@/app/admin/partner-claims/admin-refresh-button";

export type DlqFailureRow = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type Props = {
  items: DlqFailureRow[];
  variant: "sync" | "outbox";
  retryApiPath: string;
};

export function DlqFailuresPanel(props: Props) {
  const { items, variant, retryApiPath } = props;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<DlqFailureRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return items;
    return items.filter(
      (r) =>
        r.partnerEmail.toLowerCase().includes(ql) ||
        r.venueSlug.toLowerCase().includes(ql) ||
        (r.lastError ?? "").toLowerCase().includes(ql),
    );
  }, [items, q]);

  const allFilteredIds = filtered.map((r) => r.id);
  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of allFilteredIds) next.delete(id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of allFilteredIds) next.add(id);
        return next;
      });
    }
  }

  async function postRetry(limit: number) {
    if (limit < 1) return;
    setBusy(true);
    try {
      const res = await fetch(`${retryApiPath}?limit=${limit}`, { method: "POST" });
      if (!res.ok) {
        console.warn("retry_failed", res.status);
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const headerBg =
    variant === "sync"
      ? "bg-[#7f1d1d]"
      : "bg-[#78350f]";

  const title =
    variant === "sync" ? "DLQ sync partner→catalog" : "DLQ outbox partner→sync";
  const subtitle =
    variant === "sync"
      ? "Trabajos de sincronización fallidos (dead-letter queue)"
      : "Fallos de publicación en outbox hacia sync";

  const selectionCount = selected.size;
  const bulkLimit = selectionCount === 0 ? 0 : Math.min(selectionCount, 50);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white md:px-5 ${headerBg}`}>
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-white/80">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || selectionCount === 0}
            onClick={() => void postRetry(bulkLimit)}
            className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reintentar seleccionados (máx. 50)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void postRetry(50)}
            className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
          >
            Reintentar 50
          </button>
          <AdminRefreshButton className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15" />
        </div>
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 md:px-5">
        <div className="relative max-w-2xl">
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
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-[#0a1430]/35 focus:outline-none focus:ring-2 focus:ring-[#0a1430]/15"
            aria-label="Filtrar DLQ"
          />
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          El servicio reencola hasta N trabajos en estado fallido (orden interno por fecha). La selección solo determina N
          (mínimo 1 cuando hay filas marcadas), no IDs concretos.
        </p>
      </div>

      <div className="overflow-x-auto px-2 pb-4 md:px-4">
        {filtered.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-neutral-600 md:px-4">
            {items.length === 0 ? "Sin trabajos en DLQ." : "Ningún resultado para la búsqueda."}
          </p>
        ) : (
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-white">
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-neutral-300"
                    aria-label="Seleccionar todas las filas visibles"
                  />
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Partner
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Venue</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Intentos
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Último error
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Fecha</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 bg-white hover:bg-neutral-50/80">
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      className="h-4 w-4 rounded border-neutral-300"
                      aria-label={`Seleccionar ${row.id}`}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="flex items-center gap-2 text-neutral-900">
                      <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="break-all">{row.partnerEmail}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="flex items-center gap-2 font-medium text-neutral-900">
                      <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {row.venueSlug}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-900 ring-1 ring-rose-200/80">
                      {row.attempts} intentos
                    </span>
                  </td>
                  <td className="max-w-[280px] px-3 py-3 align-middle text-xs text-red-800">
                    <span className="line-clamp-3" title={row.lastError ?? ""}>
                      {row.lastError ?? "unknown_error"}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle text-neutral-800">
                    <div className="flex flex-col gap-0.5">
                      <span>{formatDateShort(row.createdAt)}</span>
                      <span className="text-xs text-neutral-500">{formatRelativeShort(row.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        title="Reintentar un lote de hasta 1 trabajo fallido"
                        onClick={() => void postRetry(1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
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
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-[111] w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/10"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900">Detalle DLQ</h3>
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
                <dd className="font-mono text-xs text-neutral-900">{detail.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Partner</dt>
                <dd className="break-all text-neutral-900">{detail.partnerEmail}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Venue</dt>
                <dd className="text-neutral-900">{detail.venueSlug}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Intentos</dt>
                <dd className="text-neutral-900">{detail.attempts}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Creado</dt>
                <dd className="text-neutral-900">{formatDateTimeLong(detail.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Último error</dt>
                <dd className="whitespace-pre-wrap break-words text-red-800">{detail.lastError ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
