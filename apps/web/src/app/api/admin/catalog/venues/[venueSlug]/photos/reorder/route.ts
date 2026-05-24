import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Params = { params: Promise<{ venueSlug: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const { venueSlug } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/catalog/venues/${encodeURIComponent(venueSlug)}/photos/reorder`,
      {
        method: "PATCH",
        headers: {
          [auth.headerName]: auth.headerValue,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
