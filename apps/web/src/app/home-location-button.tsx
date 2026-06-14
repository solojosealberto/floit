"use client";

import { MapPin, Map } from "lucide-react";
import { useRouter } from "next/navigation";

export function HomeLocationButton() {
  const router = useRouter();

  function onUseLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = new URLSearchParams();
        p.set("lat", String(pos.coords.latitude));
        p.set("lng", String(pos.coords.longitude));
        p.set("sort", "distance");
        p.set("radius_km", "12");
        router.push(`/buscar?${p.toString()}`);
      },
      () => {
        router.push("/buscar");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <button
      type="button"
      onClick={onUseLocation}
      className="qg-link-hover qg-motion inline-flex items-center gap-1 text-quegym-secondary hover:text-quegym-highlight"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Usar mi ubicación
    </button>
  );
}
