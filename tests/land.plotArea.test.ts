import {
  areaFromGisRings,
  areaFromPlotAttributes,
  areaFromSquareMeters,
  resolveGisAreaSqm,
} from "@/src/modules/land/plotArea";

const square = (size: number, clockwise = true): number[][] => {
  const points = [
    [0, 0],
    [size, 0],
    [size, size],
    [0, size],
  ];
  return clockwise ? points : [...points].reverse();
};

describe("GIS plot area", () => {
  it("converts square metres using the documented land units", () => {
    const result = areaFromSquareMeters(720 / 10.76391041671);
    expect(result.isValid).toBe(true);
    expect(result.katha).toBeCloseTo(1, 8);
  });

  it("returns zero for missing or invalid rings", () => {
    expect(areaFromGisRings(undefined)).toBe(0);
    expect(areaFromGisRings([])).toBe(0);
    expect(areaFromGisRings([[ [0, 0], [1, 1] ]])).toBe(0);
  });

  it("supports a single exterior ring regardless of winding direction", () => {
    const clockwise = areaFromGisRings([square(1, true)]);
    const counterClockwise = areaFromGisRings([square(1, false)]);
    expect(clockwise).toBeGreaterThan(0);
    expect(counterClockwise).toBeCloseTo(clockwise, 10);
  });

  it("does not assume every ring after the first is a hole", () => {
    const one = areaFromGisRings([square(1, true)]);
    const twoParts = areaFromGisRings([square(1, true), square(1, true)]);
    expect(twoParts).toBeCloseTo(one * 2, 10);
  });

  it("subtracts a hole when its winding direction is opposite", () => {
    const outer = areaFromGisRings([square(10, true)]);
    const withHole = areaFromGisRings([square(10, true), square(4, false)]);
    expect(withHole).toBeCloseTo(outer - areaFromGisRings([square(4, true)]), 10);
  });

  it("prefers geometry over Shape__Area when valid rings exist", () => {
    const result = resolveGisAreaSqm({
      rings: [square(10, true)],
      attributes: { Shape__Area: 1 },
    });
    expect(result.source).toBe("geometry");
    expect(result.sqm).toBeGreaterThan(1);
  });

  it("falls back to Shape__Area when geometry is unavailable", () => {
    expect(resolveGisAreaSqm({ attributes: { Shape__Area: 123.45 } })).toEqual({
      source: "shape_area",
      sqm: 123.45,
    });
    expect(areaFromPlotAttributes({ Shape__Area: 123.45 }).isValid).toBe(true);
  });
});
