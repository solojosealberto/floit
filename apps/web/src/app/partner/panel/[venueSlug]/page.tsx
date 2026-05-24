import { redirect } from "next/navigation";

type Props = { params: Promise<{ venueSlug: string }> };

export default async function PartnerVenuePanelEntry({ params }: Props) {
  const { venueSlug } = await params;
  redirect(`/partner/panel?venueSlug=${encodeURIComponent(venueSlug)}`);
}
