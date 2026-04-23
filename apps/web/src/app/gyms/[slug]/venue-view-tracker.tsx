"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

export function VenueViewTracker(props: { slug: string }) {
  useEffect(() => {
    trackEvent("venue_view", { slug: props.slug });
  }, [props.slug]);
  return null;
}
