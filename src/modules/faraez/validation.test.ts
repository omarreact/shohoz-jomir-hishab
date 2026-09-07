import { validateMuslimFaraezInput } from "./validation";
import type { AssetsInput, HeirsInput } from "./types";

const heirs: HeirsInput = {
  spouse: 1, sons: 1, deadSons: 0, daughters: 1, deadDaughters: 0,
  father: 1, mother: 1, paternalGrandFather: 0, paternalGrandMother: 0,
  maternalGrandMother: 0, fullBrothers: 0, fullSisters: 0,
  consanguineBrothers: 0, consanguineSisters: 0, uterineBrothers: 0, uterineSisters: 0,
  fullBrotherSon: 0, consBrotherSon: 0, fullBrotherSonSon: 0, consBrotherSonSon: 0,
  fullPaternalUncle: 0, consPaternalUncle: 0, fullCousin: 0, consCousin: 0,
  fullCousinSon: 0, consCousinSon: 0, fullCousinSonSon: 0, consCousinSonSon: 0,
};

const assets: AssetsInput = {
  land: 10, gold: 5, cash: 100000, funeralCost: 1000, debt: 2000, wasiyat: 1000,
};

describe("Muslim Faraez input validation", () => {
  it("accepts a valid cash-funded estate settlement", () => {
    expect(validateMuslimFaraezInput(heirs, assets)).toEqual([]);
  });

  it("rejects negative asset values", () => {
    expect(validateMuslimFaraezInput(heirs, { ...assets, cash: -1 }).some(e => e.includes("cash"))).toBe(true);
  });

  it("rejects fractional heir counts", () => {
    expect(validateMuslimFaraezInput({ ...heirs, sons: 1.5 }, assets).some(e => e.includes("sons"))).toBe(true);
  });

  it("rejects predeceased-child cases until descendant input exists", () => {
    expect(validateMuslimFaraezInput({ ...heirs, deadSons: 1 }, assets).some(e => e.includes("Predeceased"))).toBe(true);
  });

  it("rejects funeral and debt greater than represented cash", () => {
    expect(validateMuslimFaraezInput(heirs, { ...assets, cash: 100, funeralCost: 80, debt: 50 }).some(e => e.includes("exceed the represented cash estate"))).toBe(true);
  });

  it("rejects wasiyat above one third of cash after funeral and debt", () => {
    expect(validateMuslimFaraezInput(heirs, { ...assets, cash: 900, funeralCost: 0, debt: 0, wasiyat: 301 }).some(e => e.includes("one third"))).toBe(true);
  });
});
