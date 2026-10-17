import { calculateQuickKhatiyan, ownerShareToTil, totalOwnerTil } from "./quick-calculation";
import { KHATIYAN_RECORD_STANDARD } from "./standards";

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

  it("computes half of 100 শতাংশ using the khatiyan record standard", () => {
    const result = calculateQuickKhatiyan(
      { totalLand: "100", a: 8, g: 0, k: 0, kr: 0, ti: 0 },
      identity,
    );

    const expectedLand = 50;
    const expectedSqft = expectedLand * KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal;
    const expectedKatha = expectedSqft / KHATIYAN_RECORD_STANDARD.squareFeetPerKatha;

    expect(result).toEqual({ land: expectedLand, sqft: expectedSqft, katha: expectedKatha });
  });

  it("accepts Bengali digits exactly as the UI stores them", () => {
    const result = calculateQuickKhatiyan(
      { totalLand: "১০০", a: 8, g: 0, k: 0, kr: 0, ti: 0 },
      identity,
    );

    expect(result?.land).toBe(50);
    expect(result?.sqft).toBe(21600);
  });

  it("accepts Bengali fractional decimal input", () => {
    const result = calculateQuickKhatiyan(
      { totalLand: "১২.৫", a: 8, g: 0, k: 0, kr: 0, ti: 0 },
      identity,
    );

    expect(result?.land).toBe(6.25);
    expect(result?.sqft).toBe(2700);
  });

  it("rejects pathological exponent and excessive input magnitude without BigInt explosions", () => {
    const inputs = ["1e1000000000", "1e99", "1e-9999999", "999999999999", "9".repeat(200), "Infinity"];
    for (const totalLand of inputs) {
      expect(calculateQuickKhatiyan(
        { totalLand, a: 8, g: 0, k: 0, kr: 0, ti: 0 }, identity,
      )).toBeNull();
    }
  });

  it("accepts practical scientific notation within the supported range", () => {
    const result = calculateQuickKhatiyan(
      { totalLand: "1e2", a: 8, g: 0, k: 0, kr: 0, ti: 0 }, identity,
    );
    expect(result?.land).toBe(50);
  });

  it("returns null for non-positive land, zero share, or invalid share", () => {
    expect(calculateQuickKhatiyan({ totalLand: "0", a: 8, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
    expect(calculateQuickKhatiyan({ totalLand: "100", a: 0, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
    expect(calculateQuickKhatiyan({ totalLand: "100", a: 0.5, g: 0, k: 0, kr: 0, ti: 0 }, identity)).toBeNull();
  });
});
