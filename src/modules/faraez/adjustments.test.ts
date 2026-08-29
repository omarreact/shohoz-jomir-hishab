import { applyFaraezAdjustments } from "./adjustments";
import { determinePrescribedShares } from "./prescribed-shares";
import { validateConservation } from "./conservation";
import { rational, equals } from "./rational";
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

describe("Faraez adjustment orchestration", () => {
  it("selects Awl when prescribed shares exceed one", () => {
    const heirs = { ...emptyHeirs(), spouse: 1, father: 1, mother: 1, daughters: 2 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const result = applyFaraezAdjustments(heirs, "male", prescribed);
    expect(equals(result.find((x) => x.heirType === "কন্যা")!.totalShare, rational(16n, 25n))).toBe(true);
    expect(() => validateConservation(result)).not.toThrow();
  });

  it("selects residual inheritance when an Asabah exists", () => {
    const heirs = { ...emptyHeirs(), spouse: 1, sons: 1, daughters: 1 };
    const prescribed = determinePrescribedShares(heirs, "male");
    const result = applyFaraezAdjustments(heirs, "male", prescribed);
    expect(() => validateConservation(result)).not.toThrow();
  });

  it("selects Radd when no residuary exists", () => {
    const heirs = { ...emptyHeirs(), mother: 1, daughters: 1 };
    const prescribed = determinePrescribedShares(heirs, "female");
    const result = applyFaraezAdjustments(heirs, "female", prescribed);
    expect(equals(result.find((x) => x.heirType === "মাতা")!.totalShare, rational(1n, 4n))).toBe(true);
    expect(() => validateConservation(result)).not.toThrow();
  });
});
