import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

export async function GET() {
  const auth = await getAdminAuthHeader();
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/admin/taxonomy-attributes`, {
      headers: { [auth.headerName]: auth.headerValue },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const auth = await getAdminAuthHeader();
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/admin/taxonomy-attributes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [auth.headerName]: auth.headerValue,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
