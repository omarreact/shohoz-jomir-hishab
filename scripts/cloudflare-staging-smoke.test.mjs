import assert from "node:assert/strict";
import test from "node:test";

import {
  runSmokeChecks,
  validateStagingUrl,
} from "./cloudflare-staging-smoke.mjs";

const stagingUrl = "https://landbd-vinext-stage.account.workers.dev";

test("accepts only the isolated staging Worker URL", () => {
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
