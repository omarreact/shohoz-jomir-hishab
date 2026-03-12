import { HeirsInput, HeirResult, DeceasedGender, AssetsInput } from "./types";

export function calculateMuslimFaraez(input: HeirsInput, gender: DeceasedGender, assets: AssetsInput): HeirResult[] {
  let results: Omit<HeirResult, 'assets'>[] = [];
  
  // --- নতুন লজিক: কাফন, ঋণ ও অসিয়ত বাদ দিয়ে নীট সম্পত্তি (Net Assets) বের করা ---
  let netLand = assets.land || 0;
  let netGold = assets.gold || 0;
  let netCash = assets.cash || 0;

  const funeral = assets.funeralCost || 0;
  const debt = assets.debt || 0;
  const wasiyat = assets.wasiyat || 0;
  const totalExpenses = funeral + debt + wasiyat;

  // নগদ টাকা থেকে খরচগুলো বাদ দেওয়া হচ্ছে
  if (totalExpenses > 0) {
    if (netCash >= totalExpenses) {
      netCash -= totalExpenses;
    } else {
      netCash = 0; // নগদ টাকা কম থাকলে আপাতত জিরো হবে
    }
  }
  // -------------------------------------------------------------

  // ১৯৬১ সালের আইন অনুযায়ী মৃত পুত্র/কন্যাকে জীবিত ধরে প্রাথমিক হিসাব হবে
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
    if (count > 0) {
      results.push({ heirType: name, count, fraction: 0, totalShare: 0, reasoning: reason });
    }
  };

  // ১. স্বামী বা স্ত্রী
  if (input.spouse > 0) {
    let share = gender === "male" ? (hasChildOrAgnaticGrandChild ? 1/8 : 1/4) : (hasChildOrAgnaticGrandChild ? 1/4 : 1/2);
    let reason = gender === "male" 
      ? (hasChildOrAgnaticGrandChild ? "সন্তান থাকায় স্ত্রী ১/৮ অংশ পাবেন (সূরা আন-নিসা: ১২)।" : "সন্তান না থাকায় স্ত্রী ১/৪ অংশ পাবেন (সূরা আন-নিসা: ১২)।")
      : (hasChildOrAgnaticGrandChild ? "সন্তান থাকায় স্বামী ১/৪ অংশ পাবেন (সূরা আন-নিসা: ১২)।" : "সন্তান না থাকায় স্বামী ১/২ অংশ পাবেন (সূরা আন-নিসা: ১২)।");
    addResult(gender === "male" ? "স্ত্রী" : "স্বামী", input.spouse, share, reason);
  }

  // ২. মাতা
  if (input.mother > 0) {
    let share = (hasChildOrAgnaticGrandChild || totalSiblings >= 2) ? 1/6 : 1/3;
    let reason = (hasChildOrAgnaticGrandChild || totalSiblings >= 2) ? "সন্তান বা একাধিক ভাই-বোন থাকায় মাতা ১/৬ অংশ পাবেন (সূরা আন-নিসা: ১১)।" : "মাতা ১/৩ অংশ পাবেন (সূরা আন-নিসা: ১১)।";
    addResult("মাতা", 1, share, reason);
  }

  // ৩. পিতা
  let fatherAsaba = false;
  if (input.father > 0) {
    if (hasMaleDescendant) {
      addResult("পিতা", 1, 1/6, "পুত্র থাকায় পিতা নির্দিষ্ট ১/৬ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
    } else {
      addResult("পিতা", 1, 1/6, "পিতা ১/৬ অংশ পাবেন এবং আসাবা হিসেবে অবশিষ্ট ভোগী হবেন (সূরা আন-নিসা: ১১ ও হাদিস)।");
      fatherAsaba = true;
    }
  }

  // ৪. দাদা ও দাদি/নানি
  if (input.father > 0) {
    addExcluded("দাদা", input.paternalGrandFather, "পিতা জীবিত থাকায় দাদা বঞ্চিত (ফিকহ)।");
    addExcluded("দাদি", input.paternalGrandMother, "পিতা জীবিত থাকায় দাদি বঞ্চিত (ফিকহ)।");
  } else {
    let gfAsaba = false;
    if (input.paternalGrandFather > 0) {
      if (hasMaleDescendant) {
        addResult("দাদা", 1, 1/6, "পিতা না থাকায় এবং পুত্র থাকায় দাদা ১/৬ অংশ পাবেন (ইজমা)।");
      } else {
        addResult("দাদা", 1, 1/6, "দাদা ১/৬ অংশ পাবেন এবং আসাবা হিসেবে অবশিষ্ট ভোগী হবেন (ইজমা)।");
        gfAsaba = true;
      }
    }
    if (input.mother > 0) {
      addExcluded("দাদি", input.paternalGrandMother, "মাতা জীবিত থাকায় দাদি বঞ্চিত (ফিকহ)।");
    } else if (input.paternalGrandMother > 0) {
      addResult("দাদি", 1, 1/6, "মাতা ও পিতা না থাকায় দাদি ১/৬ অংশ পাবেন (সুন্নাহ)।");
    }
  }

  if (input.mother > 0) {
    addExcluded("নানি", input.maternalGrandMother, "মাতা জীবিত থাকায় নানি বঞ্চিত (ফিকহ)।");
  } else if (input.maternalGrandMother > 0 && input.paternalGrandMother === 0) {
    addResult("নানি", 1, 1/6, "মাতা না থাকায় নানি ১/৬ অংশ পাবেন (সুন্নাহ)।");
  }

  // ৫. কন্যারা (জীবিত ও মৃত)
  let daughterTotalShare = 0;
  if (effectiveDaughters > 0 && effectiveSons === 0) {
    daughterTotalShare = effectiveDaughters === 1 ? 1/2 : 2/3;
    daughterTotalShare = Math.min(daughterTotalShare, remainingShare);
    const perDaughter = daughterTotalShare / effectiveDaughters;
    
    if (input.daughters > 0) addResult("কন্যা", input.daughters, perDaughter * input.daughters, effectiveDaughters === 1 ? "একমাত্র কন্যা ১/২ অংশ পাবেন (সূরা আন-নিসা: ১১)।" : "একাধিক কন্যা ২/৩ অংশ পাবেন (সূরা আন-নিসা: ১১)।");
    if (input.deadDaughters > 0) addResult("মৃত কন্যার সন্তান", input.deadDaughters, perDaughter * input.deadDaughters, "মৃত কন্যার সন্তানরা তাদের মায়ের প্রাপ্য অংশ পাবেন (মুসলিম পারিবারিক আইন ১৯৬১, ধারা ৪)।");
  }

  // ৬. সৎ ভাই-বোন (বৈপিত্রেয়)
  if (hasChildOrAgnaticGrandChild || input.father > 0 || input.paternalGrandFather > 0) {
    addExcluded("সৎ ভাই (বৈপিত্রেয়)", input.uterineBrothers, "সন্তান, পিতা বা দাদা থাকায় বৈপিত্রেয় ভাই বঞ্চিত।");
    addExcluded("সৎ বোন (বৈপিত্রেয়)", input.uterineSisters, "সন্তান, পিতা বা দাদা থাকায় বৈপিত্রেয় বোন বঞ্চিত।");
  } else {
    const totalUterine = input.uterineBrothers + input.uterineSisters;
    if (totalUterine > 0) {
      let share = totalUterine === 1 ? 1/6 : 1/3;
      share = Math.min(share, remainingShare);
      const perHead = share / totalUterine;
      if (input.uterineBrothers > 0) addResult("সৎ ভাই (বৈপিত্রেয়)", input.uterineBrothers, perHead * input.uterineBrothers, "বৈপিত্রেয় ভাই-বোন সমহারে অংশ পাবেন (সূরা আন-নিসা: ১২)।");
      if (input.uterineSisters > 0) addResult("সৎ বোন (বৈপিত্রেয়)", input.uterineSisters, perHead * input.uterineSisters, "বৈপিত্রেয় ভাই-বোন সমহারে অংশ পাবেন (সূরা আন-নিসা: ১২)।");
    }
  }

  // ৭. আপন বোন (যদি ভাই না থাকে)
  if (hasMaleDescendant || input.father > 0 || input.paternalGrandFather > 0) {
    addExcluded("সহোদর বোন", input.fullSisters, "পুত্র/পিতা/দাদা থাকায় আপন বোন বঞ্চিত।");
  } else if (input.fullBrothers === 0 && input.fullSisters > 0) {
    let share = input.fullSisters === 1 ? 1/2 : 2/3;
    share = Math.min(share, remainingShare);
    addResult("সহোদর বোন", input.fullSisters, share, input.fullSisters === 1 ? "আপন ভাই না থাকায় বোন ১/২ অংশ পাবেন (সূরা আন-নিসা: ১৭৬)।" : "আপন ভাই না থাকায় একাধিক বোন ২/৩ অংশ পাবেন (সূরা আন-নিসা: ১৭৬)।");
  }

  // ৮. সৎ বোন (বৈমাত্রেয়)
  if (hasMaleDescendant || input.father > 0 || input.paternalGrandFather > 0 || input.fullBrothers > 0) {
    addExcluded("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, "অগ্রাধিকারপ্রাপ্ত ওয়ারিশ থাকায় বঞ্চিত।");
  } else if (input.fullSisters >= 2 && input.consanguineBrothers === 0) {
    addExcluded("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, "একাধিক আপন বোন থাকায় বৈমাত্রেয় বোন বঞ্চিত।");
  } else if (input.consanguineBrothers === 0 && input.consanguineSisters > 0) {
    if (input.fullSisters === 1) {
      let share = 1/6;
      share = Math.min(share, remainingShare);
      addResult("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, share, "এক আপন বোন থাকায় ২/৩ পূর্ণ করতে ১/৬ অংশ পাবেন (হাদিস)।");
    } else if (input.fullSisters === 0) {
      let share = input.consanguineSisters === 1 ? 1/2 : 2/3;
      share = Math.min(share, remainingShare);
      addResult("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, share, input.consanguineSisters === 1 ? "আপন ভাই-বোন না থাকায় ১/২ অংশ পাবেন।" : "আপন ভাই-বোন না থাকায় ২/৩ অংশ পাবেন।");
    }
  }

  // --- আসাবা (Residuaries) - অবশিষ্টভোগী ---
  if (remainingShare > 0.0001) {
    if (effectiveSons > 0 || effectiveDaughters > 0) {
      if (effectiveSons > 0) {
        const parts = (effectiveSons * 2) + effectiveDaughters;
        const val = remainingShare / parts;
        if (input.sons > 0) addResult("পুত্র", input.sons, val * 2 * input.sons, "অবশিষ্টভোগী হিসেবে পুত্র ও কন্যা ২:১ হারে পাবেন (সূরা আন-নিসা: ১১)।");
        if (input.deadSons > 0) addResult("মৃত পুত্রের সন্তান", input.deadSons, val * 2 * input.deadSons, "মৃত পুত্রের সন্তানরা তাদের পিতার অংশ পাবেন (পারিবারিক আইন ১৯৬১: ৪)।");
        if (input.daughters > 0) addResult("কন্যা", input.daughters, val * input.daughters, "অবশিষ্টভোগী হিসেবে পুত্র ও কন্যা ২:১ হারে পাবেন (সূরা আন-নিসা: ১১)।");
        if (input.deadDaughters > 0) addResult("মৃত কন্যার সন্তান", input.deadDaughters, val * input.deadDaughters, "মৃত কন্যার সন্তানরা তাদের মায়ের অংশ পাবেন (পারিবারিক আইন ১৯৬১: ৪)।");
        remainingShare = 0;
      }
    } else if (fatherAsaba) {
      const idx = results.findIndex(r => r.heirType === "পিতা");
      results[idx].totalShare += remainingShare;
      results[idx].fraction = results[idx].totalShare;
      remainingShare = 0;
    } else if (input.paternalGrandFather > 0 && !fatherAsaba) {
      const idx = results.findIndex(r => r.heirType === "দাদা");
      if (idx !== -1) {
        results[idx].totalShare += remainingShare;
        results[idx].fraction = results[idx].totalShare;
        remainingShare = 0;
      }
    } else if (input.fullBrothers > 0 || input.fullSisters > 0) {
      if (input.fullBrothers > 0) {
        const parts = (input.fullBrothers * 2) + input.fullSisters;
        const val = remainingShare / parts;
        addResult("সহোদর ভাই", input.fullBrothers, val * 2 * input.fullBrothers, "অবশিষ্টভোগী হিসেবে ভাই ও বোন ২:১ হারে পাবেন (সূরা আন-নিসা: ১৭৬)।");
        if (input.fullSisters > 0) addResult("সহোদর বোন", input.fullSisters, val * input.fullSisters, "অবশিষ্টভোগী হিসেবে ভাই ও বোন ২:১ হারে পাবেন (সূরা আন-নিসা: ১৭৬)।");
        remainingShare = 0;
      } else if (input.fullSisters > 0 && input.daughters > 0) {
        addResult("সহোদর বোন", input.fullSisters, remainingShare, "কন্যাদের উপস্থিতিতে আপন বোন অবশিষ্টভোগী (আসাবা) হবেন (হাদিস)।");
        remainingShare = 0;
      }
    } else if (input.consanguineBrothers > 0 || input.consanguineSisters > 0) {
      if (input.consanguineBrothers > 0) {
        const parts = (input.consanguineBrothers * 2) + input.consanguineSisters;
        const val = remainingShare / parts;
        addResult("সৎ ভাই (বৈমাত্রেয়)", input.consanguineBrothers, val * 2 * input.consanguineBrothers, "অবশিষ্টভোগী হিসেবে বৈমাত্রেয় ভাই ও বোন ২:১ হারে পাবেন।");
        if (input.consanguineSisters > 0) addResult("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, val * input.consanguineSisters, "অবশিষ্টভোগী হিসেবে বৈমাত্রেয় ভাই ও বোন ২:১ হারে পাবেন।");
        remainingShare = 0;
      } else if (input.consanguineSisters > 0 && input.daughters > 0) {
        addResult("সৎ বোন (বৈমাত্রেয়)", input.consanguineSisters, remainingShare, "কন্যাদের উপস্থিতিতে বৈমাত্রেয় বোন অবশিষ্টভোগী হবেন (হাদিস)।");
        remainingShare = 0;
      }
    } else {
      const asabaList = [
        { name: "সহোদর ভাইয়ের পুত্র", count: input.fullBrotherSon },
        { name: "সৎ ভাই(বৈমাত্রেয়)-এর পুত্র", count: input.consBrotherSon },
        { name: "সহোদর ভাইয়ের পুত্রের পুত্র", count: input.fullBrotherSonSon },
        { name: "সৎ ভাই(বৈমাত্রেয়)-এর পুত্রের পুত্র", count: input.consBrotherSonSon },
        { name: "চাচা", count: input.fullPaternalUncle },
        { name: "চাচা (বৈমাত্রেয়)", count: input.consPaternalUncle },
        { name: "চাচাতো ভাই", count: input.fullCousin },
        { name: "চাচাতো ভাই (বৈমাত্রেয়)", count: input.consCousin },
        { name: "চাচাতো ভাইয়ের পুত্র", count: input.fullCousinSon },
        { name: "চাচাতো ভাই (বৈমাত্রেয়) এর পুত্র", count: input.consCousinSon },
        { name: "চাচাতো ভাইয়ের পুত্রের পুত্র", count: input.fullCousinSonSon },
        { name: "চাচাতো ভাই (বৈমাত্রেয়)এর পুত্রের পুত্র", count: input.consCousinSonSon },
      ];

      for (const heir of asabaList) {
        if (heir.count > 0 && remainingShare > 0) {
          addResult(heir.name, heir.count, remainingShare, `নিকটতম পুরুষ আত্মীয় হিসেবে অবশিষ্টভোগী বা আসাবা হবেন (হাদিস: বুখারী ও মুসলিম)।`);
          remainingShare = 0;
          break; 
        } else if (heir.count > 0) {
           addExcluded(heir.name, heir.count, "উর্ধ্বতন অগ্রাধিকারপ্রাপ্ত ওয়ারিশ থাকায় বঞ্চিত।");
        }
      }
    }
  }

  // Aul (আউল) Adjustment
  const totalCalculatedShare = results.reduce((acc, curr) => acc + curr.totalShare, 0);
  if (totalCalculatedShare > 1.0001) {
    results = results.map(r => {
      const adjustedFraction = r.fraction / totalCalculatedShare;
      return {
        ...r,
        fraction: adjustedFraction,
        totalShare: adjustedFraction * r.count,
        reasoning: r.reasoning + " (অংশ বেশি হওয়ায় 'আউল' নীতিতে কমানো হয়েছে)।"
      };
    });
  }

  // নতুন আপডেটেড সম্পত্তিতে রূপান্তর (Net Assets দিয়ে)
  return results.map(r => ({
    ...r,
    assets: {
      land: r.totalShare > 0 ? (netLand * r.fraction) : 0,
      gold: r.totalShare > 0 ? (netGold * r.fraction) : 0,
      cash: r.totalShare > 0 ? (netCash * r.fraction) : 0,
    }
  }));
}