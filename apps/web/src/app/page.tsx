import Link from "next/link";
import { FloitLogo } from "@floit/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <main className="mx-auto flex max-w-lg flex-col gap-10 px-4 py-16">
        <header className="flex flex-col gap-3">
          <FloitLogo className="text-4xl" />
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Encuentra y compara centros de entrenamiento en Caracas. MVP en
            construcción: discovery, comparador y solicitudes de contacto.
          </p>
        </header>

        <nav className="flex flex-col gap-3 text-base">
          <Link
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3 font-medium shadow-sm transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            href="/buscar"
          >
            Buscar centros
          </Link>
          <Link
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3 font-medium shadow-sm transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            href="/comparar"
          >
            Comparar
          </Link>
          <Link
            className="rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
            href="/gyms/demo-centro"
          >
            Ver ficha de ejemplo (slug)
          </Link>
          <Link
            className="rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
            href="/lead/confirmacion"
          >
            Confirmación de lead (placeholder)
          </Link>
        </nav>

        <footer className="text-xs text-neutral-500 dark:text-neutral-500">
          Monorepo Floit · Next.js (BFF/UI) + servicios Nest por bounded context.
        </footer>
      </main>
    </div>
  );
}
