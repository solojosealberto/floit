import { NextResponse } from "next/server";
import { clearAdminEmailSession } from "@/lib/admin-session";

export async function GET(request: Request) {
  await clearAdminEmailSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
