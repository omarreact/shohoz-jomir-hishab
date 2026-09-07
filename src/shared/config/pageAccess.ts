export const PAGE_ACCESS_LEVELS = [
  "public",
  "logged_in",
  "admin",
  "super_admin",
  "hidden",
] as const;

export type PageAccessLevel = (typeof PAGE_ACCESS_LEVELS)[number];

export type PageAccessCategory =
  | "মূল"
  | "খতিয়ান ও রেকর্ড"
  | "মানচিত্র ও জিআইএস"
  | "হিসাব ও পরিমাপ"
  | "কনটেন্ট ও সহায়তা"
  | "পরীক্ষামূলক";

export type PageAccessDefinition = {
  id: string;
  name: string;
  description: string;
  category: PageAccessCategory;
  defaultAccess: PageAccessLevel;
};

/**
 * User-facing routes that can be controlled from /admin/page-access.
 * System routes (/admin, /api, /login, /403) are intentionally excluded so
 * an incorrect rule can never lock the control plane itself.
 */
export const PAGE_ACCESS_PAGES: readonly PageAccessDefinition[] = [
  {
    id: "/",
    name: "হোম",
    description: "ল্যান্ডবিডির প্রধান পেজ ও সেবা প্রবেশদ্বার।",
    category: "মূল",
    defaultAccess: "public",
  },
  {
    id: "/khatiyan",
    name: "খতিয়ান ক্যালকুলেটর",
    description: "খতিয়ানের জমির অংশ ও হিসাব।",
    category: "খতিয়ান ও রেকর্ড",
    defaultAccess: "public",
  },
  {
    id: "/khatian",
    name: "খতিয়ান পেজ",
    description: "খতিয়ান সম্পর্কিত বিকল্প রুট।",
    category: "খতিয়ান ও রেকর্ড",
    defaultAccess: "public",
  },
  {
    id: "/dlrms-khatian",
    name: "ডিএলআরএমএস খতিয়ান অনুসন্ধান",
    description: "সরকারি পাবলিক ডিএলআরএমএস ডেটা থেকে খতিয়ান অনুসন্ধান।",
    category: "খতিয়ান ও রেকর্ড",
    defaultAccess: "public",
  },
  {
    id: "/settlement-khatian",
    name: "সেটেলমেন্ট খতিয়ান",
    description: "সেটেলমেন্ট খতিয়ান অনুসন্ধান ও তথ্য।",
    category: "খতিয়ান ও রেকর্ড",
    defaultAccess: "public",
  },
  {
    id: "/porcha",
    name: "পর্চা",
    description: "পর্চা সম্পর্কিত সেবা ও তথ্য।",
    category: "খতিয়ান ও রেকর্ড",
    defaultAccess: "public",
  },
  {
    id: "/geospatial-map",
    name: "জিআইএস মানচিত্র",
    description: "বর্তমান আরএস/এমএস ও রাজউক জিআইএস মানচিত্র।",
    category: "মানচিত্র ও জিআইএস",
    defaultAccess: "public",
  },
  {
    id: "/mouza-map",
    name: "মৌজা ম্যাপ",
    description: "মৌজা নির্বাচন, মানচিত্র দেখা ও এক্সপোর্ট।",
    category: "মানচিত্র ও জিআইএস",
    defaultAccess: "public",
  },
  {
    id: "/dap-map",
    name: "রাজউক ড্যাপ ম্যাপ",
    description: "রাজউক ড্যাপ ও সংশ্লিষ্ট ম্যাপ লেয়ার।",
    category: "মানচিত্র ও জিআইএস",
    defaultAccess: "public",
  },
  {
    id: "/map",
    name: "মানচিত্র",
    description: "সাধারণ মানচিত্র রুট।",
    category: "মানচিত্র ও জিআইএস",
    defaultAccess: "public",
  },
  {
    id: "/rajuk-test",
    name: "রাজউক প্লট অনুসন্ধান",
    description: "আরএস/এমএস প্লট পরীক্ষা, মিল ও এক্সপোর্ট।",
    category: "মানচিত্র ও জিআইএস",
    defaultAccess: "public",
  },
  {
    id: "/land-measurement",
    name: "জমি পরিমাপ",
    description: "জমির পরিমাণ ও ইউনিট রূপান্তর।",
    category: "হিসাব ও পরিমাপ",
    defaultAccess: "public",
  },
  {
    id: "/faraez",
    name: "ফারায়েজ ক্যালকুলেটর",
    description: "ইসলামি উত্তরাধিকার হিসাব।",
    category: "হিসাব ও পরিমাপ",
    defaultAccess: "public",
  },
  {
    id: "/history",
    name: "হিসাবের ইতিহাস",
    description: "ব্যবহারকারীর সংরক্ষিত বা সাম্প্রতিক হিসাব।",
    category: "হিসাব ও পরিমাপ",
    defaultAccess: "public",
  },
  {
    id: "/blog",
    name: "ব্লগ",
    description: "প্রকাশিত ভূমি বিষয়ক নিবন্ধের তালিকা।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/blog/[category]/[slug]",
    name: "ব্লগ নিবন্ধ",
    description: "একটি নির্দিষ্ট প্রকাশিত ব্লগ নিবন্ধ।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/p/[slug]",
    name: "কাস্টম পেজ",
    description: "অ্যাডমিন থেকে তৈরি ডাইনামিক কাস্টম পেজ।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/faq",
    name: "প্রশ্নোত্তর",
    description: "সাধারণ প্রশ্ন ও উত্তর।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/contact",
    name: "যোগাযোগ",
    description: "যোগাযোগ ও সহায়তার তথ্য।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/privacy",
    name: "গোপনীয়তা নীতি",
    description: "গোপনীয়তা ও তথ্য ব্যবহারের নীতি।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/terms",
    name: "শর্তাবলি",
    description: "সাইট ব্যবহারের শর্তাবলি।",
    category: "কনটেন্ট ও সহায়তা",
    defaultAccess: "public",
  },
  {
    id: "/ms-test",
    name: "এমএস পরীক্ষামূলক পেজ",
    description: "এমএস প্লট ডেটা যাচাইয়ের পরীক্ষামূলক রুট।",
    category: "পরীক্ষামূলক",
    defaultAccess: "super_admin",
  },
] as const;

