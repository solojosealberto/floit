import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export async function GET() {
  const auth = await getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/partner/me/venues`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
