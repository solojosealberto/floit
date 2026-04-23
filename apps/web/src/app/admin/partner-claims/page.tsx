import type { Metadata } from "next";
import Link from "next/link";
import { ClaimStatusActions } from "@/app/admin/partner-claims/claim-status-actions";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export const metadata: Metadata = {
  title: "Partner claims (operación)",
  robots: { index: false, follow: false },
};

type ClaimRow = {
  id: string;
  venueSlug: string;
  representativeName: string;
  representativeEmail: string;
  representativePhone: string;
  evidence: string | null;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
};

type SyncFailure = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type OutboxFailure = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type OwnershipRow = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
};

type OwnershipAuditRow = {
  id: string;
  action: "revoked";
  partnerEmail: string;
  venueSlug: string;
  actor: string;
  reason: string | null;
  createdAt: string;
};

type PartnerHealth = {
  ok: boolean;
  service: string;
  auth?: {
    adminStrictOidc?: boolean;
    adminOidcConfigured?: boolean;
    partnerStrictOidc?: boolean;
    partnerOidcConfigured?: boolean;
  };
  queues?: {
    catalogSync?: { pending?: number; failed?: number; sent?: number };
    catalogSyncOutbox?: { pending?: number; failed?: number; published?: number };
  };
  readiness?: {
    oidcConfigReady?: boolean;
    queuesHealthy?: boolean;
    recommendedForStrictOidc?: boolean;
    failedQueues?: number;
  };
};

