export type Religion = "muslim" | "hindu";
export type DeceasedGender = "male" | "female";

export interface AssetsInput {
  land: number;
  gold: number;
  cash: number;
}

export interface HeirsInput {
  spouse: number; // স্বামী বা স্ত্রী
  sons: number; // পুত্র
  deadSons: number; // মৃত পুত্র
  daughters: number; // কন্যা
  deadDaughters: number; // মৃত কন্যা
  father: number; // পিতা
  mother: number; // মাতা
  paternalGrandFather: number; // দাদা
  paternalGrandMother: number; // দাদি
  maternalGrandMother: number; // নানি
  fullBrothers: number; // সহোদর ভাই
  fullSisters: number; // সহোদর বোন
  consanguineBrothers: number; // সৎ ভাই (বৈমাত্রেয়)
  consanguineSisters: number; // সৎ বোন (বৈমাত্রেয়)
  uterineBrothers: number; // সৎ ভাই (বৈপিত্রেয়)
  uterineSisters: number; // সৎ বোন (বৈপিত্রেয়)
  
  // আসাবা (অবশিষ্টভোগী পুরুষ আত্মীয়)
  fullBrotherSon: number; // সহোদর ভাইয়ের পুত্র
  consBrotherSon: number; // সৎ ভাই(বৈমাত্রেয়)-এর পুত্র
  fullBrotherSonSon: number; // সহোদর ভাইয়ের পুত্রের পুত্র
  consBrotherSonSon: number; // সৎ ভাই(বৈমাত্রেয়)-এর পুত্রের পুত্র
  fullPaternalUncle: number; // চাচা
  consPaternalUncle: number; // চাচা (বৈমাত্রেয়)
  fullCousin: number; // চাচাতো ভাই
  consCousin: number; // চাচাতো ভাই (বৈমাত্রেয়)
  fullCousinSon: number; // চাচাতো ভাইয়ের পুত্র
  consCousinSon: number; // চাচাতো ভাই (বৈমাত্রেয়) এর পুত্র
  fullCousinSonSon: number; // চাচাতো ভাইয়ের পুত্রের পুত্র
  consCousinSonSon: number; // চাচাতো ভাই (বৈমাত্রেয়)এর পুত্রের পুত্র
}

export interface HeirResult {
  heirType: string;
  count: number;
  fraction: number;
  totalShare: number;
  reasoning: string;
  assets: {
    land: number;
    gold: number;
    cash: number;
  };
}