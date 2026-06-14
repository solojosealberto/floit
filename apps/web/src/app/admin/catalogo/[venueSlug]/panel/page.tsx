import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
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
  const localAdminLoginEnabled = isAdminLocalPasswordLoginEnabled();

  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-quegym-secondary">
        <h1 className="text-lg font-semibold text-quegym-primary">Panel catálogo</h1>
        <p className="mt-2">Configura credenciales admin en apps/web.</p>
      </main>
    );
  }

  const { venueSlug } = await params;

  return (
    <main className="min-h-screen bg-quegym-page p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="catalog" />
        <section className="min-w-0 overflow-hidden qg-surface qg-motion rounded-2xl border border-quegym-border bg-quegym-elevated p-2 md:p-3">
          <AdminCatalogVenuePanelSection venueSlug={venueSlug} />
        </section>
      </div>
    </main>
  );
}
