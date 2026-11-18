import { test, expect } from "@playwright/test";
const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
test.use({
  baseURL,
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-proxy-server", "--proxy-bypass-list=<-loopback>"],
  } : undefined,
});
async function visit(page, route) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  expect(response, route).not.toBeNull();
  expect(response.status(), route).toBeLessThan(500);
  await expect(page.locator("body")).not.toContainText("This page couldn’t load");
}
test("mobile home and contact do not overflow the viewport", async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 800 });
    for (const route of ["/", "/contact"]) {
      await visit(page, route);
      const metrics = await page.evaluate(() => ({
        viewport: window.innerWidth, scroll: document.documentElement.scrollWidth,
      }));
      expect(metrics.scroll, route + " at " + width + "px").toBeLessThanOrEqual(metrics.viewport + 2);
    }
  }
});
test("mobile service launcher and desktop navbar retain their independent layouts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "/");
  await expect(page.getByRole("heading", { name: "আপনার জমির কাজ, সহজে" })).toBeVisible();
  await expect(page.locator("#landbd-mobile-service-search")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, "/");
  await expect(page.getByRole("navigation", { name: "প্রধান নেভিগেশন" })).toBeVisible();
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth, scroll: document.documentElement.scrollWidth,
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 2);
});
