/**
 * Canonical product routes used by navigation and CTAs.
 */
export const FEATURE_ROUTES = {
  home: "/",
  records: "/khatiyan",
  landMeasurement: "/land-measurement",
  inheritance: "/faraez",
  landMap: "/geospatial-map",
  mouzaDownload: "/mouza-map",
  mapQa: "/rajuk-test",
  documents: "/porcha",
  blog: "/blog",
  faq: "/faq",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  login: "/login",
  admin: "/admin",
} as const;

export type FeatureRouteKey = keyof typeof FEATURE_ROUTES;

export const FEATURE_LABELS: Record<FeatureRouteKey, { en: string; bn: string }> = {
  home: { en: "Home", bn: "হোম" },
  records: { en: "Land records", bn: "খতিয়ান" },
  landMeasurement: { en: "Land measurement", bn: "জমি পরিমাপ" },
  inheritance: { en: "Inheritance", bn: "ফারায়েজ" },
  landMap: { en: "GIS map", bn: "GIS মানচিত্র" },
  mouzaDownload: { en: "Download mouza map", bn: "ডাউনলোড মৌজা ম্যাপ" },
  mapQa: { en: "Map QA", bn: "মানচিত্র পরীক্ষা" },
  documents: { en: "Documents", bn: "পর্চা" },
  blog: { en: "Blog", bn: "ব্লগ" },
  faq: { en: "FAQ", bn: "প্রশ্নোত্তর" },
  contact: { en: "Contact", bn: "যোগাযোগ" },
  privacy: { en: "Privacy", bn: "প্রাইভেসি" },
  terms: { en: "Terms", bn: "শর্তাবলী" },
  login: { en: "Staff login", bn: "স্টাফ লগইন" },
  admin: { en: "Admin", bn: "অ্যাডমিন" },
};

export const PRIMARY_NAV_KEYS: FeatureRouteKey[] = [
  "records",
  "landMeasurement",
  "inheritance",
  "landMap",
  "mouzaDownload",
  "mapQa",
  "documents",
  "blog",
];

export const FOOTER_QUICK_LINKS: FeatureRouteKey[] = [
  "records",
  "inheritance",
  "landMeasurement",
  "landMap",
  "mouzaDownload",
  "mapQa",
  "blog",
];

export const FOOTER_LEGAL_LINKS: FeatureRouteKey[] = [
  "privacy",
  "terms",
  "faq",
  "contact",
];
