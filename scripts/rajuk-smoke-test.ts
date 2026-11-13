import { strict as assert } from "node:assert";

const SERVER = "https://masterplan.rajuk.gov.bd/server";
const PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const PUBLIC_CONFIG = "https://masterplan.rajuk.gov.bd/config.json";
const REFERER = "https://masterplan.rajuk.gov.bd/";
const ORIGIN = "https://masterplan.rajuk.gov.bd";
const LAYER_MAUZA = `${SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/1`;
const LAYER_RS_PLOT = `${SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/0`;
const LAYER_MS_PLOT = `${SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/5`;

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

async function assertLayerQuery(layerUrl: string, token: string, label: string) {
  const metadataUrl = new URL(layerUrl);
  metadataUrl.searchParams.set("f", "json");
  metadataUrl.searchParams.set("token", token);
  const metadata = await json(metadataUrl.toString());
  console.log(`[RAJUK] ${label} metadata HTTP ${metadata.response.status}`);
  assert(metadata.response.ok, `${label} metadata HTTP ${metadata.response.status}`);
  assert(!metadata.data?.error, `${label} metadata error: ${JSON.stringify(metadata.data?.error)}`);
  assert(metadata.data?.name || metadata.data?.type, `Unexpected ${label} metadata: ${JSON.stringify(metadata.data)}`);

  const query = new URL(`${layerUrl}/query`);
  query.searchParams.set("f", "json");
  query.searchParams.set("where", "1=1");
  query.searchParams.set("outFields", "*");
  query.searchParams.set("returnGeometry", "false");
  query.searchParams.set("resultRecordCount", "1");
  query.searchParams.set("token", token);

  const result = await json(query.toString());
  console.log(`[RAJUK] ${label} query HTTP ${result.response.status}`);
  assert(result.response.ok, `${label} query HTTP ${result.response.status}`);
  assert(!result.data?.error, `${label} rejected: ${JSON.stringify(result.data?.error ?? result.data)}`);
  assert(Array.isArray(result.data?.features), `Unexpected ${label} response: ${JSON.stringify(result.data)}`);
  console.log(`[RAJUK] ${label}: ${result.data.features.length} feature(s).`);
}

async function assertPlotLayer(layerUrl: string, token: string, label: string, plotFields: string[]) {
  const metadataUrl = new URL(layerUrl);
  metadataUrl.searchParams.set("f", "json");
  metadataUrl.searchParams.set("token", token);
  const metadata = await json(metadataUrl.toString());
  console.log(`[RAJUK] ${label} metadata HTTP ${metadata.response.status}`);
  assert(metadata.response.ok, `${label} metadata HTTP ${metadata.response.status}`);
  assert(!metadata.data?.error, `${label} metadata error: ${JSON.stringify(metadata.data?.error)}`);

  const objectIdField = String(metadata.data?.objectIdField || "OBJECTID");
  const query = new URL(`${layerUrl}/query`);
  query.searchParams.set("f", "json");
  query.searchParams.set("where", "1=1");
  query.searchParams.set("outFields", "*");
  query.searchParams.set("returnGeometry", "true");
  query.searchParams.set("outSR", "4326");
  query.searchParams.set("resultRecordCount", "1");
  query.searchParams.set("token", token);

  const result = await json(query.toString());
  console.log(`[RAJUK] ${label} sample HTTP ${result.response.status}`);
  assert(result.response.ok, `${label} query HTTP ${result.response.status}`);
  assert(!result.data?.error, `${label} rejected: ${JSON.stringify(result.data?.error ?? result.data)}`);
  assert(Array.isArray(result.data?.features) && result.data.features.length > 0, `${label} returned no sample features`);

  const sample = result.data.features[0];
  assert(sample?.attributes && typeof sample.attributes === "object", `${label} sample has no attributes`);
  assert(sample?.geometry && typeof sample.geometry === "object", `${label} sample has no geometry`);
  const plotValue = plotFields.map((field) => sample.attributes[field]).find((value) => value !== undefined && value !== null && String(value).trim());
  assert(plotValue !== undefined, `${label} sample is missing expected plot fields: ${plotFields.join(", ")}`);

  const objectId = sample.attributes[objectIdField];
  assert(objectId !== undefined && objectId !== null, `${label} sample is missing ${objectIdField}`);
  const exact = new URL(`${layerUrl}/query`);
  exact.searchParams.set("f", "json");
  exact.searchParams.set("where", `${objectIdField}=${Number(objectId)}`);
  exact.searchParams.set("outFields", "*");
  exact.searchParams.set("returnGeometry", "true");
  exact.searchParams.set("outSR", "4326");
  exact.searchParams.set("resultRecordCount", "2");
  exact.searchParams.set("token", token);
  const exactResult = await json(exact.toString());
  assert(exactResult.response.ok, `${label} exact re-query HTTP ${exactResult.response.status}`);
  assert(!exactResult.data?.error, `${label} exact re-query rejected: ${JSON.stringify(exactResult.data?.error ?? exactResult.data)}`);
  assert(Array.isArray(exactResult.data?.features) && exactResult.data.features.length === 1, `${label} exact re-query did not resolve one feature`);
  assert(exactResult.data.features[0]?.geometry, `${label} exact re-query lost geometry`);
  console.log(`[RAJUK] ${label}: live plot + geometry + exact feature re-query verified.`);
}

async function main() {
  const auth = await getServerToken();
  console.log(`[RAJUK] Authentication source: ${auth.source}`);

  console.log("[RAJUK] Verifying mauza boundary layer (FeatureServer/1)...");
  await assertLayerQuery(LAYER_MAUZA, auth.token, "FeatureServer/1");

  console.log("[RAJUK] Verifying RS plot layer (FeatureServer/0)...");
  await assertPlotLayer(LAYER_RS_PLOT, auth.token, "RS FeatureServer/0", ["rs_plot_no", "plot_no"]);

  console.log("[RAJUK] Verifying MS plot layer (FeatureServer/5)...");
  await assertPlotLayer(LAYER_MS_PLOT, auth.token, "MS FeatureServer/5", ["ms_plot_no", "plot_no"]);

  console.log("[RAJUK] SUCCESS: mauza + RS + MS live plot geometry are reachable with production-compatible auth.");
}

main().catch((error) => {
  console.error("[RAJUK] FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
