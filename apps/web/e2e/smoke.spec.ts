import { test, expect } from "@playwright/test";

test("home muestra hero y acceso a descubrimiento (/buscar)", async ({ page }) => {
  await page.goto("/");
  /** Copy canónico Fase 7 — tuteo venezolano (sin voseo). */
  await expect(
    page.getByRole("heading", { level: 1, name: /Encuentra tu próximo gym en Caracas/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Buscar$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ver todos/i })).toBeVisible();
});

test("privacidad muestra título", async ({ page }) => {
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Privacidad/i,
  );
});
