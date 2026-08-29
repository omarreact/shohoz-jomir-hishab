import type { DeceasedGender, Religion } from "./types";
import type { Rational } from "./rational";

/**
 * Estate deduction policy for the hardened Faraez domain.
 *
 * Funeral expenses and enforceable debts are deducted from the gross estate
 * before inheritance shares are calculated. When an estate contains multiple
 * represented asset classes, the existing estate-preparation policy is the
 * source of truth: deductions are allocated proportionally across those asset
 * classes rather than silently treating one asset class as the universal source.
 * Wasiyat is a separate post-deduction constraint and remains limited by the
 * currently supported one-third rule in the existing implementation.
 */
export const FaraezDeductionPolicy = {
  funeralAndDebt: "proportional-across-represented-assets",
  wasiyat: "maximum-one-third-of-net-estate",
} as const;

export type FaraezDeductionPolicyName =
  (typeof FaraezDeductionPolicy)[keyof typeof FaraezDeductionPolicy];

export interface FaraezEstateInput {
  /** Asset quantities retain their existing project units. */
  readonly land: number;
  readonly gold: number;
  readonly cash: number;
  readonly funeralCost: number;
  readonly debt: number;
  readonly wasiyat: number;
}

export interface FaraezHeirsInput {
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

export interface FaraezInput {
  readonly religion: Religion;
  readonly deceasedGender: DeceasedGender;
  readonly heirs: FaraezHeirsInput;
  readonly estate: FaraezEstateInput;
  /** Explicit ruleset identifier prevents silent mixing of legal models. */
  readonly ruleset: "existing-sunni-project-rules";
}

export interface FaraezHeirShare {
  readonly heirType: string;
  readonly count: number;
  readonly fraction: Rational;
  readonly totalShare: Rational;
  readonly reasoning: string;
}

export interface FaraezEligibility {
  readonly heirType: string;
  readonly count: number;
  readonly eligible: boolean;
  readonly reason?: string;
}

export interface FaraezPrescribedShare {
  readonly heirType: string;
  readonly count: number;
  readonly sharePerHeir: Rational;
  readonly totalShare: Rational;
  readonly reasoning: string;
}

export type FaraezAdjustmentKind = "none" | "awl" | "radd" | "residual";

export interface FaraezAdjustment {
  readonly kind: FaraezAdjustmentKind;
  readonly factor?: Rational;
  readonly remainder?: Rational;
  readonly reasoning: string;
}

export interface FaraezConservation {
  readonly allocated: Rational;
  readonly expected: Rational;
  readonly exact: boolean;
}

export interface FaraezResult {
  readonly ruleset: FaraezInput["ruleset"];
  readonly eligibleHeirs: readonly FaraezEligibility[];
  readonly prescribedShares: readonly FaraezPrescribedShare[];
  readonly adjustments: readonly FaraezAdjustment[];
  readonly allocations: readonly FaraezHeirShare[];
  readonly conservation: FaraezConservation;
}

/**
 * Measurement remains an adapter concern. Faraez itself only returns exact
 * fractions, so the Ana/Gonda/Kora/Kranti/Til system can be applied later
 * without introducing fractional floating-point arithmetic into inheritance.
 */
export interface FaraezMeasurementAdapterResult {
  readonly fraction: Rational;
  readonly ana: bigint;
  readonly gonda: bigint;
  readonly kora: bigint;
  readonly kranti: bigint;
  readonly til: bigint;
}
