import { test, expect } from "@playwright/test";

test("home muestra acceso a descubrimiento (/buscar)", async ({ page }) => {
  await page.goto("/");
  /** Alineado a `app/page.tsx`: CTA del formulario + enlace «Ver todos» a `/buscar`. */
  await expect(page.getByRole("button", { name: /^Buscar$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Ver todos$/ })).toBeVisible();
});

test("privacidad muestra título", async ({ page }) => {
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Privacidad/i,
  );
});
