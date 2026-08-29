import { faraezFractionToKhatiyan } from "./measurement-adapter";
import { rational } from "./rational";

describe("Faraez → Khatiyan measurement adapter", () => {
  it("converts exactly representable fractions to mixed-radix units", () => {
    expect(faraezFractionToKhatiyan(rational(1n, 2n))).toMatchObject({
      ana: 8n,
      gonda: 0n,
      kora: 0n,
      kranti: 0n,
      til: 0n,
    });

    expect(faraezFractionToKhatiyan(rational(1n, 16n))).toMatchObject({
      ana: 1n,
      gonda: 0n,
      kora: 0n,
      kranti: 0n,
      til: 0n,
    });
  });

  it("rejects a fraction that cannot be represented exactly by the Til grid", () => {
    expect(() => faraezFractionToKhatiyan(rational(1n, 3n))).toThrow(/not exactly representable/);
  });

  it("rejects negative and greater-than-one fractions", () => {
    expect(() => faraezFractionToKhatiyan(rational(-1n, 2n))).toThrow(/negative/);
    expect(() => faraezFractionToKhatiyan(rational(3n, 2n))).toThrow(/exceed 1\/1/);
  });
});
