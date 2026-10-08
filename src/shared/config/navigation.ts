import type { FeatureRouteKey } from "./feature-routes";
import { FEATURE_LABELS, FEATURE_ROUTES } from "./feature-routes";
import { LEGACY_ROUTE_REDIRECTS } from "../routing/route-registry";

/** One source of navigation group/order for desktop, mobile and footer. */
export const NAV_SECTIONS = [
  { id: "records", label: "রেকর্ড", keys: ["records", "dlrmsKhatian", "settlementKhatian", "history"] },
  { id: "calculations", label: "হিসাব", keys: ["landMeasurement", "inheritance"] },
  { id: "maps", label: "মানচিত্র", keys: ["landMap", "mouzaDownload", "mapQa"] },
  { id: "documents", label: "ডকুমেন্ট", keys: ["documents", "mouzaPorchaReport", "warish", "warishSanad"] },
  { id: "guides", label: "গাইড", keys: ["blog", "faq", "contact", "terms", "privacy"] },
] as const satisfies ReadonlyArray<{ id: string; label: string; keys: readonly FeatureRouteKey[] }>;

/** Compact mobile sheet. Labels and destination paths resolve from feature routes. */
export const MOBILE_MENU_KEYS = [
  "dlrmsKhatian", "landMeasurement", "inheritance",
  "mouzaDownload", "mouzaPorchaReport", "warishSanad", "blog",
] as const satisfies readonly FeatureRouteKey[];

/** Segment-safe active state for nested routes and canonical URL aliases. */
export function isFeatureRouteActive(pathname: string, destination: string): boolean {
  const normalize = (url: string) => {
    const path = (url.split(/[?#]/, 1)[0] || "/").replace(/\/+$/, "") || "/";
    return LEGACY_ROUTE_REDIRECTS.find((r) => r.source === path)?.destination ?? path;
  };
  const current = normalize(pathname);
  const target = normalize(destination);
  return target === "/" ? current === "/" : current === target || current.startsWith(target + "/");
}

export function featureSection(key: FeatureRouteKey) {
  return NAV_SECTIONS.find(section => (section.keys as readonly FeatureRouteKey[]).includes(key));
}

export function navRoute(key: FeatureRouteKey) {
  return { key, href: FEATURE_ROUTES[key], label: FEATURE_LABELS[key].bn, group: featureSection(key)?.label ?? "" };
}

/** Help search and navigation use only declared reachable destinations. */
export function navRouteExists(path: string): boolean {
  return Object.values(FEATURE_ROUTES).some(url => isFeatureRouteActive(path, url));
}
