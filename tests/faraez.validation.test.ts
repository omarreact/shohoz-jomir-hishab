import { calculateMuslimFaraez } from "@/src/modules/faraez/muslim-law";
import { validateMuslimFaraezInput } from "@/src/modules/faraez/validation";
import type { AssetsInput, HeirsInput } from "@/src/modules/faraez/types";

const heirs: HeirsInput = {
  spouse: 1,
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
};

const assets: AssetsInput = {
  land: 0,
  gold: 0,
  cash: 100000,
  funeralCost: 0,
  debt: 0,
  wasiyat: 0,
};

describe("Muslim Faraez input safety", () => {
  it("rejects negative asset values", () => {
    expect(validateMuslimFaraezInput(heirs, { ...assets, cash: -1 })).toContain(
      "Asset cash cannot be negative",
    );
  });

  it("rejects a bequest above one third of the estate", () => {
    expect(validateMuslimFaraezInput(heirs, { ...assets, wasiyat: 33334 })).toContain(
      "Wasiyat cannot exceed one third of the estate after funeral cost and debt",
    );
  });

  it("rejects fractional or negative heir counts", () => {
    expect(
      validateMuslimFaraezInput({ ...heirs, sons: 1.5 }, assets),
    ).toContain("Heir count sons must be a non-negative integer");
    expect(
      validateMuslimFaraezInput({ ...heirs, daughters: -1 }, assets),
    ).toContain("Heir count daughters must be a non-negative integer");
  });

  it("does not create NaN or Infinity in a normal spouse-only case", () => {
    const result = calculateMuslimFaraez(heirs, "male", assets);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((item) => {
      expect(Number.isFinite(item.fraction)).toBe(true);
      expect(Number.isFinite(item.totalShare)).toBe(true);
      expect(Number.isFinite(item.assets.cash)).toBe(true);
    });
  });
});
