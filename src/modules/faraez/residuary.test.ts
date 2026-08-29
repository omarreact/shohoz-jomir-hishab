import { allocateResidual } from "./residuary";
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

describe("Faraez residuary allocation", () => {
  it("allocates the residual to sons and daughters at 2:1", () => {
    const heirs = { ...emptyHeirs(), spouse: 1, sons: 1, daughters: 1 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const residual = allocateResidual(heirs, prescribed);
    const son = residual.find((item) => item.heirType === "পুত্র");
    const daughter = residual.find((item) => item.heirType === "কন্যা");

    expect(son && equals(son.totalShare, rational(7n, 12n))).toBe(true);
    expect(daughter && equals(daughter.totalShare, rational(7n, 24n))).toBe(true);
    expect(equals(sum([...prescribed, ...residual]), rational(1n))).toBe(true);
  });

  it("gives the residual to a father who is also a fixed-share heir", () => {
    const heirs = { ...emptyHeirs(), spouse: 1, father: 1 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const residual = allocateResidual(heirs, prescribed);
    const fatherResidual = residual.find((item) => item.heirType === "পিতা");

    expect(fatherResidual && equals(fatherResidual.totalShare, rational(7n, 12n))).toBe(true);
    expect(equals(sum([...prescribed, ...residual]), rational(1n))).toBe(true);
  });

  it("uses the legacy agnatic chain when closer residuaries are absent", () => {
    const heirs = { ...emptyHeirs(), mother: 1, fullBrotherSon: 1, fullPaternalUncle: 1 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const residual = allocateResidual(heirs, prescribed);

    expect(residual).toHaveLength(1);
    expect(residual[0].heirType).toBe("সহোদর ভাইয়ের পুত্র");
    expect(equals(residual[0].totalShare, rational(2n, 3n))).toBe(true);
  });
});
