import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/partner/claims`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