const PAGE_ACCESS_IDS = new Set(PAGE_ACCESS_PAGES.map((page) => page.id));
const PAGE_ACCESS_LEVEL_SET = new Set<string>(PAGE_ACCESS_LEVELS);

export function isPageAccessLevel(value: unknown): value is PageAccessLevel {
  return typeof value === "string" && PAGE_ACCESS_LEVEL_SET.has(value);
}

export function getDefaultPageAccessRules(): Record<string, PageAccessLevel> {
  return Object.fromEntries(
    PAGE_ACCESS_PAGES.map((page) => [page.id, page.defaultAccess]),
  ) as Record<string, PageAccessLevel>;
}

export function sanitizePageAccessRules(input: unknown): Record<string, PageAccessLevel> {
  const defaults = getDefaultPageAccessRules();
  if (!input || typeof input !== "object" || Array.isArray(input)) return defaults;

  for (const [pageId, level] of Object.entries(input as Record<string, unknown>)) {
    if (!PAGE_ACCESS_IDS.has(pageId) || !isPageAccessLevel(level)) continue;
    defaults[pageId] = level;
  }
  return defaults;
}

export function normalizeStoredPageAccess(data: unknown): Record<string, PageAccessLevel> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return getDefaultPageAccessRules();
  }
  const record = data as Record<string, unknown>;
  return sanitizePageAccessRules(
    record.rules && typeof record.rules === "object" ? record.rules : record,
  );
}

function routePatternToRegExp(pattern: string): RegExp {
  if (pattern === "/") return /^\/$/;
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[\.\.\.([^\]]+)\\\]/g, ".+")
    .replace(/\\\[([^\]]+)\\\]/g, "[^/]+");
  return new RegExp(`^${escaped}/?$`);
}

export function normalizePagePath(pathname: string): string {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0]?.split("#")[0] || "/";
  if (clean === "/") return "/";
  return clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

export function resolvePageDefinition(pathname: string): PageAccessDefinition | null {
  const normalized = normalizePagePath(pathname);
  const exact = PAGE_ACCESS_PAGES.find((page) => page.id === normalized);
  if (exact) return exact;

  return (
    PAGE_ACCESS_PAGES.find(
      (page) => page.id.includes("[") && routePatternToRegExp(page.id).test(normalized),
    ) ?? null
  );
}

export function getPageAccessLevel(
  pathname: string,
  rules: Record<string, PageAccessLevel>,
): PageAccessLevel {
  const page = resolvePageDefinition(pathname);
  if (!page) return "public";
  return rules[page.id] ?? page.defaultAccess;
}

export function isSystemPageAccessBypass(pathname: string): boolean {
  const path = normalizePagePath(pathname);
  return (
    path === "/403" ||
    path === "/login" ||
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next")
  );
}
