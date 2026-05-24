import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export const metadata: Metadata = {
  title: "Partner · Planes",
  robots: { index: false, follow: false },
};

type VenueItem = { venueSlug: string };

export default async function PartnerPlanesPage(props: {
  searchParams: Promise<{ venueSlug?: string }>;
}) {
  const sp = await props.searchParams;
  const preferred = sp.venueSlug?.trim();
  const auth = await getPartnerAuthHeader();
  const localPartnerLoginEnabled =
    process.env.PARTNER_LOGIN_ALLOW_LOCAL_PASSWORD?.trim() === "true" &&
    process.env.NODE_ENV !== "production";

  if (!auth) {
    if (localPartnerLoginEnabled) redirect("/partner/login");
    redirect("/partner/login");
  }

  if (preferred) {
    redirect(
      `/partner/panel?venueSlug=${encodeURIComponent(preferred)}&section=planes`,
    );
  }

  const partnerBase = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  let slug: string | null = null;
  try {
    const res = await fetch(`${partnerBase.replace(/\/$/, "")}/v1/partner/me/venues`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: VenueItem[] };
      slug = data.items?.[0]?.venueSlug?.trim() ?? null;
    }
  } catch {
    slug = null;
  }

  if (!slug) redirect("/partner/venues");
  redirect(`/partner/panel?venueSlug=${encodeURIComponent(slug)}&section=planes`);
}
