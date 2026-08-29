import { determinePrescribedShares } from "./prescribed-shares";
import { equals, rational } from "./rational";
import { determineEligibility } from "./eligibility";
import type { FaraezHeirsInput } from "./contracts";

const heirs = (overrides: Partial<FaraezHeirsInput> = {}): FaraezHeirsInput => ({
  spouse: 0, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0,
  father: 0, mother: 0, paternalGrandFather: 0, paternalGrandMother: 0,
  maternalGrandMother: 0, fullBrothers: 0, fullSisters: 0,
  consanguineBrothers: 0, consanguineSisters: 0, uterineBrothers: 0, uterineSisters: 0,
  fullBrotherSon: 0, consBrotherSon: 0, fullBrotherSonSon: 0, consBrotherSonSon: 0,
  fullPaternalUncle: 0, consPaternalUncle: 0, fullCousin: 0, consCousin: 0,
  fullCousinSon: 0, consCousinSon: 0, fullCousinSonSon: 0, consCousinSonSon: 0,
  ...overrides,
});

const share = (input: FaraezHeirsInput, gender: "male" | "female", type: string) =>
  determinePrescribedShares(input, gender).find((item) => item.heirType === type);

describe("Faraez prescribed shares", () => {
  test("wife receives 1/8 with descendants and 1/4 without", () => {
    expect(equals(share(heirs({ spouse: 1, sons: 1 }), "male", "স্বামী/স্ত্রী")!.sharePerHeir, rational(1n, 8n))).toBe(true);
    expect(equals(share(heirs({ spouse: 1 }), "male", "স্বামী/স্ত্রী")!.sharePerHeir, rational(1n, 4n))).toBe(true);
  });

  test("husband receives 1/4 with descendants and 1/2 without", () => {
    expect(equals(share(heirs({ spouse: 1, daughters: 1 }), "female", "স্বামী/স্ত্রী")!.sharePerHeir, rational(1n, 4n))).toBe(true);
    expect(equals(share(heirs({ spouse: 1 }), "female", "স্বামী/স্ত্রী")!.sharePerHeir, rational(1n, 2n))).toBe(true);
  });

  test("mother receives 1/6 with descendants or at least two siblings, otherwise 1/3", () => {
    expect(equals(share(heirs({ mother: 1, daughters: 1 }), "male", "মাতা")!.sharePerHeir, rational(1n, 6n))).toBe(true);
    expect(equals(share(heirs({ mother: 1, fullBrothers: 2 }), "male", "মাতা")!.sharePerHeir, rational(1n, 6n))).toBe(true);
    expect(equals(share(heirs({ mother: 1 }), "male", "মাতা")!.sharePerHeir, rational(1n, 3n))).toBe(true);
  });

  test("father and grandfather each receive the existing fixed 1/6 rule", () => {
    expect(equals(share(heirs({ father: 1 }), "male", "পিতা")!.sharePerHeir, rational(1n, 6n))).toBe(true);
    expect(equals(share(heirs({ paternalGrandFather: 1 }), "male", "দাদা")!.sharePerHeir, rational(1n, 6n))).toBe(true);
  });

  test("one daughter gets 1/2 and multiple daughters share 2/3 exactly", () => {
    expect(equals(share(heirs({ daughters: 1 }), "male", "কন্যা")!.totalShare, rational(1n, 2n))).toBe(true);
    expect(equals(share(heirs({ daughters: 2 }), "male", "কন্যা")!.totalShare, rational(2n, 3n))).toBe(true);
    expect(equals(share(heirs({ daughters: 2 }), "male", "কন্যা")!.sharePerHeir, rational(1n, 3n))).toBe(true);
  });

  test("uterine siblings share 1/6 when one exists and 1/3 collectively when multiple exist", () => {
    expect(equals(share(heirs({ uterineBrothers: 1 }), "male", "সৎ ভাই (বৈপিত্রেয়)")!.totalShare, rational(1n, 6n))).toBe(true);
    expect(equals(share(heirs({ uterineBrothers: 1, uterineSisters: 1 }), "male", "সৎ ভাই (বৈপিত্রেয়)")!.totalShare, rational(1n, 6n))).toBe(true);
    expect(equals(share(heirs({ uterineBrothers: 1, uterineSisters: 1 }), "male", "সৎ বোন (বৈপিত্রেয়)")!.totalShare, rational(1n, 6n))).toBe(true);
  });

  test("one full sister gets 1/2 and multiple full sisters share 2/3", () => {
    expect(equals(share(heirs({ fullSisters: 1 }), "male", "সহোদর বোন")!.totalShare, rational(1n, 2n))).toBe(true);
    expect(equals(share(heirs({ fullSisters: 2 }), "male", "সহোদর বোন")!.totalShare, rational(2n, 3n))).toBe(true);
  });

  test("consanguine sister gets 1/6 beside one full sister, otherwise 1/2 or 2/3", () => {
    expect(equals(share(heirs({ fullSisters: 1, consanguineSisters: 1 }), "male", "সৎ বোন (বৈমাত্রেয়)")!.totalShare, rational(1n, 6n))).toBe(true);
    expect(equals(share(heirs({ consanguineSisters: 1 }), "male", "সৎ বোন (বৈমাত্রেয়)")!.totalShare, rational(1n, 2n))).toBe(true);
    expect(equals(share(heirs({ consanguineSisters: 2 }), "male", "সৎ বোন (বৈমাত্রেয়)")!.totalShare, rational(2n, 3n))).toBe(true);
  });

  test("blocked heirs receive no prescribed-share record", () => {
    const input = heirs({ sons: 1, fullSisters: 1, uterineBrothers: 1 });
    const eligibility = determineEligibility(input);
    const result = determinePrescribedShares(input, "male", eligibility);
    expect(result.some((item) => item.heirType === "সহোদর বোন")).toBe(false);
    expect(result.some((item) => item.heirType === "সৎ ভাই (বৈপিত্রেয়)")).toBe(false);
  });
});
