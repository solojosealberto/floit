import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { token } = await ctx.params;
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  try {
    const res = await fetch(
      `${base}/v1/leads/status/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
