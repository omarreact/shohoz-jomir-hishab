import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
test.use({
  baseURL,
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : undefined,
});

async function allowPublicService(page) {
  await page.route("**/api/services/access?*", async (route) => {
    const url = new URL(route.request().url());
    const serviceId = url.searchParams.get("serviceId") || "faraez";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        serviceId,
        allowed: true,
        requiresLogin: false,
        enabled: true,
        paid: false,
        priceBdt: 0,
      }),
    });
  });
  await page.route("**/api/payment/pinpay/methods", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ methods: [] }),
    });
  });
}

test("Faraez result downloads one coherent A4 report with the textual distribution", async ({ page }) => {
  await allowPublicService(page);
  await page.goto("/faraez", { waitUntil: "domcontentloaded" });

  await page.getByPlaceholder("যেমন: ১০০", { exact: true }).fill("100");
  await page.getByRole("button", { name: /সম্পত্তি বন্টন করুন/ }).click();

  const result = page.locator("#resultSection");
  await expect(result).toBeVisible();
  await expect(result.getByText("সম্পত্তি বন্টন (ফারায়েজ) বিবরণী")).toBeVisible();
  await expect(result.locator("tbody tr")).toHaveCount(1);
  await expect(result.locator("tbody td").filter({ hasText: /আনা · .*গন্ডা · .*কড়া · .*ক্রান্তি · .*তিল/ }).first()).toBeVisible();

  // The chart is deliberately excluded from PDF so it cannot become a
  // chart-only/near-empty sheet. The textual legal distribution must remain.
  await expect(result.locator("[data-pdf-exclude='1']")).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await result.getByRole("button", { name: "রিপোর্ট ডাউনলোড করুন" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^LandBD-Faraez-Result-A4-Portrait\.pdf$/);
  await mkdir("test-results", { recursive: true });
  const output = "test-results/landbd-faraez-result.pdf";
  await download.saveAs(output);
  const stream = await download.createReadStream();
  let bytes = 0;
  for await (const chunk of stream) bytes += chunk.length;
  expect(bytes).toBeGreaterThan(20_000);
});
