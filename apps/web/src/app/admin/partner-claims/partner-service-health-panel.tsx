import { AdminRefreshButton } from "@/app/admin/partner-claims/admin-refresh-button";

export type PartnerHealthPanelData = {
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

function StatusGlyph(props: { ok: boolean; warn?: boolean }) {
  if (props.warn) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center text-amber-500" aria-hidden>
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  if (props.ok) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center text-emerald-600" aria-hidden>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-red-600" aria-hidden>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
}

function QueueMiniStat(props: {
  label: string;
  value: number;
  tone: "neutral" | "danger" | "success";
  hint: string;
  hintIcon?: "alert" | "trend" | "clock" | "check";
}) {
  const shell =
    props.tone === "danger"
      ? "border-rose-200 bg-rose-50"
      : props.tone === "success"
        ? "border-emerald-200 bg-emerald-50"
        : "border-neutral-200 bg-neutral-100/90";
  const ratio =
    props.tone === "neutral" && props.value > 0
      ? Math.min(100, 35 + (props.value % 40))
      : props.tone === "danger"
        ? Math.min(100, 20 + props.value * 8)
        : 100;
  return (
    <div className={`rounded-xl border p-3 ${shell}`}>
      <p className="text-xs font-medium text-neutral-600">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{props.value}</p>
      {props.tone === "neutral" ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-sky-500/90" style={{ width: `${ratio}%` }} />
        </div>
      ) : null}
      <p className="mt-2 flex items-center gap-1 text-xs text-neutral-600">
        {props.hintIcon === "alert" ? (
          <svg className="h-3.5 w-3.5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : null}
        {props.hintIcon === "trend" ? (
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ) : null}
        {props.hintIcon === "clock" ? (
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : null}
        {props.hintIcon === "check" ? (
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : null}
        {props.hint}
      </p>
    </div>
  );
}

export function PartnerServiceHealthPanel(props: { health: PartnerHealthPanelData | null }) {
  const { health } = props;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] px-4 py-3 text-white md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4-8-4s-8 1.79-8 4"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Estado partner-service</h2>
            <p className="text-sm text-white/70">Colas, OIDC y sincronización con catálogo</p>
          </div>
        </div>
        <AdminRefreshButton className="inline-flex items-center rounded-lg border border-white/30 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10" />
      </div>

      <div className="border-t border-neutral-100 bg-[#fafbfc] p-4 md:p-5">
        {!health ? (
          <p className="text-sm text-neutral-600">Sin datos de health. Verifica que partner-service responda en /health.</p>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Auth OIDC */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-neutral-900">Auth OIDC</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-neutral-600">Admin OIDC</span>
                    <span className="flex items-center gap-2 font-medium text-neutral-900">
                      <StatusGlyph ok={Boolean(health.auth?.adminStrictOidc)} />
                      {health.auth?.adminStrictOidc ? "Strict activo" : "Modo flexible"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-neutral-600">Partner OIDC</span>
                    <span className="flex items-center gap-2 font-medium text-neutral-900">
                      <StatusGlyph
                        ok={Boolean(health.auth?.partnerStrictOidc)}
                        warn={!health.auth?.partnerStrictOidc && Boolean(health.auth?.partnerOidcConfigured)}
                      />
                      {health.auth?.partnerStrictOidc ? "Strict activo" : "Fallback / no estricto"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-neutral-600">Emisor configurado</span>
                    <span className="flex items-center gap-2 font-medium text-neutral-900">
                      <StatusGlyph ok={Boolean(health.auth?.adminOidcConfigured && health.auth?.partnerOidcConfigured)} />
                      {health.auth?.adminOidcConfigured && health.auth?.partnerOidcConfigured
                        ? "Admin + Partner"
                        : "Revisar issuer en env"}
                    </span>
                  </li>
                </ul>
              </div>

              {/* catalogSync */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-neutral-900">Queue catalogSync</span>
                </div>
                <div className="grid gap-2">
                  <QueueMiniStat
                    label="Pending"
                    value={health.queues?.catalogSync?.pending ?? 0}
                    tone="neutral"
                    hint="En cola de envío"
                  />
                  <QueueMiniStat
                    label="Failed"
                    value={health.queues?.catalogSync?.failed ?? 0}
                    tone={(health.queues?.catalogSync?.failed ?? 0) > 0 ? "danger" : "success"}
                    hint={
                      (health.queues?.catalogSync?.failed ?? 0) > 0
                        ? "Requiere atención"
                        : "Sin errores"
                    }
                    hintIcon={(health.queues?.catalogSync?.failed ?? 0) > 0 ? "alert" : "check"}
                  />
                  <QueueMiniStat
                    label="Sent"
                    value={health.queues?.catalogSync?.sent ?? 0}
                    tone="success"
                    hint="Trabajos completados"
                    hintIcon="trend"
                  />
                </div>
              </div>

              {/* outbox */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4-8-4s-8 1.79-8 4"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-neutral-900">Queue catalogSyncOutbox</span>
                </div>
                <div className="grid gap-2">
                  <QueueMiniStat
                    label="Pending"
                    value={health.queues?.catalogSyncOutbox?.pending ?? 0}
                    tone="neutral"
                    hint="En cola outbox"
                  />
                  <QueueMiniStat
                    label="Failed"
                    value={health.queues?.catalogSyncOutbox?.failed ?? 0}
                    tone={(health.queues?.catalogSyncOutbox?.failed ?? 0) > 0 ? "danger" : "success"}
                    hint={
                      (health.queues?.catalogSyncOutbox?.failed ?? 0) > 0
                        ? "Requiere atención"
                        : "Sin errores"
                    }
                    hintIcon={(health.queues?.catalogSyncOutbox?.failed ?? 0) > 0 ? "alert" : "check"}
                  />
                  <QueueMiniStat
                    label="Published"
                    value={health.queues?.catalogSyncOutbox?.published ?? 0}
                    tone="success"
                    hint="Eventos publicados"
                    hintIcon="clock"
                  />
                </div>
              </div>
            </div>

            <div
              className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                health.readiness?.recommendedForStrictOidc
                  ? "border-emerald-200 bg-emerald-50/90"
                  : "border-amber-200 bg-amber-50/90"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    health.readiness?.recommendedForStrictOidc ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {health.readiness?.recommendedForStrictOidc ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </span>
                <div>
                  <p className="font-semibold text-neutral-900">Readiness OIDC-only</p>
                  <p className="text-sm text-neutral-600">
                    {health.readiness?.recommendedForStrictOidc
                      ? "Listo para activar strict OIDC en producción (colas sanas + issuer configurado)."
                      : "Revisa colas fallidas y variables OIDC antes de forzar strict en producción."}
                  </p>
                </div>
              </div>
              <code className="rounded-lg bg-white/80 px-2 py-1 text-xs font-medium text-neutral-800 ring-1 ring-neutral-200/80">
                recommendedForStrictOidc: {String(Boolean(health.readiness?.recommendedForStrictOidc))}
              </code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
