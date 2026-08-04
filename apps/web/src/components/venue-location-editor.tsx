"use client";

import { useEffect, useRef } from "react";
import { UITextInput } from "@floit/ui";
import { mapPinMarkerHtml } from "@/lib/map-marker-html";
import "leaflet/dist/leaflet.css";

/** Default map center (Caracas) when a venue has no coordinates yet. */
export const CARACAS_MAP_CENTER = { lat: 10.480594, lng: -66.903606 } as const;

export type VenueLocationFields = {
  address: string;
  zone: string;
  lat: number | null;
  lng: number | null;
};

type Props = {
  value: VenueLocationFields;
  venueName?: string;
  inputClassName?: string;
  mapClassName?: string;
  onChange: (next: VenueLocationFields) => void;
};

function parseCoord(raw: string, min: number, max: number): number | null {
  const n = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 1e6) / 1e6;
}

export function VenueLocationEditor({
  value,
  venueName,
  inputClassName,
  mapClassName,
  onChange,
}: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  const displayLat =
    value.lat != null && Number.isFinite(value.lat)
      ? value.lat
      : CARACAS_MAP_CENTER.lat;
  const displayLng =
    value.lng != null && Number.isFinite(value.lng)
      ? value.lng
      : CARACAS_MAP_CENTER.lng;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapEl.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const map = L.map(mapEl.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([displayLat, displayLng], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        className: "floit-gym-map-marker",
        html: mapPinMarkerHtml(true, 28),
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([displayLat, displayLng], {
        icon,
        draggable: true,
      }).addTo(map);
      if (venueName) {
        marker.bindTooltip(venueName, { direction: "top", offset: [0, -20] });
      }
      markerRef.current = marker;

      const commitCoords = (lat: number, lng: number) => {
        const roundedLat = Math.round(lat * 1e6) / 1e6;
        const roundedLng = Math.round(lng * 1e6) / 1e6;
        onChangeRef.current({
          ...valueRef.current,
          lat: roundedLat,
          lng: roundedLng,
        });
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        commitCoords(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        commitCoords(e.latlng.lat, e.latlng.lng);
      });

      // Leaflet needs a layout pass inside dynamic containers.
      setTimeout(() => map.invalidateSize(), 50);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Re-init only when venue identity changes; pin moves via separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueName]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const cur = marker.getLatLng();
    if (
      Math.abs(cur.lat - displayLat) < 1e-7 &&
      Math.abs(cur.lng - displayLng) < 1e-7
    ) {
      return;
    }
    marker.setLatLng([displayLat, displayLng]);
    map.panTo([displayLat, displayLng]);
  }, [displayLat, displayLng]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-quegym-secondary">
            Dirección
          </span>
          <UITextInput
            name="address"
            value={value.address}
            onChange={(e) =>
              onChange({ ...value, address: e.target.value })
            }
            placeholder="Calle, edificio, municipio…"
            className={`h-[46px] w-full rounded-xl ${inputClassName ?? ""}`}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-quegym-secondary">Zona</span>
          <UITextInput
            name="zone"
            value={value.zone}
            onChange={(e) => onChange({ ...value, zone: e.target.value })}
            placeholder="Ej: Chacao"
            className={`h-[46px] w-full rounded-xl ${inputClassName ?? ""}`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-quegym-secondary">
              Latitud
            </span>
            <UITextInput
              name="lat"
              inputMode="decimal"
              value={value.lat != null && Number.isFinite(value.lat) ? String(value.lat) : ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  lat: parseCoord(e.target.value, -90, 90),
                })
              }
              placeholder="10.48"
              className={`h-[46px] w-full rounded-xl ${inputClassName ?? ""}`}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-quegym-secondary">
              Longitud
            </span>
            <UITextInput
              name="lng"
              inputMode="decimal"
              value={value.lng != null && Number.isFinite(value.lng) ? String(value.lng) : ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  lng: parseCoord(e.target.value, -180, 180),
                })
              }
              placeholder="-66.90"
              className={`h-[46px] w-full rounded-xl ${inputClassName ?? ""}`}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-quegym-secondary">
          Arrastra el pin o haz clic en el mapa para ajustar la ubicación. Se
          publica en la ficha y en el mapa de búsqueda.
        </p>
        <div
          ref={mapEl}
          className={`w-full overflow-hidden rounded-xl border border-quegym-border bg-quegym-subtle ${mapClassName ?? "h-56 md:h-64"}`}
          role="application"
          aria-label="Mapa para ajustar la ubicación del centro"
        />
      </div>
    </div>
  );
}
