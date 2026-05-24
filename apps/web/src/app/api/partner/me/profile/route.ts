import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { error: "deprecated_use_venue_scoped_profile_endpoint" },
    { status: 410 },
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "deprecated_use_venue_scoped_profile_endpoint" },
    { status: 410 },
  );
}
