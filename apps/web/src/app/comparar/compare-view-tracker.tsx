"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

export function CompareViewTracker(props: { slugs: string[] }) {
  useEffect(() => {
    trackEvent("compare_open", {
      count: props.slugs.length,
      slugs: props.slugs.slice(0, 4),
    });
  }, [props.slugs]);

  return null;
}
