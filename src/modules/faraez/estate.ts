import type { AssetsInput } from "./types";

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

/**
 * Prepare the estate before faraez shares are calculated.
 *
 * Funeral expenses and enforceable debts are deducted first. A wasiyat is
 * limited to one third of the estate remaining after those deductions.
 * Deductions are allocated proportionally across land, gold and cash so that
 * the calculator does not silently deduct everything from cash when the estate
 * is predominantly non-cash property.
 */
export function prepareFaraezEstate(input: AssetsInput): PreparedFaraezEstate {
  const land = Number(input.land) || 0;
  const gold = Number(input.gold) || 0;
  const cash = Number(input.cash) || 0;
  const funeralCost = Number(input.funeralCost) || 0;
  const debt = Number(input.debt) || 0;
  const requestedWasiyat = Number(input.wasiyat) || 0;

  const gross = land + gold + cash;
  const afterFuneralAndDebt = Math.max(0, gross - funeralCost - debt);
  const allowedWasiyat = Math.min(Math.max(0, requestedWasiyat), afterFuneralAndDebt / 3);
  const net = Math.max(0, afterFuneralAndDebt - allowedWasiyat);
  const totalDeductions = gross - net;

  const ratio = gross > 0 ? Math.max(0, Math.min(1, 1 - totalDeductions / gross)) : 0;

  return {
    gross,
    net,
    assets: {
      land: land * ratio,
      gold: gold * ratio,
      cash: cash * ratio,
      funeralCost: 0,
      debt: 0,
      wasiyat: 0,
    },
    deductions: {
      funeralCost,
      debt,
      wasiyat: allowedWasiyat,
    },
  };
}
