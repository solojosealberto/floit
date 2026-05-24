"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UIButton } from "@floit/ui";

export type CatalogRow = {
  slug: string;
  name: string;
  zone: string;
  venueType: string;
  modalities: string[];
  completenessScore: number | null;
  verificationStatus: string;
  updatedAt: string | null;
  needsReview: boolean;
};

type TabId = "all" | "published" | "pending" | "draft" | "archived";

function pctComplete(score: number | null): number {
  if (score == null) return 0;
  const n = score <= 1 ? score * 100 : score;
  return Math.round(Math.min(100, Math.max(0, n)));
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const h = Math.floor(diffMs / (60 * 60 * 1000));
  if (h < 1) return "Hace menos de 1h";
  if (h < 48) return `Hace ${h}h`;
  const days = Math.floor(h / 24);
  return `Hace ${days} días`;
}

function estadoLabel(row: CatalogRow): {
  key: "pendiente" | "publicado" | "borrador" | "archivado";
  label: string;
} {
  if (row.verificationStatus === "reference") {
    return { key: "pendiente", label: "Pendiente" };
  }
  return { key: "publicado", label: "Publicado" };
}

export function AdminCatalogoClient(props: { rows: CatalogRow[] }) {
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("");
  const [venueType, setVenueType] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [completitud, setCompletitud] = useState("");

  const zones = useMemo(() => {
    const s = new Set<string>();
    props.rows.forEach((r) => {
      if (r.zone) s.add(r.zone);
    });
    return [...s].sort();
  }, [props.rows]);

  const types = useMemo(() => {
    const s = new Set<string>();
    props.rows.forEach((r) => {
      if (r.venueType) s.add(r.venueType);
    });
    return [...s].sort();
  }, [props.rows]);

  const counts = useMemo(() => {
    const all = props.rows.length;
    let published = 0;
    let pending = 0;
    let draft = 0;
    let archived = 0;
    for (const r of props.rows) {
      const e = estadoLabel(r);
      if (e.key === "publicado") published++;
      else if (e.key === "pendiente") pending++;
      else if (e.key === "borrador") draft++;
      else archived++;
    }
    return { all, published, pending, draft, archived };
  }, [props.rows]);

  const pendingOld = useMemo(() => {
    const threshold = 48 * 60 * 60 * 1000;
    return props.rows.filter((r) => {
      if (!r.needsReview || !r.updatedAt) return false;
      return Date.now() - new Date(r.updatedAt).getTime() > threshold;
    }).length;
  }, [props.rows]);

  const filtered = useMemo(() => {
    return props.rows.filter((row) => {
      const e = estadoLabel(row);
      if (tab === "published" && e.key !== "publicado") return false;
      if (tab === "pending" && e.key !== "pendiente") return false;
      if (tab === "draft" && e.key !== "borrador") return false;
      if (tab === "archived" && e.key !== "archivado") return false;

      const qq = q.trim().toLowerCase();
      if (
        qq &&
        !row.name.toLowerCase().includes(qq) &&
        !row.slug.toLowerCase().includes(qq) &&
        !row.zone.toLowerCase().includes(qq)
      ) {
        return false;
      }
      if (zone && row.zone !== zone) return false;
      if (venueType && row.venueType !== venueType) return false;
      if (estadoFilter) {
        if (estadoFilter === "pendiente" && e.key !== "pendiente") return false;
        if (estadoFilter === "publicado" && e.key !== "publicado") return false;
        if (estadoFilter === "borrador" && e.key !== "borrador") return false;
        if (estadoFilter === "archivado" && e.key !== "archivado") return false;
      }
      const p = pctComplete(row.completenessScore);
      if (completitud === "alto" && p < 70) return false;
      if (completitud === "medio" && (p < 45 || p >= 70)) return false;
      if (completitud === "bajo" && p >= 45) return false;
      return true;
    });
  }, [
    props.rows,
    tab,
    q,
    zone,
    venueType,
    estadoFilter,
    completitud,
  ]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "published", label: "Publicados", count: counts.published },
    { id: "pending", label: "Pendientes", count: counts.pending },
    { id: "draft", label: "Borradores", count: counts.draft },
    { id: "archived", label: "Archivados", count: counts.archived },
  ];

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Admin &gt; Catálogo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 md:text-[26px]">
            Catálogo de gimnasios
          </h1>
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
          <Link href="/partner/claim?returnTo=/admin/catalogo">
            <UIButton className="!rounded-xl !bg-neutral-900 !px-4 !text-sm font-semibold">
              + Nuevo gimnasio
            </UIButton>
          </Link>
        </div>
      </header>

      {counts.pending > 0 ? (
        <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium">
              {counts.pending} gimnasios pendientes de revisión
              {pendingOld > 0 ? ` (${pendingOld} con más de 48h)` : ""}
            </p>
            <p className="mt-0.5 text-xs text-amber-900/85">
              Revisá y aprobá claims desde Partner claims para mantener el catálogo consistente.
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-neutral-900/10 focus:ring-2"
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
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
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={venueType}
          onChange={(e) => setVenueType(e.target.value)}
        >
          <option value="">Tipo</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        >
          <option value="">Estado</option>
          <option value="pendiente">Pendiente</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
          <option value="archivado">Archivado</option>
        </select>
        <select
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
          value={completitud}
          onChange={(e) => setCompletitud(e.target.value)}
        >
          <option value="">Completitud</option>
          <option value="alto">Alta (≥70%)</option>
          <option value="medio">Media (45–69%)</option>
          <option value="bajo">Baja (&lt;45%)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/90 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Nombre / Zona</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Completitud</th>
              <th className="px-4 py-3">Última actualización</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  No hay resultados con los filtros actuales.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const e = estadoLabel(row);
                const pct = pctComplete(row.completenessScore);
                const barColor =
                  pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-400" : "bg-red-400";
                const highlight =
                  row.needsReview || e.key === "pendiente"
                    ? "bg-[#FEF9C3]/90"
                    : "bg-white";
                const modalityLabel = row.modalities[0] ?? row.venueType;
                return (
                  <tr key={row.slug} className={`border-b border-neutral-100 ${highlight}`}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-medium text-neutral-400">
                          Logo
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900">{row.name}</p>
                          <p className="text-xs text-neutral-500">
                            {row.zone} · {modalityLabel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          e.key === "pendiente"
                            ? "bg-amber-100 text-amber-900"
                            : e.key === "publicado"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            e.key === "pendiente"
                              ? "bg-amber-500"
                              : e.key === "publicado"
                                ? "bg-emerald-500"
                                : "bg-neutral-400"
                          }`}
                        />
                        {e.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs font-medium tabular-nums text-neutral-800">
                          {pct}%
                        </span>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-neutral-600">
                      <div>{formatRelative(row.updatedAt)}</div>
                      <div className="text-[11px] text-neutral-400">
                        {row.needsReview ? "Revisión sugerida" : "Catálogo"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/gyms/${encodeURIComponent(row.slug)}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                          aria-label="Ver ficha pública"
                          title="Ver ficha pública"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/catalogo/${encodeURIComponent(row.slug)}/panel`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                          aria-label="Editar centro (mismo panel que partners)"
                          title="Editar ficha del centro"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        {row.needsReview ? (
                          <Link
                            href="/admin/partner-claims"
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-200"
                          >
                            Revisar
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
