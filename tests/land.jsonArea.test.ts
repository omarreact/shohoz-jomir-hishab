import {
  acreFromDlrmsValue,
  acreFromJsonAttributes,
  formatAcre,
} from "@/src/modules/land/jsonArea";

describe("JSON-only Acre area contract", () => {
  it("prefers an explicit Acre value from JSON", () => {
    const result = acreFromJsonAttributes({ area_acre: 0.25, area_katha: 99 });
    expect(result?.acre).toBe(0.25);
    expect(result?.sourceField).toBe("area_acre");
    expect(result?.sourceUnit).toBe("acre");
  });

  it("converts a JSON katha field to Acre", () => {
    const result = acreFromJsonAttributes({ area_katha: 60.5 });
    expect(result?.acre).toBeCloseTo(1, 10);
    expect(result?.sourceUnit).toBe("katha");
  });

  it("converts a JSON decimal/shotok field to Acre", () => {
    const result = acreFromJsonAttributes({ area_shotok: 25 });
    expect(result?.acre).toBeCloseTo(0.25, 10);
  });

  it("never treats bare Shape__Area as an area when its unit is absent", () => {
    const result = acreFromJsonAttributes({
      Shape__Area: 43_560,
      Shape__Length: 1_000,
    });
    expect(result).toBeNull();
  });

  it("accepts Shape__Area only when JSON explicitly supplies its unit", () => {
    const result = acreFromJsonAttributes({
      Shape__Area: 43_560,
      shape_area_unit: "square-feet",
    });
    expect(result?.acre).toBeCloseTo(1, 10);
    expect(result?.sourceField).toBe("Shape__Area");
  });

  it("does not inspect geometry", () => {
    const result = acreFromJsonAttributes({
      geometry: {
        rings: [[[90, 23], [90.1, 23], [90.1, 23.1], [90, 23.1], [90, 23]]],
      },
    });
    expect(result).toBeNull();
  });

  it("normalizes DLRMS values to Acre", () => {
    expect(acreFromDlrmsValue("25 শতাংশ")).toBeCloseTo(0.25, 10);
    expect(acreFromDlrmsValue("০.৫০ একর")).toBeCloseTo(0.5, 10);
    expect(acreFromDlrmsValue("0.75", "acre")).toBeCloseTo(0.75, 10);
  });

  it("formats only Acre for display", () => {
    expect(formatAcre(0.25)).toContain("একর");
    expect(formatAcre(null)).toBe("—");
  });
});
