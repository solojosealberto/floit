import { cookies } from "next/headers";

export const PARTNER_ACCESS_COOKIE = "floit_partner_access_token";

export async function getPartnerAccessTokenFromSession(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(PARTNER_ACCESS_COOKIE)?.value?.trim();
  return token || null;
}

export async function setPartnerAccessTokenSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(PARTNER_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearPartnerAccessTokenSession(): Promise<void> {
  const store = await cookies();
  store.delete(PARTNER_ACCESS_COOKIE);
}
