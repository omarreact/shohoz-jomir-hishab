import {
  LANDBD_PDF,
  getLandBdA4ContentBox,
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
});
