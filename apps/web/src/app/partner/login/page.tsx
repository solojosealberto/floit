import type { Metadata } from "next";
import Link from "next/link";
import { QueGymLogo } from "@/components/quegym-logo";
import { BRAND_NAME, BRAND_PARTNERS } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND_PARTNERS} · Login`,
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function PartnerLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error?.trim();
  const errorMessage = mapPartnerLoginError(error);
  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center px-4 py-6 sm:py-10">
      <section className="qg-surface qg-motion w-full overflow-hidden rounded-3xl border border-quegym-border bg-quegym-elevated">
        <div className="grid md:grid-cols-[1fr_1.15fr]">
          <aside className="hidden bg-quegym-ink px-10 py-12 text-white md:flex md:flex-col">
            <div className="mb-16">
              <QueGymLogo variant="horizontal" theme="dark" size="md" href="/" />
              <p className="mt-2 text-xl text-white/75">{BRAND_PARTNERS}</p>
            </div>
            <h2 className="max-w-xs text-5xl font-semibold leading-tight tracking-tight">
              Tu panel de control en un solo lugar
            </h2>
            <p className="mt-6 max-w-sm text-xl leading-relaxed text-white/85">
              Gestiona tu perfil, recibe leads y actualiza tus planes desde un panel limpio y rapido.
            </p>
            <ul className="mt-auto space-y-4 pt-12 text-lg text-white/85">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-quegym-elevated/10 text-sm">✓</span>
                Recibe leads calificados de {BRAND_NAME}
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-quegym-elevated/10 text-sm">✓</span>
                Actualiza tu perfil sin depender de terceros
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-quegym-elevated/10 text-sm">✓</span>
                Sin costos de configuracion
              </li>
            </ul>
          </aside>

          <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
            <div className="mb-8 border-b border-quegym-border pb-8 text-center md:hidden">
              <QueGymLogo variant="horizontal" theme="auto" size="md" href="/" className="mx-auto" />
              <p className="mt-3 text-lg text-quegym-secondary">{BRAND_PARTNERS}</p>
              <p className="mt-2 text-lg text-quegym-secondary">Gestiona tu gimnasio desde un panel simple</p>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-quegym-primary md:text-5xl">
              Ingresa a tu panel
            </h1>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-quegym-secondary">
              Accede con tu correo y contrasena para gestionar tu centro en {BRAND_PARTNERS}.
            </p>

            {errorMessage ? (
              <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Error de acceso: {errorMessage}
              </p>
            ) : null}

            <form className="mt-8 space-y-4" method="post" action="/partner/auth/login">
              <label htmlFor="partner-email" className="block text-xl font-medium text-quegym-primary">
                Correo electronico del administrador
              </label>
              <div className="qg-field flex h-16 items-center gap-3 rounded-2xl border border-quegym-border bg-quegym-input px-5 text-xl text-quegym-secondary">
                <span aria-hidden>✉</span>
                <input
                  id="partner-email"
                  name="email"
                  type="email"
                  placeholder="tu@gimnasio.com"
                  className="w-full bg-transparent text-xl text-quegym-primary outline-none placeholder:text-quegym-secondary"
                  required
                />
              </div>
              <label htmlFor="partner-password" className="block text-xl font-medium text-quegym-primary">
                Contrasena
              </label>
              <div className="qg-field flex h-16 items-center gap-3 rounded-2xl border border-quegym-border bg-quegym-input px-5 text-xl text-quegym-secondary">
                <span aria-hidden>•</span>
                <input
                  id="partner-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xl text-quegym-primary outline-none placeholder:text-quegym-secondary"
                  required
                />
              </div>
              <button
                type="submit"
                className="qg-btn-primary qg-motion inline-flex h-16 w-full items-center justify-center rounded-2xl bg-quegym-accent px-6 text-2xl font-semibold text-white transition hover:bg-quegym-accent-hover"
              >
                Ingresar al panel
              </button>
              <div className="rounded-2xl border border-quegym-border bg-quegym-subtle px-5 py-4 text-base text-quegym-secondary">
                Solo correos partner registrados pueden acceder a este panel.
              </div>
            </form>

            <div className="mt-8 border-t border-quegym-border pt-7 text-center">
              <p className="text-xl text-quegym-secondary">Primera vez en {BRAND_PARTNERS}?</p>
              <Link
                href="/partner/claim"
                className="qg-btn-ghost qg-motion mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl border border-quegym-border bg-quegym-elevated px-6 text-2xl font-semibold text-quegym-primary"
              >
                Registra o reclama tu centro →
              </Link>
              <Link
                href="/"
                className="mt-4 inline-flex w-full items-center justify-center text-base font-medium text-quegym-secondary underline-offset-2 hover:text-quegym-highlight hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function mapPartnerLoginError(error?: string): string | null {
  const key = error?.trim();
  if (!key) return null;
  switch (key) {
    case "missing_credentials":
      return "Debes ingresar correo y contrasena.";
    case "invalid_credentials":
      return "Correo o contrasena invalidos.";
    case "oidc_password_grant_not_enabled":
      return "El proveedor de identidad no permite login por correo y contrasena para este cliente.";
    case "partner_oidc_client_id_missing":
      return "Falta la configuracion PARTNER_OIDC_CLIENT_ID.";
    case "partner_oidc_issuer_missing":
      return "Falta la configuracion PARTNER_OIDC_ISSUER.";
    case "missing_access_token":
      return "No se recibio token de acceso del proveedor de identidad.";
    default:
      if (key.startsWith("token_exchange_")) {
        return "No se pudo validar el acceso en este momento. Intenta de nuevo.";
      }
      return key;
  }
}
