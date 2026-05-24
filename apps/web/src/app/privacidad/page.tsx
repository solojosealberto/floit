import Link from "next/link";
import { UIBadge, UIButton, UICard } from "@floit/ui";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: "Privacidad y datos (borrador)",
};

/** Borrador MVP — alinear con counsel antes de producción (Plan maestro § seguridad). */
export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">
      <UICard className="space-y-4">
        <UIBadge>Privacidad</UIBadge>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Privacidad y tratamiento de datos
        </h1>
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {BRAND_NAME} recopila nombre, teléfono y datos opcionales de contacto para
          compartirlos con el centro que seleccionaste y facilitar una respuesta
          a tu solicitud.
        </p>
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Los datos se usan para seguimiento del lead y no se comercializan con
          terceros fuera del flujo de contacto solicitado.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Versión de consentimiento actual:{" "}
          <strong>floit-r2-2026-04</strong>.
        </p>
        <p className="text-xs text-neutral-500">
          Texto de referencia MVP sujeto a revisión legal en staging/producción.
        </p>
      </UICard>
      <div>
        <Link href="/buscar">
          <UIButton variant="secondary">Volver a buscar</UIButton>
        </Link>
      </div>
    </main>
  );
}
