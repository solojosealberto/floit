import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import {
  AdminDuplicadosClient,
  type DuplicatePair,
  type VenueMeta,
} from "./duplicados-client";

export const metadata: Metadata = {
  title: "Duplicados (admin)",
  robots: { index: false, follow: false },
};

export default async function AdminDuplicadosPage() {
  const auth = await getAdminAuthHeader();
  const localAdminLoginEnabled =
    process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Duplicados</h1>
        <p className="mt-2">Configura credenciales admin en apps/web.</p>
      </main>
    );
  }

  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  let pairs: DuplicatePair[] = [];
  const venueBySlug: Record<string, VenueMeta> = {};

  try {
    const [dupRes, venuesRes] = await Promise.all([
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/admin/meta/duplicate-suspects`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/venues?limit=500`, {
        cache: "no-store",
      }),
    ]);

    if (dupRes.ok) {
      const data = (await dupRes.json()) as { pairs?: DuplicatePair[] };
      pairs = data.pairs ?? [];
    }

    if (venuesRes.ok) {
      const data = (await venuesRes.json()) as {
        items?: Array<{ slug: string; name: string; zone: string }>;
      };
      for (const v of data.items ?? []) {
        venueBySlug[v.slug] = { name: v.name, zone: v.zone };
      }
    }
  } catch {
    pairs = [];
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="duplicates" />
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <AdminDuplicadosClient pairs={pairs} venueBySlug={venueBySlug} />
        </section>
      </div>
    </main>
  );
}
