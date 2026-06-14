"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useMemo, useState } from "react";

function CambiarCorreoFallback() {
  return (
    <main className="mx-auto w-full max-w-[420px] px-4 py-10">
      <p className="text-center text-sm text-quegym-secondary">Cargando…</p>
    </main>
  );
}

function PartnerCambiarCorreoInner() {
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

  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/partner/me/account/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newEmail, confirmEmail, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(body.message ?? "Cambio de correo solicitado correctamente.");
      setNewEmail("");
      setConfirmEmail("");
      setPassword("");
    } catch {
      setErr("No se pudo enviar la solicitud. Intenta de nuevo.");
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
        <h1 className="text-xl font-semibold text-quegym-primary">Cambiar correo</h1>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-quegym-subtle text-quegym-secondary">🔔</span>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="text-lg font-medium">Te enviaremos un código de verificación a tu nuevo correo para confirmar el cambio.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-quegym-primary">Correo actual</label>
          <input value="admin@evolvefitness.com" readOnly className="h-12 w-full rounded-xl border border-quegym-border bg-quegym-subtle px-3 text-quegym-secondary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-quegym-primary">Nuevo correo electrónico *</label>
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nuevo@correo.com" className="h-12 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-quegym-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-quegym-primary">Confirmar nuevo correo *</label>
          <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="nuevo@correo.com" className="h-12 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-quegym-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-quegym-primary">Contraseña actual *</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="h-12 w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-quegym-primary" />
          <p className="mt-1 text-sm text-quegym-secondary">Requerida para confirmar el cambio</p>
        </div>
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
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠ Después del cambio, usarás el nuevo correo para acceder a tu panel de partners.
        </div>
        <button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-xl bg-quegym-accent px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Enviando..." : "Solicitar cambio"}
        </button>
      </form>
    </main>
  );
}

export default function PartnerCambiarCorreoPage() {
  return (
    <Suspense fallback={<CambiarCorreoFallback />}>
      <PartnerCambiarCorreoInner />
    </Suspense>
  );
}
