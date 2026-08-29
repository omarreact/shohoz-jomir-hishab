import { toCalculationSafeKhatiyanPlot, RajukParcelDomainError } from "./rajukKhatiyanAdapter";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const feature = (area: number): RajukPlotFeature => ({
  attributes: {
    objectid: 101,
    plot_no: 12,
    p_guid: "p-101",
    rs_plot_no: "12",
    ms_plot_no: null,
    address_search: "Test",
    Shape__Area: area,
    Shape__Length: 100,
  },
  geometry: {
    rings: [[[90.40, 23.70], [90.41, 23.70], [90.41, 23.71], [90.40, 23.70]]],
    spatialReference: { wkid: 4326 },
  },
});

describe("RAJUK → Khatiyan adapter", () => {
  it("converts a valid square-foot parcel to a calculation-safe plot", () => {
    const result = toCalculationSafeKhatiyanPlot(feature(432), {
      measurementProfile: "khatiyan-record",
      shapeAreaUnit: "square-feet",
    });
    expect(Number(result.plot.a)).toBe(1);
    expect(result.source.measurementProfile).toBe("khatiyan-record");
  });

  it("converts square metres using the selected profile", () => {
    const result = toCalculationSafeKhatiyanPlot(feature(40.468564224)), {
      measurementProfile: "khatiyan-record",
      shapeAreaUnit: "square-meters",
    });
    expect(Number(result.plot.a)).toBeCloseTo(1, 10);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid Shape__Area: %p", (area) => {
    expect(() => toCalculationSafeKhatiyanPlot(feature(area), {
      measurementProfile: "khatiyan-record",
      shapeAreaUnit: "square-feet",
    })).toThrow(RajukParcelDomainError);
  });

  it("rejects out-of-range coordinates", () => {
    const invalid = feature(432);
    invalid.geometry.rings[0][1] = [181, 23.7];
    expect(() => toCalculationSafeKhatiyanPlot(invalid, {
      measurementProfile: "khatiyan-record",
      shapeAreaUnit: "square-feet",
    })).toThrow(/WGS84 bounds/);
  });

  it("rejects malformed geometry before creating a calculation plot", () => {
    const invalid = feature(432);
    invalid.geometry.rings = [];
    expect(() => toCalculationSafeKhatiyanPlot(invalid, {
      measurementProfile: "khatiyan-record",
      shapeAreaUnit: "square-feet",
    })).toThrow(/geometry/);
  });
});
