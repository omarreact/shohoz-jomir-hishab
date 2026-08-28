import type { AssetsInput, HeirsInput } from "./types";

const NUMERIC_ASSET_FIELDS: (keyof AssetsInput)[] = [
  "land", "gold", "cash", "funeralCost", "debt", "wasiyat",
];

const HEIR_FIELDS: (keyof HeirsInput)[] = [
  "spouse", "sons", "deadSons", "daughters", "deadDaughters", "father", "mother",
  "paternalGrandFather", "paternalGrandMother", "maternalGrandMother",
  "fullBrothers", "fullSisters", "consanguineBrothers", "consanguineSisters",
  "uterineBrothers", "uterineSisters", "fullBrotherSon", "consBrotherSon",
  "fullBrotherSonSon", "consBrotherSonSon", "fullPaternalUncle", "consPaternalUncle",
  "fullCousin", "consCousin", "fullCousinSon", "consCousinSon",
  "fullCousinSonSon", "consCousinSonSon",
];

export function validateMuslimFaraezInput(heirs: HeirsInput, assets: AssetsInput): string[] {
  const errors: string[] = [];

  for (const field of NUMERIC_ASSET_FIELDS) {
    const value = Number(assets[field]);
    if (!Number.isFinite(value)) errors.push(`Asset ${field} must be a finite number`);
    else if (value < 0) errors.push(`Asset ${field} cannot be negative`);
  }

  for (const field of HEIR_FIELDS) {
    const value = Number(heirs[field]);
    if (!Number.isFinite(value)) errors.push(`Heir count ${field} must be a finite number`);
    else if (!Number.isInteger(value) || value < 0) errors.push(`Heir count ${field} must be a non-negative integer`);
  }

  // Bangladesh Muslim Family Laws Ordinance, 1961, section 4 uses per-stirpes
  // representation for children of a predeceased son/daughter. The current UI
  // has no descendant tree for a deceased child, so refusing this case is safer
  // than incorrectly treating the deceased child as a living heir.
  if (heirs.deadSons > 0 || heirs.deadDaughters > 0) {
    errors.push("Predeceased son/daughter cases require their surviving descendants to be entered separately under section 4; this calculator cannot safely calculate that case yet.");
  }

  const grossEstate = assets.land + assets.gold + assets.cash;
  const estateAfterFuneralAndDebt = grossEstate - assets.funeralCost - assets.debt;
  if (estateAfterFuneralAndDebt < 0) errors.push("Funeral cost and debt cannot exceed the gross estate");

  if (assets.wasiyat > 0 && assets.wasiyat > Math.max(0, estateAfterFuneralAndDebt) / 3) {
    errors.push("Wasiyat cannot exceed one third of the estate after funeral cost and debt");
  }

  return errors;
}

export function assertValidMuslimFaraezInput(heirs: HeirsInput, assets: AssetsInput): void {
  const errors = validateMuslimFaraezInput(heirs, assets);
  if (errors.length > 0) throw new Error(`Invalid Faraez input: ${errors.join("; ")}`);
}
