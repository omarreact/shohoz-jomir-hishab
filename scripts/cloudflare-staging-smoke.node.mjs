import assert from "node:assert/strict";
import test from "node:test";

import {
  runSmokeChecks,
  validateStagingUrl,
} from "./cloudflare-staging-smoke.mjs";

const stagingUrl = "https://landbd-vinext-stage.account.workers.dev";

function stagingHealthResponse(overrides = {}) {
  return Response.json({
    success: true,
    service: "landbd",
    status: "ok",
    platform: "cloudflare-workers",
    environment: "staging",
    ...overrides,
  });
}

test("restricts the smoke target to the isolated staging Worker", () => {
  assert.equal(validateStagingUrl(stagingUrl), new URL(stagingUrl).origin);

  for (const value of [
    "http://landbd-vinext-stage.account.workers.dev",
    "https://landbd-app.account.workers.dev",
    "https://landbd-vinext-stage.account.workers.dev/path",
    "https://landbd-vinext-stage.account.workers.dev/?token=secret",
    "https://user@landbd-vinext-stage.account.workers.dev",
    "https://landbd-vinext-stage.example.com",
  ]) {
    assert.throws(() => validateStagingUrl(value));
  }
});

test("passes healthy public routes and fails closed on unauthenticated admin access", async () => {
  const fetchMock = async (url) => {
    if (url.pathname === "/api/health") {
      return stagingHealthResponse();
    }
    const path = url.pathname;
    if (path === "/api/public/maintenance") {
      return Response.json({ maintenanceMode: false, degraded: false });
    }
    if (path === "/api/admin/health") {
      return new Response(null, { status: 401 });
    }
    if (path === "/admin") {
      return new Response(null, {
        status: 307,
        headers: { location: "/login?from=%2Fadmin" },
      });
    }
    if (path === "/__cloudflare-smoke-not-found__") {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 200 });
  };

  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, true);
  assert.equal(result.maintenanceMode, false);
  assert.ok(result.checks.every((check) => check.passed));
});

test("expects maintenance 503 responses without treating them as runtime failures", async () => {
  const fetchMock = async (url) => {
    if (url.pathname === "/api/health") {
      return stagingHealthResponse();
    }
    const path = url.pathname;
    if (path === "/api/public/maintenance") {
      return Response.json({ maintenanceMode: true, degraded: false });
    }
    if (path === "/api/health" || path === "/login") {
      return new Response(null, { status: 200 });
    }
    if (path === "/__cloudflare-smoke-not-found__") {
      return new Response(null, { status: 503 });
    }
    return new Response(null, { status: 503 });
  };

  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, true);
  assert.equal(result.maintenanceMode, true);
});

test("fails when a page returns a Worker exception", async () => {
  const fetchMock = async (url) => {
    if (url.pathname === "/api/health") {
      return stagingHealthResponse();
    }
    if (url.pathname === "/api/public/maintenance") {
      return Response.json({ maintenanceMode: false, degraded: false });
    }
    if (url.pathname === "/api/admin/health") {
      return new Response(null, { status: 401 });
    }
    if (url.pathname === "/admin") {
      return new Response(null, {
        status: 307,
        headers: { location: "/login" },
      });
    }
    if (url.pathname === "/__cloudflare-smoke-not-found__") {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: url.pathname === "/dap-map" ? 500 : 200 });
  };

  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, false);
  assert.ok(result.checks.some((check) => check.path === "/dap-map" && !check.passed));
});

test("rejects an unauthenticated admin redirect to another origin", async () => {
  const fetchMock = async (url) => {
    if (url.pathname === "/api/health") {
      return stagingHealthResponse();
    }
    if (url.pathname === "/api/public/maintenance") {
      return Response.json({ maintenanceMode: false, degraded: false });
    }
    if (url.pathname === "/api/admin/health") {
      return new Response(null, { status: 401 });
    }
    if (url.pathname === "/admin") {
      return new Response(null, {
        status: 307,
        headers: { location: "https://example.com/login" },
      });
    }
    if (url.pathname === "/__cloudflare-smoke-not-found__") {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 200 });
  };

  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, false);
  assert.ok(result.checks.some((check) => check.path === "/admin" && !check.passed));
});

