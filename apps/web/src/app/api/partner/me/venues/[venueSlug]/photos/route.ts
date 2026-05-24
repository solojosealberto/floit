import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type Params = { params: Promise<{ venueSlug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  const { venueSlug } = await params;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(venueSlug)}/photos`,
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

export async function POST(request: Request, { params }: Params) {
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  const { venueSlug } = await params;
  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(venueSlug)}/photos`,
      {
        method: "POST",
        headers: { [auth.headerName]: auth.headerValue },
        body,
      },
    );
    const payload = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
