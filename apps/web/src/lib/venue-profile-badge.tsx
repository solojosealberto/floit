import { UIBadge } from "@floit/ui";
import type { VenueBadge } from "./venue-badges";

export type VenueProfileInput = {
  completenessScore?: number | null;
  verificationStatus?: string | null;
};

const COMPLETE_THRESHOLD = 0.75;
const LIMITED_THRESHOLD = 0.55;

/** Badge de perfil según completitud y verificación (sin rating inventado). */
export function getVenueProfileBadge(
  venue: VenueProfileInput,
): VenueBadge | null {
  if (
    venue.verificationStatus === "floit_verified" ||
    venue.verificationStatus === "partner_verified"
  ) {
    return { key: "verified", label: "Verificado" };
  }

  const score = venue.completenessScore ?? 0;
  if (score >= COMPLETE_THRESHOLD) {
    return { key: "complete", label: "Perfil completo" };
  }
  if (score > 0 && score < LIMITED_THRESHOLD) {
    return { key: "limited", label: "Perfil limitado" };
  }

  return null;
}

type VenueProfileBadgeProps = VenueProfileInput & {
  className?: string;
};

export function VenueProfileBadge({
  completenessScore,
  verificationStatus,
  className,
}: VenueProfileBadgeProps) {
  const badge = getVenueProfileBadge({ completenessScore, verificationStatus });
  if (!badge) return null;

  const variant =
    badge.key === "verified" || badge.key === "complete" ? "success" : "warning";

  return (
    <UIBadge variant={variant} className={className}>
      {badge.label}
    </UIBadge>
  );
}