test("rejects a healthy HTTP 200 from the wrong platform or environment", async () => {
  for (const identity of [
    { platform: "vercel" },
    { environment: "production" },
    { service: "different-app" },
  ]) {
    const fetchMock = async (url) => {
      switch (url.pathname) {
        case "/api/health":
          return stagingHealthResponse(identity);
        case "/api/public/maintenance":
          return Response.json({ maintenanceMode: false, degraded: false });
        case "/api/admin/health":
          return new Response(null, { status: 401 });
        case "/admin":
          return new Response(null, {
            status: 307,
            headers: { location: "/login" },
          });
        case "/__cloudflare-smoke-not-found__":
          return new Response(null, { status: 404 });
        default:
          return new Response(null, { status: 200 });
      }
    };

    const result = await runSmokeChecks(stagingUrl, fetchMock);
    assert.equal(result.passed, false);
    assert.ok(result.checks.some((check) => check.path === "/api/health" && !check.passed));
  }
});

test("rejects a non-JSON health response even with HTTP 200", async () => {
  const fetchMock = async (url) => {
    switch (url.pathname) {
      case "/api/health":
        return new Response("<html>healthy</html>", { status: 200 });
      case "/api/public/maintenance":
        return Response.json({ maintenanceMode: false, degraded: false });
      case "/api/admin/health":
        return new Response(null, { status: 401 });
      case "/admin":
        return new Response(null, { status: 307, headers: { location: "/login" } });
      case "/__cloudflare-smoke-not-found__":
        return new Response(null, { status: 404 });
      default:
        return new Response(null, { status: 200 });
    }
  };
  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, false);
  assert.ok(result.checks.some((check) => check.path === "/api/health" && !check.passed));
});

test("accepts same-origin permanent redirect only if canonical page serves 200", async () => {
  const fetchMock = async (url) => {
    if (url.pathname === "/api/health") return stagingHealthResponse();
    if (url.pathname === "/api/public/maintenance")
      return Response.json({ maintenanceMode: false, degraded: false });
    if (url.pathname === "/api/admin/health") return new Response(null, { status: 401 });
    if (url.pathname === "/admin")
      return new Response(null, { status: 307, headers: { location: "/login" } });
    if (url.pathname === "/__cloudflare-smoke-not-found__")
      return new Response(null, { status: 404 });
    if (url.pathname === "/dap-map")
      return new Response(null, { status: 308, headers: { location: "/dap-map/" } });
    return new Response(null, { status: 200 });
  };
  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, true);
  assert.ok(result.checks.some((x) => x.path === "/dap-map" && x.passed));
});

test("rejects cross-origin canonical public redirect", async () => {
  const fetchMock = async (url) => {
    if (url.pathname === "/api/health") return stagingHealthResponse();
    if (url.pathname === "/api/public/maintenance")
      return Response.json({ maintenanceMode: false, degraded: false });
    if (url.pathname === "/api/admin/health") return new Response(null, { status: 401 });
    if (url.pathname === "/admin")
      return new Response(null, { status: 307, headers: { location: "/login" } });
    if (url.pathname === "/__cloudflare-smoke-not-found__")
      return new Response(null, { status: 404 });
    if (url.pathname === "/dap-map")
      return new Response(null, { status: 308, headers: { location: "https://example.com/dap-map" } });
    return new Response(null, { status: 200 });
  };
  const result = await runSmokeChecks(stagingUrl, fetchMock);
  assert.equal(result.passed, false);
  assert.ok(result.checks.some((x) => x.path === "/dap-map" && !x.passed));
});
