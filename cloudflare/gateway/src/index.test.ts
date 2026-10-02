jest.mock("jose", () => ({
  importX509: jest.fn(),
  jwtVerify: jest.fn(),
}));

import {
  __resetGatewayStateForTests,
  handleGatewayRequest,
  type GatewayEnv,
} from "./index";
import { getDefaultPageAccessRules } from "../../../src/shared/config/pageAccess";

function policy(
  maintenanceMode: boolean,
  overrides: Record<
    string,
    "public" | "logged_in" | "admin" | "super_admin" | "hidden"
  > = {},
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

function envFor(currentPolicy: ReturnType<typeof policy>): GatewayEnv {
  return {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "smart-khotiyan",
    LANDBD_APP: {
      async fetch(request: Request) {
        const pathname = new URL(request.url).pathname;

        if (pathname === "/api/public/access-policy") {
          return Response.json(currentPolicy);
        }

        if (pathname === "/maintenance") {
          return new Response("<html>maintenance</html>", {
            headers: { "Content-Type": "text/html" },
          });
        }

        if (pathname === "/403") {
          return new Response("<html>forbidden</html>", {
            headers: { "Content-Type": "text/html" },
          });
        }

        return new Response("app", {
          headers: { "Content-Type": "text/plain" },
        });
      },
    },
  };
}

function request(path: string) {
  return new Request(new URL(path, "https://landbd.example"));
}

describe("LandBD Cloudflare gateway access policy", () => {
  beforeEach(() => {
    __resetGatewayStateForTests();
  });

  it("returns a 503 maintenance page for an anonymous request", async () => {
    const response = await handleGatewayRequest(
      request("/"),
      envFor(policy(true)),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("x-landbd-maintenance")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 JSON for public APIs during maintenance", async () => {
    const response = await handleGatewayRequest(
      request("/api/rajuk/query?action=districts&kind=rs"),
      envFor(policy(true)),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "maintenance",
      maintenanceMode: true,
    });
  });

  it("does not block login while maintenance is enabled", async () => {
    const response = await handleGatewayRequest(
      request("/login"),
      envFor(policy(true)),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("app");
  });

  it("uses the dynamic page-access policy", async () => {
    const response = await handleGatewayRequest(
      request("/mouza-map"),
      envFor(policy(false, { "/mouza-map": "public" })),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("app");
  });

  it("redirects anonymous users for logged-in pages", async () => {
    const response = await handleGatewayRequest(
      request("/mouza-map"),
      envFor(policy(false, { "/mouza-map": "logged_in" })),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("from=%2Fmouza-map");
  });

  it("returns a non-indexable 404 response for hidden pages", async () => {
    const response = await handleGatewayRequest(
      request("/porcha"),
      envFor(policy(false, { "/porcha": "hidden" })),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
});
