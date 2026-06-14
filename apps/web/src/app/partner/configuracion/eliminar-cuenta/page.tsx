"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useMemo, useState } from "react";

function EliminarCuentaFallback() {
  return (
    <main className="mx-auto w-full max-w-[420px] px-4 py-10">
      <p className="text-center text-sm text-quegym-secondary">Cargando…</p>
    </main>
  );
}

function PartnerEliminarCuentaInner() {
  const router = useRouter();
  const search = useSearchParams();
  const backHref = useMemo(() => {
    const venueSlug = search.get("venueSlug")?.trim();
    const params = new URLSearchParams();
    params.set("section", "config");
    params.set("configView", "account");
    if (venueSlug) {
      params.set("venueSlug", venueSlug);
    }
    return `/partner/panel?${params.toString()}`;
  }, [search]);
  const [confirmText, setConfirmText] = useState("");
  const [secret, setSecret] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/partner/me/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmText, secret, accepted }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(body.message ?? "Solicitud enviada.");
      setTimeout(() => router.replace("/partner/login?notice=account_delete_requested"), 1100);
    } catch {
      setErr("No se pudo procesar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[420px] px-4 py-4">
      <header className="mb-5 flex items-center justify-between">
        <Link href={backHref} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-quegym-subtle text-quegym-secondary">
          ‹
        </Link>
        <h1 className="text-xl font-semibold text-quegym-primary">Eliminar cuenta</h1>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-quegym-subtle text-quegym-secondary">🔔</span>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-800">
          <p className="text-xl font-semibold">Esta acción es irreversible</p>
          <p className="mt-1 text-base">
            Se eliminarán todos tus datos, perfiles de gimnasios, leads y estadísticas de forma permanente.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-quegym-primary">¿Qué se eliminará?</h2>
          <ul className="mt-2 space-y-1 text-base text-quegym-secondary">
            <li>• Perfil de administrador y acceso al panel</li>
            <li>• 2 perfiles de gimnasios (Altamira y El Rosal)</li>
            <li>• Historial de leads recibidos (47 leads)</li>
            <li>• Fotos y contenido subido</li>
            <li>• Estadísticas y métricas</li>
          </ul>
        </div>

        <div>
          <label className="mb-1 block text-base font-semibold text-quegym-primary">
            {"Escribí 'ELIMINAR' para confirmar *"}
          </label>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="ELIMINAR"
            className="h-12 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-quegym-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-base font-semibold text-quegym-primary">
            Contraseña o último enlace de acceso *
          </label>
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            type="password"
            placeholder="••••••••"
            className="h-12 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-quegym-primary"
          />
          <p className="mt-1 text-sm text-quegym-secondary">Requerida para confirmar la eliminación</p>
        </div>

        <label className="flex items-start gap-2 text-sm text-quegym-secondary">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-quegym-border"
          />
          <span>Entiendo que esta acción es permanente y no podrá revertirse.</span>
        </label>
        {msg ? (
          <div className="rounded-xl border border-quegym-highlight/30 bg-quegym-highlight-soft px-3 py-2 text-sm text-quegym-highlight">
            {msg}
          </div>
        ) : null}
        {err ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Procesando..." : "Eliminar cuenta"}
        </button>
      </form>
    </main>
  );
}

export default function PartnerEliminarCuentaPage() {
  return (
    <Suspense fallback={<EliminarCuentaFallback />}>
      <PartnerEliminarCuentaInner />
    </Suspense>
  );
}
