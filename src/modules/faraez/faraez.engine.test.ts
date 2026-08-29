import { calculateFaraez } from "./faraez.engine";
import { rational } from "./rational";
import { shareToTil, TIL_PER_FULL_UNIT } from "@/src/modules/khatiyan/share-normalization";
import type { FaraezInput } from "./contracts";

const heirs = {
  spouse: 1,
  sons: 2,
  deadSons: 0,
  daughters: 1,
  deadDaughters: 0,
  father: 1,
  mother: 1,
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
} as const;

const input: FaraezInput = {
  religion: "muslim",
  deceasedGender: "male",
  heirs,
  estate: {
    land: 16,
    gold: 0,
    cash: 0,
    funeralCost: 0,
    debt: 0,
    wasiyat: 0,
  },
  ruleset: "existing-sunni-project-rules",
};

describe("calculateFaraez facade", () => {
  it("runs the complete pipeline and conserves the canonical Khatiyan estate", () => {
    const result = calculateFaraez(input);

    expect(result.conservation.exact).toBe(true);
    expect(result.conservation.allocated).toEqual(rational(1n));
    expect(result.prescribedShares.map((share) => [share.heirType, share.totalShare])).toEqual([
      ["স্বামী/স্ত্রী", rational(1n, 8n)],
      ["মাতা", rational(1n, 6n)],
      ["পিতা", rational(1n, 6n)],
    ]);

    // 1/8 + 1/6 + 1/6 = 11/24; the 13/24 residual is split 2:1
    // between two sons and one daughter, giving 13/60 per son and 13/120
    // to the daughter.
    expect(result.allocations.map((share) => [share.heirType, share.totalShare])).toEqual([
      ["স্বামী/স্ত্রী", rational(1n, 8n)],
      ["মাতা", rational(1n, 6n)],
      ["পিতা", rational(1n, 6n)],
      ["পুত্র", rational(13n, 60n)],
      ["কন্যা", rational(13n, 120n)],
    ]);

    const tilCounts = result.measurementAllocations.map((measurement) =>
      shareToTil({
        a: Number(measurement.ana),
        g: Number(measurement.gonda),
        k: Number(measurement.kora),
        kr: Number(measurement.kranti),
        ti: Number(measurement.til),
      }),
    );

    // Two sons are expanded to two individual measurement entries.
    expect(result.measurementAllocations).toHaveLength(6);
    expect(tilCounts).toEqual([9600, 12800, 12800, 16640, 16640, 8320]);
    expect(tilCounts.reduce((sum, value) => sum + value, 0)).toBe(TIL_PER_FULL_UNIT);
  });

  it("rejects unsupported Hindu input instead of silently applying Sunni rules", () => {
    expect(() => calculateFaraez({ ...input, religion: "hindu" })).toThrow(/Sunni Muslim/);
  });

  it("rejects invalid heir counts at the domain boundary", () => {
    expect(() => calculateFaraez({
      ...input,
      heirs: { ...heirs, sons: -1 },
    })).toThrow(/non-negative integers/);
  });
});
