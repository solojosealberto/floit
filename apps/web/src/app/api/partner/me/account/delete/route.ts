import { NextResponse } from "next/server";
import { clearPartnerAccessTokenSession, getPartnerAccessTokenFromSession } from "@/lib/partner-session";

type Body = {
  confirmText?: string;
  secret?: string;
  accepted?: boolean;
};

export async function POST(request: Request) {
  const token = await getPartnerAccessTokenFromSession();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const confirmText = body.confirmText?.trim().toUpperCase() ?? "";
  const secret = body.secret?.trim() ?? "";
  const accepted = body.accepted === true;

  if (confirmText !== "ELIMINAR") {
    return NextResponse.json({ error: "invalid_confirmation_text" }, { status: 400 });
  }
  if (!secret) {
    return NextResponse.json({ error: "missing_secret" }, { status: 400 });
  }
  if (!accepted) {
    return NextResponse.json({ error: "must_accept_irreversible_action" }, { status: 400 });
  }

  // Demo-safe action: close session to emulate account closure flow.
  await clearPartnerAccessTokenSession();
  return NextResponse.json({
    ok: true,
    status: "accepted_for_deletion",
    message: "Solicitud de eliminación recibida. La sesión fue cerrada.",
  });
}
