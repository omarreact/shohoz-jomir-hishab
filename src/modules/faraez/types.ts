export type Religion = "muslim" | "hindu";
export type DeceasedGender = "male" | "female";

export interface AssetsInput {
  land: number;
  gold: number;
  cash: number;
  funeralCost: number;
  debt: number;
  wasiyat: number;
}

export interface HeirsInput {
  readonly spouse: number;
  readonly sons: number;
  readonly deadSons: number;
  readonly daughters: number;
  readonly deadDaughters: number;
  readonly father: number;
  readonly mother: number;
  readonly paternalGrandFather: number;
  readonly paternalGrandMother: number;
  readonly maternalGrandMother: number;
  readonly fullBrothers: number;
  readonly fullSisters: number;
  readonly consanguineBrothers: number;
  readonly consanguineSisters: number;
  readonly uterineBrothers: number;
  readonly uterineSisters: number;
  readonly fullBrotherSon: number;
  readonly consBrotherSon: number;
  readonly fullBrotherSonSon: number;
  readonly consBrotherSonSon: number;
  readonly fullPaternalUncle: number;
  readonly consPaternalUncle: number;
  readonly fullCousin: number;
  readonly consCousin: number;
  readonly fullCousinSon: number;
  readonly consCousinSon: number;
  readonly fullCousinSonSon: number;
  readonly consCousinSonSon: number;
}

export interface KhatiyanMeasurement {
  readonly ana: bigint;
  readonly gonda: bigint;
  readonly kora: bigint;
  readonly kranti: bigint;
  readonly til: bigint;
}

export interface HeirResult {
  heirType: string;
  count: number;
  fraction: number;
  totalShare: number;
  reasoning: string;
  assets: { land: number; gold: number; cash: number };
  /** One exact F7 measurement per individual heir in this group. */
  measurements?: readonly KhatiyanMeasurement[];
}
