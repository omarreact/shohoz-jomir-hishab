import {
  BANGLADESH_STANDARD,
  DHAKA_RAJUK_STANDARD,
  getLandMeasurementStandard,
} from "../src/modules/land/standards";

describe("land measurement standards", () => {
  it("uses the Bangladesh Ministry of Land published baseline", () => {
    expect(BANGLADESH_STANDARD.squareFeetPerKatha).toBe(720);
    expect(BANGLADESH_STANDARD.kathasPerBigha).toBe(20);
    expect(BANGLADESH_STANDARD.decimalsPerBigha).toBe(33);
    expect(BANGLADESH_STANDARD.decimalsPerAcre).toBe(100);
    expect(BANGLADESH_STANDARD.squareFeetPerDecimal).toBe(435.6);
    expect(BANGLADESH_STANDARD.squareFeetPerBigha).toBe(14400);
    expect(BANGLADESH_STANDARD.squareFeetPerAcre).toBe(43560);
    expect(BANGLADESH_STANDARD.squareMetersPerAcre).toBe(4047);
    expect(BANGLADESH_STANDARD.source).toContain("ভূমি মন্ত্রণালয়");
  });

  it("preserves the Ministry's published traditional-unit relationships", () => {
    expect(BANGLADESH_STANDARD.gondaPerKani).toBe(20);
    expect(BANGLADESH_STANDARD.koraPerGonda).toBe(4);
    expect(BANGLADESH_STANDARD.krantiPerKora).toBe(3);
    expect(BANGLADESH_STANDARD.tilPerKranti).toBe(20);
    expect(BANGLADESH_STANDARD.kaniSquareFeet8HatNol).toBe(17280);
    expect(BANGLADESH_STANDARD.kaniSquareFeet40Shotok).toBe(17424);
    expect(BANGLADESH_STANDARD.kaniDecimals40Shotok).toBe(40);
    expect(BANGLADESH_STANDARD.kaniSquareMeters8HatNol).toBe(1605);
    expect(BANGLADESH_STANDARD.kaniSquareMeters40Shotok).toBe(1619);
  });

  it("keeps the existing Dhaka/RAJUK profile compatible with the Ministry baseline", () => {
    expect(DHAKA_RAJUK_STANDARD.id).toBe("dhaka-rajuk");
    expect(DHAKA_RAJUK_STANDARD.squareFeetPerKatha).toBe(720);
    expect(DHAKA_RAJUK_STANDARD.squareFeetPerDecimal).toBe(435.6);
    expect(DHAKA_RAJUK_STANDARD.squareFeetPerBigha).toBe(14400);
  });

  it("falls back safely to the Bangladesh baseline", () => {
    expect(getLandMeasurementStandard("bangladesh-standard")).toBe(BANGLADESH_STANDARD);
    expect(getLandMeasurementStandard("dhaka-rajuk")).toBe(DHAKA_RAJUK_STANDARD);
  });
});
