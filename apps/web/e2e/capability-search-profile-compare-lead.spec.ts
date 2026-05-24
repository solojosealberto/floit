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
  await expect(page.getByRole("button", { name: /^Aplicar$/i })).toBeVisible();

  const searchRes = await page.request.get(
    `${process.env.SEARCH_SERVICE_URL ?? "http://127.0.0.1:4011"}/v1/search?limit=1`,
  );
  expect(searchRes.ok()).toBeTruthy();
  const searchBody = (await searchRes.json()) as {
    items?: { slug: string }[];
  };
  const firstSlug = searchBody.items?.[0]?.slug ?? "gym-fitness-caracas";

  await page.goto(`/gyms/${firstSlug}`);
  await expect(page).toHaveURL(new RegExp(`/gyms/${firstSlug}`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto(`/comparar?c=${encodeURIComponent(firstSlug)}`);
  await expect(
    page.getByRole("heading", { level: 1, name: /Comparando/i }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  await page.goto(`/gyms/${firstSlug}#contactar-modal`);
  await expect(page.getByText("Qué necesitas")).toBeVisible();
  await page.locator('select[name="intent"]').selectOption("membership");
  await page.locator('input[name="name"]').fill(capabilityFixture.leadPayload.name);
  await page.locator('input[name="phone"]').fill(capabilityFixture.leadPayload.phone);
  await page.locator('input[name="email"]').fill(capabilityFixture.leadPayload.email);
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
