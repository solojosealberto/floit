import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = getAdminAuthHeader();
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const reason = String(form?.get("reason") ?? "").trim();
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/partner/ownerships/${encodeURIComponent(id)}/revoke`,
      {
        method: "POST",
        headers: {
          [auth.headerName]: auth.headerValue,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reason: reason || undefined,
        }),
        cache: "no-store",
      },
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
