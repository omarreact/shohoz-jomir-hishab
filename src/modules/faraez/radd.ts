import { add, divide, multiply, rational, subtract, type Rational } from "./rational";
import type { FaraezHeirsInput, FaraezPrescribedShare } from "./contracts";

const ZERO = rational(0n);

function sum(shares: readonly FaraezPrescribedShare[]): Rational {
  return shares.reduce((total, share) => add(total, share.totalShare), ZERO);
}

function spouseLabel(gender: "male" | "female"): string {
  return gender === "male" ? "স্ত্রী" : "স্বামী";
}

/**
 * Apply the Radd policy represented by the legacy implementation.
 *
 * Spouse shares are excluded from the returned pool. The non-spouse fixed-share
 * heirs receive the remainder proportionally. If the spouse is the only fixed
 * heir, the legacy implementation gives that spouse the whole estate.
 */
export function applyRadd(
  input: FaraezHeirsInput,
  gender: "male" | "female",
  shares: readonly FaraezPrescribedShare[],
): readonly FaraezPrescribedShare[] {
  const fixedTotal = sum(shares);
  if (fixedTotal.numerator >= fixedTotal.denominator) return shares;

  const spouse = shares.filter((share) => share.heirType === spouseLabel(gender));
  const eligible = shares.filter((share) => share.heirType !== spouseLabel(gender));
  const remainder = subtract(rational(1n), fixedTotal);

  if (eligible.length === 0) {
    if (spouse.length !== 1 || input.spouse <= 0) return shares;
    return shares.map((share) => {
      if (share.heirType !== spouseLabel(gender)) return share;
      const totalShare = rational(1n);
      return {
        ...share,
        sharePerHeir: divide(totalShare, rational(BigInt(share.count))),
        totalShare,
        reasoning: `${share.reasoning} (রদ প্রয়োগে অবশিষ্ট অংশও যোগ হয়েছে; বর্তমান প্রকল্পের নিয়ম)।`,
      };
    });
  }

  const spouseTotal = spouse.reduce((total, share) => add(total, share.totalShare), ZERO);
  const nonSpouseTotal = eligible.reduce((total, share) => add(total, share.totalShare), ZERO);
  const targetNonSpouse = subtract(rational(1n), spouseTotal);

  return shares.map((share) => {
    if (share.heirType === spouseLabel(gender)) return share;

    const adjustedTotal = multiply(targetNonSpouse, divide(share.totalShare, nonSpouseTotal));
    return {
      ...share,
      sharePerHeir: divide(adjustedTotal, rational(BigInt(share.count))),
      totalShare: adjustedTotal,
      reasoning: `${share.reasoning} (রদ প্রয়োগে অবশিষ্ট অংশ অনুপাতে পুনর্বণ্টন হয়েছে; বর্তমান প্রকল্পের নিয়ম)।`,
    };
  });
}
