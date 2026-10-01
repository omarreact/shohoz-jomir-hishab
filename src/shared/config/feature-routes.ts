/**
 * Canonical product routes used by navigation, command search and CTAs.
 *
 * Product domains:
 * - records → khatiyan / DLRMS / settlement / history
 * - calculations → measurement / faraez
 * - maps → full-screen GIS / mouza export / staff QA
 * - documents → porcha / report / warish workspaces
 * - guides → blog / FAQ / contact / policy
 */
export const FEATURE_ROUTES = {
  home: "/",
  records: "/khatiyan",
  dlrmsKhatian: "/dlrms-khatian",
  settlementKhatian: "/settlement-khatian",
  mouzaPorchaReport: "/mouza-porcha-report",
  landMeasurement: "/land-measurement",
  inheritance: "/faraez",
  /** Primary interactive RAJUK GIS map */
  landMap: "/geospatial-map",
  mouzaDownload: "/mouza-map",
  /** Staff QA workspace — exposed in navigation only to Admin/Super Admin. */
  mapQa: "/rajuk-test",
  documents: "/porcha",
  warish: "/warish",
  warishSanad: "/warishsanad",
  history: "/history",
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
  dlrmsKhatian: { en: "DLRMS khatian", bn: "ডিএলআরএমএস খতিয়ান" },
  settlementKhatian: { en: "Settlement khatian", bn: "সেটেলমেন্ট খতিয়ান" },
  mouzaPorchaReport: { en: "Mouza porcha report", bn: "মৌজা পর্চা রিপোর্ট" },
  landMeasurement: { en: "Land measurement", bn: "জমি পরিমাপ" },
  inheritance: { en: "Inheritance", bn: "ফারায়েজ" },
  landMap: { en: "RAJUK GIS map", bn: "রাজউক ম্যাপ" },
  mouzaDownload: { en: "Download mouza map", bn: "মৌজা ম্যাপ" },
  mapQa: { en: "Plot area", bn: "প্লট এরিয়া" },
  documents: { en: "Porcha", bn: "পর্চা" },
  warish: { en: "Warish", bn: "ওয়ারিশ" },
  warishSanad: { en: "Warish certificate", bn: "ওয়ারিশ সনদ" },
  history: { en: "History", bn: "ইতিহাস" },
  blog: { en: "Blog", bn: "ব্লগ" },
  faq: { en: "FAQ", bn: "প্রশ্নোত্তর" },
  contact: { en: "Contact", bn: "যোগাযোগ" },
  privacy: { en: "Privacy", bn: "গোপনীয়তা" },
  terms: { en: "Terms", bn: "শর্তাবলি" },
  login: { en: "Staff login", bn: "স্টাফ লগইন" },
  admin: { en: "Admin", bn: "অ্যাডমিন" },
};

/** Public primary navigation route inventory. Navbar groups these into five product domains. */
export const PRIMARY_NAV_KEYS: FeatureRouteKey[] = [
  "records",
  "dlrmsKhatian",
  "settlementKhatian",
  "history",
  "landMeasurement",
  "inheritance",
  "landMap",
  "mouzaDownload",
  "documents",
  "mouzaPorchaReport",
  "warish",
  "warishSanad",
  "blog",
  "faq",
  "contact",
  "terms",
  "privacy",
];

/** Footer quick links (excludes staff-only mapQa). */
export const FOOTER_QUICK_LINKS: FeatureRouteKey[] = [
  "records",
  "dlrmsKhatian",
  "landMeasurement",
  "inheritance",
  "landMap",
  "mouzaDownload",
  "mouzaPorchaReport",
  "warishSanad",
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
  "settlementKhatian",
  "mouzaPorchaReport",
  "landMeasurement",
  "inheritance",
  "landMap",
  "mouzaDownload",
  "documents",
  "warish",
  "warishSanad",
  "blog",
  "faq",
  "contact",
  "privacy",
  "terms",
];
