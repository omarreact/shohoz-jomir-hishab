import {
  LANDBD_PDF,
  getLandBdA4ContentBox,
  toPdfCoreFontText,
} from "./branding";

describe("LandBD PDF branding standard", () => {
  test("uses ISO A4 dimensions in both supported orientations", () => {
    expect(LANDBD_PDF.a4Portrait).toEqual({ widthMm: 210, heightMm: 297 });
    expect(LANDBD_PDF.a4Landscape).toEqual({ widthMm: 297, heightMm: 210 });
  });

  test("reserves masthead and footer space for portrait result documents", () => {
    expect(getLandBdA4ContentBox("portrait")).toEqual({
      x: 10,
      y: 20,
      width: 190,
      height: 262,
    });
  });

  test("reserves masthead and footer space for landscape documents", () => {
    expect(getLandBdA4ContentBox("landscape")).toEqual({
      x: 10,
      y: 20,
      width: 277,
      height: 175,
    });
  });
  test("never passes Bengali to jsPDF Helvetica header rendering", () => {
    expect(toPdfCoreFontText("LandBD-BRS-পাতিরা-349", "LandBD Report")).toBe("LandBD-BRS-349");
    expect(toPdfCoreFontText("A4 ল্যান্ডস্কেপ · খতিয়ান রিপোর্ট", "LandBD A4 report")).toBe("A4");
    expect(toPdfCoreFontText("খতিয়ান রিপোর্ট", "LandBD Report")).toBe("LandBD Report");
    expect(toPdfCoreFontText("LandBD RS 123", "Other")).toBe("LandBD RS 123");
  });

});
