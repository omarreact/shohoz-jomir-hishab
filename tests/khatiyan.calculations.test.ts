import { ANA_PER_FULL_UNIT, GONDA_PER_ANA, KHATIYAN_UNIT_TIL, KORA_PER_GONDA, KRANTI_PER_KORA, TIL_PER_ANA, TIL_PER_KRANTI, buildDetailedResults, validateKhatiyanInputs } from "@/src/modules/khatiyan/calculations";
import type { KhatiyanOwner, KhatiyanPlot } from "@/src/shared/types";

const toEn = (value: string | number) => Number(value);
const toBn = (value: string | number) => String(value);
const owner = (overrides: Partial<KhatiyanOwner> = {}): KhatiyanOwner => ({ id: 1, n: "Test Owner", rType: "পিতা", rName: "Test Father", a: 1, g: 0, k: 0, kr: 0, ti: 0, ...overrides });
const plot = (overrides: Partial<KhatiyanPlot> = {}): KhatiyanPlot => ({ id: 1, cs: "1", rs: "2", city: "3", bds: "4", t: "কৃষি", a: "100", ...overrides });

describe("Khatiyan calculations", () => {
  it("uses the documented hierarchical share units", () => {
    expect(TIL_PER_ANA).toBe(20 * 3 * 4 * 20);
    expect(KHATIYAN_UNIT_TIL).toBe(TIL_PER_ANA * ANA_PER_FULL_UNIT);
    expect(GONDA_PER_ANA).toBe(20);
    expect(KORA_PER_GONDA).toBe(4);
    expect(KRANTI_PER_KORA).toBe(3);
    expect(TIL_PER_KRANTI).toBe(20);
  });

  it("calculates an owner's proportional land correctly", () => {
    const result = buildDetailedResults([owner({ a: 8 })], [plot({ a: "100" })], KHATIYAN_UNIT_TIL, toEn, toBn);
    expect(result.hasData).toBe(true);
    expect(result.computedResults[0].totalLand).toBeCloseTo(50, 10);
    expect(result.computedResults[0].ownerPlots[0].gotArea).toBeCloseTo(50, 10);
  });

  it("conserves total area when owner shares total one", () => {
    const result = buildDetailedResults([owner({ id: 1, n: "A", a: 8 }), owner({ id: 2, n: "B", a: 8 })], [plot({ a: "100" })], KHATIYAN_UNIT_TIL, toEn, toBn);
    const total = result.computedResults.reduce((sum, item) => sum + item.totalLand, 0);
    expect(total).toBeCloseTo(100, 10);
  });

  it("rejects owner shares whose combined total exceeds 16 ana", () => {
    const errors = validateKhatiyanInputs([owner({ a: 10 }), owner({ a: 7 })], [plot()], KHATIYAN_UNIT_TIL);
    expect(errors).toContain("Total owner shares exceed the full Khatiyan unit");
  });

  it("accepts exactly one full 16-আনা share", () => {
    expect(validateKhatiyanInputs([owner({ a: 16 })], [plot()], KHATIYAN_UNIT_TIL)).toEqual([]);
  });

  it("supports valid sub-unit boundary values", () => {
    expect(validateKhatiyanInputs([owner({ a: 0, g: 19, k: 3, kr: 2, ti: 19 })], [plot()], KHATIYAN_UNIT_TIL)).toEqual([]);
  });

  it("rejects a full 16-আনা share with lower-order units", () => {
    expect(validateKhatiyanInputs([owner({ a: 16, ti: 1 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 share exceeds the full unit");
  });

  it("rejects negative shares and out-of-range units", () => {
    expect(validateKhatiyanInputs([owner({ a: -1 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 contains a negative share value");
    expect(validateKhatiyanInputs([owner({ g: 20 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 গন্ডা exceeds its traditional range");
    expect(validateKhatiyanInputs([owner({ k: 4 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 কড়া exceeds its traditional range");
    expect(validateKhatiyanInputs([owner({ kr: 3 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 ক্রান্তি exceeds its traditional range");
    expect(validateKhatiyanInputs([owner({ ti: 20 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 তিল exceeds its traditional range");
  });

  it("rejects non-integer shares and invalid plot areas", () => {
    expect(validateKhatiyanInputs([owner({ g: 1.5 })], [plot()], KHATIYAN_UNIT_TIL)).toContain("Owner 1 গন্ডা must be a whole number");
    expect(validateKhatiyanInputs([owner()], [plot({ a: "0" })], KHATIYAN_UNIT_TIL)).toContain("Plot 1 must have a positive finite area");
    expect(validateKhatiyanInputs([owner()], [plot({ a: "not-a-number" })], KHATIYAN_UNIT_TIL)).toContain("Plot 1 must have a positive finite area");
  });

  it("conserves area across multiple plots", () => {
    const result = buildDetailedResults([owner({ a: 8 }), owner({ id: 2, n: "B", a: 8 })], [plot({ id: 1, a: "33.33" }), plot({ id: 2, a: "66.67" })], KHATIYAN_UNIT_TIL, toEn, toBn);
    const allocated = result.computedResults.reduce((sum, item) => sum + item.totalLand, 0);
    expect(allocated).toBeCloseTo(100, 10);
  });
});