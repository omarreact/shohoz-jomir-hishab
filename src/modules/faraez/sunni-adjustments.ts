import type { DeceasedGender, HeirResult, HeirsInput } from "./types";

const EPSILON = 1e-9;
type FixedShare = { key: string; share: number; resultIndexes: number[] };

function hasDescendants(input: HeirsInput): boolean {
  return input.sons > 0 || input.daughters > 0;
}

function buildFixedShares(input: HeirsInput, gender: DeceasedGender, results: HeirResult[]): FixedShare[] {
  const shares: FixedShare[] = [];
  const add = (key: string, share: number, names: string[]) => {
    const resultIndexes = results.map((r, i) => names.includes(r.heirType) && r.fraction > 0 ? i : -1).filter(i => i >= 0);
    if (resultIndexes.length > 0 && share > 0) shares.push({ key, share, resultIndexes });
  };
  const descendants = hasDescendants(input);
  if (input.spouse > 0) add("spouse", gender === "male" ? (descendants ? 1 / 8 : 1 / 4) : (descendants ? 1 / 4 : 1 / 2), [gender === "male" ? "স্ত্রী" : "স্বামী"]);
  const siblingCount = input.fullBrothers + input.fullSisters + input.consanguineBrothers + input.consanguineSisters + input.uterineBrothers + input.uterineSisters;
  if (input.mother > 0) add("mother", descendants || siblingCount >= 2 ? 1 / 6 : 1 / 3, ["মাতা"]);
  if (input.father > 0 && descendants) add("father", 1 / 6, ["পিতা"]);
  if (input.paternalGrandFather > 0 && !input.father && descendants) add("grandfather", 1 / 6, ["দাদা"]);
  if (input.daughters > 0 && input.sons === 0) add("daughters", input.daughters === 1 ? 1 / 2 : 2 / 3, ["কন্যা"]);
  if (!descendants && !input.father && !input.paternalGrandFather && input.fullBrothers === 0 && input.fullSisters > 0) add("fullSisters", input.fullSisters === 1 ? 1 / 2 : 2 / 3, ["সহোদর বোন"]);
  if (!descendants && !input.father && !input.paternalGrandFather && input.consanguineBrothers === 0 && input.consanguineSisters > 0 && input.fullSisters === 0) add("consanguineSisters", input.consanguineSisters === 1 ? 1 / 2 : 2 / 3, ["সৎ বোন (বৈমাত্রেয়)"]);
  if (!descendants && !input.father && !input.paternalGrandFather) {
    const uterineCount = input.uterineBrothers + input.uterineSisters;
    if (uterineCount > 0) add("uterine", uterineCount === 1 ? 1 / 6 : 1 / 3, ["সৎ ভাই (বৈপিত্রেয়)", "সৎ বোন (বৈপিত্রেয়)"]);
  }
  return shares;
}

function isResiduaryPossible(input: HeirsInput): boolean {
  return input.sons > 0 || input.father > 0 || input.paternalGrandFather > 0 || input.fullBrothers > 0 || input.consanguineBrothers > 0 || input.fullBrotherSon > 0 || input.consBrotherSon > 0 || input.fullBrotherSonSon > 0 || input.consBrotherSonSon > 0 || input.fullPaternalUncle > 0 || input.consPaternalUncle > 0 || input.fullCousin > 0 || input.consCousin > 0 || input.fullCousinSon > 0 || input.consCousinSon > 0 || input.fullCousinSonSon > 0 || input.consCousinSonSon > 0;
}

function assetBasis(results: HeirResult[]) {
  const source = results.find(r => r.totalShare > EPSILON && r.assets.total > EPSILON);
  if (!source) return { land: 0, gold: 0, cash: 0, total: 0 };
  return {
    land: source.assets.land / source.totalShare,
    gold: source.assets.gold / source.totalShare,
    cash: source.assets.cash / source.totalShare,
    total: source.assets.total / source.totalShare,
  };
}

function setShare(result: HeirResult, share: number, basis: ReturnType<typeof assetBasis>) {
  result.totalShare = share;
  result.fraction = result.count > 0 ? share / result.count : 0;
  result.assets = {
    land: basis.land * share,
    gold: basis.gold * share,
    cash: basis.cash * share,
    total: basis.total * share,
  };
}

export function applySunniAdjustments(input: HeirsInput, gender: DeceasedGender, results: HeirResult[]): HeirResult[] {
  const fixed = buildFixedShares(input, gender, results);
  if (fixed.length === 0) return results;
  const fixedTotal = fixed.reduce((sum, item) => sum + item.share, 0);
  const basis = assetBasis(results);

  if (fixedTotal > 1 + EPSILON) {
    const factor = 1 / fixedTotal;
    const adjusted = results.map(result => ({ ...result, assets: { ...result.assets } }));
    const fixedIndexes = new Set(fixed.flatMap(item => item.resultIndexes));
    adjusted.forEach((result, index) => {
      if (result.fraction > 0 && !fixedIndexes.has(index)) setShare(result, 0, basis);
    });
    for (const item of fixed) {
      const adjustedTotal = item.share * factor;
      const count = item.resultIndexes.reduce((sum, index) => sum + adjusted[index].count, 0);
      for (const index of item.resultIndexes) setShare(adjusted[index], adjustedTotal * (adjusted[index].count / count), basis);
    }
    return adjusted;
  }

  if (fixedTotal >= 1 - EPSILON || isResiduaryPossible(input)) return results;

  const spouseKey = input.spouse > 0 ? "spouse" : null;
  const eligible = fixed.filter(item => item.key !== spouseKey);
  if (eligible.length === 0) {
    if (fixed.length === 1) {
      const adjusted = results.map(result => ({ ...result, assets: { ...result.assets } }));
      setShare(adjusted[fixed[0].resultIndexes[0]], 1, basis);
      return adjusted;
    }
    return results;
  }

  const returnedBase = eligible.reduce((sum, item) => sum + item.share, 0);
  const adjusted = results.map(result => ({ ...result, assets: { ...result.assets } }));
  const spouse = fixed.find(item => item.key === spouseKey);
  if (spouse) {
    const count = spouse.resultIndexes.reduce((sum, index) => sum + adjusted[index].count, 0);
    spouse.resultIndexes.forEach(index => setShare(adjusted[index], spouse.share * adjusted[index].count / count, basis));
  }

  const targetTotal = 1 - (spouse?.share ?? 0);
  for (const item of eligible) {
    const adjustedTotal = targetTotal * (item.share / returnedBase);
    const count = item.resultIndexes.reduce((sum, index) => sum + adjusted[index].count, 0);
    item.resultIndexes.forEach(index => setShare(adjusted[index], adjustedTotal * adjusted[index].count / count, basis));
  }
  return adjusted;
}
