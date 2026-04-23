import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  try {
    const body = (await req.json()) as {
      slug?: string;
      kind?: string;
      message?: string;
    };
    if (!body.slug || !body.kind || !body.message) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const res = await fetch(
      `${base}/v1/venues/${encodeURIComponent(body.slug)}/reports`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: body.kind, message: body.message }),
      },
    );
    return new NextResponse(null, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
