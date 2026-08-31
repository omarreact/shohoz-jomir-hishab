import { allocatePlotArea, allocationsConserved } from "./area-allocation";
import { TIL_PER_FULL_UNIT_BIGINT } from "./share-normalization";

const full = { a: 16, g: 0, k: 0, kr: 0, ti: 0 };
const half = { a: 8, g: 0, k: 0, kr: 0, ti: 0 };
const quarter = { a: 4, g: 0, k: 0, kr: 0, ti: 0 };
const threeQuarter = { a: 12, g: 0, k: 0, kr: 0, ti: 0 };

describe("Khatiyan area allocation", () => {
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
    const oneThird = { a: 5, g: 6, k: 2, kr: 6, ti: 0 };
    const twoThirds = { a: 10, g: 10, k: 0, kr: 0, ti: 0 };
    const allocations = allocatePlotArea(100, [oneThird, twoThirds]);
    expect(allocations.reduce((s, x) => s + x.allocatedArea, 0)).toBe(100);
    expect(allocations.reduce((s, x) => s + x.allocatedAreaScaled, 0n)).toBe(100_000_000n);
    expect(allocationsConserved(100, allocations)).toBe(true);
  });

  it("rejects shares that do not total 16 ana", () => {
    expect(() => allocatePlotArea(100, [half])).toThrow(/16 আনা/);
  });

  it("rejects invalid areas", () => {
    expect(() => allocatePlotArea(-1, [full])).toThrow();
    expect(() => allocatePlotArea(Number.NaN, [full])).toThrow();
  });
});
