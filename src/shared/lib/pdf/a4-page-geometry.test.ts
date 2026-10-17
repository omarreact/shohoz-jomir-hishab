import { inspectA4PageGeometry, type A4PageGeometry } from "./a4-page-geometry";

const portrait: A4PageGeometry = {
  orientation: "portrait",
  renderedWidthPx: 800,
  renderedHeightPx: 800 * (297 / 210),
  clientHeightPx: 1131,
  scrollHeightPx: 1131,
  tableBottomPx: 890,
  footerTopPx: 1030,
};

describe("A4 report overflow guard", () => {
  it("accepts a normally laid out portrait page", () => {
    expect(inspectA4PageGeometry(portrait)).toBeNull();
  });

  it("accepts a normally laid out landscape page", () => {
    expect(inspectA4PageGeometry({
      orientation: "landscape",
      renderedWidthPx: 1122,
      renderedHeightPx: 1122 * (210 / 297),
      clientHeightPx: 794,
      scrollHeightPx: 794,
      tableBottomPx: 660,
      footerTopPx: 750,
    })).toBeNull();
  });

  it("rejects a portrait page grown taller than physical A4", () => {
    expect(inspectA4PageGeometry({ ...portrait, renderedHeightPx: 1280, clientHeightPx: 1280, scrollHeightPx: 1280 })).toBe("oversized-page");
  });

  it("rejects a CSS-hidden overflowing page", () => {
    expect(inspectA4PageGeometry({ ...portrait, scrollHeightPx: 1170 })).toBe("hidden-overflow");
  });

  it("rejects long table rows obscured by the footer", () => {
    expect(inspectA4PageGeometry({ ...portrait, tableBottomPx: 1045 })).toBe("footer-overlap");
  });

  it("accepts table cells with a small safe footer gap", () => {
    expect(inspectA4PageGeometry({ ...portrait, tableBottomPx: 1020 })).toBeNull();
  });

  it("rejects invalid dimensions", () => {
    expect(inspectA4PageGeometry({ ...portrait, renderedWidthPx: 0 })).toBe("invalid-size");
    expect(inspectA4PageGeometry({ ...portrait, clientHeightPx: Number.NaN })).toBe("invalid-size");
  });
});
