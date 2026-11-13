import { test, expect } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
test.use({ baseURL });

async function goto(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);
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
    const section = dialog.locator('button[aria-expanded]').first();
    await expect(section).toBeVisible();
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
    await goto(page, "/geospatial-map");

    const toggle = page.getByRole("button", { name: /খুঁজুন \/ স্তর|প্যানেল বন্ধ/ });
    await expect(toggle).toBeVisible();
    if ((await toggle.textContent())?.includes("খুঁজুন")) await toggle.click();

    const panel = page.locator("#atlas-map-workspace-panel");
    const toolbar = page.locator('[aria-label="GIS মানচিত্র টুলবার"]');
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
      await goto(page, "/geospatial-map");

      const panel = page.locator("#atlas-map-workspace-panel");
      const toolbar = page.locator('[aria-label="GIS মানচিত্র টুলবার"]');
      await expect(panel).toBeVisible();
      await expect(toolbar).toBeVisible();

      const panelBox = await panel.boundingBox();
      const toolbarBox = await toolbar.boundingBox();
      expect(panelBox).not.toBeNull();
      expect(toolbarBox).not.toBeNull();
      expect(panelBox!.x + panelBox!.width).toBeLessThan(toolbarBox!.x);

      const tablist = page.getByRole("tablist", { name: "GIS ওয়ার্কস্পেস বিভাগ" });
      await expect(tablist).toBeVisible();
      await expect(tablist.getByRole("tab")).toHaveCount(4);
    }
  });
});
