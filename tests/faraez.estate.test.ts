import { prepareFaraezEstate } from "../src/modules/faraez/estate";

describe("Faraez estate preparation", () => {
  it("deducts funeral costs and debt from the whole mixed estate, not cash only", () => {
    const result = prepareFaraezEstate({
      land: 900,
      gold: 100,
      cash: 0,
      funeralCost: 100,
      debt: 100,
      wasiyat: 0,
    });

    expect(result.gross).toBe(1000);
    expect(result.net).toBe(800);
    expect(result.assets.land).toBeCloseTo(720);
    expect(result.assets.gold).toBeCloseTo(80);
    expect(result.assets.cash).toBe(0);
    expect(result.assets.funeralCost).toBe(0);
    expect(result.assets.debt).toBe(0);
  });

  it("caps wasiyat at one third after funeral costs and debt", () => {
    const result = prepareFaraezEstate({
      land: 600,
      gold: 200,
      cash: 200,
      funeralCost: 100,
      debt: 100,
      wasiyat: 500,
    });

    // 1000 gross - 100 funeral - 100 debt = 800; max wasiyat = 800 / 3.
    expect(result.deductions.wasiyat).toBeCloseTo(800 / 3);
    expect(result.net).toBeCloseTo(1600 / 3);
  });

  it("preserves the full estate when there are no deductions", () => {
    const result = prepareFaraezEstate({
      land: 500,
      gold: 250,
      cash: 250,
      funeralCost: 0,
      debt: 0,
      wasiyat: 0,
    });

    expect(result.net).toBe(1000);
    expect(result.assets.land).toBe(500);
    expect(result.assets.gold).toBe(250);
    expect(result.assets.cash).toBe(250);
  });
});
