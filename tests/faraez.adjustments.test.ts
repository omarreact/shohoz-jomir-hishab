import { applySunniAdjustments } from "@/src/modules/faraez/sunni-adjustments";
import type { DeceasedGender, HeirResult, HeirsInput } from "@/src/modules/faraez/types";

const emptyHeirs = (): HeirsInput => ({
  spouse: 0, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0, father: 0, mother: 0,
  paternalGrandFather: 0, paternalGrandMother: 0, maternalGrandMother: 0,
  fullBrothers: 0, fullSisters: 0, consanguineBrothers: 0, consanguineSisters: 0,
  uterineBrothers: 0, uterineSisters: 0, fullBrotherSon: 0, consBrotherSon: 0,
  fullBrotherSonSon: 0, consBrotherSonSon: 0, fullPaternalUncle: 0, consPaternalUncle: 0,
  fullCousin: 0, consCousin: 0, fullCousinSon: 0, consCousinSon: 0,
  fullCousinSonSon: 0, consCousinSonSon: 0,
});

const result = (heirType: string, count: number, totalShare: number): HeirResult => ({
  heirType,
  count,
  fraction: totalShare / count,
  totalShare,
  reasoning: "test",
  assets: { land: 0, gold: 0, cash: 100, total: 100 },
});

describe("Sunni Faraez Awl/Radd adjustments", () => {
  it("applies Awl to wife + father + mother + two daughters", () => {
    const heirs = { ...emptyHeirs(), spouse: 1, father: 1, mother: 1, daughters: 2 };
    const results = [
      result("স্ত্রী", 1, 1 / 8),
      result("পিতা", 1, 1 / 6),
      result("মাতা", 1, 1 / 6),
      result("কন্যা", 2, 13 / 24),
    ];

    const adjusted = applySunniAdjustments(heirs, "male" as DeceasedGender, results);
    const byName = Object.fromEntries(adjusted.map((r) => [r.heirType, r.totalShare]));

    expect(byName["স্ত্রী"]).toBeCloseTo(3 / 27);
    expect(byName["পিতা"]).toBeCloseTo(4 / 27);
    expect(byName["মাতা"]).toBeCloseTo(4 / 27);
    expect(byName["কন্যা"]).toBeCloseTo(16 / 27);
    expect(Object.values(byName).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("applies Radd to mother + daughter when there is no residuary", () => {
    const heirs = { ...emptyHeirs(), mother: 1, daughters: 1 };
    const results = [result("মাতা", 1, 1 / 6), result("কন্যা", 1, 1 / 2)];

    const adjusted = applySunniAdjustments(heirs, "female" as DeceasedGender, results);
    const byName = Object.fromEntries(adjusted.map((r) => [r.heirType, r.totalShare]));

    expect(byName["মাতা"]).toBeCloseTo(1 / 4);
    expect(byName["কন্যা"]).toBeCloseTo(3 / 4);
  });
});
