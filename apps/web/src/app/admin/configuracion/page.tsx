import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UICard } from "@floit/ui";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import {
  describeAuthenticatedAdminMode,
  readAdminEnvFlags,
} from "@/lib/admin-config-summary";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { getAdminEmailFromSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Configuración (admin)",
  robots: { index: false, follow: false },
};

const DOC_PATHS = [
  { label: "Inventario de rutas web", path: "docs/operations/WEB_ROUTES_PLATFORM.md" },
  { label: "Guía localhost / BFF", path: "docs/operations/LOCALHOST_LINKS_GUIDE.md" },
  { label: "Credenciales de prueba (dev)", path: "docs/operations/LOCAL_TEST_CREDENTIALS.md" },
  { label: "Rollout OIDC admin/partner", path: "docs/operations/oidc-rollout-sprint4.md" },
  { label: "Variables de entorno ejemplo", path: "docs/env/local.example" },
  { label: "Plan pantalla configuración", path: "docs/operations/ADMIN_CONFIGURATION_PAGE_PLAN.md" },
] as const;

export default async function AdminConfiguracionPage() {
  const auth = await getAdminAuthHeader();
  const sessionEmail = await getAdminEmailFromSession();
  const flags = readAdminEnvFlags();
  const localAdminLoginEnabled = flags.localPasswordLoginEnabled;

  if (!auth) {
    if (localAdminLoginEnabled) {
      redirect("/admin/login");
    }
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Configuración</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code> en{" "}
          <code className="rounded bg-neutral-100 px-1">apps/web</code>.
        </p>
      </main>
    );
  }

  const localPasswordGateApplies =
    auth.headerName === "x-admin-token" && flags.localPasswordLoginEnabled;

  const modeDescription = describeAuthenticatedAdminMode(auth, {
    sessionEmail,
    localPasswordGateApplies,
  });

  const displayEmail =
    sessionEmail ?? process.env.ADMIN_LOCAL_LOGIN_EMAIL?.trim() ?? undefined;

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="settings" userEmail={displayEmail} />

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Configuración</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Entorno del backoffice y autenticación del BFF (sin secretos en pantalla).
            </p>
          </header>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-neutral-900">Sesión en el navegador</h2>
            <p className="mt-2 text-sm text-neutral-600">
              {sessionEmail ? (
                <>
                  Sesión local activa: <span className="font-medium text-neutral-900">{sessionEmail}</span>
                </>
              ) : flags.localPasswordLoginEnabled ? (
                <>
                  No hay cookie de sesión de login local. Si usas QA sin IdP, entra en{" "}
                  <Link href="/admin/login" className="font-medium text-neutral-900 underline">
                    /admin/login
                  </Link>
                  .
                </>
              ) : (
                <>
                  Sin cookie de sesión (habitual con token OIDC o legacy solo en el servidor).
                </>
              )}
            </p>
          </UICard>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-neutral-900">Autenticación hacia APIs admin</h2>
            <p className="mt-2 text-sm text-neutral-700">{modeDescription}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <FlagRow label="ADMIN_OIDC_ACCESS_TOKEN definido" value={flags.hasOidcAccessToken} />
              <FlagRow label="ADMIN_AUTH_REQUIRE_OIDC" value={flags.strictOidc} />
              <FlagRow label="ADMIN_API_TOKEN definido" value={flags.hasLegacyApiToken} />
              <FlagRow
                label="Login local QA (/admin/login)"
                value={flags.localPasswordLoginEnabled}
              />
              <div className="sm:col-span-2">
                <dt className="text-neutral-500">NODE_ENV</dt>
                <dd className="font-medium text-neutral-900">{flags.nodeEnv}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-neutral-500">
              Los valores de los tokens no se muestran aquí por seguridad.
            </p>
          </UICard>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-neutral-900">Documentación</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Rutas respecto al repositorio (clonar el proyecto para abrirlas).
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {DOC_PATHS.map((d) => (
                <li key={d.path} className="flex gap-2">
                  <span className="text-neutral-400">•</span>
                  <span>
                    <span className="text-neutral-700">{d.label}</span>
                    <code className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-800">
                      {d.path}
                    </code>
                  </span>
                </li>
              ))}
            </ul>
          </UICard>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-neutral-900">Accesos rápidos</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Quick href="/admin" title="Dashboard" />
              <Quick href="/admin/catalogo" title="Catálogo" />
              <Quick href="/admin/leads" title="Leads" />
              <Quick href="/admin/taxonomias" title="Taxonomías" />
              <Quick href="/admin/partner-claims" title="Solicitudes" />
              <Quick href="/admin/analytics" title="Métricas" />
            </div>
          </UICard>

          <footer className="flex flex-col gap-3 border-t border-neutral-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/logout"
              className="font-medium text-neutral-900 underline underline-offset-2"
            >
              Cerrar sesión
            </Link>
            <p className="text-xs text-neutral-500">
              Operaciones avanzadas (health, DLQ): ver{" "}
              <Link href="/admin/partner-claims#operaciones-y-sync" className="underline">
                Solicitudes → operaciones y sync
              </Link>
              .
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}

function FlagRow(props: { label: string; value: boolean }) {
  return (
    <>
      <dt className="text-neutral-500">{props.label}</dt>
      <dd className="font-medium text-neutral-900">{props.value ? "Sí" : "No"}</dd>
    </>
  );
}

function Quick(props: { href: string; title: string }) {
  return (
    <Link
      href={props.href}
      className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
    >
      {props.title}
    </Link>
  );
}
