const ORIGIN = "https://dlrms.land.gov.bd";
const VERIFY_PATH = "/v/d416e64b-4015-4ad9-9d82-d0cb2f781eec";
const target = `${ORIGIN}${VERIFY_PATH}`;
const TERMS = [
  "hal-sabeks/khatian",
  ".W1Z",
  "W1Z",
  "NEW_KHATIAN_ID",
  "OLD_KHATIAN_ID",
  "CURRENT_KHATIAN_APPLICATION",
  "SENT_KHATIAN_APPLICATION",
  "hal-sabek",
  "halSabek",
  "sabek",
  "referenceKhatian",
  "reference-khatian",
  "KHATIAN_ENTRY_ID",
];

function sanitize(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]")
    .replace(/(access[_-]?token|refresh[_-]?token|authorization|cookie)([\"'=:\s]+)[^,;\s\"']+/gi, "$1$2[redacted]");
}

async function get(url, accept = "application/javascript,text/javascript,*/*;q=0.8") {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: accept,
      Referer: target,
      "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
    },
    signal: AbortSignal.timeout(12000),
  });
  return { response, text: await response.text() };
}

function contexts(source, term, max = 8) {
  const out = [];
  let from = 0;
  while (out.length < max) {
    const index = source.indexOf(term, from);
    if (index < 0) break;
    out.push(sanitize(source.slice(Math.max(0, index - 1200), Math.min(source.length, index + term.length + 2200))));
    from = index + term.length;
  }
  return [...new Set(out)];
}

async function scanOne(src) {
  try {
    const url = new URL(src.startsWith("/") ? src : `/_next/${src}`, ORIGIN);
    if (url.origin !== ORIGIN) return;
    const { response, text } = await get(url.toString());
    if (!response.ok) return;
    const hits = [];
    for (const term of TERMS) {
      const found = contexts(text, term);
      if (found.length) hits.push([term, found]);
    }
    if (!hits.length) return;
    console.log(`[DLRMS-TARGET] src=${src} bytes=${Buffer.byteLength(text)}`);
    for (const [term, found] of hits) {
      console.log(`[DLRMS-TARGET] term=${term} count=${found.length}`);
      for (const snippet of found) console.log(`[DLRMS-TARGET] snippet :: ${snippet}`);
    }
  } catch (error) {
    console.log(`[DLRMS-TARGET] fetch-failed src=${src} error=${error instanceof Error ? error.name : "unknown"}`);
  }
}

export async function runDlrmsDiscovery() {
  try {
    const { response: pageResponse, text: html } = await get(target, "text/html,application/xhtml+xml");
    console.log(`[DLRMS-TARGET] page=${pageResponse.status} bytes=${Buffer.byteLength(html)}`);

    const pageScripts = [...new Set([...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]).filter(Boolean))];
    const manifestSrc = pageScripts.find((s) => s.includes("/_buildManifest.js"));
    const allScripts = new Set(pageScripts);

    if (manifestSrc) {
      const { response, text: manifest } = await get(new URL(manifestSrc, ORIGIN).toString());
      console.log(`[DLRMS-TARGET] manifest=${response.status} bytes=${Buffer.byteLength(manifest)}`);
      for (const match of manifest.matchAll(/["']((?:static\/chunks\/)?pages\/[^"']+?\.js)["']/g)) allScripts.add(`/_next/${match[1]}`);
      for (const match of manifest.matchAll(/["'](static\/chunks\/[^"']+?\.js)["']/g)) allScripts.add(`/_next/${match[1]}`);
    }

    const scripts = [...allScripts].slice(0, 220);
    console.log(`[DLRMS-TARGET] scripts=${scripts.length}`);
    const batchSize = 8;
    for (let i = 0; i < scripts.length; i += batchSize) {
      await Promise.all(scripts.slice(i, i + batchSize).map(scanOne));
    }
  } catch (error) {
    console.log(`[DLRMS-TARGET] fatal=${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`);
  }
}
