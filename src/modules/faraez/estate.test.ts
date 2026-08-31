import { estateAssetsConserved, prepareFaraezEstate } from "./estate";

describe("Faraez estate fixed-point boundary", () => {
  it("conserves residual assets exactly without floating-point comparison", () => {
    const prepared = prepareFaraezEstate({
      land: 100.123456,
      gold: 50.654321,
      cash: 25.111111,
      funeralCost: 10.000001,
      debt: 5.123456,
      wasiyat: 20.333333,
    });

    expect(estateAssetsConserved(prepared)).toBe(true);
  });

  it("rounds decimal input at the fixed six-decimal boundary", () => {
    const prepared = prepareFaraezEstate({
      land: 1.0000005,
      gold: 0,
      cash: 0,
      funeralCost: 0,
      debt: 0,
      wasiyat: 0,
    });

    expect(prepared.gross).toBe(1.000001);
    expect(prepared.net).toBe(1.000001);
    expect(estateAssetsConserved(prepared)).toBe(true);
  });

  it("does not introduce binary-float multiplication into decimal parsing", () => {
    const prepared = prepareFaraezEstate({
      land: 0.1,
      gold: 0.2,
      cash: 0.3,
      funeralCost: 0,
      debt: 0,
      wasiyat: 0,
    });

    expect(prepared.gross).toBe(0.6);
    expect(prepared.net).toBe(0.6);
    expect(estateAssetsConserved(prepared)).toBe(true);
  });
});
