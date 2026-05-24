import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export async function GET(request: Request) {
  const auth = await getAdminAuthHeader();
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/venue-reports${qs ? `?${qs}` : ""}`,
      {
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
