import Link from "next/link";
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
      <h1 className="text-2xl font-semibold tracking-tight">
        Solicitud registrada
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Recibimos tus datos. En producción, el centro o Floit te contactarían por
        teléfono. Aquí puedes ver el estado demo de tu solicitud.
      </p>

      {token ? (
        <p className="text-sm">
          <Link
            className="font-medium underline"
            href={`/lead/estado/${encodeURIComponent(token)}`}
          >
            Ver estado de mi solicitud
          </Link>
        </p>
      ) : null}

      <LeadSurvey />

      <Link className="text-sm underline" href="/buscar">
        Seguir explorando
      </Link>
    </main>
  );
}
