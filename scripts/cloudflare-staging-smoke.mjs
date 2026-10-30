import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const requestTimeoutMs = 15_000;

export function validateStagingUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Provide the HTTPS URL for the isolated landbd-vinext-stage Worker.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "") ||
    !url.hostname.startsWith("landbd-vinext-stage.") ||
    !url.hostname.endsWith(".workers.dev")
  ) {
    throw new Error(
      "Smoke tests are restricted to the HTTPS landbd-vinext-stage workers.dev URL.",
    );
  }

  return url.origin;
}

export async function runSmokeChecks(stagingUrl, fetchImpl = fetch) {
  const origin = validateStagingUrl(stagingUrl);
  const checks = [];

  async function get(path) {
    try {
      const response = await fetchImpl(new URL(path, origin), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      return { response, status: response.status };
    } catch (error) {
      checks.push({
        path,
        passed: false,
        detail: error instanceof Error ? error.message : "Request failed",
      });
      return { response: null, status: null };
    }
  }

  function record(path, passed, status, expected) {
    checks.push({
      path,
      passed,
      detail: `HTTP ${status ?? "unavailable"}; expected ${expected}`,
    });
  }

  const maintenance = await get("/api/public/maintenance");
  let maintenanceMode = false;
  if (maintenance.status === 200) {
    try {
      const policy = await maintenance.response.json();
      maintenanceMode = policy.maintenanceMode === true;
      record(
        "/api/public/maintenance",
        policy.degraded !== true &&
          typeof policy.maintenanceMode === "boolean",
        maintenance.status,
        "200 with a healthy maintenance policy",
      );
    } catch {
      record(
        "/api/public/maintenance",
        false,
        maintenance.status,
        "valid maintenance policy JSON",
      );
    }
  } else {
    record(
      "/api/public/maintenance",
      false,
      maintenance.status,
      "200 with a healthy maintenance policy",
    );
  }

  const apiHealth = await get("/api/health");
  if (apiHealth.status === 200) {
    try {
      const health = await apiHealth.response.json();
      const isCorrectStagingRuntime =
        health?.success === true &&
        health.service === "landbd" &&
        health.status === "ok" &&
        health.platform === "cloudflare-workers" &&
        health.environment === "staging";
      record(
        "/api/health",
        isCorrectStagingRuntime,
        apiHealth.status,
        "200 with LandBD Cloudflare staging identity",
      );
    } catch {
      record(
        "/api/health",
        false,
        apiHealth.status,
        "valid JSON identifying LandBD Cloudflare staging",
      );
    }
  } else {
    record("/api/health", false, apiHealth.status, "200 with staging identity");
  }

  const login = await get("/login");
  record("/login", login.status === 200, login.status, "200");

  const publicPageStatus = maintenanceMode ? 503 : 200;
  for (const path of ["/", "/dap-map"]) {
    const result = await get(path);
    record(path, result.status === publicPageStatus, result.status, `${publicPageStatus}`);
  }

  const adminPage = await get("/admin");
  const adminExpected = maintenanceMode
    ? adminPage.status === 503
    : [302, 307].includes(adminPage.status);
  const loginLocation = adminPage.response?.headers.get("location") ?? "";
  let redirectsToLogin = false;
  try {
    const redirectUrl = new URL(loginLocation, origin);
    redirectsToLogin =
      redirectUrl.origin === origin && redirectUrl.pathname === "/login";
  } catch {
    redirectsToLogin = false;
  }
  record(
    "/admin",
    adminExpected && (maintenanceMode || redirectsToLogin),
    adminPage.status,
    maintenanceMode ? "503 during maintenance" : "redirect to /login",
  );

  const adminApi = await get("/api/admin/health");
  const adminApiStatuses = maintenanceMode ? [503] : [401, 403];
  record(
    "/api/admin/health",
    adminApiStatuses.includes(adminApi.status),
    adminApi.status,
    maintenanceMode ? "503 during maintenance" : "401 or 403 without a session",
  );

  const missingRoute = await get("/__cloudflare-smoke-not-found__");
  const missingRouteStatus = maintenanceMode ? 503 : 404;
  record(
    "/__cloudflare-smoke-not-found__",
    missingRoute.status === missingRouteStatus,
    missingRoute.status,
    `${missingRouteStatus}`,
  );

  return {
    checks,
    passed: checks.every((check) => check.passed),
    maintenanceMode,
  };
}

async function main() {
  const stagingUrl =
    process.env.LANDBD_CLOUDFLARE_STAGING_URL ?? process.argv[2];

  if (!stagingUrl) {
    throw new Error("LANDBD_CLOUDFLARE_STAGING_URL is required.");
  }

  const result = await runSmokeChecks(stagingUrl);
  for (const check of result.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.path}: ${check.detail}`);
  }
  console.log(`Maintenance mode: ${result.maintenanceMode ? "enabled" : "disabled"}`);

  if (!result.passed) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Cloudflare smoke test failed");
    process.exitCode = 1;
  });
}
