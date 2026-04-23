"use client";

import type { VenueSummary } from "@floit/contracts";
import type { Map } from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  venues: VenueSummary[];
  /** Centro por defecto (Caracas). */
  center: [number, number];
};

export function DiscoveryMap({ venues, center }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!el.current) return () => {};

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !el.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(el.current).setView(center, 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const group = L.featureGroup();
      venues.forEach((v) => {
        const m = L.marker([v.lat, v.lng]).bindPopup(
          `<strong>${escapeHtml(v.name)}</strong><br/>${escapeHtml(v.zone)}`,
        );
        group.addLayer(m);
      });
      group.addTo(map);

      if (venues.length > 0) {
        map.fitBounds(group.getBounds().pad(0.2));
      }
    })();

    return () => {
      cancelled = true;
      if (!mapRef.current) return;
      mapRef.current.remove();
      mapRef.current = null;
    };
  }, [venues, center]);

  return (
    <div
      ref={el}
      className="h-[min(360px,55vh)] w-full rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
      role="presentation"
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
