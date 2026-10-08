import { PAGE_ACCESS_PAGES, normalizePagePath } from "../config/pageAccess";
import type { AppRole } from "@/src/modules/auth/roles";

/**
 * Canonical routing inventory for navigation, server RBAC and regression QA.
 * User-facing page access metadata remains sourced from PAGE_ACCESS_PAGES so
 * Firestore's existing page-access editor does not need a data migration.
 */
export const LEGACY_ROUTE_REDIRECTS = [
  { source: "/khatian", destination: "/khatiyan", permanent: true },
  { source: "/survey-khatian", destination: "/dlrms-khatian", permanent: true },
  { source: "/map", destination: "/geospatial-map", permanent: true },
  { source: "/dap-map", destination: "/geospatial-map", permanent: true },
] as const;

export type AdminMinimumRole = "staff" | "admin" | "super_admin";
export const ADMIN_ROUTE_REGISTRY: readonly {
  path: string;
  name: string;
  minimumRole: AdminMinimumRole;
}[] = [
  { path: "/admin", name: "ড্যাশবোর্ড", minimumRole: "staff" },
  { path: "/admin/blog", name: "ব্লগ ম্যানেজমেন্ট", minimumRole: "staff" },
  { path: "/admin/custom-pages", name: "কাস্টম পেজ", minimumRole: "staff" },
  { path: "/admin/qr-verification", name: "QR ভেরিফিকেশন", minimumRole: "staff" },
  { path: "/admin/users", name: "ইউজার ম্যানেজমেন্ট", minimumRole: "admin" },
  { path: "/admin/data-monitor", name: "ডেটা মনিটর", minimumRole: "admin" },
  { path: "/admin/map-visits", name: "মানচিত্র ভিজিটর", minimumRole: "admin" },
  { path: "/admin/test-api", name: "টেস্ট এপিআই", minimumRole: "admin" },
  { path: "/admin/settings", name: "সেটিংস", minimumRole: "admin" },
  { path: "/admin/page-access", name: "পেইজ অ্যাক্সেস", minimumRole: "super_admin" },
  { path: "/admin/audit-log", name: "অডিট লগ", minimumRole: "super_admin" },
];

export const SYSTEM_ROUTES = ["/login", "/maintenance", "/403"] as const;

export function getAdminMinimumRole(pathname: string): AdminMinimumRole {
  const path = normalizePagePath(pathname);
  // Most-specific route first. Nested routes inherit the closest parent.
  const match = [...ADMIN_ROUTE_REGISTRY]
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) => path === r.path || path.startsWith(r.path + "/"));
  return match?.minimumRole ?? "staff";
}

export function getAdminNavigationRoles(pathname: string): readonly AppRole[] {
  const level = getAdminMinimumRole(pathname);
  if (level === "super_admin") return ["Super Admin"];
  if (level === "admin") return ["Super Admin", "Admin"];
  return ["Super Admin", "Admin", "Editor"];
}

export const ROUTE_REGISTRY = [
  ...PAGE_ACCESS_PAGES.map((page) => ({
    path: page.id,
    kind: "page" as const,
    minimumAccess: page.defaultAccess,
    name: page.name,
  })),
  ...ADMIN_ROUTE_REGISTRY.map((route) => ({
    path: route.path,
    kind: "admin" as const,
    minimumAccess: route.minimumRole,
    name: route.name,
  })),
  ...SYSTEM_ROUTES.map((path) => ({
    path,
    kind: "system" as const,
    minimumAccess: "system",
    name: path,
  })),
] as const;
