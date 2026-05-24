"use client";

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
      className="inline-flex items-center gap-1 hover:text-neutral-700"
    >
      <span aria-hidden>📍</span>
      Usar mi ubicación
    </button>
  );
}
