/**
 * Canonical product routes used by navigation and CTAs.
 *
 * Product maps:
 * - landMap → /geospatial-map (primary full-screen GIS map; satellite/public mode + authenticated advanced controls)
 * - mouzaDownload → /mouza-map (mouza select/export)
 * Legacy /dap-map and /map URLs redirect to /geospatial-map.
 */
export const FEATURE_ROUTES = {
  home: "/",
  records: "/khatiyan",
  dlrmsKhatian: "/dlrms-khatian",
  landMeasurement: "/land-measurement",
  inheritance: "/faraez",
  /** Primary interactive RAJUK GIS map */
  landMap: "/geospatial-map",
  mouzaDownload: "/mouza-map",
  /** Staff QA workspace — not in public nav/sitemap. */
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
  dlrmsKhatian: { en: "DLRMS khatian", bn: "DLRMS খতিয়ান" },
  landMeasurement: { en: "Land measurement", bn: "জমি পরিমাপ" },
  inheritance: { en: "Inheritance", bn: "ফারায়েজ" },
  landMap: { en: "RAJUK GIS map", bn: "রাজউক ম্যাপ" },
  mouzaDownload: { en: "Download mouza map", bn: "মৌজা ম্যাপ" },
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

/** Public primary navigation (excludes staff-only mapQa). */
export const PRIMARY_NAV_KEYS: FeatureRouteKey[] = [
  "records",
  "dlrmsKhatian",
  "landMeasurement",
  "inheritance",
  "landMap",
  "mouzaDownload",
  "documents",
  "blog",
];

/** Footer quick links (excludes staff-only mapQa). */
export const FOOTER_QUICK_LINKS: FeatureRouteKey[] = [
  "records",
  "dlrmsKhatian",
  "inheritance",
  "landMeasurement",
  "landMap",
  "mouzaDownload",
  "blog",
];

export const FOOTER_LEGAL_LINKS: FeatureRouteKey[] = [
  "privacy",
  "terms",
  "faq",
  "contact",
];

/** Routes safe to list in public sitemap.xml */
export const PUBLIC_SITEMAP_KEYS: FeatureRouteKey[] = [
  "home",
  "records",
  "dlrmsKhatian",
  "landMeasurement",
  "inheritance",
  "landMap",
  "mouzaDownload",
  "documents",
  "blog",
  "faq",
  "contact",
  "privacy",
  "terms",
];
