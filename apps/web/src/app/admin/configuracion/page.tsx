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
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-quegym-secondary">
        <h1 className="text-lg font-semibold text-quegym-primary">Configuración</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-quegym-subtle px-1">ADMIN_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o <code className="rounded bg-quegym-subtle px-1">ADMIN_API_TOKEN</code> en{" "}
          <code className="rounded bg-quegym-subtle px-1">apps/web</code>.
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
    <main className="min-h-screen bg-quegym-page p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="settings" userEmail={displayEmail} />

        <section className="space-y-4 qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-4 md:p-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-quegym-primary">Configuración</h1>
            <p className="mt-1 text-sm text-quegym-secondary">
              Entorno del backoffice y autenticación del BFF (sin secretos en pantalla).
            </p>
          </header>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-quegym-primary">Sesión en el navegador</h2>
            <p className="mt-2 text-sm text-quegym-secondary">
              {sessionEmail ? (
                <>
                  Sesión local activa: <span className="font-medium text-quegym-primary">{sessionEmail}</span>
                </>
              ) : flags.localPasswordLoginEnabled ? (
                <>
                  No hay cookie de sesión de login local. Si usas QA sin IdP, entra en{" "}
                  <Link href="/admin/login" className="font-medium text-quegym-primary underline">
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
            <h2 className="text-base font-semibold text-quegym-primary">Autenticación hacia APIs admin</h2>
            <p className="mt-2 text-sm text-quegym-primary">{modeDescription}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <FlagRow label="ADMIN_OIDC_ACCESS_TOKEN definido" value={flags.hasOidcAccessToken} />
              <FlagRow label="ADMIN_AUTH_REQUIRE_OIDC" value={flags.strictOidc} />
              <FlagRow label="ADMIN_API_TOKEN definido" value={flags.hasLegacyApiToken} />
              <FlagRow
                label="Login local QA (/admin/login)"
                value={flags.localPasswordLoginEnabled}
              />
              <div className="sm:col-span-2">
                <dt className="text-quegym-secondary">NODE_ENV</dt>
                <dd className="font-medium text-quegym-primary">{flags.nodeEnv}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-quegym-secondary">
              Los valores de los tokens no se muestran aquí por seguridad.
            </p>
          </UICard>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-quegym-primary">Documentación</h2>
            <p className="mt-1 text-sm text-quegym-secondary">
              Rutas respecto al repositorio (clonar el proyecto para abrirlas).
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {DOC_PATHS.map((d) => (
                <li key={d.path} className="flex gap-2">
                  <span className="text-quegym-secondary">•</span>
                  <span>
                    <span className="text-quegym-primary">{d.label}</span>
                    <code className="ml-2 rounded bg-quegym-subtle px-1.5 py-0.5 text-xs text-quegym-primary">
                      {d.path}
                    </code>
                  </span>
                </li>
              ))}
            </ul>
          </UICard>

          <UICard className="p-4">
            <h2 className="text-base font-semibold text-quegym-primary">Accesos rápidos</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Quick href="/admin" title="Dashboard" />
              <Quick href="/admin/catalogo" title="Catálogo" />
              <Quick href="/admin/leads" title="Leads" />
              <Quick href="/admin/taxonomias" title="Taxonomías" />
              <Quick href="/admin/partner-claims" title="Solicitudes" />
              <Quick href="/admin/analytics" title="Métricas" />
            </div>
          </UICard>

          <footer className="flex flex-col gap-3 border-t border-quegym-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/logout"
              className="font-medium text-quegym-primary underline underline-offset-2"
            >
              Cerrar sesión
            </Link>
            <p className="text-xs text-quegym-secondary">
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
      <dt className="text-quegym-secondary">{props.label}</dt>
      <dd className="font-medium text-quegym-primary">{props.value ? "Sí" : "No"}</dd>
    </>
  );
}

function Quick(props: { href: string; title: string }) {
  return (
    <Link
      href={props.href}
      className="rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-sm font-medium text-quegym-primary hover:bg-quegym-subtle"
    >
      {props.title}
    </Link>
  );
}
