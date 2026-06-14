"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { ClaimStatusActions } from "@/app/admin/partner-claims/claim-status-actions";
import type { PartnerClaimRow } from "@/app/admin/partner-claims/partner-claim-row";

type NewVenueDraftFields = {
  businessName?: string;
  zone?: string;
  venueType?: string;
  address?: string;
};

function parseDraft(raw: Record<string, unknown> | null | undefined): NewVenueDraftFields | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    businessName: typeof o.businessName === "string" ? o.businessName : undefined,
    zone: typeof o.zone === "string" ? o.zone : undefined,
    venueType: typeof o.venueType === "string" ? o.venueType : undefined,
    address: typeof o.address === "string" ? o.address : undefined,
  };
}

type EvidenceItem =
  | { kind: "url"; href: string; label: string }
  | { kind: "text"; text: string };

/** Split evidence field into URL-like segments vs plain text */
function parseEvidenceItems(evidence: string | null): EvidenceItem[] {
  if (!evidence?.trim()) return [];
  const parts = evidence
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: EvidenceItem[] = [];
  for (const p of parts) {
    try {
      const u = new URL(p);
      const label = u.pathname.split("/").filter(Boolean).pop() || p;
      out.push({ kind: "url", href: u.href, label });
    } catch {
      out.push({ kind: "text", text: p });
    }
  }
  return out;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function SectionShell(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-quegym-subtle p-4 ring-1 ring-quegym-border/80">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-quegym-secondary">{props.title}</p>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

function Field(props: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-quegym-secondary">{props.label}</p>
      <div className="mt-0.5 text-sm font-semibold text-quegym-primary">{props.value ?? "—"}</div>
    </div>
  );
}

function ApplicantRow(props: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-quegym-secondary">{props.icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-quegym-secondary">{props.label}</p>
        <p className="text-sm font-semibold text-quegym-primary">{props.value}</p>
      </div>
    </div>
  );
}

