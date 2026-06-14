"use client";

import { UIButton } from "@floit/ui";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { VenueMeta } from "./admin-leads-client";

export type LeadDetailPayload = {
  lead: {
    id: string;
    venueSlug: string;
    intent: string;
    name: string;
    phone: string;
    email: string | null;
    preferredSlot: string | null;
    message: string | null;
    consentAccepted: boolean;
    consentVersion: string | null;
    status: string;
    suspicious: boolean;
    clientIp: string | null;
    entryChannel: string;
    clientUserAgent: string | null;
    adminNote: string | null;
    firstContactedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  traceability: {
    sameIpTodayCount: number;
    samePhoneAllTimeCount: number;
    dwellTimeSeconds: null;
    fieldsSummary: string;
  };
  notificationEnqueuedAt: string | null;
};

type Props = {
  leadId: string | null;
  venueBySlug: Record<string, VenueMeta>;
  onClose: () => void;
  onUpdated: () => void;
};

export function LeadDetailModal(props: Props) {
  const { leadId, venueBySlug, onClose, onUpdated } = props;
  const [data, setData] = useState<LeadDetailPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as LeadDetailPayload | { message?: string };
      if (!res.ok) {
        setErr(
          typeof (json as { message?: string }).message === "string"
            ? String((json as { message: string }).message)
            : `HTTP ${res.status}`,
        );
        setData(null);
        return;
      }
      const payload = json as LeadDetailPayload;
      setData(payload);
      setNoteDraft(payload.lead.adminNote ?? "");
    } catch {
      setErr("No se pudo cargar el lead.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId) {
      setData(null);
      setErr(null);
      return;
    }
    void load();
  }, [leadId, load]);

  useEffect(() => {
    if (!leadId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [leadId, onClose]);

  async function patch(body: Record<string, unknown>) {
    if (!leadId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof json.message === "string" ? json.message : `HTTP ${res.status}`);
        return;
      }
      setData(json as LeadDetailPayload);
      setNoteDraft((json as LeadDetailPayload).lead.adminNote ?? "");
      onUpdated();
    } catch {
      setErr("Error de red al guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    await patch({ adminNote: noteDraft.trim() ? noteDraft.trim() : "" });
  }

  function openWhatsApp() {
    const phone = data?.lead.phone.replace(/\D/g, "") ?? "";
    if (!phone) return;
    const text = encodeURIComponent(
      `Hola, te escribimos desde ${BRAND_NAME} por tu solicitud en ${venueLabel}.`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  if (!leadId) return null;

  const venueLabel =
    data?.lead?.venueSlug != null
      ? venueBySlug[data.lead.venueSlug]?.name ?? data.lead.venueSlug
      : "";

  const lead = data?.lead;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 p-3 md:p-6">
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-title"
        className="relative z-[101] my-4 w-full max-w-5xl rounded-2xl border border-quegym-border bg-quegym-page shadow-2xl"
      >
        <div className="border-b border-quegym-border bg-quegym-elevated px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-quegym-secondary">
                Admin &gt; Leads &gt;{" "}
                {lead ? (
                  <>
                    Lead {formatLeadPublicId(lead.id)} · {lead.name}
                  </>
                ) : (
                  "Detalle"
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-quegym-secondary">
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
              <span className="rounded-full border border-quegym-border bg-quegym-subtle px-3 py-1.5 text-xs font-medium text-quegym-primary">
                Admin
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-sm font-medium text-quegym-primary hover:bg-quegym-subtle"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 md:p-6">
          {loading ? (
            <p className="text-sm text-quegym-secondary">Cargando…</p>
          ) : err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : lead && data ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
              <div className="space-y-4">
                <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-quegym-accent text-lg font-semibold text-white">
                        {(lead.name.trim().charAt(0) || "?").toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 id="lead-detail-title" className="text-xl font-semibold text-quegym-primary">
                            {lead.name}
                          </h2>
                          <HeaderStatusBadge lead={lead} />
                          <span className="text-sm text-quegym-secondary">
                            Lead {formatLeadPublicId(lead.id)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-quegym-secondary">
                          Recibido: {formatReceivedLine(lead.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <UIButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="!rounded-xl gap-1.5"
                        onClick={openWhatsApp}
                      >
                        <svg className="h-4 w-4 text-quegym-highlight" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </UIButton>
                      <UIButton
                        type="button"
                        size="sm"
                        className="!rounded-xl !bg-quegym-accent !text-white hover:!bg-quegym-accent-hover"
                        disabled={busy || lead.status === "contacted"}
                        onClick={() => patch({ status: "contacted", suspicious: false })}
                      >
                        Marcar atendido
                      </UIButton>
                    </div>
                  </div>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Teléfono / WA" value={lead.phone} />
                    <DetailItem
                      label="Email"
                      value={lead.email?.trim() ? lead.email : "Sin informar"}
                    />
                    <DetailItem
                      label="Canal de origen"
                      value={channelLabel(lead.entryChannel)}
                    />
                    <DetailItem label="Gimnasio consultado" value={venueLabel} />
                    <DetailItem label="Interés declarado" value={intentLabelFull(lead.intent)} />
                    <DetailItem
                      label="Horario preferido"
                      value={lead.preferredSlot?.trim() || "—"}
                    />
                  </dl>
                </section>

                <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-quegym-primary">
                    Mensaje / comentario del usuario
                  </h3>
                  <blockquote className="mt-3 rounded-xl border border-quegym-border bg-quegym-subtle px-4 py-3 text-sm text-quegym-primary">
                    {lead.message?.trim() ? (
                      <>“{lead.message.trim()}”</>
                    ) : (
                      <span className="text-quegym-secondary">Sin mensaje adicional.</span>
                    )}
                  </blockquote>
                </section>

                <section className="qg-surface qg-motion rounded-2xl border border-quegym-highlight/30 bg-quegym-highlight-soft/40 p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-quegym-highlight">
                    ✓ Registro de consentimiento
                  </h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Términos y política aceptados"
                      value={lead.consentAccepted ? "✓ Sí" : "No"}
                    />
                    <DetailItem
                      label="Fecha y hora de aceptación"
                      value={formatFullDateTime(lead.createdAt)}
                    />
                    <DetailItem label="IP del dispositivo" value={maskIpConsent(lead.clientIp)} />
                    <DetailItem label="Dispositivo" value={parseUaDetail(lead.clientUserAgent)} />
                    <DetailItem
                      label="Versión de T&C aceptada"
                      value={formatConsentVersion(lead.consentVersion)}
                    />
                    <DetailItem
                      label="Fuente del formulario"
                      value={`Ficha: ${venueLabel}`}
                    />
                  </dl>
                </section>

                <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-quegym-primary">
                    Señales de trazabilidad (operativo)
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex justify-between gap-4 border-b border-quegym-border py-2">
                      <span className="text-quegym-secondary">Leads desde esta IP (hoy)</span>
                      <span className="font-semibold text-quegym-highlight">
                        {data.traceability.sameIpTodayCount}
                      </span>
                    </li>
                    <li className="flex justify-between gap-4 border-b border-quegym-border py-2">
                      <span className="text-quegym-secondary">
                        Leads con mismo contacto (todo tiempo)
                      </span>
                      <span className="font-semibold text-quegym-highlight">
                        {data.traceability.samePhoneAllTimeCount}
                      </span>
                    </li>
                    <li className="flex justify-between gap-4 border-b border-quegym-border py-2">
                      <span className="text-quegym-secondary">
                        Tiempo en la ficha antes de enviar
                      </span>
                      <span className="font-medium text-quegym-secondary">No disponible</span>
                    </li>
                    <li className="flex justify-between gap-4 py-2">
                      <span className="text-quegym-secondary">Campos completados</span>
                      <span className="text-right font-medium text-quegym-primary">
                        {data.traceability.fieldsSummary}
                      </span>
                    </li>
                  </ul>
                </section>
              </div>

              <div className="space-y-4">
                <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-quegym-primary">Estado del lead</h3>
                  <div className="mt-3 space-y-2">
                    <StatusChoice
                      label="Nuevo"
                      dotClass="bg-sky-500"
                      selected={adminUiBucket(lead) === "nuevo"}
                      disabled={busy}
                      onSelect={() => patch({ status: "received", suspicious: false })}
                    />
                    <StatusChoice
                      label="Atendido"
                      dotClass="bg-quegym-highlight-soft0"
                      selected={adminUiBucket(lead) === "atendido"}
                      disabled={busy}
                      onSelect={() => patch({ status: "contacted", suspicious: false })}
                    />
                    <StatusChoice
                      label="Sospechoso"
                      dotClass="bg-rose-500"
                      selected={adminUiBucket(lead) === "sospechoso"}
                      disabled={busy}
                      onSelect={() => patch({ suspicious: true })}
                    />
                    <StatusChoice
                      label="Spam"
                      dotClass="bg-red-600"
                      selected={adminUiBucket(lead) === "spam"}
                      disabled={busy}
                      onSelect={() => patch({ status: "closed", suspicious: true })}
                    />
                  </div>
                </section>

                <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-quegym-primary">Historial de estado</h3>
                  <ul className="mt-4 space-y-4 border-l-2 border-quegym-border pl-4">
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-white" />
                      <p className="text-sm font-medium text-quegym-primary">Lead recibido</p>
                      <p className="text-xs text-quegym-secondary">
                        Sistema · {formatTimeline(lead.createdAt)}
                      </p>
                    </li>
                    <li className="relative">
                      <span
                        className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                          data.notificationEnqueuedAt ? "bg-quegym-subtle" : "bg-amber-400"
                        }`}
                      />
                      <p className="text-sm font-medium text-quegym-primary">
                        Notificado al partner
                      </p>
                      <p className="text-xs text-quegym-secondary">
                        {data.notificationEnqueuedAt
                          ? `Sistema · ${formatTimeline(data.notificationEnqueuedAt)}`
                          : "Sin cola (webhook no configurado o pendiente)"}
                      </p>
                    </li>
                    {lead.firstContactedAt ? (
                      <li className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-quegym-highlight-soft0 ring-4 ring-white" />
                        <p className="text-sm font-medium text-quegym-primary">Atención registrada</p>
                        <p className="text-xs text-quegym-secondary">
                          Sistema · {formatTimeline(lead.firstContactedAt)}
                        </p>
                      </li>
                    ) : null}
                  </ul>
                  <Link
                    href={`/gyms/${encodeURIComponent(lead.venueSlug)}`}
                    className="mt-4 inline-block text-xs font-medium text-sky-700 underline"
                  >
                    Ver ficha pública del centro →
                  </Link>
                </section>

                <section className="qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-quegym-primary">Nota interna (admin)</h3>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Agregar nota sobre este lead…"
                    rows={4}
                    className="mt-3 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm text-quegym-primary outline-none ring-quegym-accent/10 placeholder:text-quegym-secondary focus:ring-2"
                  />
                  <UIButton
                    type="button"
                    variant="secondary"
                    className="mt-3 w-full !rounded-xl font-semibold"
                    disabled={busy}
                    onClick={() => void saveNote()}
                  >
                    Guardar nota
                  </UIButton>
                </section>
              </div>
            </div>
          ) : (
            <p className="text-sm text-quegym-secondary">Sin datos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderStatusBadge(props: { lead: LeadDetailPayload["lead"] }) {
  const b = adminUiBucket(props.lead);
  if (b === "sospechoso") {
    return (
      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-900">
        Sospechoso
      </span>
    );
  }
  if (b === "spam") {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-900">
        Spam
      </span>
    );
  }
  if (b === "atendido") {
    return (
      <span className="rounded-full bg-quegym-highlight-soft px-2.5 py-0.5 text-xs font-medium text-quegym-highlight">
        Atendido
      </span>
    );
  }
  return (
    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900">
      Nuevo
    </span>
  );
}

function adminUiBucket(lead: LeadDetailPayload["lead"]): "nuevo" | "atendido" | "sospechoso" | "spam" {
  if (lead.status === "closed") return "spam";
  if (lead.suspicious) return "sospechoso";
  if (lead.status === "contacted") return "atendido";
  return "nuevo";
}

function StatusChoice(props: {
  label: string;
  dotClass: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
        props.selected
          ? "border-sky-300 bg-sky-50 text-sky-950"
          : "border-quegym-border bg-quegym-elevated text-quegym-primary hover:bg-quegym-subtle"
      }`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${props.dotClass}`} />
      {props.label}
    </button>
  );
}

function DetailItem(props: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-quegym-secondary">{props.label}</dt>
      <dd className="mt-1 text-sm font-medium text-quegym-primary">{props.value}</dd>
    </div>
  );
}

function formatLeadPublicId(id: string): string {
  const n = parseInt(id.replace(/-/g, "").slice(0, 10), 16) % 10000;
  return `#${String(n).padStart(4, "0")}`;
}

function formatReceivedLine(iso: string): string {
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString("es-VE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const dateStr = d.toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    return `${isToday ? "hoy" : dateStr}, ${time} · ${dateStr}`;
  } catch {
    return iso;
  }
}

function formatFullDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

function formatTimeline(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    const time = d.toLocaleTimeString("es-VE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return isToday ? `Hoy, ${time}` : d.toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function maskIpConsent(ip: string | null): string {
  if (!ip) return "—";
  const p = ip.split(".");
  if (p.length === 4) return `${p[0]}.${p[1]}.xxx.xx.${p[3]}`;
  return ip;
}

function parseUaDetail(ua: string | null): string {
  if (!ua?.trim()) return "Web";
  const mobile = /Mobile|Android|iPhone/i.test(ua);
  let os = "—";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  let browser = "—";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  const device = /Tablet|iPad/i.test(ua) ? "Tablet" : mobile ? "Mobile" : "Desktop";
  return `${device} · ${os} · ${browser}`;
}

function channelLabel(ch: string): string {
  if (ch === "whatsapp") return "WhatsApp (desde ficha)";
  return "Formulario web (desde ficha)";
}

function intentLabelFull(intent: string): string {
  switch (intent) {
    case "membership":
      return "Membresía / plan mensual";
    case "trial":
      return "Prueba o visita";
    case "info":
      return "Información de precios";
    default:
      return intent;
  }
}

function formatConsentVersion(v: string | null): string {
  if (!v?.trim()) return "—";
  return `${v} · referencia legal vigente al envío`;
}
