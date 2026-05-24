import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { AdminCatalogVenuePanelSection } from "./venue-panel-section";

export const metadata: Metadata = {
  title: "Editar centro (admin)",
  robots: { index: false, follow: false },
};

export default async function AdminCatalogVenuePanelPage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const auth = await getAdminAuthHeader();
  const localAdminLoginEnabled =
    process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Panel catálogo</h1>
        <p className="mt-2">Configura credenciales admin en apps/web.</p>
      </main>
    );
  }

  const { venueSlug } = await params;

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="catalog" />
        <section className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 md:p-3">
          <AdminCatalogVenuePanelSection venueSlug={venueSlug} />
        </section>
      </div>
    </main>
  );
}
