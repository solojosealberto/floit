import type { Metadata } from "next";
import type { VenueSummary } from "@floit/contracts";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { AdminCatalogoClient, type CatalogRow } from "./catalogo-client";

export const metadata: Metadata = {
  title: "Catálogo (admin)",
  robots: { index: false, follow: false },
};

type ClaimRow = {
  venueSlug: string;
  status: string;
};

export default async function AdminCatalogoPage() {
  const auth = await getAdminAuthHeader();
  const localAdminLoginEnabled =
    process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Catálogo admin</h1>
        <p className="mt-2">Configura credenciales admin en apps/web.</p>
      </main>
    );
  }

  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  const leadsBase = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";

  let items: VenueSummary[] = [];
  const pendingClaimSlugs = new Set<string>();
  let leadsReceived = 0;

  try {
    const [venuesRes, claimsRes, leadsRes] = await Promise.all([
      fetch(`${catalogBase}/v1/venues?limit=500&sort=name`, { cache: "no-store" }),
      fetch(`${partnerBase}/v1/admin/partner/claims?limit=200`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(`${leadsBase}/v1/admin/leads?limit=300`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
    ]);

    if (venuesRes.ok) {
      const data = (await venuesRes.json()) as { items?: VenueSummary[] };
      items = data.items ?? [];
    }

    if (claimsRes.ok) {
      const data = (await claimsRes.json()) as { items?: ClaimRow[] };
      for (const c of data.items ?? []) {
        if (c.status === "pending_review") pendingClaimSlugs.add(c.venueSlug);
      }
    }

    if (leadsRes.ok) {
      const data = (await leadsRes.json()) as {
        items?: Array<{ status?: string }>;
      };
      leadsReceived =
        data.items?.filter((x) => x.status === "received").length ?? 0;
    }
  } catch {
    items = [];
  }

  const rows: CatalogRow[] = items.map((v) => {
    const needsReview =
      v.verificationStatus === "reference" || pendingClaimSlugs.has(v.slug);
    return {
      slug: v.slug,
      name: v.name,
      zone: v.zone,
      venueType: v.venueType,
      modalities: v.modalities ?? [],
      completenessScore: v.completenessScore ?? null,
      verificationStatus: v.verificationStatus ?? "reference",
      updatedAt: v.updatedAt ?? null,
      needsReview,
    };
  });

  const catalogBadge = rows.filter((r) => r.needsReview).length;

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar
          active="catalog"
          catalogBadge={catalogBadge}
          leadsBadge={leadsReceived}
        />
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <AdminCatalogoClient rows={rows} />
        </section>
      </div>
    </main>
  );
}
