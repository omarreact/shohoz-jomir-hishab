import {
  buildDetailedResults,
  KHATIYAN_UNIT_TIL,
  validateKhatiyanInputs,
} from "@/src/modules/khatiyan/calculations";
import type { KhatiyanOwner, KhatiyanPlot } from "@/src/shared/types";

const toEn = (value: string | number) => Number(value);
const toBn = (value: string | number) => String(value);

const owner = (overrides: Partial<KhatiyanOwner> = {}): KhatiyanOwner => ({
  id: 1,
  n: "Test Owner",
  rType: "পিতা",
  rName: "Test Father",
  a: 1,
  g: 0,
  k: 0,
  kr: 0,
  ti: 0,
  ...overrides,
});

const plot = (overrides: Partial<KhatiyanPlot> = {}): KhatiyanPlot => ({
  id: 1,
  cs: "1",
  rs: "2",
  city: "3",
  bds: "4",
  t: "কৃষি",
  a: "100",
  ...overrides,
});

describe("Khatiyan calculations", () => {
  it("uses the documented 4,800/240/60/20/1 hierarchy", () => {
    expect(KHATIYAN_UNIT_TIL).toBe(4800 * 16);
  });

  it("calculates an owner's proportional land correctly", () => {
    const result = buildDetailedResults(
      [owner({ a: 8 })],
      [plot({ a: "100" })],
      KHATIYAN_UNIT_TIL,
      toEn,
      toBn,
    );

    expect(result.hasData).toBe(true);
    expect(result.computedResults).toHaveLength(1);
    expect(result.computedResults[0].totalLand).toBeCloseTo(50, 10);
    expect(result.computedResults[0].ownerPlots[0].gotArea).toBeCloseTo(50, 10);
  });

  it("conserves total area for owners whose shares total one", () => {
    const result = buildDetailedResults(
      [owner({ id: 1, n: "A", a: 8 }), owner({ id: 2, n: "B", a: 8 })],
      [plot({ a: "100" })],
      KHATIYAN_UNIT_TIL,
      toEn,
      toBn,
    );

    const total = result.computedResults.reduce((sum, item) => sum + item.totalLand, 0);
    expect(total).toBeCloseTo(100, 10);
  });

  it("rejects negative shares and shares greater than the full unit", () => {
    expect(validateKhatiyanInputs([owner({ a: -1 })], [plot()], KHATIYAN_UNIT_TIL)).toContain(
      "Owner 1 contains a negative share value",
    );
    expect(validateKhatiyanInputs([owner({ a: 17 })], [plot()], KHATIYAN_UNIT_TIL)).toContain(
      "Owner 1 share exceeds the full unit",
    );
  });

  it("rejects non-positive or invalid plot areas", () => {
    expect(validateKhatiyanInputs([owner()], [plot({ a: "0" })], KHATIYAN_UNIT_TIL)).toContain(
      "Plot 1 must have a positive finite area",
    );
    expect(validateKhatiyanInputs([owner()], [plot({ a: "not-a-number" })], KHATIYAN_UNIT_TIL)).toContain(
      "Plot 1 must have a positive finite area",
    );
  });
});
