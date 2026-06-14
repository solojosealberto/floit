"use client";

import type { VenueSummary } from "@floit/contracts";
import type { Map } from "leaflet";
import { useEffect, useRef } from "react";
import { mapPinMarkerHtml } from "@/lib/map-marker-html";

type Props = {
  venues: VenueSummary[];
  /** Centro por defecto (Caracas). */
  center: [number, number];
  selectedSlug?: string;
  className?: string;
  onSelectVenue?: (slug: string) => void;
  onClearSelection?: () => void;
  onSelectedMarkerPositionChange?: (
    pos: { x: number; y: number; width: number; height: number } | null,
  ) => void;
};

export function DiscoveryMap({
  venues,
  center,
  selectedSlug,
  className,
  onSelectVenue,
  onClearSelection,
  onSelectedMarkerPositionChange,
}: Props) {
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
      map.on("click", () => {
        onClearSelection?.();
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const group = L.featureGroup();
      venues.forEach((v) => {
        const active = selectedSlug === v.slug;
        const markerIcon = L.divIcon({
          className: "floit-map-marker",
          html: mapPinMarkerHtml(active),
          iconSize: [active ? 30 : 26, active ? 30 : 26],
          iconAnchor: [active ? 15 : 13, active ? 30 : 26],
          popupAnchor: [0, -24],
        });
        const m = L.marker([v.lat, v.lng], { icon: markerIcon });
        m.on("click", () => {
          onSelectVenue?.(v.slug);
        });
        group.addLayer(m);
      });
      group.addTo(map);

      if (venues.length > 0) {
        map.fitBounds(group.getBounds().pad(0.2));
      }

      const emitSelectedMarkerPosition = () => {
        if (!selectedSlug) {
          onSelectedMarkerPositionChange?.(null);
          return;
        }
        const selectedVenue = venues.find((v) => v.slug === selectedSlug);
        if (!selectedVenue) {
          onSelectedMarkerPositionChange?.(null);
          return;
        }
        const point = map.latLngToContainerPoint([selectedVenue.lat, selectedVenue.lng]);
        const size = map.getSize();
        onSelectedMarkerPositionChange?.({
          x: point.x,
          y: point.y,
          width: size.x,
          height: size.y,
        });
      };

      if (selectedSlug) {
        const selectedVenue = venues.find((v) => v.slug === selectedSlug);
        if (selectedVenue) {
          map.flyTo(
            [selectedVenue.lat, selectedVenue.lng],
            Math.max(map.getZoom(), 16),
            { duration: 0.35 },
          );
        }
      }

      map.on("move", emitSelectedMarkerPosition);
      map.on("zoom", emitSelectedMarkerPosition);
      emitSelectedMarkerPosition();
    })();

    return () => {
      cancelled = true;
      if (!mapRef.current) return;
      onSelectedMarkerPositionChange?.(null);
      mapRef.current.remove();
      mapRef.current = null;
    };
  }, [
    venues,
    center,
    selectedSlug,
    onSelectVenue,
    onClearSelection,
    onSelectedMarkerPositionChange,
  ]);

  return (
    <div
      ref={el}
      className={`w-full rounded-xl border border-quegym-border bg-quegym-subtle ${className ?? "h-[min(360px,55vh)]"}`}
      role="presentation"
    />
  );
}
