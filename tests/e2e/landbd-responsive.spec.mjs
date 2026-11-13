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

async function dismissLocationConsent(page) {
  const consent = page.getByRole("dialog", { name: "লোকেশন অনুমতি" });
  // The consent prompt is mounted after client hydration, so an immediate
  // isVisible() check can race and let the modal intercept later map clicks.
  const appeared = await consent.waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!appeared) return;
  await consent.getByRole("button", { name: "বন্ধ" }).click();
  await expect(consent).toBeHidden();
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

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("tablet and desktop use the top navbar with dropdown submenus", async ({ page }) => {
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
      await groupButton.hover();
      await expect(groupButton).toHaveAttribute("aria-expanded", "true");
    }
  });
});

test.describe("LandBD GIS control geometry", () => {
  test("mobile workspace hides the competing right toolbar while open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await allowFreeGisAccess(page);
    await goto(page, "/geospatial-map");
    await dismissLocationConsent(page);

    const toggle = page.getByRole("button", { name: /খুঁজুন \/ স্তর|প্যানেল বন্ধ/ });
    await expect(toggle).toBeVisible();
    if ((await toggle.textContent())?.includes("খুঁজুন")) await toggle.click();

    const panel = page.locator("#atlas-map-workspace-panel");
    const toolbar = page.getByLabel(/^(?:GIS|জিআইএস) মানচিত্র টুলবার$/);
    await expect(panel).toBeVisible();
    await expect(toolbar).toBeHidden();

    await page.getByRole("button", { name: "প্যানেল বন্ধ" }).click();
    await expect(panel).toBeHidden();
    await expect(toolbar).toBeVisible();
  });

  test("desktop GIS panel and toolbar occupy separate regions", async ({ page }) => {
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await allowFreeGisAccess(page);
      await goto(page, "/geospatial-map");
    await dismissLocationConsent(page);

      const panel = page.locator("#atlas-map-workspace-panel");
      const toolbar = page.getByLabel(/^(?:GIS|জিআইএস) মানচিত্র টুলবার$/);
      await expect(panel).toBeVisible();
      await expect(toolbar).toBeVisible();

      const panelBox = await panel.boundingBox();
      const toolbarBox = await toolbar.boundingBox();
      expect(panelBox).not.toBeNull();
      expect(toolbarBox).not.toBeNull();
      if (!panelBox || !toolbarBox) throw new Error("GIS panel or toolbar has no layout box");
      expect(panelBox.x + panelBox.width).toBeLessThan(toolbarBox.x);

      const tablist = page.getByRole("tablist", { name: /^(?:GIS|জিআইএস) ওয়ার্কস্পেস বিভাগ$/ });
      await expect(tablist).toBeVisible();
      await expect(tablist.getByRole("tab")).toHaveCount(4);
    }
  });
  test("historical imagery choices switch in the real map workspace", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await allowFreeGisAccess(page);
    await goto(page, "/geospatial-map");
    await dismissLocationConsent(page);

    const panel = page.locator("#atlas-map-workspace-panel");
    await expect(panel).toBeVisible();
    await panel.getByRole("tab", { name: "বেসম্যাপ" }).click();

    const sentinel = panel.getByRole("button", { name: /Sentinel-2 · 2016|Sentinel-2 · ২০১৬/ });
    const modis2003 = panel.getByRole("button", { name: /NASA MODIS · 2003|NASA MODIS · ২০০৩/ });
    const modis2025 = panel.getByRole("button", { name: /NASA MODIS · 2025|NASA MODIS · ২০২৫/ });
    await expect(sentinel).toBeVisible();
    await expect(modis2003).toBeVisible();
    await expect(modis2025).toBeVisible();

    await sentinel.click();
    await expect(sentinel).toHaveAttribute("aria-pressed", "true");
    await modis2003.click();
    await expect(modis2003).toHaveAttribute("aria-pressed", "true");
    await expect(sentinel).toHaveAttribute("aria-pressed", "false");
    const earthLink = panel.getByRole("link", { name: /Google Earth/ });
    await expect(earthLink).toBeVisible();
    await expect(earthLink).toHaveAttribute("target", "_blank");
    await modis2025.click();
    await expect(modis2025).toHaveAttribute("aria-pressed", "true");
    await expect(modis2003).toHaveAttribute("aria-pressed", "false");
  });

});
