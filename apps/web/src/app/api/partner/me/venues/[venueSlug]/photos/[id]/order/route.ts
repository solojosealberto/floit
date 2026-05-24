import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type Params = { params: Promise<{ venueSlug: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { venueSlug, id } = await params;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(venueSlug)}/photos/${encodeURIComponent(id)}/order`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          [auth.headerName]: auth.headerValue,
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
