import { expect, test } from "@playwright/test";

test.skip(
  !process.env.E2E_WITH_SERVICES,
  "Requiere catalog+leads levantados y seed activo.",
);

test("envia lead desde ficha y redirige a confirmacion", async ({ page }) => {
  await page.goto("/gyms/gym-fitness-caracas#contactar-modal");

  await expect(page.getByText("Qué necesitas")).toBeVisible();
  await page.locator('select[name="intent"]').selectOption("info");
  await page.locator('input[name="name"]').fill("QA Sprint 3");
  await page.locator('input[name="phone"]').fill("+584120000000");
  await page
    .getByLabel(/Acepto el tratamiento de mis datos personales/i)
    .check();

  await page
    .getByRole("button", {
      name: /Solicitar membresía ahora|Pedir prueba ahora|Enviar solicitud/i,
    })
    .click();

  await expect(page).toHaveURL(/\/lead\/confirmacion/);
  await expect(page.getByText(/Tu solicitud fue recibida/i)).toBeVisible();
});
