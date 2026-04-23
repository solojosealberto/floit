import { expect, test } from "@playwright/test";
import { capabilityFixture } from "../../../tests/fixtures/capability-search-profile-compare-lead";

test.skip(
  !process.env.E2E_WITH_SERVICES,
  "Requiere servicios search/catalog/leads activos con seed.",
);

test("flujo buscar -> ficha -> comparar -> lead sin sleeps fijos", async ({
  page,
}) => {
  await page.goto("/buscar");
  await expect(
    page.getByRole("heading", { level: 1, name: /Buscar centros/i }),
  ).toBeVisible();

  const zoneOptions = page.locator('select[name="zone"] option');
  if ((await zoneOptions.count()) > 1) {
    await page.getByLabel("Zona").selectOption({ index: 1 });
  }
  await page.getByRole("button", { name: /Aplicar filtros/i }).click();
  await expect(page).toHaveURL(/\/buscar\?/);

  const firstResult = page.locator('a[href^="/gyms/"]').first();
  await expect(firstResult).toBeVisible();
  const firstHref = await firstResult.getAttribute("href");
  expect(firstHref).toMatch(/^\/gyms\/.+/);
  const firstSlug = firstHref!.replace("/gyms/", "");

  await firstResult.click();
  await expect(page).toHaveURL(new RegExp(`/gyms/${firstSlug}`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto(`/comparar?c=${encodeURIComponent(firstSlug)}`);
  await expect(
    page.getByRole("heading", { level: 1, name: /Comparar hasta 3 centros/i }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  await page.goto(`/gyms/${firstSlug}`);
  await page.getByLabel("Qué necesitas").selectOption("membership");
  await page.getByLabel("Nombre").fill(capabilityFixture.leadPayload.name);
  await page.getByLabel("Teléfono").fill(capabilityFixture.leadPayload.phone);
  await page.getByLabel("Correo (opcional)").fill(capabilityFixture.leadPayload.email);
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
