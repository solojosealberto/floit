import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export async function POST(request: Request) {
  const auth = await getAdminAuthHeader();
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  if (!auth) {
    return NextResponse.json(
      { error: "admin_not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limitN = Number.parseInt(limitRaw ?? "50", 10);
  const limit = Number.isFinite(limitN)
    ? Math.min(Math.max(limitN, 1), 500)
    : 50;

  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/notifications/retry?limit=${limit}`,
      {
        method: "POST",
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: res.status });
    }
    return NextResponse.json(await res.json(), { status: 200 });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
