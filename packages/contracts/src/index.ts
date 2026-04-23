/** Logical event names published via outbox / broker (see `/contracts/events`). */
export const FloitEvents = {
  venuePublished: "floit.catalog.venue_published.v1",
  venueUpdated: "floit.catalog.venue_updated.v1",
  leadCreated: "floit.leads.lead_created.v1",
  leadUpdated: "floit.leads.lead_updated.v1",
} as const;

export type FloitEventName = (typeof FloitEvents)[keyof typeof FloitEvents];

/** Respuesta de `/v1/venues` y `/v1/search` (proxy). */
export type VenueSummary = {
  id: string;
  slug: string;
  name: string;
  address: string;
  zone: string;
  lat: number;
  lng: number;
  venueType: string;
  modalities: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
  completenessScore: number | null;
  popularityScore?: number;
  verificationStatus?: string;
  allowsTrial?: boolean;
  activePromotionTitle?: string | null;
  distanceM?: number;
};

export type DiscoveryResponse = {
  items: VenueSummary[];
  meta: {
    total: number;
    sort?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
  };
};
