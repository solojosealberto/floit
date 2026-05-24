import { NextResponse } from "next/server";
import { getAdminAuthHeader } from "@/lib/admin-auth-header";

type Params = { params: Promise<{ venueSlug: string; id: string }> };

export async function PATCH(req: Request, ctx: Params) {
  const auth = await getAdminAuthHeader();
  if (!auth) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  let status: string | undefined;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    status = body.status;
  } else {
    const form = await req.formData().catch(() => null);
    status = typeof form?.get("status") === "string" ? String(form.get("status")) : undefined;
  }
  if (status !== "contacted" && status !== "closed") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const { venueSlug, id } = await ctx.params;
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/catalog/venues/${encodeURIComponent(venueSlug)}/leads/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: {
          [auth.headerName]: auth.headerValue,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    const payload = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
