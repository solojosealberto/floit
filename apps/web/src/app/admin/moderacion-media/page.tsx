import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/admin-sidebar";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";
import {
  ModeracionMediaClient,
  type MediaReviewRow,
  type VenueReportRow,
} from "./moderacion-media-client";

export const metadata: Metadata = {
  title: "Moderación media (admin)",
  robots: { index: false, follow: false },
};

export default async function AdminModeracionMediaPage() {
  const auth = await getAdminAuthHeader();
  const localAdminLoginEnabled =
    process.env.ADMIN_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localAdminLoginEnabled) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-neutral-600">
        <h1 className="text-lg font-semibold text-neutral-900">Moderación</h1>
        <p className="mt-2">Configura credenciales admin en apps/web.</p>
      </main>
    );
  }

  const catalogBase = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  let reports: VenueReportRow[] = [];
  let media: MediaReviewRow[] = [];
  const venueNames: Record<string, string> = {};

  try {
    const [reportsRes, mediaRes, venuesRes] = await Promise.all([
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/admin/venue-reports?limit=200`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/admin/meta/media-review`, {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      }),
      fetch(`${catalogBase.replace(/\/$/, "")}/v1/venues?limit=500`, {
        cache: "no-store",
      }),
    ]);

    if (reportsRes.ok) {
      const data = (await reportsRes.json()) as { items?: VenueReportRow[] };
      reports = data.items ?? [];
    }
    if (mediaRes.ok) {
      const data = (await mediaRes.json()) as { items?: MediaReviewRow[] };
      media = data.items ?? [];
    }
    if (venuesRes.ok) {
      const data = (await venuesRes.json()) as {
        items?: Array<{ slug: string; name: string }>;
      };
      for (const v of data.items ?? []) {
        venueNames[v.slug] = v.name;
      }
    }
  } catch {
    reports = [];
    media = [];
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 md:p-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <AdminSidebar active="moderation" />
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6">
          <ModeracionMediaClient
            reports={reports}
            media={media}
            venueNames={venueNames}
          />
        </section>
      </div>
    </main>
  );
}
