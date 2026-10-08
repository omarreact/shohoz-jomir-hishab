#!/usr/bin/env node
/**
 * Read-only production smoke checks. Does not write records, create sessions,
 * inspect secrets or require a real user's credentials.
 * Usage: SMOKE_BASE_URL=https://landbd.pincodeit.com node scripts/qa/live-routing-smoke.mjs
 */
const origin = new URL(process.env.SMOKE_BASE_URL || "https://landbd.pincodeit.com").origin;
const timeout = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const failures = [];
const checks = [];

async function check(name, path, expected, verify = () => true) {
  try {
    const res = await fetch(origin + path, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { accept: "text/html,application/json", "user-agent": "LandBD-QA-Smoke/1.0" },
      signal: AbortSignal.timeout(timeout),
    });
    const location = res.headers.get("location");
    const ok = expected.includes(res.status) && verify({ status: res.status, location, headers: res.headers });
    checks.push({ name, path, status: res.status, location, ok });
    if (!ok) failures.push(name + ": unexpected status " + res.status + " or redirect " + location);
  } catch (error) {
    failures.push(name + ": " + String(error));
  }
}

const main = await fetch(origin + "/", { redirect: "manual", signal: AbortSignal.timeout(timeout) });
const maintenance = main.status === 503 && main.headers.get("x-landbd-maintenance") === "1";

if (maintenance) {
  console.log("Maintenance mode active: testing access gates without assuming public pages are available.");
  await check("maintenance blocked homepage", "/", [503],
    r => r.headers.get("x-landbd-maintenance") === "1");
  await check("login remains reachable", "/login", [200]);
  await check("anonymous admin blocked", "/admin", [503]);
  await check("anonymous sensitive API blocked", "/api/porcha?q=qa", [503]);
} else {
  for (const path of ["/", "/khatiyan", "/dlrms-khatian", "/mouza-porcha-report",
    "/geospatial-map", "/mouza-map", "/blog", "/login", "/faq"]) {
    await check("public page " + path, path, [200]);
  }
  for (const [legacy, target] of [
    ["/khatian", "/khatiyan"],
    ["/survey-khatian", "/dlrms-khatian"],
    ["/map", "/geospatial-map"],
    ["/dap-map", "/geospatial-map"],
  ]) {
    await check("legacy " + legacy, legacy, [307, 308], r =>
      !!r.location && new URL(r.location, origin).pathname === target);
  }
  await check("admin login return", "/admin", [307, 308], r =>
    !!r.location && new URL(r.location, origin).pathname === "/login" &&
    new URL(r.location, origin).searchParams.get("from") === "/admin");
  for (const path of ["/api/porcha?q=qa", "/api/public/bdris",
    "/api/admin/users", "/api/admin/page-access", "/api/notifications"]) {
    await check("anonymous protected " + path, path, [401, 403]);
  }
}
for (const c of checks) {
  console.log((c.ok ? "PASS" : "FAIL") + " " + c.name + " HTTP " + c.status);
}
if (failures.length) {
  console.error("\nRouting smoke failed:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nPublic/anonymous routing smoke checks passed (" + checks.length + ").");
  console.log("Authenticated browser workflows remain a separate QA gate.");
}
