import {
  faraezFractionToKhatiyan,
  faraezFractionsToKhatiyan,
} from "./measurement-adapter";
import { rational } from "./rational";
import { shareToTil, TIL_PER_FULL_UNIT } from "@/src/modules/khatiyan/share-normalization";

describe("Faraez → Khatiyan measurement adapter", () => {
  it("converts 1/3 exactly in the canonical mixed-radix grid", () => {
    const result = faraezFractionToKhatiyan(rational(1n, 3n));

    // 16×20×4×3×20 = 76,800 Tils; 1/3 = 25,600 Tils.
    // Canonical mixed-radix form: 5 আনা, 6 গন্ডা, 2 কড়া, 2 ক্রান্তি, 0 তিল.
    expect(result).toMatchObject({
      ana: 5n,
      gonda: 6n,
      kora: 2n,
      kranti: 2n,
      til: 0n,
    });
    expect(shareToTil({
      a: Number(result.ana),
      g: Number(result.gonda),
      k: Number(result.kora),
      kr: Number(result.kranti),
      ti: Number(result.til),
    })).toBe(25600);
  });

  it("converts 1/6 and 2/3 exactly", () => {
    expect(faraezFractionToKhatiyan(rational(1n, 6n))).toMatchObject({
      ana: 2n,
      gonda: 13n,
      kora: 1n,
      kranti: 1n,
      til: 0n,
    });
    expect(faraezFractionToKhatiyan(rational(2n, 3n))).toMatchObject({
      ana: 10n,
      gonda: 13n,
      kora: 1n,
      kranti: 1n,
      til: 0n,
    });
  });

  it("does not reject a non-terminating single fraction such as 1/7", () => {
    expect(() => faraezFractionToKhatiyan(rational(1n, 7n))).not.toThrow();

    const result = faraezFractionToKhatiyan(rational(1n, 7n));
    const til = shareToTil({
      a: Number(result.ana),
      g: Number(result.gonda),
      k: Number(result.kora),
      kr: Number(result.kranti),
      ti: Number(result.til),
    });

    // 76,800 / 7 = 10,971 + 3/7, so nearest-Til rounding gives 10,971.
    expect(til).toBe(10971);
  });

  it("rounds seven 1/7 shares collectively with Largest Remainder and conserves the estate", () => {
    const results = faraezFractionsToKhatiyan(
      Array.from({ length: 7 }, () => rational(1n, 7n)),
    );

    const tilCounts = results.map((result) =>
      shareToTil({
        a: Number(result.ana),
        g: Number(result.gonda),
        k: Number(result.kora),
        kr: Number(result.kranti),
        ti: Number(result.til),
      }),
    );

    expect(results).toHaveLength(7);
    expect(tilCounts.reduce((sum, value) => sum + value, 0)).toBe(TIL_PER_FULL_UNIT);
    expect(tilCounts.filter((value) => value === 10972)).toHaveLength(3);
    expect(tilCounts.filter((value) => value === 10971)).toHaveLength(4);
  });

  it("rejects negative and greater-than-one fractions", () => {
    expect(() => faraezFractionToKhatiyan(rational(-1n, 2n))).toThrow(/negative/);
    expect(() => faraezFractionToKhatiyan(rational(3n, 2n))).toThrow(/exceed 1\/1/);
  });

  it("rejects collective fractions that do not conserve the full estate", () => {
    expect(() => faraezFractionsToKhatiyan([rational(1n, 2n)])).toThrow(/sum exactly to 1\/1/);
  });
});
