"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  async function onLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLeadErr(null);
    if (intent === "trial" && !allowsTrial) {
      setLeadErr("Este centro no indica prueba gratuita en Floit.");
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
      `Hola, vi ${venueName} en Floit y quiero información.`,
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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Contactar · {venueName}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Floit reenvía tu solicitud al centro (demo). Usa un teléfono real si
          quieres probar el seguimiento.
        </p>
        {ctaVariant === "whatsapp_first" ? (
          <button
            type="button"
            onClick={handleWhatsappFirstClick}
            className="self-start rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Abrir WhatsApp ahora
          </button>
        ) : null}
        <form className="flex flex-col gap-3 text-sm" onSubmit={onLeadSubmit}>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Qué necesitas</span>
            <select
              name="intent"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              value={intent}
              onChange={(event) =>
                setIntent(event.target.value as "membership" | "trial" | "info")
              }
            >
              <option value="info">Información general</option>
              <option value="membership">Membresía / precios</option>
              <option value="trial" disabled={!allowsTrial}>
                Probar gratis / clase de prueba
                {!allowsTrial ? " (no indicado)" : ""}
              </option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Nombre</span>
            <input
              name="name"
              required
              minLength={2}
              maxLength={160}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Teléfono</span>
            <input
              name="phone"
              required
              minLength={6}
              maxLength={40}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="+58 …"
              autoComplete="tel"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Correo (opcional)</span>
            <input
              name="email"
              type="email"
              maxLength={200}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Horario preferido (opcional)</span>
            <input
              name="preferredSlot"
              maxLength={500}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="Ej. tardes entre semana"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Mensaje (opcional)</span>
            <textarea
              name="message"
              maxLength={1200}
              rows={3}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex items-start gap-2 text-sm leading-snug">
            <input
              type="checkbox"
              name="consentAccepted"
              required
              className="mt-1 shrink-0 rounded border-neutral-300"
            />
            <span className="text-neutral-600 dark:text-neutral-400">
              Acepto el tratamiento de mis datos personales de contacto para que
              Floit y el centro puedan responder a esta solicitud. Versión:{" "}
              {FLOIT_CONSENT_VERSION}.{" "}
              <Link href="/privacidad" className="font-medium underline">
                Texto completo
              </Link>
              .
            </span>
          </label>
          {TURNSTILE_SITE_KEY ? (
            <div className="flex flex-col gap-1">
              <span className="font-medium">Verificación anti-spam</span>
              <div
                ref={turnstileHostRef}
                className="min-h-16 rounded-lg border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>
          ) : null}
          {leadErr ? (
            <p className="text-sm text-red-600 dark:text-red-400">{leadErr}</p>
          ) : null}
          <button
            type="submit"
            disabled={leadBusy}
            className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {leadBusy
              ? "Enviando…"
              : ctaVariant === "trial" && allowsTrial
                ? "Pedir prueba ahora"
                : ctaVariant === "whatsapp_first"
                  ? "Enviar solicitud (alternativa a WhatsApp)"
                  : "Solicitar membresía ahora"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-lg font-semibold">Reportar datos incorrectos</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ayuda a mantener Floit preciso: precio, ubicación, horarios u otra
          información.
        </p>
        <form className="flex flex-col gap-3 text-sm" onSubmit={onReportSubmit}>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Tipo</span>
            <select
              name="kind"
              required
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              defaultValue="info"
            >
              <option value="precio">Precio</option>
              <option value="ubicacion">Ubicación</option>
              <option value="horario">Horario</option>
              <option value="info">Información general</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Detalle</span>
            <textarea
              name="message"
              required
              minLength={5}
              maxLength={1200}
              rows={4}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="Describe qué está mal o qué falta."
            />
          </label>
          {reportErr ? (
            <p className="text-sm text-red-600 dark:text-red-400">{reportErr}</p>
          ) : null}
          {reportOk ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              Gracias. El equipo revisará el reporte.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={reportBusy}
            className="rounded-lg border border-neutral-300 px-4 py-2 font-medium disabled:opacity-60 dark:border-neutral-600"
          >
            {reportBusy ? "Enviando…" : "Enviar reporte"}
          </button>
        </form>
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/buscar`}>
          ← Buscar más centros
        </Link>
        <Link className="underline" href="/favoritos">
          Favoritos
        </Link>
      </div>
    </div>
  );
}
