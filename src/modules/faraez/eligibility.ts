import type { FaraezHeirsInput, EligibilityResult, FaraezEligibility } from "./contracts";

/**
 * Eligibility is deliberately separate from prescribed shares and residual
 * allocation. This layer mirrors only blocking relationships already present
 * in muslim-law.ts; it does not calculate or consume fractions.
 */

const HEIR_LABELS: ReadonlyArray<readonly [keyof FaraezHeirsInput, string]> = [
  ["spouse", "স্বামী/স্ত্রী"],
  ["sons", "পুত্র"],
  ["daughters", "কন্যা"],
  ["father", "পিতা"],
  ["mother", "মাতা"],
  ["paternalGrandFather", "দাদা"],
  ["paternalGrandMother", "দাদি"],
  ["maternalGrandMother", "নানি"],
  ["fullBrothers", "সহোদর ভাই"],
  ["fullSisters", "সহোদর বোন"],
  ["consanguineBrothers", "সৎ ভাই (বৈমাত্রেয়)"],
  ["consanguineSisters", "সৎ বোন (বৈমাত্রেয়)"],
  ["uterineBrothers", "সৎ ভাই (বৈপিত্রেয়)"],
  ["uterineSisters", "সৎ বোন (বৈপিত্রেয়)"],
  ["fullBrotherSon", "সহোদর ভাইয়ের পুত্র"],
  ["consBrotherSon", "বৈমাত্রেয় ভাইয়ের পুত্র"],
  ["fullBrotherSonSon", "সহোদর ভাইয়ের পুত্রের পুত্র"],
  ["consBrotherSonSon", "বৈমাত্রেয় ভাইয়ের পুত্রের পুত্র"],
  ["fullPaternalUncle", "চাচা"],
  ["consPaternalUncle", "বৈমাত্রেয় চাচা"],
  ["fullCousin", "চাচাতো ভাই"],
  ["consCousin", "বৈমাত্রেয় চাচাতো ভাই"],
  ["fullCousinSon", "চাচাতো ভাইয়ের পুত্র"],
  ["consCousinSon", "বৈমাত্রেয় চাচাতো ভাইয়ের পুত্র"],
  ["fullCousinSonSon", "চাচাতো ভাইয়ের পুত্রের পুত্র"],
  ["consCousinSonSon", "বৈমাত্রেয় চাচাতো ভাইয়ের পুত্রের পুত্র"],
];

