import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const base = process.env.CATALOG_SERVICE_URL ?? "http://localhost:4010";
  try {
    const { slugs } = (await req.json()) as { slugs?: string[] };
    if (!slugs?.length) return NextResponse.json({ items: [] });

    const items = await Promise.all(
      slugs.slice(0, 24).map(async (slug) => {
        const r = await fetch(
          `${base}/v1/venues/${encodeURIComponent(slug)}`,
          { cache: "no-store" },
        );
        if (!r.ok) return null;
        return r.json();
      }),
    );

    return NextResponse.json({
      items: items.filter(Boolean),
    });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
