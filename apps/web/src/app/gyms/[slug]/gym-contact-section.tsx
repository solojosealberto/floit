"use client";

import {
  UIBadge,
  UIBanner,
  UIButton,
  UISelect,
  UITextInput,
} from "@floit/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { formatUpstreamError } from "@/lib/format-upstream-error";
import { trackEvent } from "@/lib/track";

/** Debe coincidir con textos referenciados en `/privacidad` y OpenAPI `consentVersion`. */
const FLOIT_CONSENT_VERSION = "floit-r2-2026-04";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const CTA_EXPERIMENT_ID = "cta_lead_entrypoint_v2";
const CTA_EXPERIMENT_STORAGE_KEY = "floit_exp_cta_lead_entrypoint_v2";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  slug: string;
  venueName: string;
  allowsTrial: boolean;
  contactWhatsapp?: string | null;
};

export function GymContactSection({
  slug,
  venueName,
  allowsTrial,
  contactWhatsapp,
}: Props) {
  const router = useRouter();
  const turnstileHostRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadErr, setLeadErr] = useState<string | null>(null);
  const [intent, setIntent] = useState<"membership" | "trial" | "info">("info");
  const [ctaVariant, setCtaVariant] = useState<
    "membership" | "trial" | "whatsapp_first"
  >("membership");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportOk, setReportOk] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const assignmentTrackedRef = useRef(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileHostRef.current) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !turnstileHostRef.current || !window.turnstile) return;
      if (turnstileWidgetIdRef.current && window.turnstile.remove) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      }
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileHostRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
        theme: "auto",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = render;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", render, { once: true });
      }
    }

    return () => {
      cancelled = true;
      if (turnstileWidgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      }
      turnstileWidgetIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CTA_EXPERIMENT_STORAGE_KEY);
    let variant: "membership" | "trial" | "whatsapp_first";
    if (
      stored === "membership" ||
      stored === "trial" ||
      stored === "whatsapp_first"
    ) {
      variant = stored;
    } else {
      const draw = Math.random();
      variant =
        draw < 0.34
          ? "membership"
          : draw < 0.67
            ? "trial"
            : "whatsapp_first";
      window.localStorage.setItem(CTA_EXPERIMENT_STORAGE_KEY, variant);
    }
    const waDigits = contactWhatsapp?.replace(/\D/g, "") ?? "";
    if (variant === "whatsapp_first" && !waDigits) {
      variant = allowsTrial ? "trial" : "membership";
    }
    if (!allowsTrial && variant === "trial") {
      variant = "membership";
    }
    setCtaVariant(variant);
    setIntent(variant === "trial" ? "trial" : "membership");
    if (!assignmentTrackedRef.current) {
      trackEvent("experiment_assignment", {
        experiment: CTA_EXPERIMENT_ID,
        ctaVariant: variant,
        venueSlug: slug,
      });
      assignmentTrackedRef.current = true;
    }
  }, [allowsTrial, slug, contactWhatsapp]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      setContactModalOpen(hash === "#contactar-modal");
      setReportModalOpen(hash === "#reportar-modal");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href="#contactar-modal"], a[href="#reportar-modal"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href === "#contactar-modal") {
        event.preventDefault();
        setReportModalOpen(false);
        setContactModalOpen(true);
        history.replaceState(null, "", `${window.location.pathname}${window.location.search}#contactar-modal`);
      } else if (href === "#reportar-modal") {
        event.preventDefault();
        setContactModalOpen(false);
        setReportModalOpen(true);
        history.replaceState(null, "", `${window.location.pathname}${window.location.search}#reportar-modal`);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function onLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLeadErr(null);
    if (intent === "trial" && !allowsTrial) {
      setLeadErr(`Este centro no indica prueba gratuita en ${BRAND_NAME}.`);
      return;
    }
    const fd = new FormData(e.currentTarget);
    const consentEl = e.currentTarget.elements.namedItem("consentAccepted");
    const consentOk =
      consentEl instanceof HTMLInputElement &&
      consentEl.type === "checkbox" &&
      consentEl.checked;
    if (!consentOk) {
      setLeadErr("Debes aceptar el tratamiento de datos para enviar la solicitud.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setLeadErr("Completa la verificación anti-spam antes de enviar.");
      return;
    }

    const payload = {
      venueSlug: slug,
      intent,
      name: String(fd.get("name") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim() || undefined,
      preferredSlot: String(fd.get("preferredSlot") ?? "").trim() || undefined,
      message: String(fd.get("message") ?? "").trim() || undefined,
      consentAccepted: true as const,
      consentVersion: FLOIT_CONSENT_VERSION,
      entryChannel: "form" as const,
      turnstileToken: turnstileToken ?? undefined,
    };
    setLeadBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        publicToken?: string;
      };
      if (!res.ok) {
        setLeadErr(formatUpstreamError(data, "No se pudo enviar."));
        return;
      }
      trackEvent("lead_submit", {
        venueSlug: slug,
        intent,
        experiment: CTA_EXPERIMENT_ID,
        ctaVariant,
      });
      trackEvent("cta_click", {
        channel: "lead_form",
        venueSlug: slug,
        intent,
        experiment: CTA_EXPERIMENT_ID,
        ctaVariant,
      });
      const token = data.publicToken;
      if (token) {
        router.push(`/lead/confirmacion?token=${encodeURIComponent(token)}`);
      } else {
        router.push("/lead/confirmacion");
      }
    } catch {
      setLeadErr("Error de red. Intenta de nuevo.");
    } finally {
      setLeadBusy(false);
    }
  }

  function handleWhatsappFirstClick(): void {
    const waDigits = contactWhatsapp?.replace(/\D/g, "") ?? "";
    if (!waDigits) return;
    const waMsg = encodeURIComponent(
      `Hola, vi ${venueName} en ${BRAND_NAME} y quiero información.`,
    );
    trackEvent("cta_click", {
      channel: "whatsapp_first",
      venueSlug: slug,
      experiment: CTA_EXPERIMENT_ID,
      ctaVariant,
    });
    window.open(`https://wa.me/${waDigits}?text=${waMsg}`, "_blank", "noopener,noreferrer");
  }

  async function onReportSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReportErr(null);
    setReportOk(false);
    const fd = new FormData(e.currentTarget);
    const kind = String(fd.get("kind") ?? "");
    const message = String(fd.get("message") ?? "").trim();
    setReportBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, kind, message }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setReportErr(formatUpstreamError(errBody, "No se pudo enviar el reporte."));
        return;
      }
      trackEvent("venue_report", { slug, kind });
      setReportOk(true);
      e.currentTarget.reset();
    } catch {
      setReportErr("Error de red.");
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <>
      {contactModalOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="w-full max-w-xl rounded-2xl border border-quegym-border bg-quegym-elevated shadow-xl">
            <div className="flex items-center justify-between border-b border-quegym-border px-4 py-3">
              <div className="flex items-center gap-2">
                <UIBadge variant="success">Contacto directo</UIBadge>
                <h2 className="text-lg font-semibold text-quegym-primary">
                  Contactar · {venueName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContactModalOpen(false);
                  if (window.location.hash === "#contactar-modal") {
                    history.replaceState(null, "", window.location.pathname + window.location.search);
                  }
                }}
                className="rounded-full border border-quegym-border px-2 py-1 text-xs text-quegym-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-4">
              <p className="mb-3 text-sm text-quegym-secondary">
                {BRAND_NAME} reenvía tu solicitud al centro (demo). Usa un teléfono real
                si quieres probar el seguimiento.
              </p>
              {contactWhatsapp ? (
                <UIButton
                  type="button"
                  onClick={handleWhatsappFirstClick}
                  className="mb-3 self-start bg-green-600 hover:bg-green-700"
                >
                  Abrir WhatsApp ahora
                </UIButton>
              ) : null}
              <form className="flex flex-col gap-3 text-sm" onSubmit={onLeadSubmit}>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">Qué necesitas</span>
                  <UISelect
                    name="intent"
                    value={intent}
                    onChange={(event) =>
                      setIntent(
                        event.target.value as "membership" | "trial" | "info",
                      )
                    }
                    className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary"
                  >
                    <option value="info">Información general</option>
                    <option value="membership">Membresía / precios</option>
                    <option value="trial" disabled={!allowsTrial}>
                      Probar gratis / clase de prueba
                      {!allowsTrial ? " (no indicado)" : ""}
                    </option>
                  </UISelect>
                </label>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">Nombre</span>
                  <UITextInput
                    name="name"
                    required
                    minLength={2}
                    maxLength={160}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary placeholder:!text-quegym-secondary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">Teléfono</span>
                  <UITextInput
                    name="phone"
                    required
                    minLength={6}
                    maxLength={40}
                    placeholder="+58 …"
                    autoComplete="tel"
                    className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary placeholder:!text-quegym-secondary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">
                    Correo (opcional)
                  </span>
                  <UITextInput
                    name="email"
                    type="email"
                    maxLength={200}
                    autoComplete="email"
                    className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary placeholder:!text-quegym-secondary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">
                    Horario preferido (opcional)
                  </span>
                  <UITextInput
                    name="preferredSlot"
                    maxLength={500}
                    placeholder="Ej. tardes entre semana"
                    className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary placeholder:!text-quegym-secondary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">
                    Mensaje (opcional)
                  </span>
                  <textarea
                    name="message"
                    maxLength={1200}
                    rows={3}
                    className="rounded-lg border border-quegym-border bg-quegym-elevated px-3 py-2 text-quegym-primary placeholder:text-quegym-secondary"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm leading-snug">
                  <input
                    type="checkbox"
                    name="consentAccepted"
                    required
                    className="mt-1 shrink-0 rounded border-quegym-border"
                  />
                  <span className="text-quegym-secondary">
                    Acepto el tratamiento de mis datos personales de contacto para
                    que {BRAND_NAME} y el centro puedan responder a esta solicitud.
                    Versión: {FLOIT_CONSENT_VERSION}.{" "}
                    <Link href="/privacidad" className="font-medium underline">
                      Texto completo
                    </Link>
                    .
                  </span>
                </label>
                {TURNSTILE_SITE_KEY ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-quegym-primary">
                      Verificación anti-spam
                    </span>
                    <div
                      ref={turnstileHostRef}
                      className="min-h-16 rounded-lg border border-quegym-border bg-quegym-elevated p-2"
                    />
                  </div>
                ) : null}
                {leadErr ? (
                  <UIBanner variant="error" className="text-quegym-primary">
                    {leadErr}
                  </UIBanner>
                ) : null}
                <UIButton
                  type="submit"
                  disabled={leadBusy}
                  className="w-full !bg-quegym-accent !text-white hover:!bg-quegym-accent-hover"
                >
                  {leadBusy
                    ? "Enviando…"
                    : ctaVariant === "trial" && allowsTrial
                      ? "Pedir prueba ahora"
                      : ctaVariant === "whatsapp_first"
                        ? "Enviar solicitud (alternativa a WhatsApp)"
                        : "Solicitar membresía ahora"}
                </UIButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {reportModalOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="w-full max-w-xl rounded-2xl border border-quegym-border bg-quegym-elevated shadow-xl">
            <div className="flex items-center justify-between border-b border-quegym-border px-4 py-3">
              <div className="flex items-center gap-2">
                <UIBadge>Calidad de datos</UIBadge>
                <h2 className="text-lg font-semibold text-quegym-primary">
                  Reportar datos incorrectos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  if (window.location.hash === "#reportar-modal") {
                    history.replaceState(null, "", window.location.pathname + window.location.search);
                  }
                }}
                className="rounded-full border border-quegym-border px-2 py-1 text-xs text-quegym-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-4">
              <p className="mb-3 text-sm text-quegym-secondary">
                Ayuda a mantener {BRAND_NAME} preciso: precio, ubicación, horarios u otra
                información.
              </p>
              <form className="flex flex-col gap-3 text-sm" onSubmit={onReportSubmit}>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">Tipo</span>
                  <UISelect
                    name="kind"
                    required
                    defaultValue="info"
                    className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary"
                  >
                    <option value="precio">Precio</option>
                    <option value="ubicacion">Ubicación</option>
                    <option value="horario">Horario</option>
                    <option value="info">Información general</option>
                    <option value="otro">Otro</option>
                  </UISelect>
                </label>
                <label className="flex flex-col gap-1 text-quegym-primary">
                  <span className="font-medium text-quegym-primary">Detalle</span>
                  <textarea
                    name="message"
                    required
                    minLength={5}
                    maxLength={1200}
                    rows={4}
                    className="rounded-lg border border-quegym-border bg-quegym-elevated px-3 py-2 text-quegym-primary placeholder:text-quegym-secondary"
                    placeholder="Describe qué está mal o qué falta."
                  />
                </label>
                {reportErr ? (
                  <UIBanner variant="error" className="text-quegym-primary">
                    {reportErr}
                  </UIBanner>
                ) : null}
                {reportOk ? (
                  <UIBanner variant="success" className="text-quegym-primary">
                    Gracias. El equipo revisará el reporte.
                  </UIBanner>
                ) : null}
                <UIButton
                  type="submit"
                  disabled={reportBusy}
                  variant="secondary"
                  className="!border-quegym-border !bg-quegym-elevated !text-quegym-primary hover:!bg-quegym-subtle"
                >
                  {reportBusy ? "Enviando…" : "Enviar reporte"}
                </UIButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
