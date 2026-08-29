import type {
  FaraezAdjustment,
  FaraezHeirShare,
  FaraezInput,
  FaraezResult,
} from "./contracts";
import { determineEligibility } from "./eligibility";
import { determinePrescribedShares } from "./prescribed-shares";
import { applyFaraezAdjustments } from "./adjustments";
import { validateConservation } from "./conservation";
import { faraezFractionsToKhatiyan } from "./measurement-adapter";

/**
 * The single public domain facade for the currently supported Sunni Faraez
 * ruleset. It intentionally contains no React, Next.js, routing, or UI logic.
 *
 * Pipeline:
 * Eligibility → prescribed shares → Awl/residual/Radd → exact conservation
 * → collective Khatiyan measurement adaptation.
 */
export function calculateFaraez(input: FaraezInput): FaraezResult {
  assertSupportedInput(input);

  const eligibility = determineEligibility(input.heirs);
  const prescribedShares = determinePrescribedShares(
    input.heirs,
    input.deceasedGender,
    eligibility,
  );

  const allocations = applyFaraezAdjustments(
    input.heirs,
    input.deceasedGender,
    prescribedShares,
    eligibility,
  );

  const conservation = validateConservation(allocations);
  const measurementAllocations = faraezFractionsToKhatiyan(
    allocations.flatMap((allocation) =>
      Array.from({ length: allocation.count }, () => allocation.fraction),
    ),
  );

  const adjustments = inferAdjustments(prescribedShares, allocations);

  return {
    ruleset: input.ruleset,
    eligibleHeirs: eligibility.heirs,
    prescribedShares,
    adjustments,
    allocations,
    measurementAllocations,
    conservation,
  };
}

function assertSupportedInput(input: FaraezInput): void {
  if (input.ruleset !== "existing-sunni-project-rules") {
    throw new RangeError("Unsupported Faraez ruleset");
  }
  if (input.religion !== "muslim") {
    throw new RangeError("The hardened Faraez engine currently supports the existing Sunni Muslim ruleset only");
  }

  const heirValues = Object.values(input.heirs);
  if (heirValues.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new RangeError("Heir counts must be non-negative integers");
  }

  const estateValues = Object.values(input.estate);
  if (estateValues.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Estate values and deductions must be finite non-negative numbers");
  }
}

function inferAdjustments(
  prescribedShares: readonly { totalShare: { numerator: bigint; denominator: bigint } }[],
  allocations: readonly FaraezHeirShare[],
): readonly FaraezAdjustment[] {
  const prescribedTotal = prescribedShares.reduce(
    (sum, share) => sum + share.totalShare.numerator * (1n),
    0n,
  );
  const prescribedDenominator = prescribedShares.length === 0
    ? 1n
    : prescribedShares[0].totalShare.denominator;
  const finalTotal = allocations.length === 0
    ? 0n
    : allocations.reduce((sum, share) => sum + share.totalShare.numerator, 0n);

  if (prescribedShares.length === 0) {
    return [{ kind: "none", reasoning: "কোনো নির্দিষ্ট অংশ নির্ধারিত হয়নি; অবশিষ্টভোগী/রদ স্তর সিদ্ধান্ত নিয়েছে।" }];
  }

  const prescribedIsOver = prescribedTotal > prescribedDenominator;
  const prescribedIsUnder = prescribedTotal < prescribedDenominator;
  if (prescribedIsOver) return [{ kind: "awl", reasoning: "নির্দিষ্ট অংশের যোগফল ১-এর বেশি হওয়ায় আউল প্রয়োগ হয়েছে।" }];
  if (prescribedIsUnder && finalTotal > prescribedTotal) {
    const hasResidual = allocations.some((allocation) =>
      !prescribedShares.some((share) => share.heirType === allocation.heirType),
    );
    return [{
      kind: hasResidual ? "residual" : "radd",
      reasoning: hasResidual
        ? "নির্দিষ্ট অংশের পর অবশিষ্ট অংশ আসাবাদের মধ্যে বণ্টিত হয়েছে।"
        : "আসাবা না থাকায় অবশিষ্ট অংশ রদ নীতিতে পুনর্বণ্টিত হয়েছে।",
    }];
  }
  return [{ kind: "none", reasoning: "কোনো অতিরিক্ত সমন্বয় প্রয়োজন হয়নি।" }];
}
