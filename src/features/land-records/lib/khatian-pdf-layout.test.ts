import {
  PDF_EXPORT_WIDTH_PX,
  PDF_EXPORT_WIDTH_PX_LANDSCAPE,
  contentSizeMm,
  exportWidthPxFor,
  idealPageCssHeight,
  fitImageToA4Content,
  shouldFitTrailingRibbonOnOnePage,
  planA4Slices,
  planPortraitSlices,
  portraitContentSizeMm,
} from "./khatian-pdf-layout";

describe("khatian A4 portrait PDF layout", () => {
  test("uses A4 portrait content dimensions", () => {
    expect(portraitContentSizeMm()).toEqual({ width: 190, height: 262 });
    expect(contentSizeMm("portrait")).toEqual({ width: 190, height: 262 });
    expect(idealPageCssHeight("portrait")).toBeGreaterThan(1340);
    expect(idealPageCssHeight("portrait")).toBeLessThan(1360);
    expect(PDF_EXPORT_WIDTH_PX).toBe(980);
    expect(exportWidthPxFor("portrait")).toBe(980);
  });

  test("plans contiguous pages and prefers natural row boundaries", () => {
    const slices = planPortraitSlices(
      4300,
      [500, 1250, 1400, 2500, 2780, 3900, 4200],
    );

    expect(slices[0]).toEqual({ offsetY: 0, height: 1250 });
    expect(slices.at(-1)!.offsetY + slices.at(-1)!.height).toBe(4300);

    for (let index = 1; index < slices.length; index += 1) {
      expect(slices[index].offsetY).toBe(
        slices[index - 1].offsetY + slices[index - 1].height,
      );
    }
  });

  test("keeps very tall records bounded to page-sized slices", () => {
    const breakpoints = Array.from({ length: 100 }, (_, index) => (index + 1) * 200);
    const slices = planPortraitSlices(20_000, breakpoints);

    expect(slices.length).toBeGreaterThan(10);
    expect(slices.length).toBeLessThan(20);
    expect(Math.max(...slices.map((slice) => slice.height))).toBeLessThanOrEqual(
      idealPageCssHeight("portrait"),
    );
  });
});

describe("khatian A4 landscape PDF layout", () => {
  test("uses A4 landscape content dimensions", () => {
    expect(contentSizeMm("landscape")).toEqual({ width: 277, height: 175 });
    expect(exportWidthPxFor("landscape")).toBe(PDF_EXPORT_WIDTH_PX_LANDSCAPE);
    expect(PDF_EXPORT_WIDTH_PX_LANDSCAPE).toBe(1380);
    expect(idealPageCssHeight("landscape")).toBeGreaterThan(860);
    expect(idealPageCssHeight("landscape")).toBeLessThan(880);
  });

  test("plans contiguous landscape slices", () => {
    const slices = planA4Slices(
      3000,
      [400, 900, 1500, 2100, 2800],
      "landscape",
    );

    expect(slices.length).toBeGreaterThan(0);
    expect(slices.at(-1)!.offsetY + slices.at(-1)!.height).toBe(3000);

    for (let index = 1; index < slices.length; index += 1) {
      expect(slices[index].offsetY).toBe(
        slices[index - 1].offsetY + slices[index - 1].height,
      );
    }
  });
});

describe("single-page BRS ribbon regression", () => {
  test("keeps a short trailing branding ribbon with its khatian details", () => {
    const slices = planA4Slices(960, [560, 770, 870], "landscape");
    expect(slices.length).toBe(2);
    expect(shouldFitTrailingRibbonOnOnePage(960, slices, "landscape", 1380, true)).toBe(true);
    expect(shouldFitTrailingRibbonOnOnePage(960, slices, "landscape", 1380, false)).toBe(false);
  });

  test("preserves pagination for genuinely long khatian records", () => {
    const slices = planA4Slices(2800, [1000, 1600, 2200], "landscape");
    expect(shouldFitTrailingRibbonOnOnePage(2800, slices, "landscape", 1380, true)).toBe(false);
    expect(slices.length).toBeGreaterThan(2);
  });

  test("fits taller images proportionally without clipping or distorting fonts and QR", () => {
    const result = fitImageToA4Content(960, 1380, 277, 175);
    expect(result.heightMm).toBeCloseTo(175, 3);
    expect(result.widthMm).toBeLessThan(277);
    expect(result.insetMm).toBeGreaterThan(0);
    expect(result.widthMm / result.heightMm).toBeCloseTo(1380 / 960, 6);

    const short = fitImageToA4Content(800, 1380, 277, 175);
    expect(short.widthMm).toBe(277);
    expect(short.insetMm).toBe(0);
  });
});
