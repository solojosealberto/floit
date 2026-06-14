"use client";

import { UIBanner, UIButton } from "@floit/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRAND_NAME, BRAND_PARTNERS } from "@/lib/brand";
import { formatUpstreamError } from "@/lib/format-upstream-error";

/** Alineado con `/partner/login` y manual QueGym (Green/Ink) */
const BRAND_ACCENT = "border-quegym-accent bg-quegym-accent text-white";
const BRAND_ACCENT_HOVER = "hover:bg-quegym-accent-hover";
const BRAND_FOCUS_RING = "focus-visible:ring-quegym-accent/30";
const ACCENT_TEXT = "text-quegym-ink";
const BTN_PRIMARY = `${BRAND_ACCENT} ${BRAND_ACCENT_HOVER}`;
const CARD_SELECTED = "border-quegym-accent bg-quegym-elevated";
const CARD_IDLE =
  "border-quegym-border bg-quegym-elevated opacity-90 hover:border-quegym-accent/50 hover:opacity-100";

const VENUE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "gym", label: "Gimnasio clásico" },
  { value: "functional", label: "Functional / CrossFit" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "cycling", label: "Cycling" },
  { value: "mixed", label: "Mixto" },
  { value: "personal_training", label: "Personal training" },
];

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeNewVenueSlug(businessName: string): string {
  const base = slugify(businessName).slice(0, 72) || "centro";
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = `alta-${base}-${suffix}`;
  return slug.slice(0, 160);
}

function buildEvidencePayload(opts: {
  claimMode: "existing" | "new";
  role: string;
  venueLabel: string;
  evidenceNote: string;
  evidenceFileName: string | null;
  newFields?: {
    businessName: string;
    zone: string;
    venueType: string;
    address: string;
  };
}): string {
  const lines: string[] = [];
  lines.push(`Cargo en el centro: ${opts.role.trim() || "—"}`);
  lines.push("");
  if (opts.claimMode === "existing") {
    lines.push("Tipo: Reclamo de centro existente");
    lines.push(`Centro: ${opts.venueLabel}`);
  } else if (opts.newFields) {
    lines.push("Tipo: Registro de centro nuevo");
    lines.push("--- Datos del centro ---");
    lines.push(`Nombre comercial: ${opts.newFields.businessName}`);
    lines.push(`Zona / municipio: ${opts.newFields.zone}`);
    lines.push(`Tipo de centro: ${opts.newFields.venueType}`);
    lines.push(`Dirección: ${opts.newFields.address || "—"}`);
  }
  lines.push("");
  lines.push("--- Evidencia de vínculo ---");
  if (opts.evidenceFileName) {
    lines.push(`Archivo indicado: ${opts.evidenceFileName}`);
  }
  lines.push(opts.evidenceNote.trim() || "—");
  let text = lines.join("\n");
  if (text.length > 1200) {
    text = `${text.slice(0, 1170)}\n… (recortado; máx. 1200 caracteres)`;
  }
  return text;
}

type SearchHit = { slug: string; name: string; zone?: string };

