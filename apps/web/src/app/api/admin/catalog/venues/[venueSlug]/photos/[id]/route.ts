import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Params = { params: Promise<{ venueSlug: string; id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const { venueSlug, id } = await params;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/catalog/venues/${encodeURIComponent(venueSlug)}/photos/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { [auth.headerName]: auth.headerValue },
      },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
