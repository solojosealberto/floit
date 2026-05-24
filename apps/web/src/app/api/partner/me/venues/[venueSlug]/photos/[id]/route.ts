import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type Params = { params: Promise<{ venueSlug: string; id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  const { venueSlug, id } = await params;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(venueSlug)}/photos/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { [auth.headerName]: auth.headerValue },
      },
    );
    const payload = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
