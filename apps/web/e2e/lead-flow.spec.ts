import { expect, test } from "@playwright/test";

test.skip(
  !process.env.E2E_WITH_SERVICES,
  "Requiere catalog+leads levantados y seed activo.",
);

test("envia lead desde ficha y redirige a confirmacion", async ({ page }) => {
  await page.goto("/gyms/oxide-chacao");

  await page.getByLabel("Qué necesitas").selectOption("info");
  await page.getByLabel("Nombre").fill("QA Sprint 3");
  await page.getByLabel("Teléfono").fill("+584120000000");
  await page
    .getByLabel(/Acepto el tratamiento de mis datos personales/i)
    .check();

  await page
    .getByRole("button", {
      name: /Solicitar membresía ahora|Pedir prueba ahora|Enviar solicitud/i,
    })
    .click();

  await expect(page).toHaveURL(/\/lead\/confirmacion/);
  await expect(page.getByText(/Recibimos tus datos/i)).toBeVisible();
});
