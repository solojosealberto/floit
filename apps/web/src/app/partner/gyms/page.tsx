import { redirect } from "next/navigation";
export default async function PartnerGymsPage(props: {
  searchParams: Promise<{ venueSlug?: string }>;
}) {
  const sp = await props.searchParams;
  const venueSlug = sp.venueSlug?.trim();
  const query = venueSlug ? `?venueSlug=${encodeURIComponent(venueSlug)}` : "";
  redirect(`/partner/venues${query}`);
}
