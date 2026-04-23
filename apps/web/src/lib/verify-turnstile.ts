/**
 * Cloudflare Turnstile server-side verification (US-7.2).
 * Si no hay `TURNSTILE_SECRET_KEY`, siempre permite (solo desarrollo).
 */
export async function verifyTurnstileToken(token: unknown): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || token.length < 10) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
