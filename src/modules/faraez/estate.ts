/** Exact fixed-point estate preparation for the Faraez domain. */
import type { AssetsInput } from "./types";

/** Internal fixed-point scale (6 decimal places). */
const SCALE = 1_000_000n;
const SCALE_DIGITS = 6;
const TEN = 10n;

export interface PreparedFaraezEstate {
  /** Gross estate before funeral expenses, debts and wasiyat. */
  gross: number;
  /** Estate remaining after all permitted deductions. */
  net: number;
  /** Asset values after deductions, allocated proportionally across asset classes. */
  assets: AssetsInput;
  deductions: { funeralCost: number; debt: number; wasiyat: number };
}

function toScaled(value: number): bigint {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Estate values must be finite non-negative numbers");
  const text = String(value).toLowerCase();
  const [coefficient, exponentText] = text.split("e");
  const exponent = exponentText ? Number.parseInt(exponentText, 10) : 0;
  if (!Number.isInteger(exponent)) throw new RangeError("Invalid estate value");
  const [whole, fraction = ""] = coefficient.split(".");
  const digitsText = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  const digits = BigInt(digitsText || "0");
  const decimalPlaces = fraction.length - exponent;
  const shift = SCALE_DIGITS - decimalPlaces;
  if (shift >= 0) return digits * TEN ** BigInt(shift);
  const divisor = TEN ** BigInt(-shift);
  const quotient = digits / divisor;
  const remainder = digits % divisor;
  return remainder * 2n >= divisor ? quotient + 1n : quotient;
}

function fromScaled(value: bigint): number { return Number(value) / Number(SCALE); }

function allocateProportional(weights: readonly bigint[], totalScaled: bigint): bigint[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0n);
  if (weightSum <= 0n || totalScaled <= 0n) return weights.map(() => 0n);
  const rows = weights.map((weight, index) => {
    const numerator = totalScaled * weight;
    const base = numerator / weightSum;
    const remainder = numerator % weightSum;
    return { index, base, remainder };
  });
  const assigned = rows.reduce((sum, row) => sum + row.base, 0n);
  let leftover = totalScaled - assigned;
  [...rows].sort((a, b) => b.remainder > a.remainder ? 1 : b.remainder < a.remainder ? -1 : a.index - b.index).forEach((row) => {
    if (leftover > 0n) { row.base += 1n; leftover -= 1n; }
  });
  return rows.sort((a, b) => a.index - b.index).map((row) => row.base);
}

export function prepareFaraezEstate(input: AssetsInput): PreparedFaraezEstate {
  const landS = toScaled(input.land);
  const goldS = toScaled(input.gold);
  const cashS = toScaled(input.cash);
  const funeralS = toScaled(input.funeralCost);
  const debtS = toScaled(input.debt);
  const requestedWasiyatS = toScaled(input.wasiyat);
  const grossS = landS + goldS + cashS;
  const deductionsS = funeralS + debtS;
  const afterFuneralAndDebtS = grossS > deductionsS ? grossS - deductionsS : 0n;
  const maxWasiyatS = afterFuneralAndDebtS / 3n;
  const allowedWasiyatS = requestedWasiyatS < maxWasiyatS ? requestedWasiyatS : maxWasiyatS;
  const netS = afterFuneralAndDebtS > allowedWasiyatS ? afterFuneralAndDebtS - allowedWasiyatS : 0n;
  const [landNet, goldNet, cashNet] = allocateProportional([landS, goldS, cashS], netS);
  return {
    gross: fromScaled(grossS),
    net: fromScaled(netS),
    assets: { land: fromScaled(landNet), gold: fromScaled(goldNet), cash: fromScaled(cashNet), funeralCost: 0, debt: 0, wasiyat: 0 },
    deductions: { funeralCost: fromScaled(funeralS < grossS ? funeralS : grossS), debt: fromScaled(debtS), wasiyat: fromScaled(allowedWasiyatS) },
  };
}

export function estateAssetsConserved(prepared: PreparedFaraezEstate): boolean {
  return toScaled(prepared.assets.land) + toScaled(prepared.assets.gold) + toScaled(prepared.assets.cash) === toScaled(prepared.net);
}
