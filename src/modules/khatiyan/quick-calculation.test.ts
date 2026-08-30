import { calculateQuickKhatiyan, ownerShareToTil, totalOwnerTil } from "./quick-calculation";

describe("Khatiyan quick calculation", () => {
  const identity = (value: string | number) => Number(value);

  it("uses exact Til conversion for canonical shares", () => {
    const owner = { a: 8, g: 0, k: 0, kr: 0, ti: 0 };
    expect(ownerShareToTil(owner)).toBe(38400);
    expect(totalOwnerTil([owner, { a: 4, g: 0, k: 0, kr: 0, ti: 0 }])).toBe(57600);
  });

  it("rejects non-canonical mixed-radix inputs", () => {
    // গন্ডা must be < 20; fractional আনা is not a ledger share unit
    expect(() => ownerShareToTil({ a: 0, g: 20, k: 0, kr: 0, ti: 0 })).toThrow();
    expect(() => ownerShareToTil({ a: 0.5, g: 0, k: 0, kr: 0, ti: 0 })).toThrow();
  });

  it("computes half of 100 শতাংশ as 50 via scaled bigint allocation", () => {
    const result = calculateQuickKhatiyan(
      { totalLand: "100", a: 8, g: 0, k: 0, kr: 0, ti: 0 },
      identity,
    );

    expect(result).toEqual({ land: 50, sqft: 21780, katha: 50 / 1.65 });
  });

  it("returns null for non-positive land, zero share, or invalid share", () => {
    expect(calculateQuickKhatiyan({ totalLand: "0", a: 8, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
    expect(calculateQuickKhatiyan({ totalLand: "100", a: 0, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
    expect(calculateQuickKhatiyan({ totalLand: "100", a: 0.5, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
  });
});
