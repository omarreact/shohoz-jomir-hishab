const ORIGIN = "https://dlrms.land.gov.bd";
const VERIFY_PATH = "/v/d416e64b-4015-4ad9-9d82-d0cb2f781eec";
const target = `${ORIGIN}${VERIFY_PATH}`;

function contexts(source, needle, radius = 1800) {
  const out = [];
  let cursor = 0;
  const lower = source.toLowerCase();
  const n = needle.toLowerCase();
  while (out.length < 8) {
    const i = lower.indexOf(n, cursor);
    if (i < 0) break;
    out.push(source.slice(Math.max(0, i - radius), Math.min(source.length, i + n.length + radius)));
    cursor = i + n.length;
  }
  return out;
}

function sanitize(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]")
    .replace(/(access[_-]?token|refresh[_-]?token|authorization|cookie)([\"'=:\s]+)[^,;\s\"']+/gi, "$1$2[redacted]");
}

async function get(url, accept) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: accept,
      Referer: target,
      "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
    },
    signal: AbortSignal.timeout(20000),
  });
  return { response, text: await response.text() };
}

try {
  const { response: pageResponse, text: html } = await get(target, "text/html,application/xhtml+xml");
  console.log(`[DLRMS-DISCOVERY] page=${pageResponse.status} bytes=${Buffer.byteLength(html)}`);

  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter(Boolean);
  console.log(`[DLRMS-DISCOVERY] scripts=${scripts.length}`);
  console.log(`[DLRMS-DISCOVERY] scriptSources=${JSON.stringify(scripts)}`);

  const loaded = [];
  for (const src of scripts) {
    const url = new URL(src, ORIGIN);
    if (url.origin !== ORIGIN) continue;
    try {
      const { response, text } = await get(url.toString(), "application/javascript,text/javascript,*/*;q=0.8");
      loaded.push({ src, status: response.status, text });
    } catch (error) {
      console.log(`[DLRMS-DISCOVERY] script-failed src=${src} error=${error instanceof Error ? error.name : "unknown"}`);
    }
  }

  const pageChunk = loaded.find((item) => /\/pages\/v\//i.test(item.src));
  if (pageChunk) {
    console.log(`[DLRMS-DISCOVERY] verificationPageChunk=${pageChunk.src} bytes=${Buffer.byteLength(pageChunk.text)}`);
    for (const key of ["displayCode", ".e(3871)", "63871", "khatian.view"]) {
      for (const snippet of contexts(pageChunk.text, key)) {
        console.log(`[DLRMS-DISCOVERY] page-context key=${key} :: ${sanitize(snippet)}`);
      }
    }
  }

  const runtimeCandidates = loaded.filter((item) => /webpack/i.test(item.src) || item.text.includes(".u=") || item.text.includes("3871"));
  for (const item of runtimeCandidates) {
    if (!item.text.includes("3871")) continue;
    console.log(`[DLRMS-DISCOVERY] runtime-hit src=${item.src} bytes=${Buffer.byteLength(item.text)}`);
    for (const snippet of contexts(item.text, "3871", 4000)) {
      console.log(`[DLRMS-DISCOVERY] runtime-3871 :: ${sanitize(snippet)}`);
    }
  }

  // Try to resolve any literal static/chunks path containing the target chunk hash.
  const allRuntimeText = runtimeCandidates.map((x) => x.text).join("\n");
  const hashCandidates = new Set();
  for (const match of allRuntimeText.matchAll(/3871[^A-Za-z0-9]{1,20}["']([A-Za-z0-9_-]{6,64})["']/g)) {
    hashCandidates.add(match[1]);
  }
  for (const hash of hashCandidates) {
    const guesses = [
      `/_next/static/chunks/3871-${hash}.js`,
      `/_next/static/chunks/3871.${hash}.js`,
      `/_next/static/chunks/${hash}.js`,
    ];
    for (const guess of guesses) {
      try {
        const { response, text } = await get(`${ORIGIN}${guess}`, "application/javascript,text/javascript,*/*;q=0.8");
        if (response.ok && (text.includes("63871") || /displayCode|khatian|verify|verification/i.test(text))) {
          console.log(`[DLRMS-DISCOVERY] dynamicChunk=${guess} status=${response.status} bytes=${Buffer.byteLength(text)}`);
          for (const key of ["displayCode", "router.query", "api/public", "gateway", "api-core", "khatian", "verify", "verification", "KHATIAN", "OWNER", "DAG", "AREA", "SHARE"]) {
            for (const snippet of contexts(text, key, 1600)) {
              console.log(`[DLRMS-DISCOVERY] dynamic-context key=${key} :: ${sanitize(snippet)}`);
            }
          }
        }
      } catch {}
    }
  }
} catch (error) {
  console.log(`[DLRMS-DISCOVERY] fatal=${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`);
}
