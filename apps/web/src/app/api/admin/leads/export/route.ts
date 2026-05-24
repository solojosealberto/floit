import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

/** Proxy seguro: el token admin no sale al navegador; solo usa variables de servidor. */
export async function GET() {
  const auth = await getAdminAuthHeader();
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  if (!auth) {
    return NextResponse.json(
      { error: "admin_not_configured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/leads/export.csv?limit=500`,
      {
        headers: { [auth.headerName]: auth.headerValue },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_error" },
        { status: res.status },
      );
    }
    const csv = await res.text();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="floit-leads.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
