import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Params = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAdminAuthHeader();
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const { slug } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/taxonomy-attributes/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
