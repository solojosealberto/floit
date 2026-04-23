import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export const metadata: Metadata = {
  title: "Leads partner",
  robots: { index: false, follow: false },
};

type PartnerLead = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
};

export default async function PartnerLeadsPage() {
  const auth = getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Leads partner</h1>
        <p className="mt-2">
          Configura <code className="rounded bg-neutral-100 px-1">PARTNER_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o <code className="rounded bg-neutral-100 px-1">PARTNER_DEV_EMAIL</code>.
        </p>
      </main>
    );
  }

  let items: PartnerLead[] = [];
  let venues: string[] = [];
  let err: string | null = null;
  try {
    const res = await fetch(`${base}/v1/partner/me/leads?limit=200`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    if (!res.ok) {
      err = `HTTP ${res.status}`;
    } else {
      const data = (await res.json()) as { items?: PartnerLead[]; venues?: string[] };
      items = data.items ?? [];
      venues = data.venues ?? [];
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Bandeja de leads</h1>
        <p className="text-sm text-neutral-500">
          Leads filtrados por ownership de claims aprobados.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/partner/panel">
            Abrir panel partner
          </Link>
          <Link className="underline" href="/partner/claim">
            Solicitar claim
          </Link>
          <Link className="underline" href="/buscar">
            Ver catálogo
          </Link>
        </div>
      </div>

      {err ? <p className="mb-4 text-sm text-red-600">No se pudo cargar: {err}</p> : null}

      <p className="mb-3 text-sm text-neutral-500">
        Centros asociados: {venues.length > 0 ? venues.join(", ") : "ninguno"}
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Centro</th>
              <th className="px-3 py-2 font-medium">Intent</th>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Tel</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  No hay leads para tus centros aprobados.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="px-3 py-2 text-neutral-500">{formatTime(it.createdAt)}</td>
                  <td className="px-3 py-2">{it.venueSlug}</td>
                  <td className="px-3 py-2">{it.intent}</td>
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2">{it.phone}</td>
                  <td className="px-3 py-2">{it.email ?? "—"}</td>
                  <td className="px-3 py-2">{it.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {it.status === "received" ? (
                        <form method="post" action={`/api/partner/me/leads/${encodeURIComponent(it.id)}/status`}>
                          <input type="hidden" name="status" value="contacted" />
                          <button
                            className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                            type="submit"
                            formAction={`/api/partner/me/leads/${encodeURIComponent(it.id)}/status`}
                          >
                            Marcar contactado
                          </button>
                        </form>
                      ) : null}
                      {it.status !== "closed" ? (
                        <form method="post" action={`/api/partner/me/leads/${encodeURIComponent(it.id)}/status`}>
                          <input type="hidden" name="status" value="closed" />
                          <button
                            className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                            type="submit"
                            formAction={`/api/partner/me/leads/${encodeURIComponent(it.id)}/status`}
                          >
                            Marcar cerrado
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-neutral-500">Cerrado</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
