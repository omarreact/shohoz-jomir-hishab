import { HeirsInput, HeirResult, DeceasedGender, AssetsInput } from "./types";
import { validateMuslimFaraezInput } from "./validation";

export function calculateMuslimFaraez(input: HeirsInput, gender: DeceasedGender, assets: AssetsInput): HeirResult[] {
  const validationErrors = validateMuslimFaraezInput(input, assets);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid Faraez input: ${validationErrors.join("; ")}`);
  }

  let results: Omit<HeirResult, 'assets'>[] = [];

  // The estate is settled before inheritance: funeral costs, debts and wasiyat
  // are deducted from the gross estate, not from cash alone. For the calculator's
  // existing asset model, deductions are allocated proportionally across land,
  // gold and cash so no asset class is silently ignored.
  const grossEstate = (assets.land || 0) + (assets.gold || 0) + (assets.cash || 0);
  const funeral = assets.funeralCost || 0;
  const debt = assets.debt || 0;
  const wasiyat = assets.wasiyat || 0;
  const totalDeductions = funeral + debt + wasiyat;
  const deductionRatio = grossEstate > 0 ? Math.min(totalDeductions / grossEstate, 1) : 0;
  const netLand = (assets.land || 0) * (1 - deductionRatio);
  const netGold = (assets.gold || 0) * (1 - deductionRatio);
  const netCash = (assets.cash || 0) * (1 - deductionRatio);

  const effectiveSons = input.sons + input.deadSons;
  const effectiveDaughters = input.daughters + input.deadDaughters;
  const hasMaleDescendant = effectiveSons > 0;
  const hasChildOrAgnaticGrandChild = effectiveSons > 0 || effectiveDaughters > 0;
  const totalSiblings = input.fullBrothers + input.fullSisters + input.consanguineBrothers + input.consanguineSisters + input.uterineBrothers + input.uterineSisters;

  let remainingShare = 1;

  const addResult = (name: string, count: number, share: number, reason: string) => {
    if (count > 0) {
      results.push({ heirType: name, count, fraction: share / count, totalShare: share, reasoning: reason });
      remainingShare -= share;
    }
  };

  const addExcluded = (name: string, count: number, reason: string) => {
    if (count > 0) results.push({ heirType: name, count, fraction: 0, totalShare: 0, reasoning: reason });
  };

  if (input.spouse > 0) {
    const share = gender === "male" ? (hasChildOrAgnaticGrandChild ? 1 / 8 : 1 / 4) : (hasChildOrAgnaticGrandChild ? 1 / 4 : 1 / 2);
    addResult(gender === "male" ? "স্ত্রী" : "স্বামী", input.spouse, share,
      gender === "male" ? (hasChildOrAgnaticGrandChild ? "সন্তান থাকায় স্ত্রী ১/৮ অংশ পাবেন (সূরা আন-নিসা: ১২)।" : "সন্তান না থাকায় স্ত্রী ১/৪ অংশ পাবেন (সূরা আন-নিসা: ১২)।")
        : (hasChildOrAgnaticGrandChild ? "সন্তান থাকায় স্বামী ১/৪ অংশ পাবেন (সূরা আন-নিসা: ১২)।" : "সন্তান না থাকায় স্বামী ১/২ অংশ পাবেন (সূরা আন-নিসা: ১২)।"));
  }

  if (input.mother > 0) {
    const share = (hasChildOrAgnaticGrandChild || totalSiblings >= 2) ? 1 / 6 : 1 / 3;
    addResult("মাতা", 1, share, share === 1 / 6 ? "সন্তান বা একাধিক ভাই-বোন থাকায় মাতা ১/৬ অংশ পাবেন (সূরা আন-নিসা: ১১)।" : "মাতা ১/৩ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
  }

  let fatherAsaba = false;
  if (input.father > 0) {
    if (hasMaleDescendant) addResult("পিতা", 1, 1 / 6, "পুত্র থাকায় পিতা নির্দিষ্ট ১/৬ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
    else {
      addResult("পিতা", 1, 1 / 6, "পিতা ১/৬ অংশ পাবেন এবং আসাবা হিসেবে অবশিষ্ট ভোগী হবেন (সূরা আন-নিসা: ১১ ও হাদিস)।");
      fatherAsaba = true;
    }
  }

  if (input.father > 0) {
    addExcluded("দাদা", input.paternalGrandFather, "পিতা জীবিত থাকায় দাদা বঞ্চিত (ফিকহ)।");
    addExcluded("দাদি", input.paternalGrandMother, "পিতা জীবিত থাকায় দাদি বঞ্চিত (ফিকহ)।");
  } else {
    let gfAsaba = false;
    if (input.paternalGrandFather > 0) {
      if (hasMaleDescendant) addResult("দাদা", 1, 1 / 6, "পিতা না থাকায় এবং পুত্র থাকায় দাদা ১/৬ অংশ পাবেন (ইজমা)।");
      else {
        addResult("দাদা", 1, 1 / 6, "দাদা ১/৬ অংশ পাবেন এবং আসাবা হিসেবে অবশিষ্ট ভোগী হবেন (ইজমা)।");
        gfAsaba = true;
      }
    }
    if (input.mother > 0) addExcluded("দাদি", input.paternalGrandMother, "মাতা জীবিত থাকায় দাদি বঞ্চিত (ফিকহ)।");
    else if (input.paternalGrandMother > 0) addResult("দাদি", 1, 1 / 6, "মাতা ও পিতা না থাকায় দাদি ১/৬ অংশ পাবেন (সুন্নাহ)।");
    void gfAsaba;
  }

  if (input.mother > 0) addExcluded("নানি", input.maternalGrandMother, "মাতা জীবিত থাকায় নানি বঞ্চিত (ফিকহ)।");
  else if (input.maternalGrandMother > 0 && input.paternalGrandMother === 0) addResult("নানি", 1, 1 / 6, "মাতা না থাকায় নানি ১/৬ অংশ পাবেন (সুন্নাহ)।");

  let daughterTotalShare = 0;
  if (effectiveDaughters > 0 && effectiveSons === 0) {
    daughterTotalShare = Math.min(effectiveDaughters === 1 ? 1 / 2 : 2 / 3, Math.max(remainingShare, 0));
    const perDaughter = daughterTotalShare / effectiveDaughters;
    if (input.daughters > 0) addResult("কন্যা", input.daughters, perDaughter * input.daughters, effectiveDaughters === 1 ? "একমাত্র কন্যা ১/২ অংশ পাবেন (সূরা আন-নিসা: ১১)।" : "একাধিক কন্যা ২/৩ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
    if (input.deadDaughters > 0) addResult("মৃত কন্যার সন্তান", input.deadDaughters, perDaughter * input.deadDaughters, "মৃত কন্যার সন্তানদের অংশ বাংলাদেশে প্রযোজ্য মুসলিম পারিবারিক আইন, ১৯৬১-এর ধারা ৪ অনুযায়ী যাচাই করতে হবে।");
  }

  if (hasChildOrAgnaticGrandChild || input.father > 0 || input.paternalGrandFather > 0) {
    addExcluded("সৎ ভাই (বৈপিত্রেয়)", input.uterineBrothers, "সন্তান, পিতা বা দাদা থাকায় বৈপিত্রেয় ভাই বঞ্চিত।");
    addExcluded("সৎ বোন (বৈপিত্রেয়)", input.uterineSisters, "সন্তান, পিতা বা দাদা থাকায় বৈপিত্রেয় বোন বঞ্চিত।");
  } else {
    const totalUterine = input.uterineBrothers + input.uterineSisters;
    if (totalUterine > 0) {
      const share = Math.min(totalUterine === 1 ? 1 / 6 : 1 / 3, Math.max(remainingShare, 0));
      const perHead = share / totalUterine;
      if (input.uterineBrothers > 0) addResult("সৎ ভাই (বৈপিত্রেয়)", input.uterineBrothers, perHead * input.uterineBrothers, "বৈপিত্রেয় ভাই-বোন সমহারে অংশ পাবেন (সূরা আন-নিসা: ১২)।");
      if (input.uterineSisters > 0) addResult("সৎ বোন (বৈপিত্রেয়)", input.uterineSisters, perHead * input.uterineSisters, "বৈপিত্রেয় ভাই-বোন সমহারে অংশ পাবেন (সূরা আন-নিসা: ১২)।");
    }
  }

  if (hasMaleDescendant || input.father > 0 || input.paternalGrandFather > 0) addExcluded("সহোদর বোন", input.fullSisters, "পুত্র/পিতা/দাদা থাকায় আপন বোন বঞ্চিত।");
  else if (input.fullBrothers === 0 && input.fullSisters > 0) {
    const share = Math.min(input.fullSisters === 1 ? 1 / 2 : 2 / 3, Math.max(remainingShare, 0));
    addResult("সহোদর বোন", input.fullSisters, share, input.fullSisters === 1 ? "আপন ভাই না থাকায় বোন ১/২ অংশ পাবেন (সূরা আন-নিসা: ১৭৬)।" : "আপন ভাই না থাকায় একাধিক বোন ২/৩ অংশ পাবেন (সূরা আন-নিসা: ১৭৬)।");
  }

  if (hasMaleDescendant || input.father > 0 || input.paternalGrandFather > 0 || input.fullBrothers > 0) addExcluded("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, "অগ্রাধিকারপ্রাপ্ত ওয়ারিশ থাকায় বঞ্চিত।");
  else if (input.fullSisters >= 2 && input.consanguineBrothers === 0) addExcluded("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, "একাধিক আপন বোন থাকায় বৈমাত্রেয় বোন বঞ্চিত।");
  else if (input.consanguineBrothers === 0 && input.consanguineSisters > 0) {
    if (input.fullSisters === 1) addResult("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, Math.min(1 / 6, Math.max(remainingShare, 0)), "একজন আপন বোনের সাথে বৈমাত্রেয় বোন ১/৬ অংশ পেতে পারেন (ফিকহ)।");
    else if (input.fullSisters === 0) addResult("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, Math.min(input.consanguineSisters === 1 ? 1 / 2 : 2 / 3, Math.max(remainingShare, 0)), "আপন ভাই-বোন না থাকলে বৈমাত্রেয় বোন নির্দিষ্ট অংশ পেতে পারেন (সূরা আন-নিসা: ১৭৬)।");
  }

  // Sons/daughters as residuaries. Male receives twice the female share.
  if (effectiveSons > 0) {
    const units = effectiveSons * 2 + effectiveDaughters;
    const share = Math.max(remainingShare, 0);
    const unit = share / units;
    if (input.sons > 0) addResult("পুত্র", input.sons, unit * 2 * input.sons, "পুত্র আসাবা হিসেবে অবশিষ্ট সম্পত্তি ২:১ অনুপাতে কন্যার দ্বিগুণ পাবেন।");
    if (input.daughters > 0) addResult("কন্যা", input.daughters, unit * input.daughters, "পুত্রের সাথে কন্যা আসাবা হিসেবে ২:১ অনুপাতে অংশ পাবেন।");
    if (input.deadSons > 0) addExcluded("মৃত পুত্র", input.deadSons, "মৃত পুত্রের সরাসরি অংশ তার জীবিত সন্তান না থাকলে তার মৃত্যুর তারিখে স্থির হয়; এই calculator input-এ মৃত পুত্রকে জীবিত পুত্রের সমতুল্য ধরা যাবে না।");
    if (input.deadDaughters > 0) addExcluded("মৃত কন্যার সন্তান", input.deadDaughters, "মৃত কন্যার সন্তানদের অংশ বাংলাদেশি আইনের ধারা ৪ ও সংশ্লিষ্ট উত্তরাধিকার বিধান অনুযায়ী আলাদাভাবে যাচাই করতে হবে।");
  }

  // If a parent/fixed-share case leaves residue, the existing engine treats the
  // father/grandfather as asaba. Keep that behavior explicit and finite.
  if (remainingShare > 0 && fatherAsaba && input.father > 0) addResult("পিতা (আসাবা অবশিষ্ট)", 1, remainingShare, "নির্দিষ্ট অংশের পর অবশিষ্ট অংশ পিতা আসাবা হিসেবে পাবেন।");

  // Final safety: never emit negative residue caused by floating-point drift.
  remainingShare = Math.max(0, remainingShare);

  const totalEstate = netLand + netGold + netCash;
  return results.map(item => ({
    ...item,
    assets: {
      land: netLand * item.totalShare,
      gold: netGold * item.totalShare,
      cash: netCash * item.totalShare,
      total: totalEstate * item.totalShare,
    },
  }));
}
