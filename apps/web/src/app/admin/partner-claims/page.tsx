import type { Metadata } from "next";
import { UIBanner } from "@floit/ui";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { DlqFailuresPanel } from "@/app/admin/partner-claims/dlq-failures-panel";
import { OwnershipAuditPanel } from "@/app/admin/partner-claims/ownership-audit-panel";
import { OwnershipPartnerVenuePanel } from "@/app/admin/partner-claims/ownership-partner-venue-panel";
import { PartnerClaimsDashboard } from "@/app/admin/partner-claims/partner-claims-dashboard";
import type { PartnerClaimRow } from "@/app/admin/partner-claims/partner-claim-row";
import {
  PartnerServiceHealthPanel,
  type PartnerHealthPanelData,
} from "@/app/admin/partner-claims/partner-service-health-panel";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export const metadata: Metadata = {
  title: "Claims de partners (admin)",
  robots: { index: false, follow: false },
};

type ClaimRow = PartnerClaimRow;

type SyncFailure = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type OutboxFailure = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type OwnershipRow = {
  id: string;
  partnerEmail: string;
  venueSlug: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
};

type OwnershipAuditRow = {
  id: string;
  action: "revoked";
  partnerEmail: string;
  venueSlug: string;
  actor: string;
  reason: string | null;
  createdAt: string;
};

export default async function AdminPartnerClaimsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const auditPartnerEmail =
    typeof sp.auditPartnerEmail === "string" ? sp.auditPartnerEmail.trim() : "";
  const auditVenueSlug = typeof sp.auditVenueSlug === "string" ? sp.auditVenueSlug.trim() : "";
  const auth = await getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  const localAdminLoginEnabled =
    process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localAdminLoginEnabled) {
      redirect("/admin/login");
    }
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Partner claims</h1>
        <p className="mt-2">
          Configura{" "}
          <code className="rounded bg-neutral-100 px-1">
            ADMIN_OIDC_ACCESS_TOKEN
          </code>{" "}
          (recomendado) o{" "}
          <code className="rounded bg-neutral-100 px-1">ADMIN_API_TOKEN</code>.
        </p>
      </main>
    );
  }

  let items: ClaimRow[] = [];
  let syncFailures: SyncFailure[] = [];
  let outboxFailures: OutboxFailure[] = [];
  let ownerships: OwnershipRow[] = [];
  let ownershipAudit: OwnershipAuditRow[] = [];
  let health: PartnerHealthPanelData | null = null;
  let err: string | null = null;
  try {
    const res = await fetch(`${base}/v1/admin/partner/claims?limit=200`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    if (!res.ok) {
      err = `HTTP ${res.status}`;
    } else {
      const data = (await res.json()) as { items?: ClaimRow[] };
      items = data.items ?? [];
      const syncRes = await fetch(
        `${base}/v1/admin/partner/catalog-sync/failures?limit=100`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (syncRes.ok) {
        const payload = (await syncRes.json()) as { items?: SyncFailure[] };
        syncFailures = payload.items ?? [];
      }
      const outboxRes = await fetch(
        `${base}/v1/admin/partner/catalog-sync/outbox/failures?limit=100`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (outboxRes.ok) {
        const payload = (await outboxRes.json()) as { items?: OutboxFailure[] };
        outboxFailures = payload.items ?? [];
      }
      const ownRes = await fetch(`${base}/v1/admin/partner/ownerships?limit=100`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      });
      if (ownRes.ok) {
        const ownPayload = (await ownRes.json()) as { items?: OwnershipRow[] };
        ownerships = ownPayload.items ?? [];
      }
      const auditRes = await fetch(
        `${base}/v1/admin/partner/ownership-audit?limit=200`,
        {
          headers: { [auth.headerName]: auth.headerValue },
          cache: "no-store",
        },
      );
      if (auditRes.ok) {
        const auditPayload = (await auditRes.json()) as { items?: OwnershipAuditRow[] };
        ownershipAudit = auditPayload.items ?? [];
      }
      const healthRes = await fetch(`${base}/health`, { cache: "no-store" });
      if (healthRes.ok) {
        health = (await healthRes.json()) as PartnerHealthPanelData;
      }
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "fetch failed";
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="claims" />
        <section className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 [color-scheme:light] md:p-6">
          {err ? (
            <UIBanner variant="error" className="mb-6">
              No se pudo cargar claims: {err}. Revisa partner-service y el token admin.
            </UIBanner>
          ) : null}

          <PartnerClaimsDashboard items={items} />

      <section id="operaciones-y-sync" className="mb-8 mt-12 scroll-mt-6 space-y-8">
        <PartnerServiceHealthPanel health={health} />

        <DlqFailuresPanel
          items={syncFailures}
          variant="sync"
          retryApiPath="/api/admin/partner/catalog-sync/retry"
        />

        <DlqFailuresPanel
          items={outboxFailures}
          variant="outbox"
          retryApiPath="/api/admin/partner/catalog-sync/outbox/retry"
        />

        <OwnershipPartnerVenuePanel items={ownerships} />

        <OwnershipAuditPanel
          items={ownershipAudit}
          initialEmail={auditPartnerEmail}
          initialVenueSlug={auditVenueSlug}
        />
      </section>
        </section>
      </div>
    </main>
  );
}
