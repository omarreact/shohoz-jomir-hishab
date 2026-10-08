import { NextRequest } from "next/server";

import { getDefaultPageAccessRules } from "@/src/shared/config/pageAccess";

const mockGetSiteAccessPolicy = jest.fn();
const mockVerifyServerAuth = jest.fn();

jest.mock("jose", () => ({
  importX509: jest.fn(),
  jwtVerify: jest.fn(),
}));

jest.mock("@/src/modules/access/server/siteAccessPolicy", () => ({
  getSiteAccessPolicy: (...args: unknown[]) => mockGetSiteAccessPolicy(...args),
}));

jest.mock("@/src/modules/auth/serverAuth", () => ({
  verifyServerAuth: (...args: unknown[]) => mockVerifyServerAuth(...args),
}));

import { proxy } from "./proxy";

function request(path: string) {
  return new NextRequest(new URL(path, "https://landbd.example"));
}

function policy(
  maintenanceMode: boolean,
  overrides: Record<string, "public" | "logged_in" | "admin" | "super_admin" | "hidden"> = {},
) {
  return {
    maintenanceMode,
    pageAccess: {
      ...getDefaultPageAccessRules(),
      ...overrides,
    },
    pageAccessUpdatedAt: null,
    degraded: false,
    loadedAt: Date.now(),
  };
}

describe("LandBD request-boundary access policy", () => {
  beforeEach(() => {
    mockGetSiteAccessPolicy.mockReset();
    mockVerifyServerAuth.mockReset();
  });

  it("restores /admin for a verified Admin when Google's proxy X509 check is unavailable", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));
    mockVerifyServerAuth.mockResolvedValue({
      id: "staff-uid",
      email: "staff@example.test",
      name: "Staff",
      role: "Admin",
    });
    const req = new NextRequest("https://landbd.example/admin", {
      headers: { cookie: "access_token=valid-session-token" },
    });

    const response = await proxy(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mockVerifyServerAuth).toHaveBeenCalledWith(
      req,
      { requireAdminBackend: true, checkRevoked: true },
    );
  });

  it("allows a verified Editor dashboard but not Admin-only paths", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));
    mockVerifyServerAuth.mockResolvedValue({
      id: "editor-uid", email: "editor@example.test", name: "Editor", role: "Editor",
    });
    const headers = { cookie: "access_token=valid-session-token" };
    const dashboard = await proxy(new NextRequest("https://landbd.example/admin", { headers }));
    expect(dashboard.status).toBe(200);
    const settings = await proxy(new NextRequest("https://landbd.example/admin/settings", { headers }));
    expect(settings.status).toBeGreaterThanOrEqual(300);
    expect(settings.headers.get("location")).toContain("/403");
  });

  it("rejects users without signed staff claims even when a cookie exists", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));
    mockVerifyServerAuth.mockResolvedValue({
      id: "user-uid", email: "user@example.test", name: "User", role: "Basic User",
    });
    const res = await proxy(new NextRequest("https://landbd.example/admin", {
      headers: { cookie: "access_token=valid-session-token" },
    }));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get("location")).toContain("/403");
  });

  it("does not turn temporary Admin SDK failure into a login loop", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));
    mockVerifyServerAuth.mockRejectedValue(new Error("Firebase Admin unavailable"));
    const res = await proxy(new NextRequest("https://landbd.example/admin", {
      headers: { cookie: "access_token=valid-session-token" },
    }));
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("lets a verified Admin reach the dashboard during maintenance", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(true));
    mockVerifyServerAuth.mockResolvedValue({
      id: "staff-uid", email: "staff@example.test", name: "Staff", role: "Super Admin",
    });
    const res = await proxy(new NextRequest("https://landbd.example/admin", {
      headers: { cookie: "access_token=valid-session-token" },
    }));
    expect(res.status).toBe(200);
  });

  it("returns a 503 maintenance rewrite for an anonymous page", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(true));

    const response = await proxy(request("/"));

    expect(response.status).toBe(503);
    expect(response.headers.get("x-landbd-maintenance")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 JSON for anonymous public APIs during maintenance", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(true));

    const response = await proxy(
      request("/api/rajuk/query?action=districts&kind=rs"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "maintenance",
      maintenanceMode: true,
    });
  });

  it("keeps public APIs accessible when maintenance is disabled", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));

    const response = await proxy(request("/api/rajuk/query?action=districts&kind=rs"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows only same-origin PDF frames on the report pages", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));

    for (const route of ["/dlrms-khatian", "/mouza-porcha-report"]) {
      const response = await proxy(request(route));
      expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
      expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'self'");
      expect(response.headers.get("content-security-policy")).toContain("frame-src 'self' blob:");
    }

    const otherPage = await proxy(request("/"));
    expect(otherPage.headers.get("x-frame-options")).toBe("DENY");
    expect(otherPage.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("serves public report QR images without requiring login when maintenance is off", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(policy(false));

    const response = await proxy(request("/api/reports/mouza-porcha/qr?target=dlrms-khatian"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps the maintenance status endpoint available without loading policy", async () => {
    const response = await proxy(request("/api/public/maintenance"));

    expect(response.status).toBe(200);
    expect(mockGetSiteAccessPolicy).not.toHaveBeenCalled();
  });

  it("does not block login while maintenance is enabled", async () => {
    const response = await proxy(request("/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mockGetSiteAccessPolicy).not.toHaveBeenCalled();
  });

  it("uses Firestore-backed page access instead of hard-coded mouza access", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(
      policy(false, { "/mouza-map": "public" }),
    );

    const response = await proxy(request("/mouza-map"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects anonymous users when a page rule is logged_in", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(
      policy(false, { "/mouza-map": "logged_in" }),
    );

    const response = await proxy(request("/mouza-map"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);

    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("from=%2Fmouza-map");
  });

  it("returns a non-indexable not-found response for hidden pages", async () => {
    mockGetSiteAccessPolicy.mockResolvedValue(
      policy(false, { "/porcha": "hidden" }),
    );

    const response = await proxy(request("/porcha"));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
