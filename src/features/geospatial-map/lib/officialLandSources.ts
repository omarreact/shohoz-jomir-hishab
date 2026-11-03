/**
 * Verified public Ministry/DLRS destinations. This is a navigational reference
 * catalog, NOT a claim of access to those portals' internal GIS APIs.
 * Reviewed 2026-11-03 against land.gov.bd, map.land.gov.bd and settlement.gov.bd.
 */
export type LandSourceKind = "official" | "regional" | "draft" | "reference";

export interface OfficialLandService {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: LandSourceKind;
  source: string;
}

export const OFFICIAL_LAND_SERVICES: readonly OfficialLandService[] = [
  {
    id: "records",
    title: "ভূমি রেকর্ড ও ম্যাপ",
    subtitle: "সরকারি DLRMS খতিয়ান এবং রেকর্ড অনুসন্ধান",
    href: "https://dlrms.land.gov.bd/",
    kind: "official",
    source: "ভূমি মন্ত্রণালয় · DLRMS",
  },
  {
    id: "zoning",
    title: "জাতীয় ভূমি নকশা",
    subtitle: "বিভাগ → জেলা → উপজেলা → মৌজা → শিট → প্লট; চলমান ডিজিটাল জোনিং প্রকল্প",
    href: "https://map.land.gov.bd/",
    kind: "reference",
    source: "ভূমি মন্ত্রণালয় · জাতীয় ভূমি জোনিং",
  },
  {
    id: "mouza",
    title: "সরকারি মৌজা ম্যাপ",
    subtitle: "DLRS জরিপ ম্যাপ খোঁজা ও অনুমোদিত ক্রয়/ডাউনলোড",
    href: "https://map.settlement.gov.bd/",
    kind: "official",
    source: "ভূমি রেকর্ড ও জরিপ অধিদপ্তর",
  },
  {
    id: "settlement",
    title: "চলমান জরিপের খসড়া",
    subtitle: "Settlement পোর্টালের প্রদর্শিত খতিয়ান চূড়ান্ত নয়",
    href: "https://settlement.gov.bd/",
    kind: "draft",
    source: "ভূমি রেকর্ড ও জরিপ অধিদপ্তর",
  },
  {
    id: "fees",
    title: "সরকারি সেবা ফি",
    subtitle: "মিউটেশন, খতিয়ান ও ম্যাপের সরকারি ফি যাচাই",
    href: "https://lsg-portal.land.gov.bd/vumisheba-fee",
    kind: "official",
    source: "ভূমি তথ্য বাতায়ন",
  },
] as const;

/** Published project land-use classes, not computed zoning classifications. */
export const OFFICIAL_LAND_USE_CLASSES = [
  "কৃষি", "আবাসিক", "বনাঞ্চল", "জলমহাল / জলাশয়", "সড়ক ও যোগাযোগ",
  "শিল্প", "চা বাগান", "উপকূলীয় এলাকা", "চরাঞ্চল",
] as const;

export const LAND_SURVEY_LABELS = [
  { code: "CS", name: "Cadastral Survey" },
  { code: "SA", name: "State Acquisition" },
  { code: "RS", name: "Revisional Survey" },
  { code: "BRS", name: "Bangladesh Revisional Survey" },
  { code: "BDS", name: "Bangladesh Digital Survey" },
] as const;

export const OFFICIAL_LAND_HELPLINE = "16122";
export const GIS_COVERAGE_NOTE =
  "RAJUK RS/MS দাগ ও DAP তথ্য কেবল প্রকাশিত পরিকল্পনা এলাকার জন্য। এটি বাংলাদেশের সব মৌজার ক্যাডাস্ট্রাল ডেটাবেস নয়।";
export const LEGAL_SURVEY_NOTE =
  "স্যাটেলাইট ছবি ও GIS মাপ আনুমানিক। জমির মালিকানা, সীমানা ও খতিয়ানের জন্য সংশ্লিষ্ট সরকারি নথি ও প্রত্যয়িত কপি যাচাই করুন।";
