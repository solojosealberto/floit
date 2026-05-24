import Link from "next/link";
import { notFound } from "next/navigation";
import { UIBadge, UIButton, UICard } from "@floit/ui";

type StatusPayload = {
  status?: string;
  intent?: string;
  venueSlug?: string;
  createdAt?: string;
};

const STATUS_LABEL: Record<string, string> = {
  received: "Recibida",
  contacted: "En contacto",
  closed: "Cerrada",
};

export default async function LeadEstadoPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";

  let data: StatusPayload | null = null;
  try {
    const res = await fetch(
      `${base}/v1/leads/status/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) notFound();
    if (!res.ok) notFound();
    data = (await res.json()) as StatusPayload;
  } catch {
    notFound();
  }

  if (!data?.status) notFound();

  const statusLabel = STATUS_LABEL[data.status] ?? data.status;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Estado de tu solicitud
        </h1>
        <UIBadge>{statusLabel}</UIBadge>
      </div>
      <UICard className="bg-neutral-50 dark:bg-neutral-900">
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-neutral-500">Estado</dt>
            <dd className="font-medium">{statusLabel}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Tipo</dt>
            <dd className="font-medium">{formatIntent(data.intent)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Centro</dt>
            <dd className="font-medium">{data.venueSlug ?? "—"}</dd>
          </div>
          {data.createdAt ? (
            <div>
              <dt className="text-neutral-500">Recibida</dt>
              <dd className="font-medium">{formatDate(data.createdAt)}</dd>
            </div>
          ) : null}
        </dl>
      </UICard>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Seguimiento en modo demo local. El estado puede pasar de recibida a en
        contacto y luego cerrada.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/buscar">
          <UIButton variant="secondary">Buscar centros</UIButton>
        </Link>
        {data.venueSlug ? (
          <Link href={`/gyms/${data.venueSlug}`}>
            <UIButton variant="secondary">Ver ficha del centro</UIButton>
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function formatIntent(intent: string | undefined): string {
  if (intent === "membership") return "Membresía / precios";
  if (intent === "trial") return "Prueba / clase";
  if (intent === "info") return "Información";
  return intent ?? "—";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
