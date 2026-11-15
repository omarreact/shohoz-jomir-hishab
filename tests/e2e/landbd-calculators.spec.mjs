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
    const serviceId = url.searchParams.get("serviceId") || "unknown";
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

async function gotoTool(page, path) {
  await allowPublicService(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
}

test.describe("LandBD calculator common-flow QA", () => {
  test("khatiyan quick calculator accepts Bangla digits and produces a non-zero result", async ({ page }) => {
    await gotoTool(page, "/khatiyan");

    await page.getByRole("tab", { name: /কুইক/ }).click();
    const land = page.getByPlaceholder("উদাহরণ: ৫০");
    await land.fill("৫০");
    await expect(land).toHaveValue("৫০");

    const addAna = page.getByRole("button", { name: "আনা বাড়ান" });
    for (let index = 0; index < 8; index += 1) {
      await addAna.click();
    }
    await expect(page.getByRole("status", { name: "আনা এর পরিমাণ" })).toHaveText("৮");

    await page.getByRole("button", { name: /ফলাফল দেখুন/ }).click();

    await expect(page.getByText("আপনার প্রাপ্ত জমি")).toBeVisible();
    const result = page.getByText(/শতাংশ$/).filter({ has: page.locator("xpath=..") });
    await expect(page.locator("h2").filter({ hasText: /শতাংশ/ })).toContainText(/[১-৯]/);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("faraez calculator completes a common spouse-only distribution flow", async ({ page }) => {
    await gotoTool(page, "/faraez");

    await page.getByPlaceholder("যেমন: ১০০").fill("100");
    await page.getByRole("button", { name: /সম্পত্তি বন্টন করুন/ }).click();

    await expect(page.getByText("বিস্তারিত বন্টন ফলাফল")).toBeVisible();
    await expect(page.getByText("সম্পত্তি বন্টন (ফারায়েজ) বিবরণী")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("land measurement rectangle flow calculates from feet inputs", async ({ page }) => {
    await gotoTool(page, "/land-measurement");

    await page.getByRole("radio", { name: /আয়তক্ষেত্র/ }).click();
    await page.getByRole("spinbutton", { name: "দৈর্ঘ্য / বাহু ১ ফুট" }).fill("30");
    await page.getByRole("spinbutton", { name: "প্রস্থ / বাহু ২ ফুট" }).fill("20");
    await page.getByRole("button", { name: /হিসাব করুন/ }).click();

    await expect(page.getByText("হিসাবের ফলাফল")).toBeVisible();
    await expect(page.locator("#landResultSection [data-bangla-number='1']").first()).toContainText(/[১-৯]/);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});
