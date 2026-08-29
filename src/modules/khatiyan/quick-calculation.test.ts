import { calculateQuickKhatiyan, ownerShareToTil, totalOwnerTil } from "./quick-calculation";

describe("Khatiyan quick calculation", () => {
  const identity = (value: string | number) => Number(value);

  it("uses the canonical mixed-radix share conversion", () => {
    const owner = { a: 8, g: 0, k: 0, kr: 0, ti: 0 };
    expect(ownerShareToTil(owner)).toBe(38400);
    expect(totalOwnerTil([owner, { a: 4, g: 0, k: 0, kr: 0, ti: 0 }])).toBe(57600);
  });

  it("preserves the existing quick calculation formula", () => {
    const result = calculateQuickKhatiyan(
      { totalLand: "100", a: 8, g: 0, k: 0, kr: 0, ti: 0 },
      identity,
    );

    expect(result).toEqual({ land: 50, sqft: 21780, katha: 50 / 1.65 });
  });

  it("returns null for non-positive land or share", () => {
    expect(calculateQuickKhatiyan({ totalLand: "0", a: 8, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
    expect(calculateQuickKhatiyan({ totalLand: "100", a: 0, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
  });
});
