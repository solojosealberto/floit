/**
 * Normaliza respuestas de error típicas de Nest (ValidationPipe): `message` como
 * string o array de strings.
 */
export function formatUpstreamMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const msg = (payload as { message?: unknown }).message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) {
    const strings = msg.filter((x): x is string => typeof x === "string");
    if (strings.length) return strings.join(" · ");
  }
  return null;
}

export function formatUpstreamError(payload: unknown, fallback: string): string {
  return formatUpstreamMessage(payload) ?? fallback;
}
