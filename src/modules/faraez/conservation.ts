import { add, equals, rational, type Rational } from "./rational";
import type { FaraezHeirShare, FaraezConservation } from "./contracts";

export class FaraezConservationError extends Error {
  constructor(public readonly allocated: Rational) {
    super(`Faraez conservation invariant failed: allocated ${allocated.numerator}/${allocated.denominator}, expected 1/1`);
    this.name = "FaraezConservationError";
  }
}

/** Sum final total shares and require exact equality with one whole estate. */
export function validateConservation(shares: readonly FaraezHeirShare[]): FaraezConservation {
  const allocated = shares.reduce((total, share) => add(total, share.totalShare), rational(0n));
  const expected = rational(1n);
  const exact = equals(allocated, expected);
  if (!exact) throw new FaraezConservationError(allocated);
  return { allocated, expected, exact };
}

export function sumAllocations(shares: readonly FaraezHeirShare[]): Rational {
  return shares.reduce((total, share) => add(total, share.totalShare), rational(0n));
}
