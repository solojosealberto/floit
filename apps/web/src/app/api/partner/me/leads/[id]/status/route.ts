import { NextResponse } from "next/server";
import { getPartnerAuthHeader } from "@/lib/partner-auth-header";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const auth = getPartnerAuthHeader();
  if (!auth) {
    return NextResponse.json({ error: "partner_not_configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const contentType = req.headers.get("content-type") ?? "";
  let status: string | undefined;
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    status = body.status;
  } else {
    const form = await req.formData().catch(() => null);
    status = typeof form?.get("status") === "string" ? String(form?.get("status")) : undefined;
  }
  if (status !== "contacted" && status !== "closed") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const base = process.env.PARTNER_SERVICE_URL ?? "http://localhost:4013";
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/v1/partner/me/leads/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: {
          [auth.headerName]: auth.headerValue,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    const referer = req.headers.get("referer");
    if (referer) {
      return NextResponse.redirect(referer, { status: 303 });
    }
    const payload = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
