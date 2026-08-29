import { add, divide, multiply, rational, type Rational } from "./rational";
import type { EligibilityResult, FaraezHeirShare, FaraezHeirsInput, FaraezPrescribedShare } from "./contracts";

const ZERO = rational(0n);

function sumPrescribed(shares: readonly FaraezPrescribedShare[]): Rational {
  return shares.reduce((sum, share) => add(sum, share.totalShare), ZERO);
}

function allocation(
  heirType: string,
  count: number,
  totalShare: Rational,
  reasoning: string,
): FaraezHeirShare {
  return {
    heirType,
    count,
    fraction: divide(totalShare, rational(BigInt(count))),
    totalShare,
    reasoning,
  };
}

function mixedTwoToOne(
  maleType: string,
  maleCount: number,
  femaleType: string,
  femaleCount: number,
  remainder: Rational,
  reasoning: string,
): FaraezHeirShare[] {
  const parts = BigInt(maleCount * 2 + femaleCount);
  const unit = divide(remainder, rational(parts));
  const result: FaraezHeirShare[] = [];
  if (maleCount > 0) result.push(allocation(maleType, maleCount, multiply(unit, rational(BigInt(maleCount * 2))), reasoning));
  if (femaleCount > 0) result.push(allocation(femaleType, femaleCount, multiply(unit, rational(BigInt(femaleCount))), reasoning));
  return result;
}

/**
 * Allocate only the residual estate according to the agnatic hierarchy that is
 * already implemented by muslim-law.ts. Fixed shares are not recalculated here.
 */
export function allocateResidual(
  input: FaraezHeirsInput,
  prescribed: readonly FaraezPrescribedShare[],
  _eligibility?: EligibilityResult,
): readonly FaraezHeirShare[] {
  const remainder = rational(
    1n * sumPrescribed(prescribed).denominator - sumPrescribed(prescribed).numerator,
    sumPrescribed(prescribed).denominator,
  );
  if (remainder.numerator <= 0n) return [];

  const h = input;
  const hasDescendants = h.sons > 0 || h.daughters > 0;

  if (h.sons > 0) {
    return mixedTwoToOne(
      "পুত্র",
      h.sons,
      "কন্যা",
      h.daughters,
      remainder,
      "অবশিষ্টভোগী হিসেবে পুত্র ও কন্যা ২:১ হারে অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।",
    );
  }

  if (h.father > 0 && !h.sons) {
    return [allocation("পিতা", 1, remainder, "পিতা আসাবা হিসেবে নির্দিষ্ট অংশের পর অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।")];
  }

  if (h.paternalGrandFather > 0 && h.father === 0) {
    return [allocation("দাদা", 1, remainder, "দাদা আসাবা হিসেবে নির্দিষ্ট অংশের পর অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।")];
  }

  if (h.fullBrothers > 0) {
    return mixedTwoToOne(
      "সহোদর ভাই",
      h.fullBrothers,
      "সহোদর বোন",
      h.fullSisters,
      remainder,
      "অবশিষ্টভোগী হিসেবে সহোদর ভাই ও বোন ২:১ হারে অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।",
    );
  }

  if (h.fullSisters > 0 && hasDescendants) {
    return [allocation("সহোদর বোন", h.fullSisters, remainder, "কন্যাদের উপস্থিতিতে সহোদর বোন অবশিষ্টভোগী হিসেবে অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।")];
  }

  if (h.consanguineBrothers > 0) {
    return mixedTwoToOne(
      "সৎ ভাই (বৈমাত্রেয়)",
      h.consanguineBrothers,
      "সৎ বোন (বৈমাত্রেয়)",
      h.consanguineSisters,
      remainder,
      "অবশিষ্টভোগী হিসেবে বৈমাত্রেয় ভাই ও বোন ২:১ হারে অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।",
    );
  }

  if (h.consanguineSisters > 0 && hasDescendants) {
    return [allocation("সৎ বোন (বৈমাত্রেয়)", h.consanguineSisters, remainder, "কন্যাদের উপস্থিতিতে বৈমাত্রেয় বোন অবশিষ্টভোগী হিসেবে অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।")];
  }

  const asabaList: ReadonlyArray<readonly [keyof FaraezHeirsInput, string]> = [
    ["fullBrotherSon", "সহোদর ভাইয়ের পুত্র"],
    ["consBrotherSon", "সৎ ভাই(বৈমাত্রেয়)-এর পুত্র"],
    ["fullBrotherSonSon", "সহোদর ভাইয়ের পুত্রের পুত্র"],
    ["consBrotherSonSon", "সৎ ভাই(বৈমাত্রেয়)-এর পুত্রের পুত্র"],
    ["fullPaternalUncle", "চাচা"],
    ["consPaternalUncle", "চাচা (বৈমাত্রেয়)"],
    ["fullCousin", "চাচাতো ভাই"],
    ["consCousin", "চাচাতো ভাই (বৈমাত্রেয়)"],
    ["fullCousinSon", "চাচাতো ভাইয়ের পুত্র"],
    ["consCousinSon", "চাচাতো ভাই (বৈমাত্রেয়) এর পুত্র"],
    ["fullCousinSonSon", "চাচাতো ভাইয়ের পুত্রের পুত্র"],
    ["consCousinSonSon", "চাচাতো ভাই (বৈমাত্রেয়)এর পুত্রের পুত্র"],
  ];

  const first = asabaList.find(([key]) => h[key] > 0);
  if (!first) return [];
  return [allocation(first[1], h[first[0]], remainder, "নিকটতম উপলব্ধ আসাবা হিসেবে অবশিষ্ট অংশ পাবেন (বর্তমান প্রকল্পের নিয়ম)।")];
}
