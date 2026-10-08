import fs from "node:fs";
import path from "node:path";
import { API_ROUTE_POLICIES, apiAccessFor, isAnonymousApiRequest } from "./api-route-registry";

function apiFiles(directory: string, relative = "/api"): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory()
      ? apiFiles(path.join(directory, entry.name), relative + "/" + entry.name)
      : entry.name === "route.ts" ? [relative] : []);
}

describe("LandBD API security inventory", () => {
  test("all API handlers are explicitly classified and policies are unique", () => {
    const current = apiFiles(path.join(process.cwd(), "app/api")).sort();
    const registered = API_ROUTE_POLICIES.map(item => item.path).sort();
    expect(registered).toEqual(current);
    expect(new Set(registered).size).toBe(registered.length);
  });

  test("does not grant anonymous access to member, admin or unknown APIs", () => {
    expect(apiAccessFor("/api/porcha", "GET")).toBe("member");
    expect(apiAccessFor("/api/public/bdris", "POST")).toBe("member");
    expect(apiAccessFor("/api/admin/audit-log")).toBe("super_admin");
    expect(apiAccessFor("/api/admin/dashboard-kpis")).toBe("staff");
    expect(apiAccessFor("/api/blogs", "POST")).toBe("staff");
    expect(apiAccessFor("/api/blogs", "GET")).toBe("public");
    expect(apiAccessFor("/api/pages/abc", "PUT")).toBe("staff");
    expect(apiAccessFor("/api/pages/abc", "DELETE")).toBe("admin");
    expect(apiAccessFor("/api/cloudinary/sign", "POST")).toBe("staff");
    expect(apiAccessFor("/api/notifications", "GET")).toBe("member");
    expect(apiAccessFor("/api/mouza-map/retrieve", "GET")).toBe("signed_token");
    expect(apiAccessFor("/api/not-yet-registered")).toBe("member");
    expect(isAnonymousApiRequest("/api/public/bdris", "GET")).toBe(false);
    expect(isAnonymousApiRequest("/api/reports/mouza-porcha/qr")).toBe(true);
  });

  test("every protected handler performs authorization independently from Proxy", () => {
    for (const route of API_ROUTE_POLICIES) {
      if (route.get === "public" && route.mutate === "public") continue;
      if (route.get === "signed_token" && route.mutate === "signed_token") {
        const body = fs.readFileSync(path.join(process.cwd(), "app" + route.path + "/route.ts"), "utf8");
        expect(body).toMatch(/verifyPrivateDownloadToken/);
        continue;
      }
      const body = fs.readFileSync(path.join(process.cwd(), "app" + route.path + "/route.ts"), "utf8");
      expect(body).toMatch(/verify(?:Server|Admin|Staff|SuperAdmin)Auth|requireMemberApiAccess/);
    }
  });

  test("public Firestore verification writers must use abuse protection", () => {
    for (const route of [
      "/api/land-records/khatian/verification",
      "/api/reports/mouza-porcha/verification",
    ]) {
      const file = fs.readFileSync(path.join(process.cwd(), "app" + route + "/route.ts"), "utf8");
      expect(file).toContain("protectPublicVerificationWrite");
    }
  });

  test("public dynamic CMS pages cannot expose unpublished drafts", () => {
    const file = fs.readFileSync(
      path.join(process.cwd(), "app/(public)/p/[slug]/page.tsx"), "utf8");
    expect(file).toContain('.where("published", "==", true)');
  });
});
