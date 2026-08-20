/**
 * Canonical product routes used by navigation and CTAs.
 *
 * Urban planning map = merged Geospatial + LIOS experience at /geospatial-map.
 * /lios-map and legacy paths redirect into that page.
 * Internal RAJUK/tile API identifiers remain technical.
 */
export const FEATURE_ROUTES = {
  home: "/",
  records: "/khatiyan",
  landMeasurement: "/land-measurement",
  inheritance: "/faraez",
  /** Unified নগর পরিকল্পনা মানচিত্র (Geospatial + LIOS). */
  landMap: "/geospatial-map",
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
