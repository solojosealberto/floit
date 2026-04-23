import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
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
  const { id } = await params;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/plans/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          [auth.headerName]: auth.headerValue,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
