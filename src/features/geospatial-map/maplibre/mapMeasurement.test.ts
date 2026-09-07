import {
  closeRing,
  measurementAreaSquareMeters,
  measurementFeatureCollection,
  polylineDistanceMeters,
  rectangleRing,
  summarizeMeasurement,
} from "./mapMeasurement";

describe("map measurement engine", () => {
  it("closes polygon rings without duplicating an already-closed endpoint", () => {
    expect(closeRing([[90, 23], [90.001, 23], [90.001, 23.001]])).toHaveLength(4);
    expect(closeRing([[90, 23], [90.001, 23], [90, 23]])).toHaveLength(3);
  });

  it("creates an axis-aligned rectangle from two corners", () => {
    expect(rectangleRing([90, 23], [91, 24])).toEqual([
      [90, 23],
      [91, 23],
      [91, 24],
      [90, 24],
      [90, 23],
    ]);
  });

  it("measures a one-degree equatorial line at roughly 111 km", () => {
    const distance = polylineDistanceMeters([[0, 0], [1, 0]]);
    expect(distance).toBeGreaterThan(111_000);
    expect(distance).toBeLessThan(112_000);
  });

  it("computes polygon area and Bangladesh land-unit conversions", () => {
    const points: Array<[number, number]> = [
      [90.4, 23.8],
      [90.401, 23.8],
      [90.401, 23.801],
      [90.4, 23.801],
    ];
    const area = measurementAreaSquareMeters("polygon", points);
    const summary = summarizeMeasurement("polygon", points);
    expect(area).toBeGreaterThan(9_000);
    expect(summary.area.isValid).toBe(true);
    expect(summary.area.shotok).toBeGreaterThan(0);
    expect(summary.area.katha).toBeGreaterThan(0);
  });

  it("keeps drawing geometry separate from cadastral map sources", () => {
    const collection = measurementFeatureCollection("distance", [[90.4, 23.8], [90.401, 23.801]]);
    expect(collection.features.some((feature) => feature.geometry.type === "LineString")).toBe(true);
    expect(collection.features.filter((feature) => feature.geometry.type === "Point")).toHaveLength(2);
  });
});
