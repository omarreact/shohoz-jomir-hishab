import { applyAwl } from "./awl";
import { rational, equals } from "./rational";
import type { FaraezPrescribedShare } from "./contracts";

const share = (heirType: string, count: number, totalShare: ReturnType<typeof rational>): FaraezPrescribedShare => ({
  heirType,
  count,
  sharePerHeir: rational(totalShare.numerator, totalShare.denominator * BigInt(count)),
  totalShare,
  reasoning: "test",
});

describe("Faraez Awl", () => {
  it("proportionally reduces a fixed-share total above one", () => {
    const adjusted = applyAwl([
      share("স্ত্রী", 1, rational(1n, 8n)),
      share("পিতা", 1, rational(1n, 6n)),
      share("মাতা", 1, rational(1n, 6n)),
      share("কন্যা", 2, rational(2n, 3n)),
    ]);

    expect(equals(adjusted[0].totalShare, rational(3n, 25n))).toBe(true);
    expect(equals(adjusted[1].totalShare, rational(4n, 25n))).toBe(true);
    expect(equals(adjusted[2].totalShare, rational(4n, 25n))).toBe(true);
    expect(equals(adjusted[3].totalShare, rational(16n, 25n))).toBe(true);
  });

  it("leaves a valid fixed-share set unchanged", () => {
    const input = [share("কন্যা", 1, rational(1n, 2n))];
    expect(applyAwl(input)).toEqual(input);
  });
});
