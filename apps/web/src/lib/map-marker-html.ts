/** HTML para marcadores Leaflet (pin SVG, sin emoji). */
export function mapPinMarkerHtml(active = false, size = 26): string {
  const px = active ? size + 4 : size;
  const bg = active ? "#12B76A" : "#0f172a";
  return `<div style="width:${px}px;height:${px}px;border-radius:9999px;background:${bg};display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(15,23,42,.3);border:2px solid white;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true"><path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z"/><circle cx="12" cy="11" r="2.5"/></svg></div>`;
}
