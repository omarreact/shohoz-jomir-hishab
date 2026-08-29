import { applyRadd } from "./radd";
import { determinePrescribedShares } from "./prescribed-shares";
import { rational, add, equals } from "./rational";
import type { FaraezHeirsInput } from "./contracts";

const emptyHeirs = (): FaraezHeirsInput => ({
  spouse: 0, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0, father: 0, mother: 0,
  paternalGrandFather: 0, paternalGrandMother: 0, maternalGrandMother: 0,
  fullBrothers: 0, fullSisters: 0, consanguineBrothers: 0, consanguineSisters: 0,
  uterineBrothers: 0, uterineSisters: 0, fullBrotherSon: 0, consBrotherSon: 0,
  fullBrotherSonSon: 0, consBrotherSonSon: 0, fullPaternalUncle: 0, consPaternalUncle: 0,
  fullCousin: 0, consCousin: 0, fullCousinSon: 0, consCousinSon: 0,
  fullCousinSonSon: 0, consCousinSonSon: 0,
});

const sum = (values: readonly { totalShare: ReturnType<typeof rational> }[]) =>
  values.reduce((total, value) => add(total, value.totalShare), rational(0n));

describe("Faraez Radd", () => {
  it("redistributes the remainder among non-spouse fixed heirs", () => {
    const heirs = { ...emptyHeirs(), mother: 1, daughters: 1 };
    const prescribed = determinePrescribedShares(heirs, "female");
    const adjusted = applyRadd(heirs, "female", prescribed);

    expect(equals(adjusted.find((x) => x.heirType === "মাতা")!.totalShare, rational(1n, 4n))).toBe(true);
    expect(equals(adjusted.find((x) => x.heirType === "কন্যা")!.totalShare, rational(3n, 4n))).toBe(true);
    expect(equals(sum(adjusted), rational(1n))).toBe(true);
  });

  it("keeps the spouse fixed while returning the remainder to other heirs", () => {
    const heirs = { ...emptyHeirs(), spouse: 1, mother: 1 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const adjusted = applyRadd(heirs, "male", prescribed);

    expect(equals(adjusted.find((x) => x.heirType === "স্ত্রী")!.totalShare, rational(1n, 4n))).toBe(true);
    expect(equals(adjusted.find((x) => x.heirType === "মাতা")!.totalShare, rational(3n, 4n))).toBe(true);
    expect(equals(sum(adjusted), rational(1n))).toBe(true);
  });

  it("gives the whole estate to the sole spouse in the legacy no-other-fixed-heir case", () => {
    const heirs = { ...emptyHeirs(), spouse: 1 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const adjusted = applyRadd(heirs, "male", prescribed);

    expect(adjusted).toHaveLength(1);
    expect(equals(adjusted[0].totalShare, rational(1n))).toBe(true);
  });
});
