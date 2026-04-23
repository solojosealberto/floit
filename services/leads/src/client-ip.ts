import type { Request } from "express";

export function clientIpFromRequest(req: Request): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0]?.trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).trim();
  return req.socket?.remoteAddress ?? undefined;
}
