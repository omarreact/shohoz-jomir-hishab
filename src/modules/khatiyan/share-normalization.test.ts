import {
  ANA_PER_FULL_UNIT,
  GONDA_PER_ANA,
  KORA_PER_GONDA,
  KRANTI_PER_KORA,
  TIL_PER_KRANTI,
  TIL_PER_ANA,
  TIL_PER_FULL_UNIT,
  normalizeShare,
  shareFraction,
  shareToTil,
  shareToTilExact,
  sharesConserved,
  tilToShare,
  tilToShareExact,
} from "./share-normalization";

describe("Khatiyan mixed-radix share normalization", () => {
  it("round-trips every unit boundary canonically", () => {
    const samples = [0, 1, TIL_PER_KRANTI, TIL_PER_KRANTI * KRANTI_PER_KORA, TIL_PER_KRANTI * KRANTI_PER_KORA * KORA_PER_GONDA, TIL_PER_ANA, TIL_PER_ANA + 1, TIL_PER_FULL_UNIT - 1, TIL_PER_FULL_UNIT];
    for (const til of samples) {
      const share = tilToShare(til);
      expect(shareToTil(share)).toBe(til);
      expect(normalizeShare(share)).toEqual(share);
    }
  });

  it("uses bigint for the authoritative Til conversion", () => {
    expect(shareToTilExact({ a: 16, g: 0, k: 0, kr: 0, ti: 0 })).toBe(BigInt(TIL_PER_FULL_UNIT));
    expect(typeof shareToTilExact({ a: 1, g: 0, k: 0, kr: 0, ti: 0 })).toBe("bigint");
    expect(tilToShareExact(BigInt(TIL_PER_FULL_UNIT))).toEqual({ a: 16, g: 0, k: 0, kr: 0, ti: 0 });
  });

  it("represents exactly 16 ana and rejects anything above it", () => {
    expect(tilToShare(TIL_PER_FULL_UNIT)).toEqual({ a: ANA_PER_FULL_UNIT, g: 0, k: 0, kr: 0, ti: 0 });
    expect(() => tilToShare(TIL_PER_FULL_UNIT + 1)).toThrow();
  });

  it("rejects non-canonical sub-unit overflow instead of silently carrying it", () => {
    expect(() => shareToTil({ a: 1, g: GONDA_PER_ANA, k: 0, kr: 0, ti: 0 })).toThrow();
    expect(() => shareToTil({ a: 1, g: 0, k: KORA_PER_GONDA, kr: 0, ti: 0 })).toThrow();
    expect(() => shareToTil({ a: 1, g: 0, k: 0, kr: KRANTI_PER_KORA, ti: 0 })).toThrow();
    expect(() => shareToTil({ a: 1, g: 0, k: 0, kr: 0, ti: TIL_PER_KRANTI })).toThrow();
  });

  it("keeps ownership shares conserved in exact til units", () => {
    const shares = [
      { a: 8, g: 0, k: 0, kr: 0, ti: 0 },
      { a: 4, g: 10, k: 0, kr: 0, ti: 0 },
      { a: 3, g: 10, k: 0, kr: 0, ti: 0 },
      { a: 0, g: 0, k: 0, kr: 0, ti: 0 },
    ];
    expect(sharesConserved(shares)).toBe(true);
  });

  it("returns a compatibility decimal fraction at the UI boundary", () => {
    expect(shareFraction({ a: 8, g: 0, k: 0, kr: 0, ti: 0 })).toBe(0.5);
    expect(shareFraction({ a: 16, g: 0, k: 0, kr: 0, ti: 0 })).toBe(1);
  });

  it("rejects fractional, negative and non-finite values", () => {
    expect(() => shareToTil({ a: 1.5, g: 0, k: 0, kr: 0, ti: 0 })).toThrow();
    expect(() => shareToTil({ a: -1, g: 0, k: 0, kr: 0, ti: 0 })).toThrow();
    expect(() => shareToTil({ a: Number.NaN, g: 0, k: 0, kr: 0, ti: 0 })).toThrow();
  });
});
