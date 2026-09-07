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

const item = (result: ReturnType<typeof determineEligibility>, type: string) =>
  result.heirs.find((heir) => heir.heirType === type);

describe("Faraez eligibility", () => {
  test("son blocks full and consanguine siblings and sons are Asabah", () => {
    const result = determineEligibility(heirs({ sons: 1, fullBrothers: 1, fullSisters: 1, consanguineBrothers: 1, consanguineSisters: 1 }));
    expect(item(result, "পুত্র")).toMatchObject({ eligible: true, asabah: true });
    expect(item(result, "সহোদর ভাই")).toMatchObject({ eligible: true, asabah: false });
    expect(item(result, "সহোদর বোন")).toMatchObject({ eligible: false });
    expect(item(result, "সৎ ভাই (বৈমাত্রেয়)")).toMatchObject({ eligible: false });
    expect(item(result, "সৎ বোন (বৈমাত্রেয়)")).toMatchObject({ eligible: false });
  });

  test("father blocks paternal grandfather", () => {
    const result = determineEligibility(heirs({ father: 1, paternalGrandFather: 1 }));
    expect(item(result, "পিতা")).toMatchObject({ eligible: true, asabah: true });
    expect(item(result, "দাদা")).toMatchObject({ eligible: false });
  });

  test("mother blocks both grandmothers", () => {
    const result = determineEligibility(heirs({ mother: 1, paternalGrandMother: 1, maternalGrandMother: 1 }));
    expect(item(result, "মাতা")).toMatchObject({ eligible: true });
    expect(item(result, "দাদি")).toMatchObject({ eligible: false });
    expect(item(result, "নানি")).toMatchObject({ eligible: false });
  });

  test("full brother blocks consanguine siblings when no senior blocker exists", () => {
    const result = determineEligibility(heirs({ fullBrothers: 1, consanguineBrothers: 1, consanguineSisters: 1 }));
    expect(item(result, "সহোদর ভাই")).toMatchObject({ eligible: true, asabah: true });
    expect(item(result, "সৎ ভাই (বৈমাত্রেয়)")).toMatchObject({ eligible: false });
    expect(item(result, "সৎ বোন (বৈমাত্রেয়)")).toMatchObject({ eligible: false });
  });

  test("one full sister remains eligible for her prescribed-share state", () => {
    const result = determineEligibility(heirs({ fullSisters: 1 }));
    expect(item(result, "সহোদর বোন")).toMatchObject({ eligible: true, asabah: false });
  });

  test("dead-son/dead-daughter counters do not themselves create living-descendant eligibility", () => {
    const result = determineEligibility(heirs({ deadSons: 2, deadDaughters: 2, fullSisters: 1 }));
    expect(item(result, "সহোদর বোন")).toMatchObject({ eligible: true });
    expect(result.asabahHeirTypes).toEqual([]);
  });
});