export default async function AdminPartnerClaimsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const auditPartnerEmail =
    typeof sp.auditPartnerEmail === "string" ? sp.auditPartnerEmail.trim() : "";
  const auditVenueSlug = typeof sp.auditVenueSlug === "string" ? sp.auditVenueSlug.trim() : "";
  const auth = getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";

  if (!auth) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Partner claims</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-neutral-100 px-1">
            ADMIN_OIDC_ACCESS_TOKEN
          </code>{" "}
          (recomendado) o{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code>.
        </p>
      </main>
    );
  }

  let items: ClaimRow[] = [];
  let syncFailures: SyncFailure[] = [];
  let outboxFailures: OutboxFailure[] = [];
  let ownerships: OwnershipRow[] = [];
  let ownershipAudit: OwnershipAuditRow[] = [];
  let health: PartnerHealth | null = null;
  let err: string | null = null;
  try {
    const res = await fetch(`${base}/v1/admin/partner/claims?limit=200`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    if (!res.ok) {
      err = `HTTP ${res.status}`;
    } else {
      const data = (await res.json()) as { items?: ClaimRow[] };
      items = data.items ?? [];
      const syncRes = await fetch(
        `${base}/v1/admin/partner/catalog-sync/failures?limit=50`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (syncRes.ok) {
        const payload = (await syncRes.json()) as { items?: SyncFailure[] };
        syncFailures = payload.items ?? [];
      }
      const outboxRes = await fetch(
        `${base}/v1/admin/partner/catalog-sync/outbox/failures?limit=50`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (outboxRes.ok) {
        const payload = (await outboxRes.json()) as { items?: OutboxFailure[] };
        outboxFailures = payload.items ?? [];
      }
      const ownRes = await fetch(`${base}/v1/admin/partner/ownerships?limit=100`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      });
      if (ownRes.ok) {
        const ownPayload = (await ownRes.json()) as { items?: OwnershipRow[] };
        ownerships = ownPayload.items ?? [];
      }
      const auditQ = new URLSearchParams({ limit: "50" });
      if (auditPartnerEmail) auditQ.set("partnerEmail", auditPartnerEmail);
      if (auditVenueSlug) auditQ.set("venueSlug", auditVenueSlug);
      const auditRes = await fetch(
        `${base}/v1/admin/partner/ownership-audit?${auditQ.toString()}`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (auditRes.ok) {
        const auditPayload = (await auditRes.json()) as { items?: OwnershipAuditRow[] };
        ownershipAudit = auditPayload.items ?? [];
      }
      const healthRes = await fetch(`${base}/health`, { cache: "no-store" });
      if (healthRes.ok) {
        health = (await healthRes.json()) as PartnerHealth;
      }
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Claims de partner</h1>
        <p className="text-sm text-neutral-500">
          Revisión operativa de solicitudes de claim (US-4.1).
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/admin/leads">
            Ver leads
          </Link>
          <Link className="underline" href="/admin/analytics">
            Analytics MVP
          </Link>
          <Link className="underline" href="/partner/claim">
            Abrir formulario público
          </Link>
        </div>
      </div>

      {err ? (
        <p className="mb-4 text-sm text-red-600">No se pudo cargar: {err}</p>
      ) : null}

      <section className="mb-8 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Estado partner-service</h2>
        {!health ? (
          <p className="text-sm text-neutral-500">Sin datos de health.</p>
        ) : (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
              <p className="font-medium">Auth</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Admin strict: {String(Boolean(health.auth?.adminStrictOidc))}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Admin issuer: {String(Boolean(health.auth?.adminOidcConfigured))}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Partner strict: {String(Boolean(health.auth?.partnerStrictOidc))}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Partner issuer: {String(Boolean(health.auth?.partnerOidcConfigured))}
              </p>
            </div>
            <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
              <p className="font-medium">Queue catalogSync</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Pending: {health.queues?.catalogSync?.pending ?? 0}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Failed: {health.queues?.catalogSync?.failed ?? 0}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Sent: {health.queues?.catalogSync?.sent ?? 0}
              </p>
            </div>
            <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
              <p className="font-medium">Queue outbox</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Pending: {health.queues?.catalogSyncOutbox?.pending ?? 0}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Failed: {health.queues?.catalogSyncOutbox?.failed ?? 0}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Published: {health.queues?.catalogSyncOutbox?.published ?? 0}
              </p>
            </div>
            <div className="rounded border border-neutral-200 p-3 dark:border-neutral-700">
              <p className="font-medium">Readiness OIDC-only</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                OIDC config ready: {String(Boolean(health.readiness?.oidcConfigReady))}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Queues healthy: {String(Boolean(health.readiness?.queuesHealthy))}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Failed queues: {health.readiness?.failedQueues ?? 0}
              </p>
              <p
                className={
                  health.readiness?.recommendedForStrictOidc
                    ? "font-medium text-emerald-700 dark:text-emerald-400"
                    : "font-medium text-amber-700 dark:text-amber-400"
                }
              >
                {health.readiness?.recommendedForStrictOidc
                  ? "Listo para strict OIDC"
                  : "No listo para strict OIDC"}
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Centro</th>
              <th className="px-3 py-2 font-medium">Representante</th>
              <th className="px-3 py-2 font-medium">Contacto</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acción</th>
              <th className="px-3 py-2 font-medium">Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                  Sin claims por revisar.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="px-3 py-2 text-neutral-500">{formatTime(c.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/gyms/${c.venueSlug}`} className="underline">
                      {c.venueSlug}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{c.representativeName}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span>{c.representativeEmail}</span>
                      <span className="text-xs text-neutral-500">{c.representativePhone}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{c.status}</td>
                  <td className="px-3 py-2">
                    <ClaimStatusActions claimId={c.id} currentStatus={c.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300">
                    {c.evidence ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">DLQ sync partner→catalog</h2>
          <form method="post" action="/api/admin/partner/catalog-sync/retry?limit=50">
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm font-medium dark:border-neutral-700"
            >
              Reintentar 50
            </button>
          </form>
        </div>
        {syncFailures.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin fallos de sincronización.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Fecha</th>
                  <th className="px-2 py-2 font-medium">Partner</th>
                  <th className="px-2 py-2 font-medium">Venue</th>
                  <th className="px-2 py-2 font-medium">Intentos</th>
                  <th className="px-2 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {syncFailures.map((f) => (
                  <tr key={f.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2 text-neutral-500">{formatTime(f.createdAt)}</td>
                    <td className="px-2 py-2">{f.partnerEmail}</td>
                    <td className="px-2 py-2">{f.venueSlug}</td>
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

      <section className="mt-8 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">DLQ outbox partner→sync</h2>
          <form method="post" action="/api/admin/partner/catalog-sync/outbox/retry?limit=50">
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm font-medium dark:border-neutral-700"
            >
              Reintentar 50
            </button>
          </form>
        </div>
        {outboxFailures.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin fallos de publicación outbox.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Fecha</th>
                  <th className="px-2 py-2 font-medium">Partner</th>
                  <th className="px-2 py-2 font-medium">Venue</th>
                  <th className="px-2 py-2 font-medium">Intentos</th>
                  <th className="px-2 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {outboxFailures.map((f) => (
                  <tr key={f.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2 text-neutral-500">{formatTime(f.createdAt)}</td>
                    <td className="px-2 py-2">{f.partnerEmail}</td>
                    <td className="px-2 py-2">{f.venueSlug}</td>
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

      <section className="mt-8 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-base font-semibold">Ownership partner↔venue</h2>
        {ownerships.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin ownerships registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Partner</th>
                  <th className="px-2 py-2 font-medium">Venue</th>
                  <th className="px-2 py-2 font-medium">Estado</th>
                  <th className="px-2 py-2 font-medium">Actualizado</th>
                  <th className="px-2 py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ownerships.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2">{o.partnerEmail}</td>
                    <td className="px-2 py-2">{o.venueSlug}</td>
                    <td className="px-2 py-2">{o.status}</td>
                    <td className="px-2 py-2 text-neutral-500">{formatTime(o.updatedAt)}</td>
                    <td className="px-2 py-2">
                      {o.status === "active" ? (
                        <form
                          method="post"
                          action={`/api/admin/partner/ownerships/${encodeURIComponent(o.id)}/revoke`}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            name="reason"
                            placeholder="Motivo (opcional)"
                            maxLength={500}
                            className="w-40 rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                          />
                          <button
                            type="submit"
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-700 dark:text-red-400"
                          >
                            Revocar
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Auditoría ownership</h2>
          <form method="get" className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              name="auditPartnerEmail"
              defaultValue={auditPartnerEmail}
              placeholder="partner@email.com"
              className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <input
              type="text"
              name="auditVenueSlug"
              defaultValue={auditVenueSlug}
              placeholder="venue-slug"
              className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <button
              type="submit"
              className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700"
            >
              Filtrar
            </button>
            <Link className="underline" href="/admin/partner-claims">
              Limpiar
            </Link>
          </form>
        </div>
        {ownershipAudit.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin eventos recientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-2 py-2 font-medium">Fecha</th>
                  <th className="px-2 py-2 font-medium">Acción</th>
                  <th className="px-2 py-2 font-medium">Partner</th>
                  <th className="px-2 py-2 font-medium">Venue</th>
                  <th className="px-2 py-2 font-medium">Actor</th>
                  <th className="px-2 py-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {ownershipAudit.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-2 py-2 text-neutral-500">{formatTime(a.createdAt)}</td>
                    <td className="px-2 py-2">{a.action}</td>
                    <td className="px-2 py-2">{a.partnerEmail}</td>
                    <td className="px-2 py-2">{a.venueSlug}</td>
                    <td className="px-2 py-2">{a.actor}</td>
                    <td className="px-2 py-2 text-xs text-neutral-600 dark:text-neutral-300">
                      {a.reason ?? "—"}
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
