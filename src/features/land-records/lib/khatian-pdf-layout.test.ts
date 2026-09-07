import {
  PDF_EXPORT_WIDTH_PX,
  idealPageCssHeight,
  planPortraitSlices,
  portraitContentSizeMm,
} from "./khatian-pdf-layout";

describe("khatian A4 portrait PDF layout", () => {
  test("uses A4 portrait content dimensions", () => {
    expect(portraitContentSizeMm()).toEqual({ width: 194, height: 281 });
    expect(idealPageCssHeight()).toBeGreaterThan(1400);
    expect(idealPageCssHeight()).toBeLessThan(1430);
    expect(PDF_EXPORT_WIDTH_PX).toBe(980);
  });

  test("plans contiguous pages and prefers natural row boundaries", () => {
    const slices = planPortraitSlices(
      4300,
      [500, 1250, 1400, 2500, 2780, 3900, 4200],
    );

    expect(slices[0]).toEqual({ offsetY: 0, height: 1400 });
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
      idealPageCssHeight(),
    );
  });
});
