import { fromSquareFeet, isRoundTripStable, toSquareFeet, validateKaniProfile } from "./conversion-integrity";

describe("land conversion integrity", () => {
  test("preserves Ministry baseline conversions", () => {
    expect(toSquareFeet(1, "decimal")).toBeCloseTo(435.6, 10);
    expect(toSquareFeet(1, "katha")).toBeCloseTo(720, 10);
    expect(toSquareFeet(1, "bigha")).toBeCloseTo(14400, 10);
    expect(toSquareFeet(1, "acre")).toBeCloseTo(43560, 10);
  });

  test.each(["8-hat-nol", "40-shotok"] as const)("keeps %s Kani hierarchy internally consistent", (profile) => {
    expect(validateKaniProfile(profile)).toEqual({ valid: true, errors: [] });
  });

  test.each(["sqft", "sqm", "decimal", "katha", "bigha", "acre", "kani", "gonda", "kora", "kranti", "til"] as const)("round-trips %s", (unit) => {
    expect(isRoundTripStable(123.456, unit, "sqft", "8-hat-nol")).toBe(true);
    expect(isRoundTripStable(123.456, unit, "sqft", "40-shotok")).toBe(true);
  });

  test("keeps Kani profiles distinct", () => {
    expect(toSquareFeet(1, "kani", "8-hat-nol")).toBeCloseTo(17280, 8);
    expect(toSquareFeet(1, "kani", "40-shotok")).toBeCloseTo(17424, 8);
  });

  test("rejects negative and non-finite values", () => {
    expect(toSquareFeet(-1, "acre")).toBeNaN();
    expect(toSquareFeet(Number.NaN, "acre")).toBeNaN();
    expect(fromSquareFeet(-1, "decimal")).toBeNaN();
    expect(fromSquareFeet(Number.POSITIVE_INFINITY, "decimal")).toBeNaN();
  });
});
