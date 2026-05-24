import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type Params = { params: Promise<{ venueSlug: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  const { venueSlug } = await params;
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "200";
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/venues/${encodeURIComponent(venueSlug)}/leads?limit=${encodeURIComponent(limit)}`,
      { headers: { [auth.headerName]: auth.headerValue }, cache: "no-store" },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
