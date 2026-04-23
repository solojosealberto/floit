import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const base =
    process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:4014";
  try {
    const raw = (await req.json().catch(() => ({}))) as {
      name?: unknown;
      properties?: Record<string, unknown>;
    };
    const referer = req.headers.get("referer") ?? "";
    let sourcePath: string | undefined;
    try {
      sourcePath = referer ? new URL(referer).pathname : undefined;
    } catch {
      sourcePath = undefined;
    }
    const body = JSON.stringify({
      name: typeof raw.name === "string" ? raw.name : "",
      properties: {
        ...(raw.properties ?? {}),
        source: sourcePath ?? (raw.properties?.source as string | undefined),
      },
    });
    const res = await fetch(`${base}/v1/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    return NextResponse.json(await res.json().catch(() => ({ ok: res.ok })), {
      status: res.status,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
