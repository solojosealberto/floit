import { cookies } from "next/headers";

export const ADMIN_EMAIL_COOKIE = "floit_admin_email";

export async function getAdminEmailFromSession(): Promise<string | null> {
  const store = await cookies();
  const email = store.get(ADMIN_EMAIL_COOKIE)?.value?.trim().toLowerCase();
  return email || null;
}

export async function setAdminEmailSession(email: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_EMAIL_COOKIE, email.trim().toLowerCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminEmailSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_EMAIL_COOKIE);
}
