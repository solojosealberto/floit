import { NextResponse } from "next/server";

function catalogBase() {
  return (process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010").replace(
    /\/$/,
    "",
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") ?? "";
  const qs = state ? `?state=${encodeURIComponent(state)}` : "";
  try {
    const res = await fetch(`${catalogBase()}/v1/meta/geo/cities${qs}`, {
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({ items: [] }));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ items: [], error: "upstream_unavailable" }, { status: 502 });
  }
}
