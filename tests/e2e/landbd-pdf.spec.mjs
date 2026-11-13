import { test, expect } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
test.use({
  baseURL,
  acceptDownloads: true,
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  } : undefined,
});

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });
}

async function mockLandRecordBook(page) {
  await page.route("**/api/services/access?serviceId=mouza-porcha-report", (route) => json(route, {
    serviceId: "mouza-porcha-report",
    allowed: true,
    requiresLogin: false,
    enabled: true,
    paid: false,
    priceBdt: 0,
  }));

  const rows = Array.from({ length: 60 }, (_, index) => ({
    ID: 900000 + index + 1,
    KHATIAN_NO: String(index + 1),
    OWNERS: `মালিক ${index + 1}`,
    GUARDIANS: `পিতা ${index + 1}`,
    DAGS: `${1000 + index},${2000 + index}`,
    JL_NUMBER_ID: 382911,
    MOUZA_ID: 71947,
    TOTAL_LAND: (0.1 + index / 1000).toFixed(3),
  }));

  await page.route("**/api/land-records/divisions**", (route) => json(route, [
    { ID: 1, NAME: "ঢাকা", NAME_EN: "Dhaka", BBS_CODE: "30", ROW_STATUS: 1 },
  ]));
  await page.route("**/api/land-records/districts**", (route) => json(route, [
    { ID: 2, NAME: "ঢাকা", NAME_EN: "Dhaka", BBS_CODE: "26", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  ]));
  await page.route("**/api/land-records/upazilas**", (route) => json(route, [
    { ID: 3, NAME: "রূপগঞ্জ", NAME_EN: "Rupganj", BBS_CODE: "26", DISTRICT_BBS_CODE: "26", ROW_STATUS: 1 },
  ]));
  await page.route("**/api/land-records/surveys**", (route) => json(route, [
    { SURVEY_ID: 7, LOCAL_NAME: "বি আর এস", SURVEY_ORDER: 7 },
  ]));
  await page.route("**/api/land-records/mouzas**", (route) => json(route, [
    {
      ID: 382911, MOUZA_ID: 71947, MOUZA_NAME: "পাতিরা", JL_NUMBER: "110",
      DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "রূপগঞ্জ", SURVEY_ID: 7,
      SURVEY_NAME: "বি আর এস", SURVEY_NAME_EN: "BRS",
    },
  ]));
  await page.route("**/api/land-records/mouza-porcha-report?**", (route) => json(route, {
    items: rows, page: 1, pageSize: 100, total: rows.length, hasNextPage: false,
  }));
  await page.route("**/api/reports/mouza-porcha/verification", (route) => json(route, {
    reportId: "LANDBD-QA-REPORT-001",
    generatedAt: "2026-11-14T00:00:00.000Z",
    verificationUrl: "https://landbd.example/verify/report/LANDBD-QA-REPORT-001",
  }));
  return rows;
}

async function choose(page, label, option) {
  const section = page.getByLabel(label);
  await expect(section).toBeVisible();
  await section.getByRole("button", { name: option, exact: true }).click();
}

test.describe("LandBD Mouza Khatian Book PDF engine", () => {
  test("renders every row, downloads a non-empty multi-page A4 PDF and opens the generated preview", async ({ page }) => {
    test.setTimeout(120_000);
    const rows = await mockLandRecordBook(page);
    await page.goto(`${baseURL}/mouza-khatian-book`, { waitUntil: "domcontentloaded" });

    await choose(page, "বিভাগ", "ঢাকা");
    await choose(page, "জেলা", "ঢাকা");
    await choose(page, "উপজেলা / থানা", "রূপগঞ্জ");
    await choose(page, "খতিয়ানের ধরন", "বি আর এস");
    await choose(page, "মৌজা (JL নম্বর)", "110 · পাতিরা");

    const generate = page.getByRole("button", { name: "পূর্ণ মৌজা PDF ডাউনলোড" });
    await expect(generate).toBeEnabled();

    const downloadStarted = Date.now();
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await generate.click();
    const download = await downloadPromise;
    const downloadMs = Date.now() - downloadStarted;

    expect(download.suggestedFilename()).toMatch(/^LandBD-Mouza-Khatian-Book-.*\.pdf$/);
    expect(downloadMs).toBeLessThan(45_000);
    const stream = await download.createReadStream();
    let bytes = 0;
    for await (const chunk of stream) bytes += chunk.length;
    expect(bytes).toBeGreaterThan(10_000);

    const report = page.locator("#mouza-porcha-report");
    await expect(report).toBeVisible();
    await expect(report.getByText("LANDBD-QA-REPORT-001")).toBeVisible();
    await expect(report.locator("tr[data-report-source-id]")).toHaveCount(rows.length);
    expect(await report.locator(".report-page").count()).toBeGreaterThan(2);

    const previewStarted = Date.now();
    await page.getByRole("button", { name: "PDF প্রিভিউ" }).click();
    const dialog = page.getByRole("dialog", { name: "PDF প্রিভিউ" });
    await expect(dialog).toBeVisible({ timeout: 45_000 });
    expect(Date.now() - previewStarted).toBeLessThan(45_000);
    await expect(dialog.locator('iframe[title="LandBD generated PDF document"]')).toHaveAttribute("src", /^blob:/);
    await expect(dialog.getByRole("link", { name: "PDF ডাউনলোড" })).toHaveAttribute("download", /\.pdf$/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
