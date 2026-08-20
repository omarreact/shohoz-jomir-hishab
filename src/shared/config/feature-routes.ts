/**
 * Canonical product routes used by navigation and CTAs.
 * URL paths stay as-is for Phase 1; future redirects may map
 * e.g. /khatiyan → /records without breaking bookmarks.
 *
 * UI labels for maps use neutral product language; internal API
 * paths and RAJUK service identifiers remain technical.
 */
export const FEATURE_ROUTES = {
  home: "/",
  records: "/khatiyan",
  landMeasurement: "/land-measurement",
  inheritance: "/faraez",
  landMap: "/dap-map",
  mapQa: "/rajuk-test",
  documents: "/porcha",
  blog: "/blog",
  faq: "/faq",
  login: "/login",
  admin: "/admin",
} as const;

export type FeatureRouteKey = keyof typeof FEATURE_ROUTES;

/** Product-facing labels (bn-first where used in shell). */
export const FEATURE_LABELS: Record<FeatureRouteKey, { en: string; bn: string }> = {
  home: { en: "Home", bn: "হোম" },
  records: { en: "Land records", bn: "খতিয়ান" },
  landMeasurement: { en: "Land measurement", bn: "জমি পরিমাপ" },
  inheritance: { en: "Inheritance", bn: "ফারায়েজ" },
  landMap: { en: "Urban planning map", bn: "নগর পরিকল্পনা মানচিত্র" },
  mapQa: { en: "Map QA", bn: "মানচিত্র পরীক্ষা" },
  documents: { en: "Documents", bn: "পর্চা" },
  blog: { en: "Blog", bn: "ব্লগ" },
  faq: { en: "FAQ", bn: "প্রশ্নোত্তর" },
  login: { en: "Login", bn: "লগইন" },
  admin: { en: "Admin", bn: "অ্যাডমিন" },
};

/** Primary public tools shown in global navigation. */
export const PRIMARY_NAV_KEYS: FeatureRouteKey[] = [
  "records",
  "landMeasurement",
  "inheritance",
  "landMap",
  "documents",
  "blog",
];
