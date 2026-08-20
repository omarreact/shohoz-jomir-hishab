import { strict as assert } from "node:assert";

const SERVER = "https://masterplan.rajuk.gov.bd/server";
const PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const REFERER = "https://masterplan.rajuk.gov.bd/";
const LAYER = `${SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/1`;

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function getServerToken(): Promise<string> {
  const configuredServerToken = process.env.RAJUK_SERVER_TOKEN?.trim();
  if (configuredServerToken) return configuredServerToken;

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
        origin: "https://masterplan.rajuk.gov.bd",
        referer: REFERER,
      },
      body,
    });
    assert(response.ok, `Portal-to-server exchange HTTP ${response.status}`);
    assert(data?.token, `Portal-to-server exchange failed: ${JSON.stringify(data)}`);
    return data.token;
  }

  const username = process.env.RAJUK_PORTAL_USERNAME?.trim();
  const password = process.env.RAJUK_PORTAL_PASSWORD;
  if (!username || !password) {
    throw new Error("No RAJUK credential configured. Set RAJUK_SERVER_TOKEN, RAJUK_PORTAL_TOKEN, or RAJUK_PORTAL_USERNAME/RAJUK_PORTAL_PASSWORD as GitHub Actions secrets.");
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
      origin: "https://masterplan.rajuk.gov.bd",
      referer: REFERER,
    },
    body,
  });
  assert(portal.response.ok, `Portal token HTTP ${portal.response.status}`);
  assert(portal.data?.token, `Portal token generation failed: ${JSON.stringify(portal.data)}`);

  const exchange = await json(`${PORTAL}/generateToken`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      origin: "https://masterplan.rajuk.gov.bd",
      referer: REFERER,
    },
    body: new URLSearchParams({ token: portal.data.token, serverUrl: SERVER, f: "json" }),
  });
  assert(exchange.response.ok, `Server token exchange HTTP ${exchange.response.status}`);
  assert(exchange.data?.token, `Server token exchange failed: ${JSON.stringify(exchange.data)}`);
  return exchange.data.token;
}

async function main() {
  console.log("[RAJUK] Checking public server metadata...");
  const metadata = await json(`${LAYER}?f=json`);
  console.log(`[RAJUK] Layer metadata HTTP ${metadata.response.status}`);
  assert(metadata.response.ok, `Layer metadata HTTP ${metadata.response.status}`);

  const token = await getServerToken();
  const query = new URL(`${LAYER}/query`);
  query.searchParams.set("f", "json");
  query.searchParams.set("where", "1=1");
  query.searchParams.set("outFields", "*");
  query.searchParams.set("returnGeometry", "false");
  query.searchParams.set("resultRecordCount", "1");
  query.searchParams.set("token", token);

  console.log("[RAJUK] Querying FeatureServer/1 with server-side credential...");
  const result = await json(query.toString(), {
    headers: { referer: REFERER },
  });
  console.log(`[RAJUK] Feature query HTTP ${result.response.status}`);
  assert(result.response.ok, `Feature query HTTP ${result.response.status}`);
  assert(!result.data?.error, `ArcGIS rejected token/query: ${JSON.stringify(result.data?.error ?? result.data)}`);
  assert(Array.isArray(result.data?.features), `Unexpected query response: ${JSON.stringify(result.data)}`);

  console.log(`[RAJUK] SUCCESS: received ${result.data.features.length} feature(s).`);
  console.log(JSON.stringify(result.data.features[0]?.attributes ?? {}, null, 2));
}

main().catch((error) => {
  console.error("[RAJUK] FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
