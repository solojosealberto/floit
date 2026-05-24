import { NextResponse } from "next/server";
import { getPartnerAccessTokenFromSession } from "@/lib/partner-session";

type Body = {
  newEmail?: string;
  confirmEmail?: string;
  password?: string;
};

export async function POST(request: Request) {
  const token = await getPartnerAccessTokenFromSession();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const newEmail = body.newEmail?.trim().toLowerCase() ?? "";
  const confirmEmail = body.confirmEmail?.trim().toLowerCase() ?? "";
  const password = body.password?.trim() ?? "";

  if (!newEmail || !confirmEmail || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (newEmail !== confirmEmail) {
    return NextResponse.json({ error: "emails_do_not_match" }, { status: 400 });
  }

  // Demo-safe behavior: register a change request without mutating ownership/session identity.
  return NextResponse.json({
    ok: true,
    status: "pending_verification",
    message: "Solicitud registrada. Revisa el correo para confirmar el cambio.",
    requestedEmail: newEmail,
  });
}
