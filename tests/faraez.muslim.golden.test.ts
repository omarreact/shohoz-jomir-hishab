import { calculateMuslimFaraez } from "@/src/modules/faraez/muslim-law";
import type { AssetsInput, HeirsInput } from "@/src/modules/faraez/types";

const heirs = (overrides: Partial<HeirsInput> = {}): HeirsInput => ({
  spouse: 0,
  sons: 0,
  deadSons: 0,
  daughters: 0,
  deadDaughters: 0,
  father: 0,
  mother: 0,
  paternalGrandFather: 0,
  paternalGrandMother: 0,
  maternalGrandMother: 0,
  fullBrothers: 0,
  fullSisters: 0,
  consanguineBrothers: 0,
  consanguineSisters: 0,
  uterineBrothers: 0,
  uterineSisters: 0,
  fullBrotherSon: 0,
  consBrotherSon: 0,
  fullBrotherSonSon: 0,
  consBrotherSonSon: 0,
  fullPaternalUncle: 0,
  consPaternalUncle: 0,
  fullCousin: 0,
  consCousin: 0,
  fullCousinSon: 0,
  consCousinSon: 0,
  fullCousinSonSon: 0,
  consCousinSonSon: 0,
  ...overrides,
});

const assets = (overrides: Partial<AssetsInput> = {}): AssetsInput => ({
  land: 100,
  gold: 0,
  cash: 0,
  funeralCost: 0,
  debt: 0,
  wasiyat: 0,
  ...overrides,
});

const shareOf = (results: ReturnType<typeof calculateMuslimFaraez>, heirType: string) =>
  results.find((result) => result.heirType === heirType)?.totalShare ?? 0;

describe("Muslim Faraez golden cases", () => {
  it("assigns wife 1/8, mother 1/6 and father 1/6 when a son exists", () => {
    const result = calculateMuslimFaraez(
      heirs({ spouse: 1, sons: 2, father: 1, mother: 1 }),
      "male",
      assets(),
    );

    expect(shareOf(result, "স্ত্রী")).toBeCloseTo(1 / 8);
    expect(shareOf(result, "মাতা")).toBeCloseTo(1 / 6);
    expect(shareOf(result, "পিতা")).toBeCloseTo(1 / 6);
    expect(shareOf(result, "পুত্র")).toBeCloseTo(13 / 24);
  });

  it("assigns a husband 1/4 when the deceased leaves descendants", () => {
    const result = calculateMuslimFaraez(
      heirs({ spouse: 1, daughters: 1, mother: 1 }),
      "female",
      assets(),
    );

    expect(shareOf(result, "স্বামী")).toBeCloseTo(1 / 4);
    expect(shareOf(result, "মাতা")).toBeCloseTo(1 / 6);
    expect(shareOf(result, "কন্যা")).toBeCloseTo(7 / 12);
  });

  it("gives one daughter 1/2 when there are no sons", () => {
    const result = calculateMuslimFaraez(
      heirs({ daughters: 1 }),
      "male",
      assets(),
    );

    expect(shareOf(result, "কন্যা")).toBeCloseTo(1 / 2);
  });

  it("gives two daughters a combined 2/3 when there are no sons", () => {
    const result = calculateMuslimFaraez(
      heirs({ daughters: 2 }),
      "male",
      assets(),
    );

    expect(shareOf(result, "কন্যা")).toBeCloseTo(2 / 3);
  });

  it("splits uterine siblings equally when they are the applicable fixed-share heirs", () => {
    const result = calculateMuslimFaraez(
      heirs({ uterineBrothers: 1, uterineSisters: 1 }),
      "male",
      assets(),
    );

    expect(shareOf(result, "সৎ ভাই (বৈপিত্রেয়)")).toBeCloseTo(1 / 6);
    expect(shareOf(result, "সৎ বোন (বৈপিত্রেয়)")).toBeCloseTo(1 / 6);
  });

  it("never allocates more than the available estate across returned heirs", () => {
    const result = calculateMuslimFaraez(
      heirs({ spouse: 1, sons: 2, daughters: 1, father: 1, mother: 1 }),
      "male",
      assets(),
    );

    const total = result.reduce((sum, heir) => sum + heir.totalShare, 0);
    expect(total).toBeLessThanOrEqual(1 + 1e-10);
  });
});
