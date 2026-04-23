"use client";

import Link from "next/link";
import { useState } from "react";
import { formatUpstreamError } from "@/lib/format-upstream-error";

export default function PartnerClaimPage() {
  const [busy, setBusy] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOkId(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      venueSlug: String(fd.get("venueSlug") ?? "").trim(),
      representativeName: String(fd.get("representativeName") ?? "").trim(),
      representativeEmail: String(fd.get("representativeEmail") ?? "").trim(),
      representativePhone: String(fd.get("representativePhone") ?? "").trim(),
      evidence: String(fd.get("evidence") ?? "").trim() || undefined,
    };
    try {
      const res = await fetch("/api/partner/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      if (!res.ok) {
        setErr(formatUpstreamError(data, "No se pudo enviar la solicitud."));
        return;
      }
      setOkId(data.id ?? "ok");
      e.currentTarget.reset();
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-5 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reclamar perfil de gimnasio
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Solicita el claim de tu centro para que el equipo Floit valide la
          propiedad y te habilite gestión posterior.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800"
      >
        <label className="flex flex-col gap-1">
          <span className="font-medium">Slug del centro</span>
          <input
            required
            name="venueSlug"
            minLength={2}
            maxLength={160}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="ej. oxide-chacao"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Nombre del representante</span>
          <input
            required
            name="representativeName"
            minLength={2}
            maxLength={160}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Email</span>
          <input
            required
            type="email"
            name="representativeEmail"
            maxLength={200}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Teléfono</span>
          <input
            required
            name="representativePhone"
            minLength={6}
            maxLength={40}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Evidencia (opcional)</span>
          <textarea
            name="evidence"
            maxLength={1200}
            rows={4}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="Cargo, web del centro, redes oficiales o documento de respaldo."
          />
        </label>
        {okId ? (
          <p className="text-green-700 dark:text-green-400">
            Solicitud recibida. ID: <code>{okId}</code>.
          </p>
        ) : null}
        {err ? <p className="text-red-600 dark:text-red-400">{err}</p> : null}
        <div className="flex flex-wrap items-center gap-4">
          <button
            disabled={busy}
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {busy ? "Enviando…" : "Enviar solicitud"}
          </button>
          <Link href="/partner/leads" className="underline">
            Ver bandeja partner
          </Link>
          <Link href="/partner/panel" className="underline">
            Abrir panel partner
          </Link>
          <Link href="/buscar" className="underline">
            Volver a búsqueda
          </Link>
        </div>
      </form>
    </main>
  );
}
