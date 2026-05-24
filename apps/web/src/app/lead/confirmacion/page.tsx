import Link from "next/link";
import { UIBadge, UICard, UIBanner, UIButton } from "@floit/ui";
import { LeadSurvey } from "../lead-survey";

export const metadata = {
  title: "Solicitud enviada",
};

export default async function LeadConfirmacionPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await props.searchParams;
  const token =
    typeof sp.token === "string" && sp.token.length > 0 ? sp.token : null;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <UICard className="flex flex-col gap-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center justify-center">
          <UIBadge variant="success">Solicitud enviada</UIBadge>
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          ¡Tu solicitud fue recibida!
        </h1>
        <UIBanner variant="success">
          El centro recibirá tus datos de contacto y debería responder pronto.
        </UIBanner>
        <p className="text-center text-neutral-600 dark:text-neutral-400">
          Puedes hacer seguimiento del estado de esta solicitud y seguir
          explorando más centros en Caracas.
        </p>

        {token ? (
          <p className="text-center text-sm">
            <Link
              className="font-medium underline"
              href={`/lead/estado/${encodeURIComponent(token)}`}
            >
              Ver estado de mi solicitud
            </Link>
          </p>
        ) : null}
      </UICard>

      <LeadSurvey />

      <div className="flex justify-center">
        <Link href="/buscar">
          <UIButton variant="secondary">Seguir explorando</UIButton>
        </Link>
      </div>
    </main>
  );
}
