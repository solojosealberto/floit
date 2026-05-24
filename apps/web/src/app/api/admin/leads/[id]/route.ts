import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await getAdminAuthHeader();
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/admin/lead/${encodeURIComponent(id)}`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await getAdminAuthHeader();
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/admin/lead/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        [auth.headerName]: auth.headerValue,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
