import { prepareFaraezEstate, estateAssetsConserved } from "../src/modules/faraez/estate";
import { toUiResults } from "../src/modules/faraez/ui-adapter";
import type { FaraezResult } from "../src/modules/faraez/contracts";
import { rational } from "../src/modules/faraez/rational";

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
    expect(estateAssetsConserved(result)).toBe(true);
  });

  it("caps wasiyat at one third after funeral costs and debt using integer third", () => {
    const result = prepareFaraezEstate({
      land: 600,
      gold: 200,
      cash: 200,
      funeralCost: 100,
      debt: 100,
      wasiyat: 500,
    });

    // 1000 gross - 100 funeral - 100 debt = 800; max wasiyat = floor(800/3) in scale.
    expect(result.deductions.wasiyat).toBeCloseTo(800 / 3, 5);
    expect(result.net).toBeCloseTo(800 - 800 / 3, 5);
    expect(estateAssetsConserved(result)).toBe(true);
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
    expect(estateAssetsConserved(result)).toBe(true);
  });

  it("conserves residual assets exactly for awkward decimals", () => {
    const result = prepareFaraezEstate({
      land: 100.1,
      gold: 200.2,
      cash: 300.3,
      funeralCost: 10.05,
      debt: 20.1,
      wasiyat: 0,
    });
    expect(estateAssetsConserved(result)).toBe(true);
    const residual = result.assets.land + result.assets.gold + result.assets.cash;
    expect(residual).toBeCloseTo(result.net, 6);
  });
});

describe("toUiResults estate wiring (no double-deduction)", () => {
  const halfShare = rational(1n, 2n);
  const halfMeasure = {
    fraction: halfShare,
    ana: 8n,
    gonda: 0n,
    kora: 0n,
    kranti: 0n,
    til: 0n,
  };
  const halfResult: FaraezResult = {
    ruleset: "existing-sunni-project-rules",
    eligibleHeirs: [],
    prescribedShares: [],
    allocations: [
      {
        heirType: "কন্যা",
        count: 1,
        fraction: halfShare,
        totalShare: halfShare,
        reasoning: "test",
      },
      {
        heirType: "পুত্র",
        count: 1,
        fraction: halfShare,
        totalShare: halfShare,
        reasoning: "test",
      },
    ],
    adjustments: [],
    conservation: {
      allocated: rational(1n),
      expected: rational(1n),
      exact: true,
    },
    measurementAllocations: [halfMeasure, halfMeasure],
  };

  it("does not subtract funeral+debt from both land and cash", () => {
    const assets = {
      land: 900,
      gold: 100,
      cash: 0,
      funeralCost: 100,
      debt: 100,
      wasiyat: 0,
    };
    const rows = toUiResults(halfResult, assets);
    const totalLand = rows.reduce((s, r) => s + r.assets.land, 0);
    const totalGold = rows.reduce((s, r) => s + r.assets.gold, 0);
    // Net estate = 800, proportional 720 land + 80 gold.
    // Legacy bug subtracted 200 from land alone → 700, then * fractions.
    expect(totalLand).toBeCloseTo(720, 5);
    expect(totalGold).toBeCloseTo(80, 5);
    expect(totalLand + totalGold).toBeCloseTo(800, 5);
  });
});
