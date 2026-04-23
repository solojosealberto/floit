import { test, expect } from "@playwright/test";

test("home muestra enlace a buscar", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Buscar centros/i }),
  ).toBeVisible();
});

test("privacidad muestra título", async ({ page }) => {
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Privacidad/i,
  );
});
