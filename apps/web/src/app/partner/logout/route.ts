import { NextResponse } from "next/server";
import { clearPartnerAccessTokenSession } from "@/lib/partner-session";

export async function POST(request: Request) {
  await clearPartnerAccessTokenSession();
  const referer = request.headers.get("referer");
  if (referer) return NextResponse.redirect(referer, { status: 303 });
  return NextResponse.redirect(new URL("/partner/login", request.url), { status: 303 });
}
