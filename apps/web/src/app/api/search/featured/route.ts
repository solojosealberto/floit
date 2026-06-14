import { NextResponse } from "next/server";

/** BFF: destacados para home (client skeleton fallback). */
export async function GET() {
  const searchBase = process.env.SEARCH_SERVICE_URL ?? "http://localhost:4011";
  try {
    const res = await fetch(`${searchBase}/v1/search?sort=popularity`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 502 });
    }
    const payload = (await res.json()) as { items?: unknown[] };
    return NextResponse.json({ items: payload.items ?? [] });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
