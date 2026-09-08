import { strict as assert } from "node:assert";

const SERVER = "https://masterplan.rajuk.gov.bd/server";
const PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const PUBLIC_CONFIG = "https://masterplan.rajuk.gov.bd/config.json";
const REFERER = "https://masterplan.rajuk.gov.bd/";
const ORIGIN = "https://masterplan.rajuk.gov.bd";
const LAYER = `${SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/1`;

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      referer: REFERER,
      origin: ORIGIN,
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function getPublicConfigApiKey(): Promise<string | null> {
  const { response, data } = await json(PUBLIC_CONFIG);
  if (!response.ok) return null;
  const key = String(data?.API_KEY || data?.api_key || data?.apiKey || "").trim();
  return key || null;
}

async function getServerToken(): Promise<{ token: string; source: string }> {
  // Keep this order aligned with src/services/rajuk/rajukAuth.service.ts.
  const publicConfigKey = await getPublicConfigApiKey();
  if (publicConfigKey) return { token: publicConfigKey, source: "public-config" };

  const configuredServerToken = process.env.RAJUK_SERVER_TOKEN?.trim();
  if (configuredServerToken) return { token: configuredServerToken, source: "server-secret" };

  const portalToken = process.env.RAJUK_PORTAL_TOKEN?.trim();
  if (portalToken) {
    const body = new URLSearchParams({
      token: portalToken,
      serverUrl: SERVER,
      f: "json",
    });
    const { response, data } = await json(`${PORTAL}/generateToken`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });
    assert(response.ok, `Portal-to-server exchange HTTP ${response.status}`);
    assert(data?.token, `Portal-to-server exchange failed: ${JSON.stringify(data)}`);
    return { token: data.token, source: "portal-token" };
  }

  const username = process.env.RAJUK_PORTAL_USERNAME?.trim();
  const password = process.env.RAJUK_PORTAL_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "No RAJUK authentication path is available: config.json has no API_KEY and no GitHub Actions credential secret is configured.",
    );
  }

  const body = new URLSearchParams({
    username,
    password,
    client: "referer",
    referer: REFERER,
    expiration: "60",
    f: "json",
  });
  const portal = await json(`${PORTAL}/generateToken`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });
  assert(portal.response.ok, `Portal token HTTP ${portal.response.status}`);
  assert(portal.data?.token, `Portal token generation failed: ${JSON.stringify(portal.data)}`);

  const exchange = await json(`${PORTAL}/generateToken`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ token: portal.data.token, serverUrl: SERVER, f: "json" }),
  });
  assert(exchange.response.ok, `Server token exchange HTTP ${exchange.response.status}`);
  assert(exchange.data?.token, `Server token exchange failed: ${JSON.stringify(exchange.data)}`);
  return { token: exchange.data.token, source: "portal-credentials" };
}

async function main() {
  console.log("[RAJUK] Checking public server metadata...");
  const metadata = await json(`${LAYER}?f=json`);
  console.log(`[RAJUK] Layer metadata HTTP ${metadata.response.status}`);
  assert(metadata.response.ok, `Layer metadata HTTP ${metadata.response.status}`);
  assert(!metadata.data?.error, `Layer metadata error: ${JSON.stringify(metadata.data?.error)}`);

  const auth = await getServerToken();
  console.log(`[RAJUK] Authentication source: ${auth.source}`);

  const query = new URL(`${LAYER}/query`);
  query.searchParams.set("f", "json");
  query.searchParams.set("where", "1=1");
  query.searchParams.set("outFields", "*");
  query.searchParams.set("returnGeometry", "false");
  query.searchParams.set("resultRecordCount", "1");
  query.searchParams.set("token", auth.token);

  console.log("[RAJUK] Querying FeatureServer/1 through the production-compatible auth path...");
  const result = await json(query.toString());
  console.log(`[RAJUK] Feature query HTTP ${result.response.status}`);
  assert(result.response.ok, `Feature query HTTP ${result.response.status}`);
  assert(!result.data?.error, `ArcGIS rejected token/query: ${JSON.stringify(result.data?.error ?? result.data)}`);
  assert(Array.isArray(result.data?.features), `Unexpected query response: ${JSON.stringify(result.data)}`);

  console.log(`[RAJUK] SUCCESS: received ${result.data.features.length} feature(s).`);
}

main().catch((error) => {
  console.error("[RAJUK] FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
