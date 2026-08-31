import type { AssetsInput, HeirResult } from "./types";
import type { FaraezResult } from "./contracts";
import { prepareFaraezEstate } from "./estate";

export function rationalToNumber(value: { numerator: bigint; denominator: bigint }): number {
  // Display boundary only — domain shares remain rational/bigint upstream.
  if (value.denominator === 0n) return 0;
  return Number(value.numerator) / Number(value.denominator);
}

/**
 * Map exact domain allocations onto residual (post-deduction) estate assets.
 *
 * CRITICAL: deductions must run through prepareFaraezEstate (proportional across
 * land/gold/cash). Never subtract funeral+debt+wasiyat independently from each
 * asset class — that double-counts deductions and violates estate conservation.
 */
export function toUiResults(result: FaraezResult, assets: AssetsInput): HeirResult[] {
  const prepared = prepareFaraezEstate(assets);
  const netLand = prepared.assets.land;
  const netGold = prepared.assets.gold;
  const netCash = prepared.assets.cash;
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
        land: netLand * fraction,
        gold: netGold * fraction,
        cash: netCash * fraction,
      },
      measurements,
    };
  });
}
