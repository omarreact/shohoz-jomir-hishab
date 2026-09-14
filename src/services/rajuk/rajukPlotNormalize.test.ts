import { enrichPlotAttributes } from "./rajukPlotNormalize";

describe("RAJUK plot JSON area normalization", () => {
  const base = {
    objectid: 101,
    plot_no: 202,
    p_guid: "p-101",
    address_search: "202, Patira -JL 023, Gulshan Thana",
  };

  it("converts RS Shape__Area to Acre only after attaching the known scalar JSON unit contract", () => {
    const attrs = enrichPlotAttributes({ ...base, Shape__Area: 43_560 }, undefined, "rs");

    expect(attrs.shape_area_unit).toBe("square-feet");
    expect(attrs.area_acre).toBe(1);
    expect(attrs.area_source_field).toBe("Shape__Area");
    expect(attrs.area_source_unit).toBe("square-feet");
    expect(attrs.area_source).toBe("json_attribute");
  });

  it("preserves an explicit upstream Shape__Area unit instead of overwriting it", () => {
    const attrs = enrichPlotAttributes(
      { ...base, Shape__Area: 4046.8564224, shape_area_unit: "square-meters" },
      undefined,
      "rs",
    );

    expect(attrs.shape_area_unit).toBe("square-meters");
    expect(attrs.area_acre).toBe(1);
    expect(attrs.area_source_unit).toBe("square-meters");
  });

  it("does not invent a unit for an unknown layer source", () => {
    const attrs = enrichPlotAttributes({ ...base, Shape__Area: 43_560 }, undefined, "unknown");

    expect(attrs.shape_area_unit).toBeUndefined();
    expect(attrs.area_acre).toBeNull();
    expect(attrs.area_source).toBe("none");
  });
});
