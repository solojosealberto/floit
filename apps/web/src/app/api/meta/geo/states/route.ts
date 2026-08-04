import { NextResponse } from "next/server";

function catalogBase() {
  return (process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010").replace(
    /\/$/,
    "",
  );
}

export async function GET() {
  try {
    const res = await fetch(`${catalogBase()}/v1/meta/geo/states`, {
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({ items: [] }));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ items: [], error: "upstream_unavailable" }, { status: 502 });
  }
}
