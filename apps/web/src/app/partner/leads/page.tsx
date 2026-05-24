import type { Metadata } from "next";
import {
  UIBadge,
  UIBanner,
  UIButton,
  UICard,
  UITable,
  UITableCell,
  UITableContainer,
} from "@floit/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export const metadata: Metadata = {
  title: "Leads partner",
  robots: { index: false, follow: false },
};

type PartnerLead = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
};

type Props = { searchParams: Promise<{ venueSlug?: string }> };

export default async function PartnerLeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const venueSlug = params.venueSlug?.trim() ?? "";
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  const localPartnerLoginEnabled =
    process.env.PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";
  if (!auth) {
    if (localPartnerLoginEnabled) {
      redirect("/partner/login");
    }
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Leads partner</h1>
        <p className="mt-2">
          Configura <code className="rounded bg-neutral-100 px-1">PARTNER_OIDC_ACCESS_TOKEN</code>{" "}
          (recomendado) o <code className="rounded bg-neutral-100 px-1">PARTNER_DEV_EMAIL</code>.
        </p>
      </main>
    );
  }

  if (!venueSlug) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Leads partner</h1>
        <p className="mt-2">Selecciona primero un centro para ver sus leads.</p>
        <Link href="/partner/venues" className="mt-3 inline-block underline">
          Ir a mis centros
        </Link>
      </main>
    );
  }

  let items: PartnerLead[] = [];
  let err: string | null = null;
  try {
    const res = await fetch(
      `${base}/v1/partner/me/venues/${encodeURIComponent(venueSlug)}/leads?limit=200`,
      {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
      },
    );
    if (!res.ok) {
      err = `HTTP ${res.status}`;
    } else {
      const data = (await res.json()) as { items?: PartnerLead[] };
      items = data.items ?? [];
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <UIBadge>Partner ops</UIBadge>
        <h1 className="text-xl font-semibold tracking-tight">Bandeja de leads</h1>
        <p className="text-sm text-neutral-500">
          Leads filtrados por ownership de claims aprobados.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/partner/venues">
            <UIButton variant="secondary" size="sm">Abrir panel partner</UIButton>
          </Link>
          <Link href="/partner/claim">
            <UIButton variant="secondary" size="sm">Solicitar claim</UIButton>
          </Link>
          <Link href="/buscar">
            <UIButton variant="secondary" size="sm">Ver catálogo</UIButton>
          </Link>
        </div>
      </div>

      {err ? <UIBanner variant="error">No se pudo cargar: {err}</UIBanner> : null}

      <UICard className="mb-3 bg-neutral-50 text-sm text-neutral-600">
        Centro activo: {venueSlug}
      </UICard>

      <UITableContainer>
        <UITable className="min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Centro</th>
              <th className="px-3 py-2 font-medium">Intent</th>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Tel</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <UITableCell colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  No hay leads para tus centros aprobados.
                </UITableCell>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-b border-neutral-100">
                  <UITableCell className="px-3 py-2 text-neutral-500">{formatTime(it.createdAt)}</UITableCell>
                  <UITableCell className="px-3 py-2">{it.venueSlug}</UITableCell>
                  <UITableCell className="px-3 py-2">{it.intent}</UITableCell>
                  <UITableCell className="px-3 py-2">{it.name}</UITableCell>
                  <UITableCell className="px-3 py-2">{it.phone}</UITableCell>
                  <UITableCell className="px-3 py-2">{it.email ?? "—"}</UITableCell>
                  <UITableCell className="px-3 py-2">{it.status}</UITableCell>
                  <UITableCell className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {it.status === "received" ? (
                        <form
                          method="post"
                          action={`/api/partner/me/venues/${encodeURIComponent(venueSlug)}/leads/${encodeURIComponent(it.id)}/status`}
                        >
                          <input type="hidden" name="status" value="contacted" />
                          <UIButton
                            type="submit"
                            variant="secondary"
                            size="sm"
                            className="!border-neutral-300 !bg-white !text-neutral-800 hover:!bg-neutral-100"
                            formAction={`/api/partner/me/venues/${encodeURIComponent(venueSlug)}/leads/${encodeURIComponent(it.id)}/status`}
                          >
                            Marcar contactado
                          </UIButton>
                        </form>
                      ) : null}
                      {it.status !== "closed" ? (
                        <form
                          method="post"
                          action={`/api/partner/me/venues/${encodeURIComponent(venueSlug)}/leads/${encodeURIComponent(it.id)}/status`}
                        >
                          <input type="hidden" name="status" value="closed" />
                          <UIButton
                            type="submit"
                            variant="secondary"
                            size="sm"
                            className="!border-neutral-300 !bg-white !text-neutral-800 hover:!bg-neutral-100"
                            formAction={`/api/partner/me/venues/${encodeURIComponent(venueSlug)}/leads/${encodeURIComponent(it.id)}/status`}
                          >
                            Marcar cerrado
                          </UIButton>
                        </form>
                      ) : (
                        <span className="text-xs text-neutral-500">Cerrado</span>
                      )}
                    </div>
                  </UITableCell>
                </tr>
              ))
            )}
          </tbody>
        </UITable>
      </UITableContainer>
    </main>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
