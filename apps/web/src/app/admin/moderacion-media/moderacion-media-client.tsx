"use client";

import { UIBanner, UIButton, UICard } from "@floit/ui";
import Link from "next/link";
import { useMemo, useState } from "react";

export type VenueReportRow = {
  id: string;
  venueSlug: string;
  kind: string;
  message: string;
  status: string;
  createdAt: string;
};

export type MediaReviewRow = {
  venueSlug: string;
  venueName: string;
  zone: string;
  photoCount: number;
  coverUrl: string | null;
  photoUrls: string[];
};

type TabId = "reportes" | "fotos";

type Props = {
  reports: VenueReportRow[];
  media: MediaReviewRow[];
  venueNames: Record<string, string>;
};

const KIND_LABEL: Record<string, string> = {
  precio: "Precio",
  ubicacion: "Ubicación",
  horario: "Horario",
  info: "Información",
  otro: "Otro",
};

export function ModeracionMediaClient(props: Props) {
  const [tab, setTab] = useState<TabId>("reportes");
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reports, setReports] = useState(props.reports);
  const [q, setQ] = useState("");

  const filteredReports = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter === "pending" && r.status !== "pending") return false;
      if (!needle) return true;
      const name = props.venueNames[r.venueSlug] ?? r.venueSlug;
      return `${name} ${r.venueSlug} ${r.kind} ${r.message}`.toLowerCase().includes(needle);
    });
  }, [reports, statusFilter, q, props.venueNames]);

  const filteredMedia = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return props.media;
    return props.media.filter((m) =>
      `${m.venueName} ${m.venueSlug} ${m.zone}`.toLowerCase().includes(needle),
    );
  }, [props.media, q]);

  async function setReportStatus(id: string, status: "reviewed" | "dismissed") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/venue-reports/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { item?: VenueReportRow };
      if (data.item) {
        setReports((prev) => prev.map((r) => (r.id === id ? data.item! : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Admin &gt; Moderación</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 md:text-[26px]">
            Moderación de media
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Reportes de usuarios y revisión visual de fotos publicadas en fichas.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
          {pendingCount} reportes pendientes
        </span>
      </header>

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1.5">
        {(
          [
            { id: "reportes" as const, label: "Reportes", count: filteredReports.length },
            { id: "fotos" as const, label: "Fotos publicadas", count: filteredMedia.length },
          ] as const
        ).map((t) => (
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
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar centro, slug o mensaje…"
          className="min-w-[220px] flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-neutral-900/10 focus:ring-2"
        />
        {tab === "reportes" ? (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "pending" | "all")}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="pending">Solo pendientes</option>
            <option value="all">Todos</option>
          </select>
        ) : null}
      </div>

      {tab === "reportes" ? (
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <UIBanner variant="success">No hay reportes en este filtro.</UIBanner>
          ) : null}
          {filteredReports.map((r) => (
            <UICard key={r.id} className="border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {props.venueNames[r.venueSlug] ?? r.venueSlug}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {KIND_LABEL[r.kind] ?? r.kind} ·{" "}
                    {new Date(r.createdAt).toLocaleString("es-VE")}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">{r.message}</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.status === "pending"
                        ? "bg-amber-100 text-amber-900"
                        : r.status === "reviewed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/gyms/${encodeURIComponent(r.venueSlug)}`} target="_blank">
                    <UIButton variant="secondary" size="sm">
                      Ver ficha
                    </UIButton>
                  </Link>
                  <Link href={`/admin/catalogo/${encodeURIComponent(r.venueSlug)}/panel`}>
                    <UIButton variant="secondary" size="sm">
                      Panel admin
                    </UIButton>
                  </Link>
                  {r.status === "pending" ? (
                    <>
                      <UIButton
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void setReportStatus(r.id, "reviewed")}
                      >
                        Revisado
                      </UIButton>
                      <UIButton
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void setReportStatus(r.id, "dismissed")}
                      >
                        Descartar
                      </UIButton>
                    </>
                  ) : null}
                </div>
              </div>
            </UICard>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMedia.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <UIBanner>No hay centros con fotos cargadas.</UIBanner>
            </div>
          ) : null}
          {filteredMedia.map((m) => (
            <UICard key={m.venueSlug} className="overflow-hidden border-neutral-200 bg-white p-0">
              {m.coverUrl ? (
                <img
                  src={m.coverUrl}
                  alt={`Portada ${m.venueName}`}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                  Sin portada
                </div>
              )}
              <div className="space-y-2 p-3">
                <p className="text-sm font-semibold text-neutral-900">{m.venueName}</p>
                <p className="text-xs text-neutral-500">
                  {m.zone} · {m.photoCount} foto{m.photoCount !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/catalogo/${encodeURIComponent(m.venueSlug)}/panel`}>
                    <UIButton size="sm" variant="secondary">
                      Editar fotos
                    </UIButton>
                  </Link>
                  <Link href={`/gyms/${encodeURIComponent(m.venueSlug)}`} target="_blank">
                    <UIButton size="sm" variant="ghost">
                      Ver público
                    </UIButton>
                  </Link>
                </div>
              </div>
            </UICard>
          ))}
        </div>
      )}
    </>
  );
}
