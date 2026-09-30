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
