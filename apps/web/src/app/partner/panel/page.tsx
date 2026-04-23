"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUpstreamError } from "@/lib/format-upstream-error";

type Profile = {
  partnerEmail: string;
  businessName: string | null;
  description: string | null;
  scheduleSummary: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
};

type Plan = {
  id: string;
  venueSlug: string;
  name: string;
  description: string | null;
  period: string | null;
  priceLabel: string | null;
  active: boolean;
};

const EMPTY_PROFILE: Profile = {
  partnerEmail: "",
  businessName: null,
  description: null,
  scheduleSummary: null,
  contactPhone: null,
  contactEmail: null,
  contactWhatsapp: null,
};

export default function PartnerPanelPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const [pRes, plansRes] = await Promise.all([
        fetch("/api/partner/me/profile", { cache: "no-store" }),
        fetch("/api/partner/me/plans", { cache: "no-store" }),
      ]);
      if (!pRes.ok) {
        const body = await pRes.json().catch(() => ({}));
        throw new Error(formatUpstreamError(body, `HTTP ${pRes.status}`));
      }
      const p = (await pRes.json()) as Profile;
      setProfile(p);
      if (plansRes.ok) {
        const payload = (await plansRes.json()) as { items?: Plan[] };
        setPlans(payload.items ?? []);
      } else {
        setPlans([]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cargar el panel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setErr(null);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      businessName: String(fd.get("businessName") ?? "").trim() || undefined,
      description: String(fd.get("description") ?? "").trim() || undefined,
      scheduleSummary: String(fd.get("scheduleSummary") ?? "").trim() || undefined,
      contactPhone: String(fd.get("contactPhone") ?? "").trim() || undefined,
      contactEmail: String(fd.get("contactEmail") ?? "").trim() || undefined,
      contactWhatsapp: String(fd.get("contactWhatsapp") ?? "").trim() || undefined,
    };
    try {
      const res = await fetch("/api/partner/me/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo guardar perfil."));
        return;
      }
      setProfile(body as Profile);
      setMsg("Perfil guardado.");
    } catch {
      setErr("Error de red al guardar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onCreatePlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPlan(true);
    setErr(null);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      venueSlug: String(fd.get("venueSlug") ?? "").trim(),
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim() || undefined,
      period: String(fd.get("period") ?? "").trim() || undefined,
      priceLabel: String(fd.get("priceLabel") ?? "").trim() || undefined,
    };
    try {
      const res = await fetch("/api/partner/me/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo crear el plan."));
        return;
      }
      e.currentTarget.reset();
      setMsg("Plan creado.");
      await reload();
    } catch {
      setErr("Error de red al crear plan.");
    } finally {
      setSavingPlan(false);
    }
  }

  async function togglePlan(plan: Plan) {
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/partner/me/plans/${encodeURIComponent(plan.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo actualizar plan."));
        return;
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, active: !plan.active } : p)),
      );
      setMsg("Plan actualizado.");
    } catch {
      setErr("Error de red al actualizar plan.");
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-sm">Cargando panel partner…</main>;
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Partner panel (lite)</h1>
        <p className="text-sm text-neutral-500">
          Perfil y planes para venues con ownership aprobado.
        </p>
        <div className="flex gap-4 text-sm">
          <Link href="/partner/leads" className="underline">
            Ver leads
          </Link>
          <Link href="/partner/claim" className="underline">
            Solicitar claim
          </Link>
        </div>
      </div>
      {profile.partnerEmail ? (
        <p className="text-xs text-neutral-500">Cuenta partner: {profile.partnerEmail}</p>
      ) : null}
      {msg ? <p className="text-sm text-green-700 dark:text-green-400">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Perfil (US-4.2)</h2>
        <form className="grid gap-3 text-sm" onSubmit={onSaveProfile}>
          <input
            name="businessName"
            defaultValue={profile.businessName ?? ""}
            placeholder="Nombre comercial"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <textarea
            name="description"
            defaultValue={profile.description ?? ""}
            placeholder="Descripción"
            rows={3}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <input
            name="scheduleSummary"
            defaultValue={profile.scheduleSummary ?? ""}
            placeholder="Resumen de horarios"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="contactPhone"
              defaultValue={profile.contactPhone ?? ""}
              placeholder="Teléfono"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <input
              name="contactEmail"
              defaultValue={profile.contactEmail ?? ""}
              placeholder="Email de contacto"
              type="email"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <input
              name="contactWhatsapp"
              defaultValue={profile.contactWhatsapp ?? ""}
              placeholder="WhatsApp"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-fit rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {savingProfile ? "Guardando…" : "Guardar perfil"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Planes (US-4.3)</h2>
        <form className="grid gap-3 text-sm md:grid-cols-5" onSubmit={onCreatePlan}>
          <input
            name="venueSlug"
            required
            placeholder="venue slug"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <input
            name="name"
            required
            placeholder="Nombre plan"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <input
            name="period"
            placeholder="Periodo (mensual)"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <input
            name="priceLabel"
            placeholder="Precio (USD 29)"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            type="submit"
            disabled={savingPlan}
            className="rounded-lg border border-neutral-300 px-3 py-2 font-medium disabled:opacity-60 dark:border-neutral-700"
          >
            {savingPlan ? "Creando…" : "Crear plan"}
          </button>
          <textarea
            name="description"
            placeholder="Descripción (opcional)"
            rows={2}
            className="md:col-span-5 rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="px-2 py-2 font-medium">Venue</th>
                <th className="px-2 py-2 font-medium">Plan</th>
                <th className="px-2 py-2 font-medium">Periodo</th>
                <th className="px-2 py-2 font-medium">Precio</th>
                <th className="px-2 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-neutral-500">
                    No hay planes aún.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2">{p.venueSlug}</td>
                    <td className="px-2 py-2">{p.name}</td>
                    <td className="px-2 py-2">{p.period ?? "—"}</td>
                    <td className="px-2 py-2">{p.priceLabel ?? "—"}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => void togglePlan(p)}
                        className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                      >
                        {p.active ? "Activo (clic para desactivar)" : "Inactivo (clic para activar)"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
