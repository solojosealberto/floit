import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/verify-turnstile";

export async function POST(req: Request) {
  const base = process.env.LEADS_SERVICE_URL ?? "http://localhost:4012";
  try {
    let raw: Record<string, unknown>;
    try {
      raw = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "invalid_json" }, { status: 400 });
    }
    const captchaOk = await verifyTurnstileToken(raw.turnstileToken);
    if (!captchaOk) {
      return NextResponse.json(
        { message: "Verificacion anti-spam fallida." },
        { status: 400 },
      );
    }
    const outbound = { ...raw };
    delete outbound.turnstileToken;
    const body = JSON.stringify(outbound);
    const clientUa = req.headers.get("user-agent")?.trim() ?? "";
    const res = await fetch(`${base}/v1/leads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(clientUa ? { "x-client-user-agent": clientUa.slice(0, 1024) } : {}),
      },
      body,
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
