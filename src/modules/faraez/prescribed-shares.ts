import { rational } from "./rational";
import type { FaraezHeirsInput, FaraezPrescribedShare, EligibilityResult } from "./contracts";
import { determineEligibility } from "./eligibility";

/**
 * Fixed shares only. No Awl, Radd, or residual allocation is performed here.
 * Conditions mirror the currently supported muslim-law.ts ruleset.
 */
export function determinePrescribedShares(
  input: FaraezHeirsInput,
  deceasedGender: "male" | "female",
  eligibility: EligibilityResult = determineEligibility(input),
): readonly FaraezPrescribedShare[] {
  const h = input;
  const eligible = new Set(eligibility.heirs.filter((item) => item.eligible).map((item) => item.heirType));
  const hasMaleDescendant = h.sons > 0;
  const hasDescendant = hasMaleDescendant || h.daughters > 0;
  const totalSiblings = h.fullBrothers + h.fullSisters + h.consanguineBrothers + h.consanguineSisters + h.uterineBrothers + h.uterineSisters;
  const shares: FaraezPrescribedShare[] = [];

  const add = (heirType: string, count: number, sharePerHeir: ReturnType<typeof rational>, reasoning: string) => {
    if (count <= 0 || !eligible.has(heirType)) return;
    shares.push({
      heirType,
      count,
      sharePerHeir,
      totalShare: rational(sharePerHeir.numerator * BigInt(count), sharePerHeir.denominator),
      reasoning,
    });
  };

  if (h.spouse > 0) {
    const share = deceasedGender === "male"
      ? (hasDescendant ? rational(1n, 8n) : rational(1n, 4n))
      : (hasDescendant ? rational(1n, 4n) : rational(1n, 2n));
    add("স্বামী/স্ত্রী", h.spouse, share, deceasedGender === "male"
      ? (hasDescendant ? "সন্তান থাকায় স্ত্রী ১/৮ অংশ পাবেন (সূরা আন-নিসা: ১২)।" : "সন্তান না থাকায় স্ত্রী ১/৪ অংশ পাবেন (সূরা আন-নিসা: ১২)।")
      : (hasDescendant ? "সন্তান থাকায় স্বামী ১/৪ অংশ পাবেন (সূরা আন-নিসা: ১২)।" : "সন্তান না থাকায় স্বামী ১/২ অংশ পাবেন (সূরা আন-নিসা: ১২)।"));
  }

  if (h.mother > 0) {
    add("মাতা", 1, hasDescendant || totalSiblings >= 2 ? rational(1n, 6n) : rational(1n, 3n), hasDescendant || totalSiblings >= 2
      ? "সন্তান বা একাধিক ভাই-বোন থাকায় মাতা ১/৬ অংশ পাবেন (সূরা আন-নিসা: ১১)।"
      : "মাতা ১/৩ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
  }

  if (h.father > 0) {
    add("পিতা", 1, rational(1n, 6n), "পিতা নির্দিষ্ট ১/৬ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
  } else if (h.paternalGrandFather > 0) {
    add("দাদা", 1, rational(1n, 6n), "পিতা না থাকায় দাদা ১/৬ অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।");
  }

  if (h.paternalGrandMother > 0 && eligible.has("দাদি")) {
    add("দাদি", 1, rational(1n, 6n), "মাতা ও পিতা না থাকায় দাদি ১/৬ অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।");
  }
  if (h.maternalGrandMother > 0 && eligible.has("নানি")) {
    add("নানি", 1, rational(1n, 6n), "মাতা না থাকায় নানি ১/৬ অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।");
  }

  if (h.daughters > 0 && h.sons === 0 && eligible.has("কন্যা")) {
    const total = h.daughters === 1 ? rational(1n, 2n) : rational(2n, 3n);
    add("কন্যা", h.daughters, rational(total.numerator, total.denominator * BigInt(h.daughters)), h.daughters === 1
      ? "একমাত্র কন্যা ১/২ অংশ পাবেন (সূরা আন-নিসা: ১১)।"
      : "একাধিক কন্যা সম্মিলিত ২/৩ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
  }

  const uterineTotal = h.uterineBrothers + h.uterineSisters;
  if (uterineTotal > 0 && !hasDescendant && h.father === 0 && h.paternalGrandFather === 0) {
    const total = uterineTotal === 1 ? rational(1n, 6n) : rational(1n, 3n);
    const perHead = rational(total.numerator, total.denominator * BigInt(uterineTotal));
    add("সৎ ভাই (বৈপিত্রেয়)", h.uterineBrothers, perHead, "বৈপিত্রেয় ভাই-বোন নির্দিষ্ট অংশে সমহারে অংশ পাবেন (সূরা আন-নিসা: ১২)।");
    add("সৎ বোন (বৈপিত্রেয়)", h.uterineSisters, perHead, "বৈপিত্রেয় ভাই-বোন নির্দিষ্ট অংশে সমহারে অংশ পাবেন (সূরা আন-নিসা: ১২)।");
  }

  if (!hasMaleDescendant && h.father === 0 && h.paternalGrandFather === 0 && h.fullBrothers === 0 && h.fullSisters > 0) {
    const total = h.fullSisters === 1 ? rational(1n, 2n) : rational(2n, 3n);
    add("সহোদর বোন", h.fullSisters, rational(total.numerator, total.denominator * BigInt(h.fullSisters)), h.fullSisters === 1
      ? "আপন ভাই না থাকায় বোন ১/২ অংশ পাবেন (সূরা আন-নিসা: ১৭৬)।"
      : "আপন ভাই না থাকায় একাধিক বোন ২/৩ অংশ পাবেন (সূরা আন-নিসা: ১৭৬)।");
  }

  if (!hasMaleDescendant && h.father === 0 && h.paternalGrandFather === 0 && h.fullBrothers === 0 && h.consanguineBrothers === 0 && h.consanguineSisters > 0) {
    if (h.fullSisters === 1) {
      add("সৎ বোন (বৈমাত্রেয়)", h.consanguineSisters, rational(1n, 6n), "এক আপন বোন থাকায় ২/৩ পূর্ণ করতে বৈমাত্রেয় বোন ১/৬ অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।");
    } else if (h.fullSisters === 0) {
      const total = h.consanguineSisters === 1 ? rational(1n, 2n) : rational(2n, 3n);
      add("সৎ বোন (বৈমাত্রেয়)", h.consanguineSisters, rational(total.numerator, total.denominator * BigInt(h.consanguineSisters)), h.consanguineSisters === 1
        ? "একজন বৈমাত্রেয় বোন ১/২ অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।"
        : "একাধিক বৈমাত্রেয় বোন সম্মিলিত ২/৩ অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।");
    }
  }

  return shares;
}
