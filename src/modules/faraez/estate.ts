import type { AssetsInput } from "./types";

/** Internal fixed-point scale (6 dp). Keeps estate prep off IEEE share ratios. */
const SCALE = 1_000_000n;

export interface PreparedFaraezEstate {
  /** Gross estate before funeral expenses, debts and wasiyat. */
  gross: number;
  /** Estate remaining after all permitted deductions. */
  net: number;
  /** Asset values after deductions, allocated proportionally across asset classes. */
  assets: AssetsInput;
  deductions: {
    funeralCost: number;
    debt: number;
    wasiyat: number;
  };
}

function toScaled(value: number): bigint {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("Estate values must be finite non-negative numbers");
  }
  return BigInt(Math.round(value * Number(SCALE)));
}

function fromScaled(value: bigint): number {
  return Number(value) / Number(SCALE);
}

/**
 * Largest-remainder proportional split of `totalScaled` across positive weights.
 * Guarantees sum(parts) === totalScaled (exact conservation at scale).
 */
function allocateProportional(weights: readonly bigint[], totalScaled: bigint): bigint[] {
  const weightSum = weights.reduce((s, w) => s + w, 0n);
  if (weightSum <= 0n || totalScaled <= 0n) {
    return weights.map(() => 0n);
  }

  const rows = weights.map((weight, index) => {
    const numerator = totalScaled * weight;
    const base = numerator / weightSum;
    const remainder = numerator % weightSum;
    return { index, base, remainder };
  });

  let assigned = rows.reduce((s, r) => s + r.base, 0n);
  let leftover = totalScaled - assigned;

  [...rows]
    .sort((a, b) =>
      b.remainder > a.remainder ? 1 : b.remainder < a.remainder ? -1 : a.index - b.index,
    )
    .forEach((row) => {
      if (leftover > 0n) {
        row.base += 1n;
        leftover -= 1n;
      }
    });

  return rows.sort((a, b) => a.index - b.index).map((r) => r.base);
}

/**
 * Prepare the estate before faraez shares are calculated.
 *
 * Policy (FaraezDeductionPolicy):
 * - Funeral + enforceable debt deducted from the whole mixed estate (not cash-only).
 * - Wasiyat capped at one third of the post-funeral/debt remainder.
 * - Residual net is allocated proportionally across land / gold / cash with
 *   largest-remainder so the three residual classes sum exactly to net.
 */
export function prepareFaraezEstate(input: AssetsInput): PreparedFaraezEstate {
  const landS = toScaled(Number(input.land) || 0);
  const goldS = toScaled(Number(input.gold) || 0);
  const cashS = toScaled(Number(input.cash) || 0);
  const funeralS = toScaled(Number(input.funeralCost) || 0);
  const debtS = toScaled(Number(input.debt) || 0);
  const requestedWasiyatS = toScaled(Number(input.wasiyat) || 0);

  const grossS = landS + goldS + cashS;
  const afterFuneralAndDebtS = grossS > funeralS + debtS ? grossS - funeralS - debtS : 0n;
  // Exact floor third in scaled units — never afterFuneralAndDebt / 3 in float.
  const maxWasiyatS = afterFuneralAndDebtS / 3n;
  const allowedWasiyatS =
    requestedWasiyatS < maxWasiyatS ? (requestedWasiyatS < 0n ? 0n : requestedWasiyatS) : maxWasiyatS;
  const netS = afterFuneralAndDebtS > allowedWasiyatS ? afterFuneralAndDebtS - allowedWasiyatS : 0n;

  const [landNet, goldNet, cashNet] = allocateProportional([landS, goldS, cashS], netS);

  return {
    gross: fromScaled(grossS),
    net: fromScaled(netS),
    assets: {
      land: fromScaled(landNet),
      gold: fromScaled(goldNet),
      cash: fromScaled(cashNet),
      funeralCost: 0,
      debt: 0,
      wasiyat: 0,
    },
    deductions: {
      funeralCost: fromScaled(funeralS < grossS ? funeralS : grossS),
      debt: fromScaled(debtS),
      wasiyat: fromScaled(allowedWasiyatS),
    },
  };
}

/** Exact conservation check at display precision for residual asset classes. */
export function estateAssetsConserved(prepared: PreparedFaraezEstate, epsilon = 1 / Number(SCALE)): boolean {
  const residual =
    prepared.assets.land + prepared.assets.gold + prepared.assets.cash;
  return Math.abs(residual - prepared.net) <= epsilon;
}
