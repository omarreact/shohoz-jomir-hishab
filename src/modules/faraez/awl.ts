import { divide, multiply, rational, type Rational } from "./rational";
import type { FaraezPrescribedShare } from "./contracts";

/**
 * Apply the Awl adjustment to prescribed shares only.
 *
 * The legacy implementation proportionally reduced every fixed share when the
 * fixed-share total exceeded one. No residual or Radd logic belongs here.
 */
export function applyAwl(shares: readonly FaraezPrescribedShare[]): readonly FaraezPrescribedShare[] {
  const total = shares.reduce(
    (sum, share) => rational(
      sum.numerator * share.totalShare.denominator + share.totalShare.numerator * sum.denominator,
      sum.denominator * share.totalShare.denominator,
    ),
    rational(0n),
  );

  if (total.numerator <= total.denominator) return shares;

  const factor: Rational = divide(rational(1n), total);

  return shares.map((share) => {
    const adjustedTotal = multiply(share.totalShare, factor);
    const adjustedPerHeir = divide(adjustedTotal, rational(BigInt(share.count)));
    return {
      ...share,
      sharePerHeir: adjustedPerHeir,
      totalShare: adjustedTotal,
      reasoning: `${share.reasoning} (আউল নীতিতে অনুপাতিক সমন্বয়)।`,
    };
  });
}
