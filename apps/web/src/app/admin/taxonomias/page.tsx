import type { Metadata } from "next";
import type { VenueSummary } from "@floit/contracts";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
import {
  AdminTaxonomiasClient,
  type TaxonomyRow,
} from "./taxonomias-client";

export const metadata: Metadata = {
  title: "Taxonomías (admin)",
  robots: { index: false, follow: false },
};

type ClaimRow = {
  venueSlug: string;
  status: string;
};

export default async function AdminTaxonomiasPage() {
  const auth = await getAdminAuthHeader();
  const localAdminLoginEnabled = isAdminLocalPasswordLoginEnabled();

  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Taxonomías</h1>
        <p className="mt-2">Configura credenciales admin en apps/web.</p>
      </main>
    );
  }

  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  const leadsBase = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";

  let initialItems: TaxonomyRow[] = [];
  let catalogBadge = 0;
  let leadsReceived = 0;

  try {
    const [taxRes, venuesRes, claimsRes, leadsRes] = await Promise.all([
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/admin/taxonomy-attributes`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
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

    if (taxRes.ok) {
      const data = (await taxRes.json()) as { items?: TaxonomyRow[] };
      initialItems = data.items ?? [];
    }

    const pendingClaimSlugs = new Set<string>();
    if (claimsRes.ok) {
      const data = (await claimsRes.json()) as { items?: ClaimRow[] };
      for (const c of data.items ?? []) {
        if (c.status === "pending_review") pendingClaimSlugs.add(c.venueSlug);
      }
    }

    if (venuesRes.ok) {
      const data = (await venuesRes.json()) as { items?: VenueSummary[] };
      const items = data.items ?? [];
      catalogBadge = items.filter(
        (v) =>
          v.verificationStatus === "reference" || pendingClaimSlugs.has(v.slug),
      ).length;
    }

    if (leadsRes.ok) {
      const data = (await leadsRes.json()) as {
        items?: Array<{ status?: string }>;
      };
      leadsReceived =
        data.items?.filter((x) => x.status === "received").length ?? 0;
    }
  } catch {
    initialItems = [];
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar
          active="taxonomy"
          catalogBadge={catalogBadge}
          leadsBadge={leadsReceived}
        />
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <AdminTaxonomiasClient initialItems={initialItems} />
        </section>
      </div>
    </main>
  );
}
