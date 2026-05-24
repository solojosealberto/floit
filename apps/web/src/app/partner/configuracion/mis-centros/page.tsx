import Link from "next/link";
import { redirect } from "next/navigation";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type VenueItem = {
  venueSlug: string;
  status: string;
};

export default async function PartnerMisCentrosPage(props: {
  searchParams: Promise<{ venueSlug?: string }>;
}) {
  const sp = await props.searchParams;
  const auth = await getPartnerAuthHeader();
  const localPartnerLoginEnabled =
    process.env.PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";
  if (!auth) {
    if (localPartnerLoginEnabled) redirect("/partner/login");
    return (
      <main className="mx-auto w-full max-w-[420px] px-4 py-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          Acceso partner requerido para ver tus centros.
        </div>
      </main>
    );
  }

  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  let items: VenueItem[] = [];
  let error = "";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/partner/me/venues`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as {
      items?: VenueItem[];
      error?: string;
    };
    if (!res.ok) {
      error = body.error ?? `HTTP ${res.status}`;
    } else {
      items = body.items ?? [];
    }
  } catch {
    error = "upstream_unavailable";
  }

  const selectedSlug = (sp.venueSlug?.trim() || items.find((it) => it.status === "active")?.venueSlug || items[0]?.venueSlug || "");

  return (
    <main className="mx-auto w-full max-w-[420px] px-4 py-4">
      <header className="mb-5 flex items-center justify-between">
        <Link href={selectedSlug ? `/partner/panel?venueSlug=${encodeURIComponent(selectedSlug)}&section=config&configView=gyms` : "/partner/panel?section=config&configView=gyms"} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
          ‹
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Mis centros</h1>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">🔔</span>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">Centros que administro</h2>
          <p className="text-sm text-neutral-500">
            Cambiá entre tus gimnasios o agregá uno nuevo
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            No se pudieron cargar tus centros: {error}
          </div>
        ) : null}

        {items.map((item) => {
          const isSelected = item.venueSlug === selectedSlug;
          return (
            <article
              key={item.venueSlug}
              className={`rounded-2xl border p-3 ${isSelected ? "border-emerald-300 bg-emerald-50/40" : "border-neutral-200 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-200 text-xs text-neutral-500">
                  Logo
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-lg font-semibold text-neutral-900">
                      {formatVenueLabel(item.venueSlug)}
                    </p>
                    {isSelected ? (
                      <span className="rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-sm text-emerald-700">
                        Activo
                      </span>
                    ) : (
                      <span className="text-neutral-400">›</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">{item.venueSlug}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-sm text-emerald-700">
                      {item.status === "active" ? "Verificado" : item.status}
                    </span>
                    {isSelected ? (
                      <span className="text-sm font-medium text-emerald-700">Estás viendo este centro ahora</span>
                    ) : (
                      <Link
                        href={`/partner/panel?venueSlug=${encodeURIComponent(item.venueSlug)}&section=config&configView=gyms`}
                        className="text-sm font-medium text-neutral-500 hover:text-neutral-700"
                      >
                        Cambiar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href={`/partner/panel?venueSlug=${encodeURIComponent(item.venueSlug)}&section=perfil`}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-center text-sm font-medium text-emerald-700"
                >
                  Editar perfil
                </Link>
                <Link
                  href={`/gyms/${encodeURIComponent(item.venueSlug)}`}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-center text-sm font-medium text-emerald-700"
                >
                  Ver público
                </Link>
              </div>
            </article>
          );
        })}

        <div className="flex items-center gap-3 text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-sm font-medium">Agregar centro</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <Link
          href="/partner/claim"
          className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-center text-lg font-semibold text-neutral-500"
        >
          Registrar o reclamar nuevo centro
        </Link>
      </section>
    </main>
  );
}

function formatVenueLabel(venueSlug: string): string {
  return venueSlug
    .split("-")
    .map((part) => (part.length > 0 ? `${part[0]!.toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}
