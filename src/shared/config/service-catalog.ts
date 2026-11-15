import { FEATURE_ROUTES } from "./feature-routes";

export type ServiceCategory = "হিসাব" | "খতিয়ান" | "মানচিত্র";

export type LandService = {
  id: string;
  label: string;
  englishLabel: string;
  href: string;
  category: ServiceCategory;
  summary: string;
  description: string;
  highlights: readonly string[];
};

/** Public service inventory shared by the all-services workspace and navigation QA. */
export const LAND_SERVICES: readonly LandService[] = [
  {
    id: "share-calculator",
    label: "হিস্যা ক্যালকুলেটর",
    englishLabel: "Share Calculator",
    href: FEATURE_ROUTES.records,
    category: "হিসাব",
    summary: "খতিয়ানের জমিতে প্রত্যেক মালিকের হিস্যা ও প্রাপ্য জমি নির্ণয় করুন।",
    description: "মোট জমি, মালিকের অংশ এবং প্রয়োজনীয় একক দিয়ে দ্রুত ও স্বচ্ছভাবে হিস্যার পরিমাণ বের করুন।",
    highlights: ["মালিকভিত্তিক হিস্যা", "বাংলাদেশি ভূমি একক", "পরিষ্কার ফলাফল"],
  },
  {
    id: "land-measurement",
    label: "জমির মাপার ক্যালকুলেটর",
    englishLabel: "Land Measurement Calculator",
    href: FEATURE_ROUTES.landMeasurement,
    category: "হিসাব",
    summary: "জমির দৈর্ঘ্য-প্রস্থ, ক্ষেত্রফল ও প্রচলিত একক রূপান্তর করুন।",
    description: "শতাংশ, কাঠা, বিঘা, একর ও বর্গফুটসহ প্রচলিত এককে জমির পরিমাণ গণনা ও রূপান্তর করুন।",
    highlights: ["একাধিক পরিমাপ পদ্ধতি", "তাৎক্ষণিক একক রূপান্তর", "মোবাইলবান্ধব ইনপুট"],
  },
  {
    id: "faraez",
    label: "ফরায়েজ",
    englishLabel: "Faraez",
    href: FEATURE_ROUTES.inheritance,
    category: "হিসাব",
    summary: "ইসলামি উত্তরাধিকার নীতিতে ওয়ারিশদের প্রাপ্য অংশ হিসাব করুন।",
    description: "ওয়ারিশের সম্পর্ক ও সংখ্যা অনুযায়ী সম্ভাব্য বণ্টন দেখুন এবং সিদ্ধান্তের আগে প্রয়োজনীয় যাচাই সম্পন্ন করুন।",
    highlights: ["ওয়ারিশভিত্তিক বণ্টন", "ধাপে ধাপে ইনপুট", "সহজ ফলাফল সারাংশ"],
  },
  {
    id: "dlrms-khatian",
    label: "ডিএলআরএমএস খতিয়ান",
    englishLabel: "DLRMS Khatian",
    href: FEATURE_ROUTES.dlrmsKhatian,
    category: "খতিয়ান",
    summary: "সরকারি পাবলিক উৎসের ভিত্তিতে ডিজিটাল খতিয়ান অনুসন্ধান করুন।",
    description: "বিভাগ, জেলা, উপজেলা, মৌজা, জরিপ ও খতিয়ান নম্বর নির্বাচন করে উপলভ্য রেকর্ড দেখুন।",
    highlights: ["ধাপভিত্তিক অনুসন্ধান", "মালিক ও দাগের তথ্য", "প্রিন্টযোগ্য ফলাফল"],
  },
  {
    id: "survey-khatian",
    label: "সার্ভে খতিয়ান",
    englishLabel: "Survey Khatian",
    href: FEATURE_ROUTES.surveyKhatian,
    category: "খতিয়ান",
    summary: "সিএস, এসএ, আরএস ও বিআরএস জরিপভিত্তিক খতিয়ান সেবায় প্রবেশ করুন।",
    description: "জরিপের ধরন অনুযায়ী ভূমি রেকর্ড খোঁজা ও সংশ্লিষ্ট খতিয়ান তথ্য দেখার কেন্দ্রীয় প্রবেশপথ।",
    highlights: ["জরিপের ধরন নির্বাচন", "মৌজাভিত্তিক অনুসন্ধান", "ক্যাননিক্যাল রেকর্ড ফ্লো"],
  },
  {
    id: "mouza-khatian-book",
    label: "মৌজা খতিয়ান বই",
    englishLabel: "Mouza Khatian Book",
    href: FEATURE_ROUTES.mouzaKhatianBook,
    category: "খতিয়ান",
    summary: "একটি মৌজার খতিয়ানগুলো একত্র করে বই আকারে দেখুন ও তৈরি করুন।",
    description: "মালিক, অভিভাবক, দাগ ও জমির পরিমাণসহ মৌজাভিত্তিক ধারাবাহিক খতিয়ান নথি প্রস্তুত করুন।",
    highlights: ["মৌজাভিত্তিক তালিকা", "ধারাবাহিক রেকর্ড", "A4 নথি প্রস্তুতি"],
  },
  {
    id: "porcha",
    label: "পর্চা",
    englishLabel: "Porcha",
    href: FEATURE_ROUTES.documents,
    category: "খতিয়ান",
    summary: "LandBD-এর পর্চা সেবা ও প্রাসঙ্গিক নথি প্রস্তুতির সুবিধা নিন।",
    description: "উপলভ্য রেকর্ড থেকে সুসংগঠিত পর্চা ফলাফল দেখুন এবং অনুমোদিত প্রবাহে নথি প্রস্তুত করুন।",
    highlights: ["পরিষ্কার নথি বিন্যাস", "রেকর্ডভিত্তিক তথ্য", "নিরাপদ সদস্য প্রবেশ"],
  },
  {
    id: "geospatial-map",
    label: "জিওস্পেশাল ম্যাপ",
    englishLabel: "Geospatial Map",
    href: FEATURE_ROUTES.landMap,
    category: "মানচিত্র",
    summary: "স্যাটেলাইট, মৌজা ও প্লট স্তরসহ ইন্টার‍্যাক্টিভ ভূমি মানচিত্র ব্যবহার করুন।",
    description: "বেসম্যাপ, লেয়ার, অনুসন্ধান ও ফিচার তথ্য ব্যবহার করে ভূমির অবস্থান ও প্রাসঙ্গিক স্থানিক তথ্য বিশ্লেষণ করুন।",
    highlights: ["MapLibre ইন্টার‍্যাকশন", "লেয়ার নিয়ন্ত্রণ", "প্লট তথ্য প্যানেল"],
  },
  {
    id: "mouza-map",
    label: "মৌজা ম্যাপ",
    englishLabel: "Mouza Map",
    href: FEATURE_ROUTES.mouzaDownload,
    category: "মানচিত্র",
    summary: "মৌজা নির্বাচন করে উপলভ্য মানচিত্র দেখুন ও সংগ্রহের প্রবাহ ব্যবহার করুন।",
    description: "প্রশাসনিক এলাকা ও মৌজা ধরে মানচিত্র খুঁজুন, প্রিভিউ দেখুন এবং অনুমোদিত উৎসের ফাইল ব্যবহার করুন।",
    highlights: ["মৌজা অনুসন্ধান", "মানচিত্র প্রিভিউ", "উৎসের অবস্থা"],
  },
  {
    id: "rajuk-plot",
    label: "রাজউক প্লট অনুসন্ধান",
    englishLabel: "RAJUK Plot Search",
    href: FEATURE_ROUTES.mapQa,
    category: "মানচিত্র",
    summary: "রাজউক এলাকার আরএস/এমএস প্লট তথ্য যাচাইয়ের ওয়ার্কস্পেস খুলুন।",
    description: "অনুমোদিত ব্যবহারকারীরা জেলা, উপজেলা, মৌজা ও দাগ নির্বাচন করে প্লট জ্যামিতি এবং উৎসের তথ্য পরীক্ষা করতে পারবেন।",
    highlights: ["আরএস/এমএস নির্বাচন", "প্লট জ্যামিতি", "নিয়ন্ত্রিত প্রবেশাধিকার"],
  },
] as const;
