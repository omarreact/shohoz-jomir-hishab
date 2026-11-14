import { test, expect } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
test.use({
  baseURL,
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
  } : undefined,
});

async function goto(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);
}

async function allowFreeGisAccess(page) {
  await page.route("**/api/services/access?serviceId=geospatial-map", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        serviceId: "geospatial-map",
        allowed: true,
        requiresLogin: false,
        enabled: true,
        paid: false,
        priceBdt: 0,
      }),
    });
  });
}

async function waitForGis(page) {
  await expect(page.getByLabel("বাংলাদেশের GIS মানচিত্র · আরএস এমএস ও স্যাটেলাইট")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "GIS মানচিত্র সাইডবার" })).toBeVisible();
  await expect(page.getByText("GIS মানচিত্র তৈরি হচ্ছে…")).toBeHidden({ timeout: 20_000 });
}

test.describe("LandBD responsive navigation", () => {
  test("mobile uses only the drawer navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, "/");

    const desktopNav = page.getByRole("navigation", { name: "প্রধান নেভিগেশন" });
    const opener = page.getByRole("button", { name: "মোবাইল মেনু খুলুন" });
    await expect(desktopNav).toBeHidden();
    await expect(opener).toBeVisible();

    await opener.click();
    const dialog = page.getByRole("dialog", { name: "মোবাইল সাইডবার মেনু" });
    await expect(dialog).toBeVisible();
    const section = dialog.locator('button[aria-controls="landbd-drawer-section-records"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute("aria-expanded", "true");
    await section.click();
    await expect(section).toHaveAttribute("aria-expanded", "false");
    await section.click();
    await expect(section).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.locator("a[href]").first()).toBeVisible();

    const firstNavLink = dialog.locator("a[href]").first();
    expect(await firstNavLink.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(18);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("tablet and desktop use the top navbar with 18px-or-larger menu copy", async ({ page }) => {
    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await goto(page, "/");

      const nav = page.getByRole("navigation", { name: "প্রধান নেভিগেশন" });
      await expect(nav).toBeVisible();
      await expect(page.getByRole("button", { name: "মোবাইল মেনু খুলুন" })).toBeHidden();

      const groupButton = nav.locator('button[aria-haspopup="menu"]').first();
      await expect(groupButton).toBeVisible();
      expect(await groupButton.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(18);
      await groupButton.hover();
      await expect(groupButton).toHaveAttribute("aria-expanded", "true");
    }
  });
});

test.describe("LandBD map-first geospatial workspace", () => {
  test("all target viewports open as an unobstructed map with collapsed tools", async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 360, height: 800 },
    ];

    await allowFreeGisAccess(page);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await goto(page, "/geospatial-map");
      await waitForGis(page);

      const panel = page.locator("#atlas-map-workspace-panel");
      await expect(panel).toBeHidden();
      await expect(page.getByRole("dialog", { name: "লোকেশন অনুমতি" })).toHaveCount(0);
      await expect(page.getByText("পরিমাপ ও জরিপ টুলস")).toHaveCount(0);
      await expect(page.getByText("মানচিত্রে ট্যাপ করে বিন্দু বসান")).toHaveCount(0);

      const map = page.getByLabel("বাংলাদেশের GIS মানচিত্র · আরএস এমএস ও স্যাটেলাইট");
      const box = await map.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.width ?? 0).toBeGreaterThan(viewport.width * 0.95);
      expect(box?.height ?? 0).toBeGreaterThan(viewport.height * 0.95);
    }
  });

  test("icon rail keeps exactly one panel active and supports close and Escape", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await allowFreeGisAccess(page);
    await goto(page, "/geospatial-map");
    await waitForGis(page);

    const panel = page.locator("#atlas-map-workspace-panel");
    const tools = [
      ["দাগ ও মৌজা খুঁজুন", "দাগ ও মৌজা অনুসন্ধান"],
      ["লেয়ার", "লেয়ার নিয়ন্ত্রণ"],
      ["বেসম্যাপ", "বেসম্যাপ"],
      ["ঐতিহাসিক স্যাটেলাইট", "ঐতিহাসিক স্যাটেলাইট"],
      ["লেজেন্ড", "লেজেন্ড"],
      ["মানচিত্র সেটিংস", "মানচিত্র সেটিংস"],
    ];

    for (const [buttonName, panelName] of tools) {
      const button = page.getByRole("button", { name: buttonName });
      await button.click();
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("aria-label", panelName);
      await expect(button).toHaveAttribute("aria-expanded", "true");
    }

    await expect(panel.getByRole("button", { name: "স্থানাঙ্ক কপি" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "PNG সংরক্ষণ" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "প্রিন্ট" })).toBeVisible();

    const settings = page.getByRole("button", { name: "মানচিত্র সেটিংস" });
    await settings.click();
    await expect(panel).toBeHidden();

    const history = page.getByRole("button", { name: "ঐতিহাসিক স্যাটেলাইট" });
    await history.click();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(history).toBeFocused();
  });

  test("mobile sidebar panel remains reachable and dismissible", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await allowFreeGisAccess(page);
    await goto(page, "/geospatial-map");
    await waitForGis(page);

    const search = page.getByRole("button", { name: "দাগ ও মৌজা খুঁজুন" });
    await search.click();
    const panel = page.locator("#atlas-map-workspace-panel");
    await expect(panel).toBeVisible();

    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((panelBox?.x ?? 0) + (panelBox?.width ?? 0)).toBeLessThanOrEqual(361);

    await panel.getByRole("button", { name: "প্যানেল বন্ধ" }).click();
    await expect(panel).toBeHidden();
  });

  test("location runs only after explicit sidebar activation", async ({ page, context }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 23.81, longitude: 90.41, accuracy: 15 });
    await allowFreeGisAccess(page);
    await goto(page, "/geospatial-map");
    await waitForGis(page);

    await expect(page.locator('[aria-label="বর্তমান অবস্থান"]')).toHaveCount(0);
    await page.getByRole("button", { name: "আমার অবস্থান" }).click();
    await expect(page.locator('[aria-label="বর্তমান অবস্থান"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#atlas-map-workspace-panel")).toBeHidden();
  });

  test("historical imagery is explicit about NASA MODIS versus Google Earth", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await allowFreeGisAccess(page);
    await goto(page, "/geospatial-map");
    await waitForGis(page);

    await page.getByRole("button", { name: "ঐতিহাসিক স্যাটেলাইট" }).click();
    const panel = page.locator("#atlas-map-workspace-panel");
    await expect(panel).toBeVisible();

    const sentinel = panel.getByRole("button", { name: /Sentinel-(?:2|২) · (?:2016|২০১৬)/ });
    const modis2003 = panel.getByRole("button", { name: /NASA MODIS · 2003|NASA MODIS · ২০০৩/ });
    const modis2025 = panel.getByRole("button", { name: /NASA MODIS · 2025|NASA MODIS · ২০২৫/ });
    await expect(sentinel).toBeVisible();
    await expect(modis2003).toBeVisible();
    await expect(modis2025).toBeVisible();
    await expect(panel.getByText(/২০০৩ layer হলো NASA MODIS, Google Earth নয়/)).toBeVisible();

    await sentinel.click();
    await expect(sentinel).toHaveAttribute("aria-pressed", "true");
    await modis2003.click();
    await expect(modis2003).toHaveAttribute("aria-pressed", "true");
    await expect(sentinel).toHaveAttribute("aria-pressed", "false");

    const earthLink = panel.getByRole("link", { name: "Google Earth historical imagery খুলুন" });
    await expect(earthLink).toHaveAttribute("href", "https://earth.google.com/web/");
    await expect(earthLink).toHaveAttribute("target", "_blank");

    await modis2025.click();
    await expect(modis2025).toHaveAttribute("aria-pressed", "true");
    await expect(modis2003).toHaveAttribute("aria-pressed", "false");
  });

  test("dag clicks replace a single popup without opening the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await allowFreeGisAccess(page);

    let identifyCount = 0;
    const features = [
      {
        plotId: "rs-101",
        attributes: {
          _layer_source: "rs",
          rs_plot_no: "101",
          plot_no: 101,
          rs_jl_no: "34",
          rs_mouza_name: "টেস্ট মৌজা",
          upazila_ps: "রূপগঞ্জ",
          m_district: "নারায়ণগঞ্জ",
        },
        geometry: {
          rings: [[[90.40, 23.80], [90.41, 23.80], [90.41, 23.81], [90.40, 23.81], [90.40, 23.80]]],
        },
      },
      {
        plotId: "ms-202",
        attributes: {
          _layer_source: "ms",
          ms_plot_no: "202",
          plot_no: 202,
          jl_no: "35",
          mauza: "অন্য মৌজা",
          thana_upazila: "রূপগঞ্জ",
          m_district: "নারায়ণগঞ্জ",
        },
        geometry: {
          rings: [[[90.42, 23.82], [90.43, 23.82], [90.43, 23.83], [90.42, 23.83], [90.42, 23.82]]],
        },
      },
    ];

    await page.route("**/api/rajuk/query?*", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("action") !== "identify") {
        await route.continue();
        return;
      }
      const feature = identifyCount < features.length ? features[identifyCount] : null;
      identifyCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ features: feature ? [feature] : [] }),
      });
    });

    await goto(page, "/geospatial-map");
    await waitForGis(page);
    const panel = page.locator("#atlas-map-workspace-panel");
    const canvas = page.locator(".maplibregl-canvas");
    await expect(canvas).toBeVisible();

    await canvas.click({ position: { x: 1120, y: 260 } });
    const popup = page.locator(".landbd-dag-popup");
    await expect(popup).toHaveCount(1);
    await expect(popup).toContainText("RS দাগ 101");
    await expect(popup).toContainText("তথ্য পাওয়া যায়নি");
    await expect(panel).toBeHidden();

    await canvas.click({ position: { x: 820, y: 690 } });
    await expect(popup).toHaveCount(1);
    await expect(popup).toContainText("MS দাগ 202");
    await expect(popup).not.toContainText("RS দাগ 101");
    await expect(panel).toBeHidden();

    await canvas.click({ position: { x: 1320, y: 760 } });
    await expect(popup).toHaveCount(0);
    await expect(panel).toBeHidden();
  });
});
