/** Cliente mínimo de analítica (US-6.x) — envía al BFF Next. */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, properties }),
    keepalive: true,
  }).catch(() => {});
}
