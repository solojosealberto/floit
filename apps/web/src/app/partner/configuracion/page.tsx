import Link from "next/link";

export default async function PartnerConfiguracionPage(props: {
  searchParams: Promise<{ venueSlug?: string; configView?: string }>;
}) {
  const sp = await props.searchParams;
  const venueSlug = sp.venueSlug?.trim() ?? "";
  const params = new URLSearchParams();
  if (venueSlug) params.set("venueSlug", venueSlug);
  if (sp.configView?.trim()) params.set("configView", sp.configView.trim());
  const query = params.size > 0 ? `?${params.toString()}` : "";

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 py-6">
      <section className="rounded-2xl border border-quegym-border bg-quegym-elevated p-4">
        <h1 className="text-2xl font-semibold text-quegym-primary">Configuración</h1>
        <p className="mt-1 text-sm text-quegym-secondary">
          Atajos de configuración partner.
        </p>
        <div className="mt-4 grid gap-2">
          <Link
            href={`/partner/configuracion/mis-centros${query}`}
            className="rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-sm text-quegym-primary hover:bg-quegym-subtle"
          >
            Mis centros
          </Link>
          <Link
            href={`/partner/configuracion/cambiar-correo${query}`}
            className="rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-sm text-quegym-primary hover:bg-quegym-subtle"
          >
            Cambiar correo
          </Link>
          <Link
            href={`/partner/configuracion/eliminar-cuenta${query}`}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100"
          >
            Eliminar cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}
