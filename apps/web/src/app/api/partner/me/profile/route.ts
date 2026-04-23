import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

export async function GET() {
  const auth = getPartnerAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/partner/me/profile`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  const auth = getPartnerAuthHeader();
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
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/partner/me/profile`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        [auth.headerName]: auth.headerValue,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
