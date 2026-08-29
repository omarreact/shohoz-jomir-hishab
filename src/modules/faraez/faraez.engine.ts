import type {
  FaraezAdjustment,
  FaraezHeirShare,
  FaraezInput,
  FaraezResult,
} from "./contracts";
import { add, rational } from "./rational";
import { determineEligibility } from "./eligibility";
import { determinePrescribedShares } from "./prescribed-shares";
import { applyFaraezAdjustments } from "./adjustments";
import { validateConservation } from "./conservation";
import { faraezFractionsToKhatiyan } from "./measurement-adapter";

/**
 * The single public domain facade for the currently supported Sunni Faraez
 * ruleset. It contains no React, Next.js, routing, or UI logic.
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

  // Conservation is validated before any measurement rounding occurs.
  const conservation = validateConservation(allocations);

  // Expand grouped heir allocations to individual shares so Largest Remainder
  // can distribute any unavoidable Til rounding across the complete estate.
  const measurementAllocations = faraezFractionsToKhatiyan(
    allocations.flatMap((allocation) =>
      Array.from({ length: allocation.count }, () => allocation.fraction),
    ),
  );

  return {
    ruleset: input.ruleset,
    eligibleHeirs: eligibility.heirs,
    prescribedShares,
    adjustments: inferAdjustments(prescribedShares, allocations),
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
    throw new RangeError(
      "The hardened Faraez engine currently supports the existing Sunni Muslim ruleset only",
    );
  }

  if (Object.values(input.heirs).some((value) => !Number.isInteger(value) || value < 0)) {
    throw new RangeError("Heir counts must be non-negative integers");
  }
  if (Object.values(input.estate).some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Estate values and deductions must be finite non-negative numbers");
  }
}

function inferAdjustments(
  prescribedShares: FaraezResult["prescribedShares"],
  allocations: readonly FaraezHeirShare[],
): readonly FaraezAdjustment[] {
  const prescribedTotal = prescribedShares.reduce(
    (sum, share) => add(sum, share.totalShare),
    rational(0n),
  );
  const finalTotal = allocations.reduce(
    (sum, share) => add(sum, share.totalShare),
    rational(0n),
  );

  if (prescribedTotal.numerator > prescribedTotal.denominator) {
    return [{
      kind: "awl",
      factor: rational(prescribedTotal.denominator, prescribedTotal.numerator),
      reasoning: "নির্দিষ্ট অংশের যোগফল ১-এর বেশি হওয়ায় আউল প্রয়োগ হয়েছে।",
    }];
  }

  if (finalTotal.numerator === prescribedTotal.numerator && finalTotal.denominator === prescribedTotal.denominator) {
    return [{ kind: "none", reasoning: "নির্দিষ্ট অংশের পর আর কোনো সমন্বয় প্রয়োজন হয়নি।" }];
  }

  if (finalTotal.numerator > prescribedTotal.numerator) {
    const hasResidual = allocations.some(
      (allocation) => !prescribedShares.some((share) => share.heirType === allocation.heirType),
    );
    return [{
      kind: hasResidual ? "residual" : "radd",
      remainder: add(rational(1n), rational(-prescribedTotal.numerator, prescribedTotal.denominator)),
      reasoning: hasResidual
        ? "নির্দিষ্ট অংশের পর অবশিষ্ট অংশ আসাবাদের মধ্যে বণ্টিত হয়েছে।"
        : "আসাবা না থাকায় অবশিষ্ট অংশ রদ নীতিতে পুনর্বণ্টিত হয়েছে।",
    }];
  }

  return [{ kind: "none", reasoning: "কোনো অতিরিক্ত সমন্বয় প্রয়োজন হয়নি।" }];
}
