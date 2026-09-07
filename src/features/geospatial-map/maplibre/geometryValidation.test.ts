import { isValidPolygonRings } from "./geometryValidation";

describe("cadastral polygon topology validation", () => {
  it("accepts a closed non-degenerate parcel ring", () => {
    expect(
      isValidPolygonRings([[
        [90, 23],
        [90.001, 23],
        [90.001, 23.001],
        [90, 23.001],
        [90, 23],
      ]]),
    ).toBe(true);
  });

  it("rejects an open ring", () => {
    expect(
      isValidPolygonRings([[
        [90, 23],
        [90.001, 23],
        [90.001, 23.001],
        [90, 23.001],
      ]]),
    ).toBe(false);
  });

  it("rejects a self-intersecting bow-tie parcel", () => {
    expect(
      isValidPolygonRings([[
        [90, 23],
        [90.001, 23.001],
        [90, 23.001],
        [90.001, 23],
        [90, 23],
      ]]),
    ).toBe(false);
  });
});
