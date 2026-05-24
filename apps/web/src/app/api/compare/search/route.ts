import { NextResponse } from "next/server";

type SearchItem = {
  slug: string;
  name: string;
  zone?: string;
  venueType?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const exclude = (url.searchParams.get("exclude") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (q.length < 2) return NextResponse.json({ items: [] });

  const base = process.env.SEARCH_SERVICE_URL ?? "http://localhost:4011";
  const upstream = new URL(`${base}/v1/search`);
  upstream.searchParams.set("q", q);
  upstream.searchParams.set("limit", "8");

  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ items: [] });

    const data = (await res.json()) as { items?: SearchItem[] };
    const items = (data.items ?? []).filter(
      (item) => item?.slug && !exclude.includes(item.slug),
    );
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

