import {
  getKaniProfile,
  kaniFromSquareFeet,
  squareFeetFromGonda,
  squareFeetFromKani,
  squareFeetFromKora,
  squareFeetFromKranti,
  squareFeetFromTil,
} from "../src/modules/land/kani";

describe("Ministry-published Kani profiles", () => {
  it("keeps the 8-hat-nol profile explicit", () => {
    const p = getKaniProfile("8-hat-nol");
    expect(p.squareFeetPerKani).toBe(17280);
    expect(p.squareMetersPerKani).toBe(1605);
    expect(p.gondaPerKani).toBe(20);
    expect(p.koraPerGonda).toBe(4);
    expect(p.krantiPerKora).toBe(3);
    expect(p.tilPerKranti).toBe(20);
  });

  it("keeps the 40-shotok profile explicit", () => {
    const p = getKaniProfile("40-shotok");
    expect(p.squareFeetPerKani).toBe(17424);
    expect(p.squareMetersPerKani).toBe(1619);
    expect(p.decimalsPerKani).toBe(40);
  });

  it("does not silently equate the two Kani profiles", () => {
    expect(getKaniProfile("8-hat-nol").squareFeetPerKani)
      .not.toBe(getKaniProfile("40-shotok").squareFeetPerKani);
  });

  it("round-trips Kani through square feet", () => {
    for (const profile of ["8-hat-nol", "40-shotok"] as const) {
      expect(kaniFromSquareFeet(squareFeetFromKani(2, profile), profile)).toBeCloseTo(2, 12);
    }
  });

  it("derives Gonda, Kora, Kranti and Til from the selected Kani profile", () => {
    expect(squareFeetFromGonda(20, "8-hat-nol")).toBe(17280);
    expect(squareFeetFromKora(80, "8-hat-nol")).toBe(17280);
    expect(squareFeetFromKranti(240, "8-hat-nol")).toBe(17280);
    expect(squareFeetFromTil(4800, "8-hat-nol")).toBe(17280);

    expect(squareFeetFromGonda(20, "40-shotok")).toBe(17424);
    expect(squareFeetFromKora(80, "40-shotok")).toBe(17424);
    expect(squareFeetFromKranti(240, "40-shotok")).toBe(17424);
    expect(squareFeetFromTil(4800, "40-shotok")).toBe(17424);
  });

  it("rejects non-finite values", () => {
    expect(squareFeetFromKani(Number.NaN)).toBeNaN();
    expect(squareFeetFromGonda(Number.POSITIVE_INFINITY)).toBeNaN();
  });
});
