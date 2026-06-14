"use client";

import { useEffect, useRef } from "react";
import { mapPinMarkerHtml } from "@/lib/map-marker-html";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  name: string;
  className?: string;
};

export function GymLocationMap({ lat, lng, name, className }: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !el.current) return;

      map = L.map(el.current, {
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: "floit-gym-map-marker",
        html: mapPinMarkerHtml(false, 28),
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindTooltip(name, {
        direction: "top",
        offset: [0, -20],
      });
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [lat, lng, name]);

  return (
    <div
      ref={el}
      className={`w-full rounded-xl border border-quegym-border bg-quegym-subtle ${className ?? "h-40"}`}
      role="presentation"
    />
  );
}
