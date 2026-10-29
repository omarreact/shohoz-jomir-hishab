import { allocatePlotArea, allocationsConserved } from "./area-allocation";
import { TIL_PER_FULL_UNIT_BIGINT } from "./share-normalization";

const full = { a: 16, g: 0, k: 0, kr: 0, ti: 0 };
const half = { a: 8, g: 0, k: 0, kr: 0, ti: 0 };
const quarter = { a: 4, g: 0, k: 0, kr: 0, ti: 0 };
const threeQuarter = { a: 12, g: 0, k: 0, kr: 0, ti: 0 };

describe("Khatiyan area allocation", () => {
  it.each([
    [0.25, 250_000n],
    [0.00125, 1_250n],
    [0.000001, 1n],
    [0.0000004, 0n],
    [0.0000005, 1n],
    [1.2345675, 1_234_568n],
    [1e21, 10n ** 27n],
  ])("preserves the six-decimal plot scale for %s", (area, expectedScaled) => {
    const [allocation] = allocatePlotArea(area, [full]);
    expect(allocation.allocatedAreaScaled).toBe(expectedScaled);
  });

  it("splits fractional plots without inflating the recorded area", () => {
    const allocations = allocatePlotArea(0.25, [half, half]);
    expect(allocations.map((row) => row.allocatedArea)).toEqual([0.125, 0.125]);
    expect(allocationsConserved(0.25, allocations)).toBe(true);
  });

  it("checks conservation against the supplied plot area for full and partial ownership", () => {
    for (const shares of [[full], [half]]) {
      const allocations = allocatePlotArea(100, shares);
      expect(allocationsConserved(100, allocations)).toBe(true);
      expect(allocationsConserved(200, allocations)).toBe(false);
    }
  });

  it("conserves a plot split 50/50", () => {
    const allocations = allocatePlotArea(100, [half, half]);
    expect(allocations.map((x) => x.allocatedArea)).toEqual([50, 50]);
    expect(allocationsConserved(100, allocations)).toBe(true);
  });

  it("keeps the canonical ownership share as bigint Tils", () => {
    const allocations = allocatePlotArea(100, [half, half]);
    expect(allocations.map((x) => x.shareTil)).toEqual([38400n, 38400n]);
    expect(allocations.reduce((sum, x) => sum + x.shareTil, 0n)).toBe(TIL_PER_FULL_UNIT_BIGINT);
    expect(allocations.every((x) => typeof x.allocatedAreaScaled === "bigint")).toBe(true);
  });

  it("conserves fractional shares without losing rounded area", () => {
    const allocations = allocatePlotArea(101, [quarter, threeQuarter]);
    expect(allocations.reduce((s, x) => s + x.allocatedArea, 0)).toBe(101);
    expect(allocations.reduce((s, x) => s + x.allocatedAreaScaled, 0n)).toBe(101_000_000n);
    expect(allocationsConserved(101, allocations)).toBe(true);
  });

  it("uses largest remainder for a repeating fraction", () => {
    const oneThird = { a: 5, g: 6, k: 2, kr: 2, ti: 0 };
    const twoThirds = { a: 10, g: 13, k: 1, kr: 1, ti: 0 };
    const allocations = allocatePlotArea(100, [oneThird, twoThirds]);
    expect(allocations.reduce((s, x) => s + x.allocatedArea, 0)).toBe(100);
    expect(allocations.reduce((s, x) => s + x.allocatedAreaScaled, 0n)).toBe(100_000_000n);
    expect(allocationsConserved(100, allocations)).toBe(true);
  });

  it("allocates only the represented ownership portion when shares total less than 16 ana", () => {
    const allocations = allocatePlotArea(100, [half]);
    expect(allocations.map((x) => x.allocatedArea)).toEqual([50]);
    expect(allocationsConserved(100, allocations)).toBe(true);
  });

  it("rejects invalid areas", () => {
    expect(() => allocatePlotArea(-1, [full])).toThrow();
    expect(() => allocatePlotArea(Number.NaN, [full])).toThrow();
  });
});