export function ClaimDetailModal(props: {
  claim: PartnerClaimRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const { claim, open, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || !claim) return null;

  const draft = claim.claimKind === "new" ? parseDraft(claim.newVenueDraft ?? null) : null;
  const centerTitle =
    draft?.businessName?.trim() ||
    claim.venueSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const evidenceItems = parseEvidenceItems(claim.evidence);

  const statusLabel =
    claim.status === "pending_review"
      ? "Pendiente de revisión"
      : claim.status === "approved"
        ? "Aprobado"
        : "Rechazado";

  const typeLabel =
    claim.claimKind === "new" ? "Registro nuevo" : "Claim (reclamo de ficha)";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-[101] flex max-h-[min(92vh,880px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-quegym-elevated shadow-2xl ring-1 ring-black/10"
      >
        <header className="shrink-0 bg-[#111827] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Detalle de solicitud
              </h2>
              <p className="mt-0.5 truncate text-sm text-white/70">{centerTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-white/90 transition hover:bg-quegym-elevated/10"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={
                claim.status === "pending_review"
                  ? "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/90"
                  : claim.status === "approved"
                    ? "inline-flex rounded-full bg-quegym-highlight-soft px-2.5 py-1 text-xs font-semibold text-quegym-highlight ring-1 ring-quegym-highlight/30"
                    : "inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-900 ring-1 ring-rose-200/90"
              }
            >
              {statusLabel}
            </span>
            <span className="inline-flex rounded-full bg-quegym-subtle px-2.5 py-1 text-xs font-semibold text-quegym-primary ring-1 ring-quegym-border/80">
              Tipo: {typeLabel}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <SectionShell title="Información del centro">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nombre comercial"
                  value={
                    draft?.businessName?.trim() ? (
                      draft.businessName
                    ) : (
                      <Link
                        href={`/gyms/${encodeURIComponent(claim.venueSlug)}`}
                        className="font-semibold text-quegym-accent underline decoration-quegym-border underline-offset-2"
                      >
                        Ver ficha ({claim.venueSlug})
                      </Link>
                    )
                  }
                />
                <Field label="Slug" value={claim.venueSlug} />
                {draft?.address ? <Field label="Dirección" value={draft.address} /> : null}
                {draft?.zone ? (
                  <Field label="Zona" value={draft.zone} />
                ) : (
                  <Field label="Zona" value="—" />
                )}
                {draft?.venueType ? (
                  <Field label="Tipo de espacio (borrador)" value={draft.venueType} />
                ) : null}
              </div>
              <p className="mt-3 text-xs text-quegym-secondary">
                {claim.claimKind === "new"
                  ? "Alta nueva: al aprobar se crea el stub en catálogo con este slug."
                  : "Reclamo sobre una ficha ya publicada en el catálogo."}
              </p>
            </SectionShell>

            <SectionShell title="Datos del solicitante">
              <div className="grid gap-4">
                <ApplicantRow
                  label="Nombre completo"
                  value={claim.representativeName}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />
                <ApplicantRow
                  label="Email"
                  value={
                    <a
                      href={`mailto:${encodeURIComponent(claim.representativeEmail)}`}
                      className="break-all text-quegym-accent underline"
                    >
                      {claim.representativeEmail}
                    </a>
                  }
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
                <ApplicantRow
                  label="Teléfono"
                  value={
                    <a href={`tel:${claim.representativePhone.replace(/\s/g, "")}`} className="text-quegym-primary">
                      {claim.representativePhone}
                    </a>
                  }
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  }
                />
              </div>
            </SectionShell>

            <SectionShell title="Evidencia adjunta">
              {evidenceItems.length === 0 ? (
                <p className="text-sm text-quegym-secondary">Sin evidencia textual o enlaces adjuntos.</p>
              ) : (
                <ul className="space-y-2">
                  {evidenceItems.map((item, i) =>
                    item.kind === "url" ? (
                      <li key={`${item.href}-${i}`}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm transition hover:bg-sky-100/80"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <svg
                              className="h-5 w-5 shrink-0 text-sky-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="min-w-0 truncate font-medium text-sky-900">{item.label}</span>
                          </span>
                          <svg className="h-4 w-4 shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </li>
                    ) : (
                      <li
                        key={`t-${i}`}
                        className="rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-sm text-quegym-primary"
                      >
                        {item.text}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </SectionShell>

            <SectionShell title="Historial">
              <div className="relative pl-8">
                <span className="absolute bottom-2 left-[11px] top-2 w-px bg-quegym-subtle" aria-hidden />
                <ul className="space-y-4">
                  <li className="relative">
                    <span className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-2 ring-white">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <p className="text-sm font-semibold text-quegym-primary">Solicitud recibida</p>
                    <p className="text-xs text-quegym-secondary">{formatDateTime(claim.createdAt)}</p>
                  </li>
                  {claim.status !== "pending_review" ? (
                    <li className="relative">
                      <span className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-quegym-subtle text-quegym-secondary ring-2 ring-white">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <p className="text-sm font-semibold text-quegym-primary">
                        Decisión: {claim.status === "approved" ? "Aprobado" : "Rechazado"}
                      </p>
                      <p className="text-xs text-quegym-secondary">
                        {claim.updatedAt ? formatDateTime(claim.updatedAt) : "—"}
                      </p>
                    </li>
                  ) : (
                    <li className="relative">
                      <span className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 ring-2 ring-white">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <p className="text-sm font-semibold text-quegym-primary">En revisión</p>
                      <p className="text-xs text-quegym-secondary">Pendiente de aprobación o rechazo.</p>
                    </li>
                  )}
                </ul>
              </div>
            </SectionShell>

            {claim.status === "pending_review" ? (
              <>
                <div className="rounded-xl border border-quegym-border bg-quegym-elevated p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-quegym-secondary">
                    Acciones
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <ClaimStatusActions
                        claimId={claim.id}
                        currentStatus={claim.status}
                        onResolved={() => onClose()}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-quegym-secondary">
                    Tras decidir, cierra el modal o actualiza la página si no ves el cambio al instante.
                  </p>
                </div>

                <div className="rounded-xl border border-dashed border-quegym-border bg-quegym-subtle/80 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-quegym-secondary">
                    Notas internas (opcional)
                  </p>
                  <p className="mt-1 text-sm text-quegym-secondary">
                    La persistencia de notas en QueGym está prevista para una iteración posterior; documenta acuerdos en tu
                    sistema de tickets o CRM.
                  </p>
                </div>
              </>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`/admin/catalogo/${encodeURIComponent(claim.venueSlug)}/panel`}
                className="text-sm font-medium text-quegym-accent underline underline-offset-2"
              >
                Abrir panel catálogo
              </Link>
              <Link
                href={`/gyms/${encodeURIComponent(claim.venueSlug)}`}
                className="text-sm font-medium text-quegym-accent underline underline-offset-2"
              >
                Ver ficha pública
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
