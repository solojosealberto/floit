"use client";

import Link from "next/link";
import { Map, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

type ZoneChipsProps = {
  zones: string[];
};

export function HomeZoneChips({ zones }: ZoneChipsProps) {
  return (
    <section className="px-4 md:hidden">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-quegym-secondary">
        Zonas populares
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {zones.slice(0, 6).map((zone, i) => (
          <Link
            key={zone}
            href={`/buscar?zone=${encodeURIComponent(zone)}`}
            className={`shrink-0 qg-chip qg-motion rounded-full border px-3 py-1.5 text-xs ${
              i === 0
                ? "border-quegym-accent text-quegym-highlight shadow-[var(--qg-shadow-sm)]"
                : "qg-surface-subtle border-quegym-border bg-quegym-elevated text-quegym-primary"
            }`}
          >
            {zone}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeSearchActions() {
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
      () => router.push("/buscar"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={onUseLocation}
        className="qg-btn-primary qg-motion inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-quegym-accent px-4 py-3 text-sm font-medium text-white hover:bg-quegym-accent-hover"
      >
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        Usar mi ubicación
      </button>
      <Link
        href="/buscar"
        className="qg-btn-ghost qg-motion inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-quegym-border bg-quegym-elevated px-4 py-3 text-sm font-medium text-quegym-primary"
      >
        <Map className="h-4 w-4 shrink-0" aria-hidden />
        Elegir zona
      </Link>
    </div>
  );
}
