/** Row shape for partner claims admin list + detail modal (aligned with `GET /v1/admin/partner/claims`). */
export type PartnerClaimRow = {
  id: string;
  venueSlug: string;
  representativeName: string;
  representativeEmail: string;
  representativePhone: string;
  evidence: string | null;
  claimKind?: "existing" | "new";
  newVenueDraft?: Record<string, unknown> | null;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
  /** Present when API returns it (partner-service list includes updatedAt). */
  updatedAt?: string;
};
