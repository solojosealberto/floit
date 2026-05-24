import { expect, test } from "@playwright/test";

test("partner claim — página pública muestra el asistente", async ({ page }) => {
  await page.goto("/partner/claim");
  await expect(page.getByRole("heading", { name: /Tu centro en QueGym/i })).toBeVisible();
});

test("partner claim — API acepta reclamo de centro existente", async ({
  request,
}, testInfo) => {
  if (!process.env.E2E_WITH_SERVICES) {
    testInfo.skip(
      true,
      "Requiere partner-service detrás del BFF (p. ej. `E2E_WITH_SERVICES=1 pnpm dev:services` + web).",
    );
    return;
  }
  const res = await request.post("/api/partner/claims", {
    headers: { "content-type": "application/json" },
    data: {
      venueSlug: "gym-fitness-caracas",
      representativeName: "E2E Claim",
      representativeEmail: `e2e-claim-${Date.now()}@floit.test`,
      representativePhone: "+584120000000",
      evidence: "Prueba automatizada E2E (reclamo existente).",
      claimKind: "existing",
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { id?: string; status?: string };
  expect(body.status).toBe("pending_review");
  expect(body.id).toBeTruthy();
});
