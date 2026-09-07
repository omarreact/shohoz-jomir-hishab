import { normalize, type Rational } from "@/src/modules/faraez/rational";
import { bigintReplacer, bigintReviver, parseStorage, stringifyStorage, writeCalculationStorage } from "@/src/shared/lib/storage";

describe("bigint-safe calculation storage", () => {
  it("preserves a Rational 1/3 through stringify/parse", () => {
    const value: Rational = normalize(1n, 3n);
    const roundTripped = parseStorage<{ value: Rational }>(stringifyStorage({ value }));
    expect(roundTripped.value.numerator).toBe(1n);
    expect(roundTripped.value.denominator).toBe(3n);
    expect(typeof roundTripped.value.numerator).toBe("bigint");
    expect(typeof roundTripped.value.denominator).toBe("bigint");
  });

  it("uses a collision-safe bigint marker and restores legacy values", () => {
    expect(JSON.stringify({ value: 12345678901234567890n }, bigintReplacer)).toBe(
      '{"value":{"__landbd_bigint__":"12345678901234567890"}}',
    );
    expect(JSON.parse('{"value":{"__landbd_bigint__":"-7"}}', bigintReviver).value).toBe(-7n);
    expect(JSON.parse('{"value":"-7n"}', bigintReviver).value).toBe(-7n);
  });

  it("does not convert ordinary strings that resemble legacy bigint values when using current encoding", () => {
    const input = { text: "123n", number: 123, flag: true, empty: null };
    expect(parseStorage<typeof input>(stringifyStorage(input))).toEqual(input);
  });

  it("fails safely during SSR when localStorage is unavailable", () => {
    expect(writeCalculationStorage({
      version: 1,
      activeDraftId: "khatiyan-test",
      drafts: {},
      history: [],
    })).toBe(false);
  });

  it("fails safely when localStorage rejects writes", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          setItem: () => {
            throw new Error("Quota exceeded");
          },
        },
      },
    });

    try {
      expect(writeCalculationStorage({
        version: 1,
        activeDraftId: "khatiyan-test",
        drafts: {},
        history: [],
      })).toBe(false);
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", originalWindow);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });
});
