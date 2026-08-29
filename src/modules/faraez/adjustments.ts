import { add, rational } from "./rational";
import { applyAwl } from "./awl";
import { allocateResidual } from "./residuary";
import { applyRadd } from "./radd";
import type { EligibilityResult, FaraezHeirShare, FaraezHeirsInput, FaraezPrescribedShare } from "./contracts";

function prescribedAsAllocations(shares: readonly FaraezPrescribedShare[]): FaraezHeirShare[] {
  return shares.map((share) => ({
    heirType: share.heirType,
    count: share.count,
    fraction: share.sharePerHeir,
    totalShare: share.totalShare,
    reasoning: share.reasoning,
  }));
}

function totalPrescribed(shares: readonly FaraezPrescribedShare[]) {
  return shares.reduce((total, share) => add(total, share.totalShare), rational(0n));
}

/**
 * Orchestrate the three mutually exclusive adjustment paths:
 * Awl when fixed shares exceed one; residual inheritance when an Asabah exists;
 * otherwise Radd according to the legacy spouse policy.
 */
export function applyFaraezAdjustments(
  input: FaraezHeirsInput,
  gender: "male" | "female",
  prescribed: readonly FaraezPrescribedShare[],
  eligibility?: EligibilityResult,
): readonly FaraezHeirShare[] {
  const fixedTotal = totalPrescribed(prescribed);

  if (fixedTotal.numerator > fixedTotal.denominator) {
    return prescribedAsAllocations(applyAwl(prescribed));
  }

  if (fixedTotal.numerator === fixedTotal.denominator) {
    return prescribedAsAllocations(prescribed);
  }

  const residual = allocateResidual(input, prescribed, eligibility);
  if (residual.length > 0) {
    return [...prescribedAsAllocations(prescribed), ...residual];
  }

  return prescribedAsAllocations(applyRadd(input, gender, prescribed));
}