function present(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function determineEligibility(input: FaraezHeirsInput): EligibilityResult {
  const h = input;
  const hasMaleDescendant = present(h.sons);
  const hasDescendant = hasMaleDescendant || present(h.daughters);
  const hasFather = present(h.father);
  const hasGrandfather = !hasFather && present(h.paternalGrandFather);
  const hasSeniorMaleAscendant = hasFather || hasGrandfather;
  const hasFullBrother = present(h.fullBrothers);

  const blocked = new Map<string, string>();
  const asabah = new Set<string>();

  const block = (key: keyof FaraezHeirsInput, reason: string) => {
    const label = HEIR_LABELS.find(([candidate]) => candidate === key)?.[1];
    if (label && present(h[key])) blocked.set(label, reason);
  };

  // Father takes precedence over paternal grandfather in the existing rules.
  if (hasFather) {
    block("paternalGrandFather", "পিতা জীবিত থাকায় দাদা বঞ্চিত।");
    block("paternalGrandMother", "পিতা জীবিত থাকায় দাদি বঞ্চিত।");
  }

  if (present(h.mother)) {
    block("paternalGrandMother", "মাতা জীবিত থাকায় দাদি বঞ্চিত।");
    block("maternalGrandMother", "মাতা জীবিত থাকায় নানি বঞ্চিত।");
  } else if (present(h.paternalGrandMother) && hasFather) {
    block("paternalGrandMother", "পিতা জীবিত থাকায় দাদি বঞ্চিত।");
  }

  if (hasDescendant || hasSeniorMaleAscendant) {
    block("uterineBrothers", "সন্তান, পিতা বা দাদা থাকায় বৈপিত্রেয় ভাই বঞ্চিত।");
    block("uterineSisters", "সন্তান, পিতা বা দাদা থাকায় বৈপিত্রেয় বোন বঞ্চিত।");
  }

  if (hasMaleDescendant || hasSeniorMaleAscendant) {
    block("fullSisters", "পুত্র/পিতা/দাদা থাকায় সহোদর বোন বঞ্চিত।");
    block("consanguineSisters", "অগ্রাধিকারপ্রাপ্ত ওয়ারিশ থাকায় বৈমাত্রেয় বোন বঞ্চিত।");
    block("consanguineBrothers", "পুত্র/পিতা/দাদা থাকায় বৈমাত্রেয় ভাই বঞ্চিত।");
  } else if (hasFullBrother) {
    block("consanguineSisters", "সহোদর ভাই জীবিত থাকায় বৈমাত্রেয় বোন বঞ্চিত।");
    block("consanguineBrothers", "সহোদর ভাইয়ের অগ্রাধিকার থাকায় বৈমাত্রেয় ভাই বঞ্চিত।");
  } else if (h.fullSisters >= 2) {
    block("consanguineSisters", "একাধিক সহোদর বোন থাকায় বৈমাত্রেয় বোন বঞ্চিত।");
  }

  // The existing implementation treats sons as the first residual class and
  // daughters as participating with them when sons exist.
  if (present(h.sons)) {
    asabah.add("পুত্র");
    if (present(h.daughters)) asabah.add("কন্যা");
  } else if (hasFather) {
    asabah.add("পিতা");
  } else if (hasGrandfather) {
    asabah.add("দাদা");
  } else if (!hasDescendant && !hasSeniorMaleAscendant && hasFullBrother) {
    asabah.add("সহোদর ভাই");
    if (present(h.fullSisters)) asabah.add("সহোদর বোন");
  } else if (!hasDescendant && !hasSeniorMaleAscendant && !hasFullBrother && present(h.consanguineBrothers)) {
    asabah.add("সৎ ভাই (বৈমাত্রেয়)");
    if (present(h.consanguineSisters)) asabah.add("সৎ বোন (বৈমাত্রেয়)");
  } else if (!hasDescendant && !hasSeniorMaleAscendant && !hasFullBrother && !present(h.consanguineBrothers) && present(h.fullSisters)) {
    // Sisters can have a fixed share in this state; they are not marked as
    // residual heirs here because prescribed-shares owns that decision.
  }

  // The remaining agnatic chain is only exposed as residual candidates when
  // every closer candidate already represented by the current implementation
  // is absent. This preserves the existing hierarchy without adding new rules.
  if (asabah.size === 0 && !hasDescendant && !hasSeniorMaleAscendant && !hasFullBrother && !present(h.consanguineBrothers)) {
    const chain: Array<[keyof FaraezHeirsInput, string]> = [
      ["fullBrotherSon", "সহোদর ভাইয়ের পুত্র"],
      ["consBrotherSon", "বৈমাত্রেয় ভাইয়ের পুত্র"],
      ["fullBrotherSonSon", "সহোদর ভাইয়ের পুত্রের পুত্র"],
      ["consBrotherSonSon", "বৈমাত্রেয় ভাইয়ের পুত্রের পুত্র"],
      ["fullPaternalUncle", "চাচা"],
      ["consPaternalUncle", "বৈমাত্রেয় চাচা"],
      ["fullCousin", "চাচাতো ভাই"],
      ["consCousin", "বৈমাত্রেয় চাচাতো ভাই"],
      ["fullCousinSon", "চাচাতো ভাইয়ের পুত্র"],
      ["consCousinSon", "বৈমাত্রেয় চাচাতো ভাইয়ের পুত্র"],
      ["fullCousinSonSon", "চাচাতো ভাইয়ের পুত্রের পুত্র"],
      ["consCousinSonSon", "বৈমাত্রেয় চাচাতো ভাইয়ের পুত্রের পুত্র"],
    ];
    const first = chain.find(([key]) => present(h[key]));
    if (first) asabah.add(first[1]);
  }

  const heirs: FaraezEligibility[] = HEIR_LABELS
    .filter(([key]) => present(h[key]))
    .map(([key, heirType]) => {
      const blockedReason = blocked.get(heirType);
      const isAsabah = asabah.has(heirType) && !blockedReason;
      return {
        heirType,
        count: h[key],
        eligible: !blockedReason,
        asabah: isAsabah,
        ...(blockedReason ? { reason: blockedReason } : {}),
      };
    });

  return {
    heirs,
    asabahHeirTypes: [...asabah].filter((label) => heirs.some((h) => h.heirType === label && h.eligible)),
  };
}
