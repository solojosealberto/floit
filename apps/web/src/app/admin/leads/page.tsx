import type { Metadata } from "next";
import Link from "next/link";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export const metadata: Metadata = {
  title: "Leads (operación)",
  robots: { index: false, follow: false },
};

type LeadRow = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  suspicious: boolean;
  clientIp: string | null;
  consentVersion: string | null;
  createdAt: string;
};

type NotificationFailure = {
  id: string;
  failedAt: string;
  attempts: number;
  lastError: string | null;
  lead: {
    id: string;
    venueSlug: string;
    intent: string;
    name: string;
    phone: string;
    createdAt: string;
  };
};

export default async function AdminLeadsPage() {
  const auth = getAdminAuthHeader();
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";

  if (!auth) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Leads</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-neutral-100 px-1">
            ADMIN_OIDC_ACCESS_TOKEN
          </code>{" "}
          (recomendado) o{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code> en{" "}
          <code className="rounded bg-neutral-100 px-1">apps/web</code>.
        </p>
      </main>
    );
  }

  let items: LeadRow[] = [];
  let failures: NotificationFailure[] = [];
  let err: string | null = null;
  try {
    const res = await fetch(`${base}/v1/admin/leads?limit=200`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    if (!res.ok) {
      err = `HTTP ${res.status}`;
    } else {
      const data = (await res.json()) as { items?: LeadRow[] };
      items = data.items ?? [];
      const failuresRes = await fetch(
        `${base}/v1/admin/notifications/failures?limit=50`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (failuresRes.ok) {
        const failuresData = (await failuresRes.json()) as {
          items?: NotificationFailure[];
        };
        failures = failuresData.items ?? [];
      }
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  if (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm">
        <h1 className="text-lg font-semibold">Leads</h1>
        <p className="mt-2 text-red-600">No se pudo cargar: {err}</p>
        <p className="mt-1 text-neutral-500">
          Verifica que leads esté en marcha y que el token OIDC/audiencia coincidan.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Leads recientes</h1>
        <p className="text-sm text-neutral-500">
          Vista operativa protegida con token admin OIDC (fallback legacy en dev).
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/buscar">
            ← Volver
          </Link>
          <Link className="underline" href="/admin/partner-claims">
            Claims partner
          </Link>
          <Link className="underline" href="/admin/analytics">
            Analytics MVP
          </Link>
          <a
            className="font-medium underline"
            href="/api/admin/leads/export"
          >
            Descargar CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Centro</th>
              <th className="px-3 py-2 font-medium">Intent</th>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Tel</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">IP</th>
              <th className="px-3 py-2 font-medium">Sospecha</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  No hay leads aún.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-neutral-100 dark:border-neutral-900"
                >
                  <td className="px-3 py-2 text-neutral-500">
                    {formatTime(r.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      className="font-medium underline"
                      href={`/gyms/${r.venueSlug}`}
                    >
                      {r.venueSlug}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.intent}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {r.clientIp ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.suspicious ? (
                      <span className="text-amber-700 dark:text-amber-400">Sí</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">DLQ notificaciones</h2>
          <form method="post" action="/api/admin/notifications/retry?limit=50">
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm font-medium dark:border-neutral-700"
            >
              Reintentar 50
            </button>
          </form>
        </div>
        {failures.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin fallos acumulados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Fallo</th>
                  <th className="px-2 py-2 font-medium">Centro</th>
                  <th className="px-2 py-2 font-medium">Intent</th>
                  <th className="px-2 py-2 font-medium">Intentos</th>
                  <th className="px-2 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((f) => (
                  <tr key={f.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2 text-neutral-500">{formatTime(f.failedAt)}</td>
                    <td className="px-2 py-2">{f.lead.venueSlug}</td>
                    <td className="px-2 py-2">{f.lead.intent}</td>
                    <td className="px-2 py-2">{f.attempts}</td>
                    <td className="px-2 py-2 text-xs text-red-600 dark:text-red-400">
                      {f.lastError ?? "unknown_error"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
