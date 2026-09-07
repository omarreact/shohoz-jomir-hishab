import axios from "axios";
import fs from "node:fs";
import path from "node:path";

const PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const SERVER = "https://masterplan.rajuk.gov.bd/server";
const LAYER_ID = process.env.RAJUK_EXPORT_LAYER_ID ?? "1";
const PAGE_SIZE = Math.min(Math.max(Number(process.env.RAJUK_EXPORT_PAGE_SIZE ?? 500), 1), 2000);
const OUT = process.env.RAJUK_EXPORT_OUT ?? path.resolve(process.cwd(), `rajuk-layer-${LAYER_ID}.geojson`);

function credential() {
  const value = (process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY)?.trim();
  if (!value) throw new Error("Set RAJUK_PORTAL_TOKEN (or legacy RAJUK_API_KEY) before exporting.");
  return value;
}

async function getServerToken() {
  const body = new URLSearchParams({
    request: "getToken",
    token: credential(),
    serverUrl: SERVER,
    client: "referer",
    referer: "https://masterplan.rajuk.gov.bd/",
    expiration: "60",
    f: "json",
  });
  const { data } = await axios.post(`${PORTAL}/generateToken`, body, {
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      origin: "https://masterplan.rajuk.gov.bd",
      referer: "https://masterplan.rajuk.gov.bd/",
    },
    timeout: 30_000,
  });
  if (!data.token) throw new Error(data.error?.message || "RAJUK server token exchange failed");
  return data.token as string;
}

async function main() {
  const token = await getServerToken();
  const url = `${SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/${LAYER_ID}/query`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const stream = fs.createWriteStream(OUT, { encoding: "utf8" });
  stream.write('{"type":"FeatureCollection","features":[\n');

  let offset = 0;
  let first = true;
  let total = 0;

  try {
    while (true) {
      const { data } = await axios.get(url, {
        timeout: 60_000,
        params: {
          f: "geojson",
          token,
          where: "1=1",
          outFields: "*",
          returnGeometry: "true",
          outSR: 4326,
          resultOffset: offset,
          resultRecordCount: PAGE_SIZE,
        },
      });

      if (data.error) throw new Error(`${data.error.code ?? "RAJUK"}: ${data.error.message ?? "query failed"}`);
      const features = Array.isArray(data.features) ? data.features : [];
      if (!features.length) break;

      for (const feature of features) {
        if (!first) stream.write(",\n");
        stream.write(JSON.stringify(feature));
        first = false;
        total += 1;
      }

      offset += features.length;
      process.stdout.write(`Exported ${total} features...\n`);
      if (!data.exceededTransferLimit && features.length < PAGE_SIZE) break;
    }

    stream.write('\n]}\n');
    await new Promise<void>((resolve, reject) => {
      stream.once("finish", resolve);
      stream.once("error", reject);
      stream.end();
    });
    console.log(`Done: ${total} features -> ${OUT}`);
  } catch (error) {
    stream.destroy();
    try { fs.unlinkSync(OUT); } catch {}
    throw error;
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