function StepCircle({
  n,
  state,
}: {
  n: 1 | 2 | 3;
  state: "todo" | "current" | "done";
}) {
  if (state === "done") {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-quegym-highlight/30 bg-quegym-highlight-soft text-quegym-highlight"
        aria-hidden
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${BRAND_ACCENT}`}
      >
        {n}
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-sm font-medium text-quegym-secondary">
      {n}
    </span>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const s1: "current" | "done" = step === 1 ? "current" : "done";
  const s2: "todo" | "current" | "done" =
    step === 1 ? "todo" : step === 2 ? "current" : "done";
  const s3: "todo" | "current" = step === 3 ? "current" : "todo";

  const labels = [
    { n: 1 as const, key: "tipo", label: "Tu caso", state: s1 },
    { n: 2 as const, key: "centro", label: "Centro", state: s2 },
    { n: 3 as const, key: "contacto", label: "Contacto", state: s3 },
  ];

  return (
    <div className="relative px-2">
      <div
        className="pointer-events-none absolute left-[calc(16.67%+18px)] right-[calc(16.67%+18px)] top-[17px] z-0 h-px bg-quegym-subtle sm:left-[calc(16.67%+20px)] sm:right-[calc(16.67%+20px)]"
        aria-hidden
      />
      <div className="relative z-10 flex justify-between gap-2">
        {labels.map((item) => (
          <div
            key={item.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <StepCircle n={item.n} state={item.state} />
            <span
              className={`text-center text-[11px] font-medium leading-tight sm:text-xs ${
                item.state === "current"
                  ? `font-semibold ${ACCENT_TEXT}`
                  : item.state === "done"
                    ? "text-quegym-highlight"
                    : "text-quegym-secondary"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PARTNER_SESSION_MODAL_KEY = "floit_partner_claim_session_modal_seen";

function PartnerSessionActiveModal({ active }: { active: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    if (sessionStorage.getItem(PARTNER_SESSION_MODAL_KEY) === "1") return;
    queueMicrotask(() => dialogRef.current?.showModal());
  }, [active]);

  const dismiss = () => {
    sessionStorage.setItem(PARTNER_SESSION_MODAL_KEY, "1");
    dialogRef.current?.close();
  };

  if (!active) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-quegym-border bg-quegym-elevated p-6 shadow-xl backdrop:bg-black/45"
      onClose={() => {
        sessionStorage.setItem(PARTNER_SESSION_MODAL_KEY, "1");
      }}
    >
      <h2 className="text-lg font-semibold text-quegym-primary">
        Sesión partner activa
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-quegym-secondary">
        Detectamos que ya iniciaste sesión. Puedes seguir con el alta o reclamo
        de centro sin usar la sección de inicio de sesión.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="qg-btn-ghost qg-motion rounded-xl border border-quegym-border bg-quegym-elevated px-4 py-2.5 text-sm font-semibold text-quegym-primary"
          onClick={dismiss}
        >
          Entendido
        </button>
      </div>
    </dialog>
  );
}

export function ClaimWizard({
  zones,
  hasPartnerSession = false,
  returnTo,
}: {
  zones: string[];
  hasPartnerSession?: boolean;
  /** Safe internal path (e.g. /admin/catalogo) after submit */
  returnTo?: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [claimMode, setClaimMode] = useState<"existing" | "new" | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedVenueLabel, setSelectedVenueLabel] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [zone, setZone] = useState("");
  const [venueType, setVenueType] = useState("");
  const [address, setAddress] = useState("");

  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");

  const [applicantName, setApplicantName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    id: string;
    venueLabel: string;
    typeLabel: string;
    email: string;
    sentAt: Date;
  } | null>(null);

  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setSearchLoading(true);
        try {
          const res = await fetch(
            `/api/compare/search?q=${encodeURIComponent(q)}`,
            { cache: "no-store" },
          );
          const data = (await res.json().catch(() => ({}))) as {
            items?: SearchHit[];
          };
          setSearchResults(data.items ?? []);
        } catch {
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      })();
    }, 320);
    return () => clearTimeout(t);
  }, [searchQ]);

  const venueTypeLabel = useMemo(() => {
    return VENUE_TYPE_OPTIONS.find((o) => o.value === venueType)?.label ?? venueType;
  }, [venueType]);

  const canAdvanceFrom1 = claimMode !== null;

  const canAdvanceFrom2 = useCallback(() => {
    if (!claimMode) return false;
    if (claimMode === "existing") {
      if (!selectedSlug) return false;
      if (!evidenceFileName && evidenceNote.trim().length < 8) return false;
      return true;
    }
    if (!businessName.trim() || !zone || !venueType) return false;
    if (!evidenceFileName && evidenceNote.trim().length < 8) return false;
    return true;
  }, [
    claimMode,
    selectedSlug,
    evidenceFileName,
    evidenceNote,
    businessName,
    zone,
    venueType,
  ]);

  const canSubmit =
    applicantName.trim().length >= 2 &&
    email.includes("@") &&
    phone.trim().length >= 6 &&
    termsAccepted;

  async function submitClaim() {
    setBusy(true);
    setErr(null);
    try {
      let venueSlug = "";
      let venueLabel = "";
      if (claimMode === "existing") {
        venueSlug = selectedSlug!;
        venueLabel = selectedVenueLabel;
      } else {
        venueSlug = makeNewVenueSlug(businessName);
        venueLabel = businessName.trim();
      }

      const evidence = buildEvidencePayload({
        claimMode: claimMode!,
        role,
        venueLabel:
          claimMode === "existing" ? selectedVenueLabel : businessName.trim(),
        evidenceNote,
        evidenceFileName,
        newFields:
          claimMode === "new"
            ? {
                businessName: businessName.trim(),
                zone,
                venueType: venueTypeLabel,
                address: address.trim(),
              }
            : undefined,
      });

      const res = await fetch("/api/partner/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venueSlug,
          representativeName: applicantName.trim(),
          representativeEmail: email.trim(),
          representativePhone: phone.trim(),
          evidence,
          claimKind: claimMode === "existing" ? "existing" : "new",
          newVenueDraft:
            claimMode === "new"
              ? {
                  businessName: businessName.trim(),
                  zone: zone.trim(),
                  venueType: venueType.trim(),
                  address: address.trim(),
                }
              : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      if (!res.ok) {
        setErr(formatUpstreamError(data, "No se pudo enviar la solicitud."));
        return;
      }
      setSuccess({
        id: data.id ?? "—",
        venueLabel,
        typeLabel:
          claimMode === "existing"
            ? "Reclamo de centro existente"
            : "Registro de centro nuevo",
        email: email.trim(),
        sentAt: new Date(),
      });
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    const sentStr = new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(success.sentAt);

    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col px-4 py-8 md:max-w-2xl md:py-12">
        <div className="flex flex-1 flex-col items-center text-center">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50"
            aria-hidden
          >
            <svg
              className="h-8 w-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-quegym-primary md:text-3xl">
            Solicitud enviada
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-quegym-secondary md:text-base">
            Recibimos tu solicitud para administrar{" "}
            <strong className="text-quegym-primary">{success.venueLabel}</strong>.
            Nuestro equipo la revisará y te notificará por correo.
          </p>

          <div className="mt-8 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm text-amber-950 md:px-6">
            <p className="mb-3 flex items-center gap-2 font-medium">
              <span className="text-amber-600">●</span> Estado: Pendiente de
              revisión
            </p>
            <dl className="space-y-2 text-amber-950/90">
              <div>
                <dt className="text-xs font-medium text-amber-900/70">
                  Centro solicitado
                </dt>
                <dd>{success.venueLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-amber-900/70">Tipo</dt>
                <dd>{success.typeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-amber-900/70">
                  Correo (acceso al panel)
                </dt>
                <dd>{success.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-amber-900/70">
                  Enviado
                </dt>
                <dd>{sentStr}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 w-full rounded-2xl bg-quegym-subtle px-4 py-4 text-left md:px-6">
            <p className="text-sm font-semibold text-quegym-primary">
              ¿Qué pasa ahora?
            </p>
            <ol className="mt-3 space-y-3 text-sm text-quegym-primary">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-quegym-subtle text-xs font-semibold text-quegym-primary">
                  1
                </span>
                <span>
                  {BRAND_NAME} revisa tu evidencia{" "}
                  <span className="text-quegym-secondary">(1–2 días hábiles)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-quegym-subtle text-xs font-semibold text-quegym-primary">
                  2
                </span>
                <span>Recibirás un correo con el resultado</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-quegym-subtle text-xs font-semibold text-quegym-primary">
                  3
                </span>
                <span>
                  Si es aprobado: entrás en{" "}
                  <Link href="/partner/login" className="font-medium text-quegym-accent underline">
                    {BRAND_PARTNERS}
                  </Link>{" "}
                  con este mismo correo (tu proveedor de acceso debe permitir ese usuario).
                </span>
              </li>
            </ol>
          </div>

          <div className="mt-10 w-full max-w-md space-y-3">
            {returnTo ? (
              <Link href={returnTo} className="block w-full">
                <UIButton className="w-full justify-center rounded-xl bg-quegym-accent py-3 text-base text-white hover:bg-quegym-accent-hover">
                  Volver al catálogo admin
                </UIButton>
              </Link>
            ) : null}
            <Link href="/" className="block w-full">
              <UIButton
                variant="secondary"
                className="w-full justify-center rounded-xl border-quegym-border py-3 text-base"
              >
                Volver a {BRAND_NAME}
              </UIButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6 md:max-w-3xl md:py-10">
      <PartnerSessionActiveModal active={hasPartnerSession} />

      <header className="mb-8 md:mb-10">
        <div className="flex items-start gap-3">
          <Link
            href="/partner"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-quegym-primary qg-btn-ghost qg-motion"
            aria-label="Volver a Partners"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-quegym-secondary">
              {BRAND_PARTNERS}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-quegym-primary md:text-3xl">
              Tu centro en {BRAND_NAME}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-quegym-secondary md:text-base">
              Mismo formulario para dos situaciones:{" "}
              <strong className="font-semibold text-quegym-primary">reclamar</strong> una ficha que ya existe o{" "}
              <strong className="font-semibold text-quegym-primary">registrar</strong> un centro que todavía no está en el
              directorio.
            </p>
          </div>
        </div>
      </header>

      {step !== 1 ? (
        <div className="mb-8 md:mb-10">
          <Stepper step={step} />
        </div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6 md:space-y-8">
          {!hasPartnerSession ? (
            <div className="qg-surface-subtle qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-5 md:p-6">
              <h2 className="text-lg font-semibold text-quegym-primary md:text-xl">
                ¿Ya tienes cuenta de partner?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-quegym-secondary md:text-base">
                Inicia sesión para abrir el panel. Esta página es solo para iniciar un{" "}
                <span className="font-medium text-quegym-primary">reclamo</span> o un{" "}
                <span className="font-medium text-quegym-primary">alta nueva</span>.
              </p>
              <Link
                href="/partner/login"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-quegym-accent px-4 py-3 text-base font-semibold text-white transition hover:bg-quegym-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quegym-accent/40 md:w-auto md:min-w-[220px]"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : null}

          <div className="qg-surface qg-motion rounded-3xl border border-quegym-border bg-quegym-elevated p-5 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
              Paso 1 de 3 · Elige tu camino
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-quegym-primary md:text-2xl">
              ¿Tu centro ya aparece en {BRAND_NAME}?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-quegym-secondary md:text-base">
              Elige una opción. Después te pedimos el centro o los datos del alta y, al final, tu contacto para la
              revisión (1–2 días hábiles).
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
              <button
                type="button"
                onClick={() => setClaimMode("existing")}
                className={`flex w-full rounded-2xl border-2 p-4 text-left transition focus:outline-none focus-visible:ring-2 ${BRAND_FOCUS_RING} md:p-5 ${
                  claimMode === "existing" ? CARD_SELECTED : CARD_IDLE
                }`}
              >
                <div
                  className={`mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl md:h-14 md:w-14 ${
                    claimMode === "existing" ? BRAND_ACCENT : "bg-quegym-subtle text-quegym-secondary"
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-quegym-primary">Sí — reclamar ficha</p>
                  <p className="mt-1 text-sm text-quegym-secondary">
                    El centro ya está en el buscador. Validamos que puedes administrarlo.
                  </p>
                </div>
                <div
                  className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    claimMode === "existing"
                      ? "border-quegym-accent bg-quegym-accent"
                      : "border-quegym-border bg-quegym-elevated"
                  }`}
                >
                  {claimMode === "existing" ? (
                    <span className="h-2 w-2 rounded-full bg-quegym-elevated" />
                  ) : null}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClaimMode("new")}
                className={`flex w-full rounded-2xl border-2 p-4 text-left transition focus:outline-none focus-visible:ring-2 ${BRAND_FOCUS_RING} md:p-5 ${
                  claimMode === "new" ? CARD_SELECTED : CARD_IDLE
                }`}
              >
                <div
                  className={`mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl md:h-14 md:w-14 ${
                    claimMode === "new" ? BRAND_ACCENT : "bg-quegym-subtle text-quegym-secondary"
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-quegym-primary">No — registrar centro nuevo</p>
                  <p className="mt-1 text-sm text-quegym-secondary">
                    Cargamos los datos básicos; el equipo los revisa antes de publicar la ficha.
                  </p>
                </div>
                <div
                  className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    claimMode === "new"
                      ? "border-quegym-accent bg-quegym-accent"
                      : "border-quegym-border bg-quegym-elevated"
                  }`}
                >
                  {claimMode === "new" ? (
                    <span className="h-2 w-2 rounded-full bg-quegym-elevated" />
                  ) : null}
                </div>
              </button>
            </div>

            <div className="mt-8 space-y-3 border-t border-quegym-border pt-6">
              <button
                type="button"
                disabled={!canAdvanceFrom1}
                onClick={() => canAdvanceFrom1 && setStep(2)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${BTN_PRIMARY}`}
              >
                Continuar al paso 2
                <span aria-hidden>→</span>
              </button>
              <p className="text-center text-xs text-quegym-secondary">
                Menos de 5 minutos · El equipo responde por correo en 1–2 días hábiles
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 && claimMode === "existing" ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
              Paso 2 · Centro existente
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-quegym-primary">
              Encuentra tu ficha en {BRAND_NAME}
            </h2>
            <p className="mt-2 text-sm text-quegym-secondary">
              Busca por nombre o zona y selecciona el centro. Luego adjunta evidencia para validar tu vínculo.
            </p>
          </div>

          <label className="block">
            <span className="sr-only">Buscar</span>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-quegym-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full rounded-xl border border-quegym-border bg-quegym-subtle py-3 pl-11 pr-3 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="Nombre del gimnasio…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                autoComplete="off"
              />
            </div>
          </label>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-quegym-secondary">
              Resultados en Caracas
            </p>
            <div className="space-y-2">
              {searchLoading ? (
                <p className="text-sm text-quegym-secondary">Buscando…</p>
              ) : null}
              {!searchLoading &&
              searchQ.trim().length >= 2 &&
              searchResults.length === 0 ? (
                <p className="text-sm text-quegym-secondary">
                  No encontramos coincidencias. Probá con otro término.
                </p>
              ) : null}
              {searchResults.map((hit) => {
                const selected = selectedSlug === hit.slug;
                const sub = [hit.zone].filter(Boolean).join(", ");
                return (
                  <button
                    key={hit.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(hit.slug);
                      setSelectedVenueLabel(hit.name);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition md:p-4 ${
                      selected
                        ? "border-quegym-accent bg-quegym-elevated shadow-sm"
                        : "border-quegym-border bg-quegym-elevated hover:border-quegym-border"
                    }`}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-quegym-subtle text-xs font-medium text-quegym-secondary">
                      Logo
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-quegym-primary">{hit.name}</p>
                      {sub ? (
                        <p className="text-sm text-quegym-secondary">{sub}</p>
                      ) : null}
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-quegym-accent bg-quegym-accent"
                          : "border-quegym-border"
                      }`}
                    >
                      {selected ? (
                        <span className="h-2 w-2 rounded-full bg-quegym-elevated" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-x-0 top-1/2 h-px bg-quegym-subtle" />
            <span className="relative mx-auto block w-fit bg-[#F5F7FA] px-3 text-xs font-medium text-quegym-secondary">
              Evidencia de vínculo
            </span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-quegym-primary">
              Adjunta evidencia de que eres administrador del centro{" "}
              <span className="text-red-600">*</span>
            </label>
            <EvidenceDropZone
              fileName={evidenceFileName}
              onFile={(name) => setEvidenceFileName(name)}
              onClear={() => setEvidenceFileName(null)}
            />
            <textarea
              className="mt-3 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
              rows={3}
              placeholder="Detalle adicional (opcional si ya subiste archivo)"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              maxLength={800}
            />
            <p className="mt-1 text-xs text-quegym-secondary">
              Ejemplos: RIF del negocio, contrato de alquiler, factura, foto
              interna del gimnasio con cartel.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-quegym-border bg-quegym-elevated px-5 py-3 text-sm font-semibold text-quegym-primary qg-btn-ghost qg-motion"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={!canAdvanceFrom2()}
              onClick={() => canAdvanceFrom2() && setStep(3)}
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[260px] ${BTN_PRIMARY}`}
            >
              Continuar → Datos de contacto
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 && claimMode === "new" ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
              Paso 2 · Centro nuevo
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-quegym-primary md:text-3xl">
              Datos del centro a registrar
            </h2>
            <p className="mt-2 text-sm text-quegym-secondary">
              Completa lo básico para crear la ficha; el equipo la revisa antes de publicarla (1–2 días hábiles).
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-quegym-primary">
                Nombre comercial del centro <span className="text-red-600">*</span>
              </span>
              <input
                className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="Nombre como aparece públicamente"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-quegym-primary">
                  Zona / municipio <span className="text-red-600">*</span>
                </span>
                {zones.length > 0 ? (
                  <select
                    className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                  >
                    <option value="">Seleccionar zona</option>
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                    placeholder="Ej: Chacao, Baruta…"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                  />
                )}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-quegym-primary">
                  Tipo de centro <span className="text-red-600">*</span>
                </span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                >
                  <option value="">Gym clásico, CrossFit…</option>
                  {VENUE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-quegym-primary">
                Dirección completa
              </span>
              <input
                className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="Av., calle, sector, referencia…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-quegym-primary">
              Evidencia de vínculo con el centro{" "}
              <span className="text-red-600">*</span>
            </label>
            <EvidenceDropZone
              fileName={evidenceFileName}
              onFile={(name) => setEvidenceFileName(name)}
              onClear={() => setEvidenceFileName(null)}
            />
            <textarea
              className="mt-3 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
              rows={3}
              placeholder="RIF, contrato, factura o descripción del respaldo"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              maxLength={800}
            />
            <p className="mt-1 text-xs text-quegym-secondary">
              RIF, contrato, factura o foto interna con cartel visible · JPG, PNG,
              PDF · Máx. 5MB
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-quegym-border bg-quegym-elevated px-5 py-3 text-sm font-semibold text-quegym-primary qg-btn-ghost qg-motion"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={!canAdvanceFrom2()}
              onClick={() => canAdvanceFrom2() && setStep(3)}
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${BTN_PRIMARY}`}
            >
              Continuar → Datos de contacto
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-quegym-secondary">
              Paso 3 · Quién solicita
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-quegym-primary">
              Contacto para la revisión
            </h2>
            <p className="mt-2 text-sm text-quegym-secondary">
              Datos de quien envía el trámite. {BRAND_NAME} usará este correo y teléfono para avisarte el resultado.
              {" "}
              <strong className="font-medium text-quegym-primary">
                Usa el correo con el que podrás iniciar sesión en {BRAND_PARTNERS}
              </strong>{" "}
              cuando la solicitud sea aprobada (debe coincidir con tu cuenta en el acceso de socios).
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-quegym-primary">
                Nombre completo del solicitante{" "}
                <span className="text-red-600">*</span>
              </span>
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="Tu nombre"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-quegym-primary">
                Cargo en el centro
              </span>
              <input
                className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="Ej: Propietario, Gerente, Administrador"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-quegym-primary">
                Correo electrónico de contacto{" "}
                <span className="text-red-600">*</span>
              </span>
              <input
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="tu@gimnasio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-quegym-secondary">
                Este correo quedará vinculado a tu centro como partner; entrarás con él en{" "}
                <Link href="/partner/login" className="font-medium text-quegym-accent underline">
                  /partner/login
                </Link>{" "}
                tras la aprobación.
              </p>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-quegym-primary">
                Teléfono / WhatsApp <span className="text-red-600">*</span>
              </span>
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2.5 text-sm outline-none ring-quegym-accent/20 focus:ring-2"
                placeholder="+58 412 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-quegym-border bg-quegym-elevated p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-quegym-border text-quegym-accent focus:ring-quegym-accent"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="text-sm text-quegym-primary">
              Declaro que tengo autorización para administrar el centro indicado
              y acepto los{" "}
              <Link href="/privacidad" className="font-medium underline">
                términos de uso
              </Link>{" "}
              de {BRAND_PARTNERS}.
            </span>
          </label>

          {err ? (
            <UIBanner variant="error" className="text-sm">
              {err}
            </UIBanner>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-quegym-border bg-quegym-elevated px-5 py-3 text-sm font-semibold text-quegym-primary shadow-sm sm:order-1"
            >
              Atrás
            </button>
            <div className="flex flex-1 flex-col gap-2 sm:order-2 sm:items-end">
              <button
                type="button"
                disabled={!canSubmit || busy}
                onClick={() => void submitClaim()}
                className={`w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[240px] ${BTN_PRIMARY}`}
              >
                {busy ? "Enviando…" : "Enviar solicitud"}
              </button>
              <p className="text-center text-xs text-quegym-secondary sm:text-right">
                La solicitud será revisada en 1–2 días hábiles
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function EvidenceDropZone({
  fileName,
  onFile,
  onClear,
}: {
  fileName: string | null;
  onFile: (name: string) => void;
  onClear: () => void;
}) {
  const id = "claim-evidence-input";
  return (
    <div className="rounded-2xl border-2 border-dashed border-quegym-border bg-quegym-subtle p-4 md:flex md:items-center md:gap-4 md:p-5">
      <div className="hidden shrink-0 md:block" aria-hidden>
        <svg
          className="h-10 w-10 text-quegym-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-quegym-primary">
          {fileName ? fileName : "Arrastra o selecciona un archivo"}
        </p>
        <p className="mt-1 text-xs text-quegym-secondary">
          RIF, contrato, factura o foto interna con cartel visible · JPG, PNG,
          PDF · Máx. 5MB
        </p>
      </div>
      <div className="mt-3 flex shrink-0 gap-2 md:mt-0">
        <input
          id={id}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f.name);
          }}
        />
        {fileName ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-quegym-border bg-quegym-elevated px-3 py-2 text-sm font-medium text-quegym-primary"
          >
            Quitar
          </button>
        ) : null}
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-quegym-border bg-quegym-elevated px-4 py-2 text-sm font-semibold text-quegym-primary shadow-sm"
        >
          Seleccionar archivo
        </label>
      </div>
    </div>
  );
}
