import { test, expect } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";

test.use({
  baseURL,
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

async function mockDlrmsUiPath(page) {
  await page.route("**/api/services/access?serviceId=dlrms-khatian", (route) => json(route, {
    serviceId: "dlrms-khatian",
    allowed: true,
    requiresLogin: false,
    enabled: true,
    paid: false,
    priceBdt: 0,
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
    { SURVEY_ID: 99, LOCAL_NAME: "নামজারি খতিয়ান (নামজারি)", SURVEY_ORDER: 999 },
  ]));
  await page.route("**/api/land-records/mouzas**", (route) => json(route, [
    {
      ID: 382911,
      MOUZA_ID: 71947,
      MOUZA_NAME: "পাতিরা",
      JL_NUMBER: "110",
      DISTRICT_NAME: "ঢাকা",
      UPAZILA_NAME: "রূপগঞ্জ",
      SURVEY_ID: 7,
      SURVEY_NAME: "বি আর এস",
      SURVEY_NAME_EN: "BRS",
    },
  ]));

  const base = {
    ID: 7940305,
    KHATIAN_NO: "349",
    OWNERS: "পরীক্ষামূলক মালিক ১,পরীক্ষামূলক মালিক ২",
    GUARDIANS: "পিতা: পরীক্ষামূলক অভিভাবক ১,পিতা: পরীক্ষামূলক অভিভাবক ২",
    DAGS: "1974,1977",
    JL_NUMBER_ID: 382911,
    MOUZA_ID: 71947,
    TOTAL_LAND: "0.338",
    KHATIAN_ENTRY_ID: 7940305,
    IS_LOCKED: 0,
    DIVISION_NAME: "ঢাকা",
    DISTRICT_NAME: "ঢাকা",
    UPAZILA_NAME: "রূপগঞ্জ",
    JL_NUMBER: "5",
    MOUZA_NAME: "পাতিরা",
    SURVEY_ID: 7,
    SURVEY_NAME: "বি আর এস",
    PUBLIC_RECORD: {
      source: "browser-qa-fixture",
      PREVIOUS_KHATIAN: "123",
      LAND_CLASS: "ভিটা",
      OWNER_DETAILS: [{ NAME: "পরীক্ষামূলক মালিক ১", MOTHER_NAME: "পরীক্ষামূলক মাতা ১" }],
    },
  };

  await page.route("**/api/land-records/khatians?**", (route) => json(route, {
    items: [{
      ID: base.ID,
      KHATIAN_NO: base.KHATIAN_NO,
      OWNERS: base.OWNERS,
      GUARDIANS: base.GUARDIANS,
      DAGS: base.DAGS,
      JL_NUMBER_ID: base.JL_NUMBER_ID,
      MOUZA_ID: base.MOUZA_ID,
      TOTAL_LAND: base.TOTAL_LAND,
    }],
    page: 1,
    pageSize: 20,
    total: 1,
    hasNextPage: false,
  }));

  await page.route("**/api/land-records/full-khatian/BRS/7940305**", (route) => json(route, {
    base,
    owners: [
      {
        occurrence: 1,
        name: "পরীক্ষামূলক মালিক ১",
        father: "পরীক্ষামূলক অভিভাবক ১",
        mother: "পরীক্ষামূলক মাতা ১",
        spouse: "পরীক্ষামূলক জীবনসঙ্গী ১",
        guardian: "পরীক্ষামূলক আইনগত অভিভাবক ১",
        address: "পরীক্ষামূলক ঠিকানা ১",
        shareRaw: "৮ আনা",
        source: "DLRMS_PUBLIC",
      },
      { occurrence: 2, name: "পরীক্ষামূলক মালিক ২", father: "পরীক্ষামূলক অভিভাবক ২", source: "DLRMS_PUBLIC" },
    ],
    dags: [
      { dagNo: "1974", landType: "নাল", khatianAreaRaw: "0.20", source: "DLRMS_PUBLIC" },
      { dagNo: "1977", landType: "ভিটা", khatianAreaRaw: "0.138", source: "DLRMS_PUBLIC" },
    ],
    halSabek: [],
    lisf: {
      status: "disabled",
      owners: [],
      dags: [],
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    },
    evidence: [
      {
        field: "base",
        source: "DLRMS_PUBLIC",
        endpoint: "/api/land-records/full-khatian/BRS/7940305",
        official: true,
        access: "public",
        fetchedAt: "2026-11-14T00:00:00.000Z",
      },
    ],
    warnings: [],
    generatedAt: "2026-11-14T00:00:00.000Z",
  }));
}

async function choose(page, label, option) {
  const section = page.locator("main").locator(`section[aria-label="${label}"]`);
  await expect(section).toHaveCount(1);
  await expect(section).toBeVisible();
  await section.getByRole("button", { name: option, exact: true }).click();
}

test.describe("LandBD DLRMS browser data path", () => {
  test("carries BRS list owner, guardian and dag data into the full detail view", async ({ page }) => {
    await mockDlrmsUiPath(page);
    await page.goto(`${baseURL}/dlrms-khatian`, { waitUntil: "domcontentloaded" });

    await choose(page, "বিভাগ", "ঢাকা");
    await choose(page, "জেলা", "ঢাকা");
    await choose(page, "উপজেলা / থানা", "রূপগঞ্জ");
    await expect(
      page.getByRole("heading", { name: /Mutation \/ নামজারি (?:QR|কিউআর) যাচাই/ }),
    ).toBeVisible();
    await choose(page, "খতিয়ানের ধরন", "বি আর এস");
    await choose(page, "মৌজা (JL নম্বর)", /^(?:110|১১০) · পাতিরা$/);

    const row = page.locator("tbody tr").filter({ hasText: /349|৩৪৯/ });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("পরীক্ষামূলক মালিক ১");
    await expect(row).toContainText(/1974|১৯৭৪/);
    await expect(row).toContainText(/0\.338|০\.৩৩৮/);

    await row.getByRole("button", { name: "প্রিভিউ" }).click();

    const dialog = page.getByRole("dialog", { name: "খতিয়ান বিস্তারিত" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("পরীক্ষামূলক মালিক ২").first()).toBeVisible();
    await expect(dialog.getByText("পরীক্ষামূলক অভিভাবক ২").first()).toBeVisible();
    await expect(dialog.getByText(/1977|১৯৭৭/).first()).toBeVisible();
    await expect(dialog.getByText(/0\.338|০\.৩৩৮/).first()).toBeVisible();

    await dialog.getByText("অতিরিক্ত উৎস-তথ্য দেখুন", { exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: /সরকারি (?:DLRMS|ডিএলআরএমএস) উৎসের সকল প্রকাশিত ফিল্ড/ }),
    ).toBeVisible();
    await expect(dialog.getByText("PREVIOUS_KHATIAN", { exact: true })).toBeVisible();
    await expect(dialog.getByText("123", { exact: true })).toBeVisible();
    await expect(dialog.getByText("পরীক্ষামূলক মাতা ১", { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText("পরীক্ষামূলক জীবনসঙ্গী ১", { exact: true })).toBeVisible();
    await expect(dialog.getByText("পরীক্ষামূলক আইনগত অভিভাবক ১", { exact: true })).toBeVisible();
    await expect(dialog.getByText("পরীক্ষামূলক ঠিকানা ১", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("cell", { name: "৮ আনা", exact: true })).toBeVisible();
  });
});
