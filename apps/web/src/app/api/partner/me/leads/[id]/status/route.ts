import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "deprecated_use_venue_scoped_lead_status_endpoint" },
    { status: 410 },
  );
}
