import { validateConservation, FaraezConservationError, sumAllocations } from "./conservation";
import { rational, equals } from "./rational";
import type { FaraezHeirShare } from "./contracts";

const allocation = (heirType: string, totalShare: ReturnType<typeof rational>): FaraezHeirShare => ({
  heirType,
  count: 1,
  fraction: totalShare,
  totalShare,
  reasoning: "test",
});

describe("Faraez conservation invariant", () => {
  it("accepts exact 1/1 allocation", () => {
    const shares = [allocation("কন্যা", rational(1n, 2n)), allocation("মাতা", rational(1n, 2n))];
    const result = validateConservation(shares);
    expect(result.exact).toBe(true);
    expect(equals(result.allocated, rational(1n))).toBe(true);
  });

  it("sums rational allocations without floating-point tolerance", () => {
    const total = sumAllocations([
      allocation("A", rational(1n, 3n)),
      allocation("B", rational(1n, 6n)),
      allocation("C", rational(1n, 2n)),
    ]);
    expect(equals(total, rational(1n))).toBe(true);
  });

  it("throws a fatal domain error for under-allocation", () => {
    expect(() => validateConservation([allocation("কন্যা", rational(1n, 2n))])).toThrow(FaraezConservationError);
  });

  it("throws for over-allocation", () => {
    expect(() => validateConservation([allocation("A", rational(3n, 4n)), allocation("B", rational(1n, 2n))])).toThrow(FaraezConservationError);
  });
});
