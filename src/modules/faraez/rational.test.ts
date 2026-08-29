import {
  ONE,
  ZERO,
  add,
  compare,
  divide,
  equals,
  multiply,
  normalize,
  rational,
  subtract,
} from "./rational";

describe("Faraez rational arithmetic", () => {
  it("reduces fractions using GCD", () => {
    expect(normalize(6n, 8n)).toEqual({ numerator: 3n, denominator: 4n });
    expect(normalize(48n, 18n)).toEqual({ numerator: 8n, denominator: 3n });
  });

  it("normalizes negative denominators", () => {
    expect(normalize(1n, -3n)).toEqual({ numerator: -1n, denominator: 3n });
    expect(normalize(-1n, -3n)).toEqual({ numerator: 1n, denominator: 3n });
  });

  it("canonicalizes every zero to 0/1", () => {
    expect(normalize(0n, 7n)).toEqual(ZERO);
    expect(normalize(0n, -99n)).toEqual(ZERO);
  });

  it("rejects zero denominators", () => {
    expect(() => normalize(1n, 0n)).toThrow(RangeError);
    expect(() => rational(5n, 0n)).toThrow(RangeError);
  });

  it("adds 1/3 and 2/3 exactly to 1/1", () => {
    const result = add(rational(1n, 3n), rational(2n, 3n));
    expect(result).toEqual(ONE);
    expect(equals(result, rational(1n, 1n))).toBe(true);
  });

  it("subtracts without floating-point error", () => {
    expect(subtract(rational(5n, 6n), rational(1n, 3n))).toEqual(
      rational(1n, 2n),
    );
  });

  it("multiplies and reduces the result", () => {
    expect(multiply(rational(2n, 3n), rational(9n, 10n))).toEqual(
      rational(3n, 5n),
    );
  });

  it("divides exactly", () => {
    expect(divide(rational(1n, 3n), rational(2n, 3n))).toEqual(
      rational(1n, 2n),
    );
  });

  it("rejects division by zero", () => {
    expect(() => divide(ONE, ZERO)).toThrow(RangeError);
  });

  it("compares exact rational values", () => {
    expect(compare(rational(1n, 2n), rational(2n, 4n))).toBe(0);
    expect(compare(rational(1n, 3n), rational(1n, 2n))).toBe(-1);
    expect(compare(rational(3n, 4n), rational(2n, 3n))).toBe(1);
  });

  it("keeps arithmetic immutable", () => {
    const a = rational(1n, 3n);
    const b = rational(1n, 6n);
    const result = add(a, b);

    expect(a).toEqual({ numerator: 1n, denominator: 3n });
    expect(b).toEqual({ numerator: 1n, denominator: 6n });
    expect(result).toEqual(rational(1n, 2n));
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
