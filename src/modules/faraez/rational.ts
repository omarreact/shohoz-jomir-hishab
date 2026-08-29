/**
 * Exact immutable rational arithmetic for the Faraez domain.
 *
 * Fractions are represented by bigint numerator/denominator pairs and are
 * normalized after every operation. No floating-point arithmetic is used.
 */

export interface Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

function assertInteger(value: bigint): void {
  if (typeof value !== "bigint") {
    throw new TypeError("Rational components must be bigint values");
  }
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

/** Reduce a rational and force the denominator to be positive. */
export function normalize(numerator: bigint, denominator: bigint): Rational {
  assertInteger(numerator);
  assertInteger(denominator);

  if (denominator === 0n) {
    throw new RangeError("Rational denominator cannot be zero");
  }

  if (numerator === 0n) {
    return Object.freeze({ numerator: 0n, denominator: 1n });
  }

  const sign = denominator < 0n ? -1n : 1n;
  const n = numerator * sign;
  const d = denominator * sign;
  const divisor = gcd(n, d);

  return Object.freeze({
    numerator: n / divisor,
    denominator: d / divisor,
  });
}

export function rational(numerator: bigint, denominator: bigint = 1n): Rational {
  return normalize(numerator, denominator);
}

export const ZERO = rational(0n);
export const ONE = rational(1n);

export function add(a: Rational, b: Rational): Rational {
  return normalize(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function subtract(a: Rational, b: Rational): Rational {
  return normalize(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function multiply(a: Rational, b: Rational): Rational {
  return normalize(a.numerator * b.numerator, a.denominator * b.denominator);
}

export function divide(a: Rational, b: Rational): Rational {
  if (b.numerator === 0n) {
    throw new RangeError("Cannot divide by a zero rational");
  }

  return normalize(a.numerator * b.denominator, a.denominator * b.numerator);
}

export function equals(a: Rational, b: Rational): boolean {
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const left = a.numerator * b.denominator;
  const right = b.numerator * a.denominator;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function isZero(value: Rational): boolean {
  return value.numerator === 0n;
}
