import type { Metadata } from "next";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";
import { BRAND_NAME, BRAND_PARTNERS } from "@/lib/brand";
import { ClaimWizard } from "./claim-wizard";

export const metadata: Metadata = {
  title: `Dar de alta o reclamar tu centro | ${BRAND_PARTNERS}`,
  description:
    `Reclamá la ficha de tu gimnasio en ${BRAND_NAME} o registrá un centro nuevo. Revisión en 1–2 días hábiles.`,
  robots: { index: false, follow: false },
};

function sanitizeReturnTo(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return undefined;
  if (t.startsWith("/admin") || t.startsWith("/partner")) return t;
  return undefined;
}

export default async function PartnerClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const sp = await searchParams;
  const returnTo = sanitizeReturnTo(sp.returnTo);

  const searchBase = process.env.SEARCH_SERVICE_URL ?? "http://localhost:4011";
  let zones: string[] = [];
  try {
    const zonesRes = await fetch(`${searchBase}/v1/meta/zones`, {
      cache: "no-store",
    });
    if (zonesRes.ok) {
      const z = (await zonesRes.json()) as { zones?: string[] };
      zones = z.zones ?? [];
    }
  } catch {
    zones = [];
  }

  const auth = await getPartnerAuthHeader();
  const hasPartnerSession = auth !== null;

  return (
    <ClaimWizard zones={zones} hasPartnerSession={hasPartnerSession} returnTo={returnTo} />
  );
}
