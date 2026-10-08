/**
 * Exhaustive list of 73 Next.js API routes and their expected minimum access.
 * Handlers remain the authoritative authorization boundary.
 */
export type ApiAccess = "public" | "signed_token" | "member" | "staff" | "admin" | "super_admin";
export type ApiRoutePolicy = { path: string; get: ApiAccess; mutate: ApiAccess; delete?: ApiAccess };
export const API_ROUTE_POLICIES: readonly ApiRoutePolicy[] = [
  { path: "/api/admin/audit-log", get: "super_admin", mutate: "super_admin" },
  { path: "/api/admin/dashboard-kpis", get: "staff", mutate: "staff" },
  { path: "/api/admin/health", get: "admin", mutate: "admin" },
  { path: "/api/admin/login-history", get: "admin", mutate: "admin" },
  { path: "/api/admin/map-visits", get: "admin", mutate: "admin" },
  { path: "/api/admin/map-visits/seed-demo", get: "super_admin", mutate: "super_admin" },
  { path: "/api/admin/metrics", get: "admin", mutate: "admin" },
  { path: "/api/admin/page-access", get: "super_admin", mutate: "super_admin" },
  { path: "/api/admin/settings", get: "admin", mutate: "admin" },
  { path: "/api/admin/stats", get: "admin", mutate: "admin" },
  { path: "/api/admin/users/[id]", get: "admin", mutate: "admin" },
  { path: "/api/admin/users/create", get: "admin", mutate: "admin" },
  { path: "/api/admin/users", get: "admin", mutate: "admin" },
  { path: "/api/auth/me", get: "member", mutate: "member" },
  { path: "/api/auth/session", get: "public", mutate: "public" },
  { path: "/api/authorities", get: "public", mutate: "public" },
  { path: "/api/blogs/[id]", get: "public", mutate: "staff", delete: "admin" },
  { path: "/api/blogs", get: "public", mutate: "staff", delete: "admin" },
  { path: "/api/cloudinary/sign", get: "staff", mutate: "staff" },
  { path: "/api/comments", get: "public", mutate: "public" },
  { path: "/api/dncc-directory", get: "public", mutate: "public" },
  { path: "/api/health", get: "public", mutate: "public" },
  { path: "/api/land-records/dag-map-area", get: "public", mutate: "public" },
  { path: "/api/land-records/dag-map-areas", get: "public", mutate: "public" },
  { path: "/api/land-records/districts", get: "public", mutate: "public" },
  { path: "/api/land-records/divisions", get: "public", mutate: "public" },
  { path: "/api/land-records/dlrms-citizen/invoice", get: "member", mutate: "member" },
  { path: "/api/land-records/dlrms-citizen/print", get: "member", mutate: "member" },
  { path: "/api/land-records/full-khatian/[surveyKey]/[id]", get: "public", mutate: "public" },
  { path: "/api/land-records/full-khatian/status", get: "public", mutate: "public" },
  { path: "/api/land-records/full-khatian/verify/[uuid]", get: "public", mutate: "public" },
  { path: "/api/land-records/khatian/verification", get: "public", mutate: "public" },
  { path: "/api/land-records/khatians/[surveyKey]/[id]", get: "public", mutate: "public" },
  { path: "/api/land-records/khatians", get: "public", mutate: "public" },
  { path: "/api/land-records/mouza-porcha-report/hal-sabek", get: "public", mutate: "public" },
  { path: "/api/land-records/mouza-porcha-report", get: "public", mutate: "public" },
  { path: "/api/land-records/mouzas", get: "public", mutate: "public" },
  { path: "/api/land-records/mutation-verify", get: "public", mutate: "public" },
  { path: "/api/land-records/resolve-khatian", get: "public", mutate: "public" },
  { path: "/api/land-records/surveys", get: "public", mutate: "public" },
  { path: "/api/land-records/upazilas", get: "public", mutate: "public" },
  { path: "/api/map-visits", get: "public", mutate: "public" },
  { path: "/api/mouza-map/download", get: "public", mutate: "public" },
  { path: "/api/mouza-map/mock-download/[fileId]", get: "public", mutate: "public" },
  { path: "/api/mouza-map/mock-thumbnail/[fileId]", get: "public", mutate: "public" },
  { path: "/api/mouza-map/retrieve", get: "signed_token", mutate: "signed_token" },
  { path: "/api/mouza-provider/browse", get: "public", mutate: "public" },
  { path: "/api/mouza-provider/file", get: "public", mutate: "public" },
  { path: "/api/notifications/[id]", get: "member", mutate: "member" },
  { path: "/api/notifications/mark-all-read", get: "member", mutate: "member" },
  { path: "/api/notifications", get: "member", mutate: "admin" },
  { path: "/api/pages/[id]", get: "public", mutate: "staff", delete: "admin" },
  { path: "/api/pages", get: "public", mutate: "staff", delete: "admin" },
  { path: "/api/porcha", get: "member", mutate: "member" },
  { path: "/api/public/bdris", get: "member", mutate: "member" },
  { path: "/api/public/maintenance", get: "public", mutate: "public" },
  { path: "/api/public/page-access", get: "public", mutate: "public" },
  { path: "/api/public/settings", get: "public", mutate: "public" },
  { path: "/api/rajuk/[layerId]", get: "public", mutate: "public" },
  { path: "/api/rajuk/auth/diagnose", get: "admin", mutate: "admin" },
  { path: "/api/rajuk/auth", get: "public", mutate: "public" },
  { path: "/api/rajuk/metadata", get: "admin", mutate: "admin" },
  { path: "/api/rajuk/query", get: "public", mutate: "public" },
  { path: "/api/rajuk/tile/[layer]/[z]/[y]/[x]", get: "public", mutate: "public" },
  { path: "/api/reports/mouza-porcha/qr", get: "public", mutate: "public" },
  { path: "/api/reports/mouza-porcha/verification", get: "public", mutate: "public" },
  { path: "/api/unified/health", get: "public", mutate: "public" },
  { path: "/api/unified/providers", get: "public", mutate: "public" },
  { path: "/api/unified", get: "public", mutate: "public" },
  { path: "/api/unified/stats", get: "public", mutate: "public" },
  { path: "/api/ward-data", get: "public", mutate: "public" },
  { path: "/api/wards", get: "public", mutate: "public" },
  { path: "/api/zones", get: "public", mutate: "public" },
] as const;

function matchesApiRoute(actual: string, template: string): boolean {
  const pathname = actual.split(/[?#]/, 1)[0] || "/";
  const segments = pathname.split("/").filter(Boolean);
  const pattern = template.split("/").filter(Boolean);
  return segments.length === pattern.length && pattern.every((segment, i) =>
    segment.startsWith("[") && segment.endsWith("]") ? Boolean(segments[i]) : segment === segments[i]);
}

/** Unknown endpoints default to authenticated access, never anonymous. */
export function apiAccessFor(pathname: string, method = "GET"): ApiAccess {
  const route = API_ROUTE_POLICIES.find(item => matchesApiRoute(pathname, item.path));
  if (!route) return "member";
  if (method === "GET" || method === "HEAD") return route.get;
  return method === "DELETE" ? (route.delete ?? route.mutate) : route.mutate;
}

export function isAnonymousApiRequest(pathname: string, method = "GET"): boolean {
  const access = apiAccessFor(pathname, method);
  return access === "public" || access === "signed_token";
}
