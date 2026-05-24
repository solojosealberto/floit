"use client";

import { useEffect, useRef } from "react";
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
        html: '<div style="width:28px;height:28px;border-radius:9999px;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 6px 14px rgba(15,23,42,.3);">📍</div>',
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
      className={`w-full rounded-xl border border-neutral-200 bg-neutral-100 ${className ?? "h-40"}`}
      role="presentation"
    />
  );
}
