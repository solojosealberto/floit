"use client";

import { trackEvent } from "@/lib/track";

type Props = {
  venueName: string;
  slug: string;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactEmail?: string | null;
};

export function GymDirectContact({
  venueName,
  slug,
  contactPhone,
  contactWhatsapp,
  contactEmail,
}: Props) {
  const waDigits = contactWhatsapp?.replace(/\D/g, "") ?? "";
  const hasAny = Boolean(
    (contactPhone && contactPhone.trim()) ||
      waDigits ||
      (contactEmail && contactEmail.trim()),
  );
  if (!hasAny) return null;

  const waMsg = encodeURIComponent(
    `Hola, vi ${venueName} en Floit y quiero información.`,
  );

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold">Contacto directo</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Si el centro publicó canal, puedes usarlo sin pasar por el formulario.
      </p>
      <div className="flex flex-wrap gap-2">
        {waDigits ? (
          <a
            href={`https://wa.me/${waDigits}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            onClick={() => {
              trackEvent("direct_contact_click", {
                channel: "whatsapp",
                slug,
              });
              trackEvent("cta_click", { channel: "whatsapp", slug });
            }}
          >
            WhatsApp
          </a>
        ) : null}
        {contactPhone?.trim() ? (
          <a
            href={`tel:${contactPhone.replace(/\s/g, "")}`}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-600"
            onClick={() => {
              trackEvent("direct_contact_click", { channel: "phone", slug });
              trackEvent("cta_click", { channel: "phone", slug });
            }}
          >
            Llamar
          </a>
        ) : null}
        {contactEmail?.trim() ? (
          <a
            href={`mailto:${encodeURIComponent(contactEmail.trim())}?subject=${encodeURIComponent(`Consulta desde Floit — ${venueName}`)}`}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-600"
            onClick={() => {
              trackEvent("direct_contact_click", { channel: "email", slug });
              trackEvent("cta_click", { channel: "email", slug });
            }}
          >
            Correo
          </a>
        ) : null}
      </div>
    </section>
  );
}
