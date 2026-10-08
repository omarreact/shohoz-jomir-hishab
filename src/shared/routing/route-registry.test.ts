import fs from "node:fs";
import path from "node:path";

import { PAGE_ACCESS_PAGES, getPageAccessLevel, getDefaultPageAccessRules } from "../config/pageAccess";
import { FEATURE_ROUTES, PUBLIC_SITEMAP_KEYS } from "../config/feature-routes";
import {
  ADMIN_ROUTE_REGISTRY,
  getAdminMinimumRole,
  getAdminNavigationRoles,
  LEGACY_ROUTE_REDIRECTS,
  ROUTE_REGISTRY,
  SYSTEM_ROUTES,
} from "./route-registry";

function pagePaths(dir: string, prefix = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith("(") && entry.name.endsWith(")")
        ? "" : "/" + entry.name;
      return pagePaths(path.join(dir, entry.name), prefix + segment);
    }
    return entry.name === "page.tsx" || entry.name === "page.ts"
      ? [prefix || "/"] : [];
  });
}

describe("LandBD routing inventory", () => {
  it("classifies every App Router page (including nested admin pages)", () => {
    const declared = new Set(PAGE_ACCESS_PAGES.map(p => p.id));
    const actual = pagePaths(path.join(process.cwd(), "app"));
    const missing = actual.filter(route => {
      if (SYSTEM_ROUTES.includes(route as typeof SYSTEM_ROUTES[number])) return false;
      if (route === "/admin" || route.startsWith("/admin/")) return false;
      return !declared.has(route);
    });
    expect(missing).toEqual([]);
    expect(new Set(ROUTE_REGISTRY.map(r => r.path)).size).toBe(ROUTE_REGISTRY.length);
  });

  it("has role requirements for every Admin navigation entry", () => {
    const paths = ADMIN_ROUTE_REGISTRY.map(r => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(getAdminMinimumRole("/admin/blog/edit/123")).toBe("staff");
    expect(getAdminMinimumRole("/admin/data-monitor/result")).toBe("admin");
    expect(getAdminMinimumRole("/admin/page-access")).toBe("super_admin");
    expect(getAdminNavigationRoles("/admin/page-access")).toEqual(["Super Admin"]);
    expect(getAdminNavigationRoles("/admin/users")).toEqual(["Super Admin", "Admin"]);
    expect(getAdminNavigationRoles("/admin/blog")).toContain("Editor");
  });

  it("keeps permanent redirects canonical and avoids redirect chains", () => {
    const sources = new Set<string>(LEGACY_ROUTE_REDIRECTS.map(r => r.source));
    for (const entry of LEGACY_ROUTE_REDIRECTS) {
      expect(entry.permanent).toBe(true);
      expect(sources.has(entry.destination)).toBe(false);
      expect(getPageAccessLevel(entry.destination, getDefaultPageAccessRules())).toBe("public");
    }
    expect(LEGACY_ROUTE_REDIRECTS.find(r => r.source === "/map")?.destination)
      .toBe(FEATURE_ROUTES.landMap);
    expect(LEGACY_ROUTE_REDIRECTS.find(r => r.source === "/dap-map")?.destination)
      .toBe(FEATURE_ROUTES.landMap);
  });

  it("keeps feature links registered and excludes noindex editors from sitemap", () => {
    const pages = new Set(PAGE_ACCESS_PAGES.map(p => p.id));
    for (const route of Object.values(FEATURE_ROUTES)) {
      if (route === "/admin" || route === "/login") continue;
      expect(pages.has(route)).toBe(true);
    }
    const sitemapRoutes = new Set(PUBLIC_SITEMAP_KEYS.map(k => FEATURE_ROUTES[k]));
    expect(sitemapRoutes.has("/warish")).toBe(false);
    expect(sitemapRoutes.has("/warishsanad")).toBe(false);
    expect(sitemapRoutes.has("/porcha")).toBe(false);
  });
});
