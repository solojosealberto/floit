import { defineConfig, devices } from "@playwright/test";

const port = 3050;
const base = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? base,
    trace: "on-first-retry",
  },
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: `npx next dev --turbopack -p ${port}`,
        url: base,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: __dirname,
      },
});
