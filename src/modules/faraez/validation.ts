import type { AssetsInput, HeirsInput } from "./types";

const NUMERIC_ASSET_FIELDS: (keyof AssetsInput)[] = [
  "land",
  "gold",
  "cash",
  "funeralCost",
  "debt",
  "wasiyat",
];

const HEIR_FIELDS: (keyof HeirsInput)[] = [
  "spouse",
  "sons",
  "deadSons",
  "daughters",
  "deadDaughters",
  "father",
  "mother",
  "paternalGrandFather",
  "paternalGrandMother",
  "maternalGrandMother",
  "fullBrothers",
  "fullSisters",
  "consanguineBrothers",
  "consanguineSisters",
  "uterineBrothers",
  "uterineSisters",
  "fullBrotherSon",
  "consBrotherSon",
  "fullBrotherSonSon",
  "consBrotherSonSon",
  "fullPaternalUncle",
  "consPaternalUncle",
  "fullCousin",
  "consCousin",
  "fullCousinSon",
  "consCousinSon",
  "fullCousinSonSon",
  "consCousinSonSon",
];

/**
 * Validates Faraez inputs without changing jurisprudential allocation rules.
 * Calculation code can call this helper before distributing shares.
 */
export function validateMuslimFaraezInput(
  heirs: HeirsInput,
  assets: AssetsInput,
): string[] {
  const errors: string[] = [];

  for (const field of NUMERIC_ASSET_FIELDS) {
    const value = Number(assets[field]);
    if (!Number.isFinite(value)) {
      errors.push(`Asset ${field} must be a finite number`);
    } else if (value < 0) {
      errors.push(`Asset ${field} cannot be negative`);
    }
  }

  for (const field of HEIR_FIELDS) {
    const value = Number(heirs[field]);
    if (!Number.isFinite(value)) {
      errors.push(`Heir count ${field} must be a finite number`);
    } else if (!Number.isInteger(value) || value < 0) {
      errors.push(`Heir count ${field} must be a non-negative integer`);
    }
  }

  const estateAfterFuneralAndDebt =
    assets.land + assets.gold + assets.cash - assets.funeralCost - assets.debt;

  if (estateAfterFuneralAndDebt < 0) {
    errors.push("Funeral cost and debt cannot exceed the gross estate");
  }

  if (
    assets.wasiyat > 0 &&
    assets.wasiyat > estateAfterFuneralAndDebt / 3
  ) {
    errors.push("Wasiyat cannot exceed one third of the estate after funeral cost and debt");
  }

  return errors;
}

export function assertValidMuslimFaraezInput(
  heirs: HeirsInput,
  assets: AssetsInput,
): void {
  const errors = validateMuslimFaraezInput(heirs, assets);
  if (errors.length > 0) {
    throw new Error(`Invalid Faraez input: ${errors.join("; ")}`);
  }
}
