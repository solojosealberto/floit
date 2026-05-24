import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_ADMIN, BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND_ADMIN} · Login`,
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error?.trim();
  const errorMessage = mapAdminLoginError(error);
  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center px-4 py-6 sm:py-10">
      <section className="w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-[1fr_1.15fr]">
          <aside className="hidden bg-neutral-900 px-10 py-12 text-white md:flex md:flex-col">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-neutral-900">
                Q
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold leading-none tracking-tight">{BRAND_NAME}</span>
                <span className="text-xl text-white/75">Admin</span>
              </div>
            </div>
            <h2 className="max-w-xs text-5xl font-semibold leading-tight tracking-tight">
              Administra la plataforma desde un solo panel
            </h2>
            <p className="mt-6 max-w-sm text-xl leading-relaxed text-white/85">
              Gestiona leads, analytics y operaciones de partners de manera centralizada.
            </p>
          </aside>

          <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
              Iniciar sesion admin
            </h1>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-neutral-500">
              Accede con tus credenciales para entrar al panel administrativo.
            </p>

            {errorMessage ? (
              <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Error de acceso: {errorMessage}
              </p>
            ) : null}

            <form className="mt-8 space-y-4" method="post" action="/admin/auth/login">
              <label htmlFor="admin-email" className="block text-xl font-medium text-neutral-700">
                Correo electronico
              </label>
              <div className="flex h-16 items-center gap-3 rounded-2xl border border-neutral-300 bg-white px-5 text-xl text-neutral-400">
                <span aria-hidden>✉</span>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="admin@floit.com"
                  className="w-full bg-transparent text-xl text-neutral-700 outline-none placeholder:text-neutral-400"
                  required
                />
              </div>
              <label htmlFor="admin-password" className="block text-xl font-medium text-neutral-700">
                Contrasena
              </label>
              <div className="flex h-16 items-center gap-3 rounded-2xl border border-neutral-300 bg-white px-5 text-xl text-neutral-400">
                <span aria-hidden>•</span>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xl text-neutral-700 outline-none placeholder:text-neutral-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-16 w-full items-center justify-center rounded-2xl bg-neutral-900 px-6 text-2xl font-semibold text-white transition hover:bg-neutral-800"
              >
                Ingresar al panel
              </button>
            </form>

            <div className="mt-8 border-t border-neutral-200 pt-7 text-center">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center text-base font-medium text-neutral-500 underline-offset-2 hover:underline"
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

function mapAdminLoginError(error?: string): string | null {
  const key = error?.trim();
  if (!key) return null;
  switch (key) {
    case "missing_credentials":
      return "Debes ingresar correo y contrasena.";
    case "invalid_credentials":
      return "Correo o contrasena invalidos.";
    case "admin_login_not_enabled":
      return "El login local de admin no esta habilitado en este entorno.";
    default:
      return key;
  }
}
