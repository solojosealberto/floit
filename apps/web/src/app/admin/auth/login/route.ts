import { NextResponse } from "next/server";
import { isAdminLocalPasswordLoginEnabled } from "@/lib/admin-local-login";
import { setAdminEmailSession } from "@/lib/admin-session";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let email = "";
  let password = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    email = typeof form?.get("email") === "string" ? String(form.get("email")).trim() : "";
    password = typeof form?.get("password") === "string" ? String(form.get("password")) : "";
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=missing_credentials", url.origin), {
      status: 303,
    });
  }

  const localEmail = process.env.ADMIN_LOCAL_LOGIN_EMAIL?.trim().toLowerCase();
  const localPassword = process.env.ADMIN_LOCAL_LOGIN_PASSWORD ?? "";
  if (!isAdminLocalPasswordLoginEnabled() || !localEmail || !localPassword) {
    return NextResponse.redirect(new URL("/admin/login?error=admin_login_not_enabled", url.origin), {
      status: 303,
    });
  }

  if (email.toLowerCase() !== localEmail || password !== localPassword) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_credentials", url.origin), {
      status: 303,
    });
  }

  await setAdminEmailSession(localEmail);
  return NextResponse.redirect(new URL("/admin", url.origin), { status: 303 });
}
