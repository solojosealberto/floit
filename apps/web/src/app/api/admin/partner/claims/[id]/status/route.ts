import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const { id } = await params;
  let payload: { status?: string };
  try {
    payload = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const status = String(payload.status ?? "").trim();
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/partner/claims/${encodeURIComponent(id)}/status`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [auth.headerName]: auth.headerValue,
        },
        body: JSON.stringify({ status }),
        cache: "no-store",
      },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
