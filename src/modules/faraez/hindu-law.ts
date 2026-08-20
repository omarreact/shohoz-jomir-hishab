import { HeirsInput, HeirResult, DeceasedGender, AssetsInput } from "./types";

export function calculateHinduDayabhaga(input: HeirsInput, gender: DeceasedGender, assets: AssetsInput): HeirResult[] {
  const results: Omit<HeirResult, 'assets'>[] = [];
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

  if (gender === "male") {
    // ==============================================
    // পুরুষ মৃত ব্যক্তির ক্ষেত্রে (Dayabhaga Law for Males)
    // ==============================================
    
    // ১. পুত্র এবং স্ত্রী (বিধবা) - হিন্দু ওমেন্স রাইটস টু প্রপার্টি অ্যাক্ট, ১৯৩৭ অনুযায়ী স্ত্রী পুত্রের সমান অংশ পান
    if (input.sons > 0 || input.spouse > 0) {
      const totalPrimaryHeirs = input.sons + input.spouse;
      const perHeadShare = 1 / totalPrimaryHeirs;

      if (input.sons > 0) {
        addResult("পুত্র", input.sons, perHeadShare * input.sons, "পুত্র প্রথম শ্রেণীর উত্তরাধিকারী হিসেবে সমভাবে সম্পত্তি পাবেন।");
      }
      if (input.spouse > 0) {
        addResult("স্ত্রী (বিধবা)", input.spouse, perHeadShare * input.spouse, "১৯৩৭ সালের আইন অনুযায়ী বিধবা স্ত্রী পুত্রের সমান অংশ (জীবনস্বত্বে) পাবেন।");
      }
      
      // বাকিদের বঞ্চিত করা
      addExcluded("কন্যা", input.daughters, "পুত্র জীবিত থাকায় কন্যারা বঞ্চিত।");
      addExcluded("পিতা", input.father, "পুত্র/স্ত্রী থাকায় পিতা বঞ্চিত।");
      addExcluded("মাতা", input.mother, "পুত্র/স্ত্রী থাকায় মাতা বঞ্চিত।");
      addExcluded("সহোদর ভাই", input.fullBrothers, "অগ্রাধিকারপ্রাপ্ত ওয়ারিশ থাকায় বঞ্চিত।");
    } 
    // ২. কন্যা
    else if (input.daughters > 0) {
      addResult("কন্যা", input.daughters, 1, "পুত্র ও স্ত্রী না থাকায় কন্যারা সম্পূর্ণ সম্পত্তি সমভাগে পাবেন।");
    } 
    // ৩. পিতা
    else if (input.father > 0) {
      addResult("পিতা", 1, 1, "পূর্ববর্তী কেউ না থাকায় পিতা সম্পূর্ণ সম্পত্তি পাবেন।");
    } 
    // ৪. মাতা
    else if (input.mother > 0) {
      addResult("মাতা", 1, 1, "পূর্ববর্তী কেউ না থাকায় মাতা সম্পূর্ণ সম্পত্তি পাবেন।");
    } 
    // ৫. সহোদর ভাই (Full Brothers)
    else if (input.fullBrothers > 0) {
      addResult("সহোদর ভাই", input.fullBrothers, 1, "পূর্ববর্তী কেউ না থাকায় সহোদর ভাইয়েরা সম্পূর্ণ সম্পত্তি পাবেন।");
    } 
    // ৬. সৎ ভাই (Half Brothers)
    else if (input.consanguineBrothers > 0) {
      addResult("সৎ ভাই (বৈমাত্রেয়)", input.consanguineBrothers, 1, "সহোদর ভাই না থাকায় বৈমাত্রেয় ভাইয়েরা সম্পত্তি পাবেন।");
    } 
    // ৭. সহোদর ভাইয়ের পুত্র
    else if (input.fullBrotherSon > 0) {
      addResult("সহোদর ভাইয়ের পুত্র", input.fullBrotherSon, 1, "পূর্ববর্তী কেউ না থাকায় ভাইয়ের পুত্ররা সমভাগে সম্পত্তি পাবেন।");
    }
    // ৮. সৎ ভাইয়ের পুত্র
    else if (input.consBrotherSon > 0) {
      addResult("সৎ ভাই(বৈমাত্রেয়)-এর পুত্র", input.consBrotherSon, 1, "পূর্ববর্তী কেউ না থাকায় সৎ ভাইয়ের পুত্ররা সম্পত্তি পাবেন।");
    }
    // ৯. দাদা
    else if (input.paternalGrandFather > 0) {
      addResult("দাদা", 1, 1, "পূর্ববর্তী কেউ না থাকায় দাদা সম্পূর্ণ সম্পত্তি পাবেন।");
    }
    // ১০. দাদি
    else if (input.paternalGrandMother > 0) {
      addResult("দাদি", 1, 1, "দাদা না থাকায় দাদি সম্পূর্ণ সম্পত্তি পাবেন।");
    }
    // ১১. চাচা
    else if (input.fullPaternalUncle > 0) {
      addResult("চাচা", input.fullPaternalUncle, 1, "পূর্ববর্তী কেউ না থাকায় চাচারা সমভাগে সম্পত্তি পাবেন।");
    }
    // ১২. আপন বোন (দায়ভাগ আইনে বোন সপিণ্ড নয়, তবে কাস্টম বা অন্যান্য সংশোধনী অনুযায়ী কিছু ক্ষেত্রে পান)
    else if (input.fullSisters > 0) {
      addResult("সহোদর বোন", input.fullSisters, 1, "অন্যান্য পুরুষ সপিণ্ড না থাকায় বোন সম্পূর্ণ সম্পত্তি পাবেন।");
    } else {
      // যদি অন্য কেউ থাকে কিন্তু লজিকে না পড়ে
      results.push({ heirType: "অন্যান্য", count: 1, fraction: 0, totalShare: 0, reasoning: "উত্তরাধিকারীর সিরিয়ালে কেউ নেই।" });
    }

  } else {
    // ==============================================
    // মহিলা মৃত ব্যক্তির ক্ষেত্রে (Stridhana Law - Simplified)
    // ==============================================
    // মহিলাদের সম্পত্তির (স্ত্রীধন) বন্টন দায়ভাগ আইনে অত্যন্ত জটিল (যৌতুক, অযৌতুক ইত্যাদি)। 
    // এখানে একটি সাধারণ সর্বজনীন ক্রম ব্যবহার করা হলো।

    if (input.sons > 0 || input.daughters > 0) {
      const totalChildren = input.sons + input.daughters;
      const perHeadShare = 1 / totalChildren;

      if (input.sons > 0) addResult("পুত্র", input.sons, perHeadShare * input.sons, "স্ত্রীধনের উত্তরাধিকারী হিসেবে পুত্র সমভাগে পাবেন।");
      if (input.daughters > 0) addResult("কন্যা", input.daughters, perHeadShare * input.daughters, "স্ত্রীধনের উত্তরাধিকারী হিসেবে কন্যা সমভাগে পাবেন।");
      
      addExcluded("স্বামী", input.spouse, "সন্তান থাকায় স্বামী বঞ্চিত।");
    } 
    else if (input.spouse > 0) {
      addResult("স্বামী", input.spouse, 1, "সন্তান না থাকায় স্বামী সম্পূর্ণ স্ত্রীধন পাবেন।");
    } 
    else if (input.mother > 0) {
      addResult("মাতা", 1, 1, "সন্তান ও স্বামী না থাকায় মাতা সম্পূর্ণ সম্পত্তি পাবেন।");
    } 
    else if (input.father > 0) {
      addResult("পিতা", 1, 1, "পূর্ববর্তী কেউ না থাকায় পিতা সম্পূর্ণ সম্পত্তি পাবেন।");
    } 
    else if (input.fullBrothers > 0) {
      addResult("সহোদর ভাই", input.fullBrothers, 1, "পিতা-মাতা না থাকায় ভাইয়েরা সম্পূর্ণ সম্পত্তি পাবেন।");
    }
    else if (input.fullSisters > 0) {
      addResult("সহোদর বোন", input.fullSisters, 1, "পূর্ববর্তী কেউ না থাকায় বোনেরা সম্পূর্ণ সম্পত্তি পাবেন।");
    }
  }

  // বঞ্চনার কারণ যুক্ত করা (যারা কিছুই পায়নি এবং লজিকে excluded হয়নি)
  const checkExcluded = (name: string, count: number) => {
    if (count > 0 && !results.some(r => r.heirType === name)) {
      addExcluded(name, count, "উর্ধ্বতন অগ্রাধিকারপ্রাপ্ত ওয়ারিশ থাকায় বঞ্চিত (দায়ভাগ আইন)।");
    }
  };

  checkExcluded("স্ত্রী (বিধবা)", input.spouse);
  checkExcluded("স্বামী", input.spouse);
  checkExcluded("পুত্র", input.sons);
  checkExcluded("কন্যা", input.daughters);
  checkExcluded("পিতা", input.father);
  checkExcluded("মাতা", input.mother);
  checkExcluded("সহোদর ভাই", input.fullBrothers);
  checkExcluded("সহোদর বোন", input.fullSisters);
  checkExcluded("দাদা", input.paternalGrandFather);
  checkExcluded("দাদি", input.paternalGrandMother);
  checkExcluded("নানি", input.maternalGrandMother);
  checkExcluded("সৎ ভাই (বৈমাত্রেয়)", input.consanguineBrothers);
  checkExcluded("চাচা", input.fullPaternalUncle);
  checkExcluded("সহোদর ভাইয়ের পুত্র", input.fullBrotherSon);

  // সম্পত্তিতে রূপান্তর (Assets Calculation)
  return results.map(r => ({
    ...r,
    assets: {
      land: r.totalShare > 0 ? (assets.land * r.fraction) : 0,
      gold: r.totalShare > 0 ? (assets.gold * r.fraction) : 0,
      cash: r.totalShare > 0 ? (assets.cash * r.fraction) : 0,
    }
  }));
}
