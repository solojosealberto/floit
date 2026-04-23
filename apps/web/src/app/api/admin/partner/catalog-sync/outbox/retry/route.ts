import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export async function POST(request: Request) {
  const auth = getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const n = Number.parseInt(limitRaw ?? "50", 10);
  const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 50;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/partner/catalog-sync/outbox/retry?limit=${limit}`,
      {
        method: "POST",
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
