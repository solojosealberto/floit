import { NextResponse } from "next/server";
export async function PATCH() {
  return NextResponse.json({ error: "deprecated_use_venue_scoped_plans_endpoint" }, { status: 410 });
}
