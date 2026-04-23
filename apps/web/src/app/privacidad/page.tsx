import Link from "next/link";

export const metadata = {
  title: "Privacidad y datos (borrador)",
};

/** Borrador MVP — alinear con counsel antes de producción (Plan maestro § seguridad). */
export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Privacidad y tratamiento de datos
      </h1>
      <p>
        En esta demo, Floit recopila nombre y teléfono para poner en contacto tu
        solicitud con el centro fitness seleccionado. El uso es limitado a ese
        fin; no vendemos datos a terceros.
      </p>
      <p>
        Versión de referencia para consentimiento en formularios:{" "}
        <strong>floit-r2-2026-04</strong>.
      </p>
      <p className="text-neutral-500">
        Este texto es un marcador de posición hasta revisión legal local.
      </p>
      <Link className="underline" href="/buscar">
        ← Volver a buscar
      </Link>
    </main>
  );
}
