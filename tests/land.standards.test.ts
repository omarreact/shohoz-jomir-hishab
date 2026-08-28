import {
  BANGLADESH_STANDARD,
  DHAKA_RAJUK_STANDARD,
  getLandMeasurementStandard,
} from "../src/modules/land/standards";

describe("land measurement standards", () => {
  it("uses the explicit Bangladesh baseline", () => {
    expect(BANGLADESH_STANDARD.squareFeetPerKatha).toBe(720);
    expect(BANGLADESH_STANDARD.kathasPerBigha).toBe(20);
    expect(BANGLADESH_STANDARD.decimalsPerAcre).toBe(100);
    expect(BANGLADESH_STANDARD.squareFeetPerDecimal).toBe(435.6);
  });

  it("keeps the Dhaka/RAJUK convention explicit", () => {
    expect(DHAKA_RAJUK_STANDARD.id).toBe("dhaka-rajuk");
    expect(DHAKA_RAJUK_STANDARD.squareFeetPerKatha).toBe(720);
  });

  it("falls back safely to the Bangladesh baseline", () => {
    expect(getLandMeasurementStandard("bangladesh-standard")).toBe(BANGLADESH_STANDARD);
    expect(getLandMeasurementStandard("dhaka-rajuk")).toBe(DHAKA_RAJUK_STANDARD);
  });
});
