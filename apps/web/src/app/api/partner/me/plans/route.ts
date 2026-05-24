import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ error: "deprecated_use_venue_scoped_plans_endpoint" }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "deprecated_use_venue_scoped_plans_endpoint" }, { status: 410 });
}
