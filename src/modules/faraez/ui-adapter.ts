import type { AssetsInput, HeirResult } from "./types";
import type { FaraezResult } from "./contracts";

export function rationalToNumber(value: { numerator: bigint; denominator: bigint }): number {
  return Number(value.numerator) / Number(value.denominator);
}

export function toUiResults(result: FaraezResult, assets: AssetsInput): HeirResult[] {
  const totalLand = assets.land - assets.funeralCost - assets.debt - assets.wasiyat;
  const totalGold = assets.gold;
  const totalCash = assets.cash - assets.funeralCost - assets.debt - assets.wasiyat;
  let measurementIndex = 0;

  return result.allocations.map((allocation) => {
    const fraction = rationalToNumber(allocation.fraction);
    const measurements = result.measurementAllocations
      .slice(measurementIndex, measurementIndex + allocation.count)
      .map((measurement) => ({
        ana: measurement.ana,
        gonda: measurement.gonda,
        kora: measurement.kora,
        kranti: measurement.kranti,
        til: measurement.til,
      }));
    measurementIndex += allocation.count;

    return {
      heirType: allocation.heirType,
      count: allocation.count,
      fraction,
      totalShare: rationalToNumber(allocation.totalShare),
      reasoning: allocation.reasoning,
      assets: {
        land: Math.max(0, totalLand) * fraction,
        gold: Math.max(0, totalGold) * fraction,
        cash: Math.max(0, totalCash) * fraction,
      },
      measurements,
    };
  });
}
