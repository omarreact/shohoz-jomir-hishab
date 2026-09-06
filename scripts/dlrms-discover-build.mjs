const ORIGIN = "https://dlrms.land.gov.bd";
const VERIFY_PATH = "/v/d416e64b-4015-4ad9-9d82-d0cb2f781eec";
const target = `${ORIGIN}${VERIFY_PATH}`;

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

function extractWebpackModule(source, moduleId) {
  const markers = [`${moduleId}:function(`, `${moduleId}:function (`];
  let start = -1;
  for (const marker of markers) {
    start = source.indexOf(marker);
    if (start >= 0) break;
  }
  if (start < 0) return null;

  const rest = source.slice(start + 1);
  const next = rest.match(/,\d+:function\(/);
  const end = next?.index != null ? start + 1 + next.index : Math.min(source.length, start + 40000);
  return source.slice(start, end);
}

function logMatches(label, source, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "gi");
    const matches = [];
    let match;
    while ((match = regex.exec(source)) && matches.length < 20) {
      const start = Math.max(0, match.index - 700);
      const end = Math.min(source.length, match.index + match[0].length + 1200);
      matches.push(sanitize(source.slice(start, end)));
      if (regex.lastIndex === match.index) regex.lastIndex++;
    }
    if (matches.length) {
      console.log(`[DLRMS-DISCOVERY] ${label} pattern=${pattern} count=${matches.length}`);
      for (const snippet of [...new Set(matches)]) {
        console.log(`[DLRMS-DISCOVERY] ${label}-snippet :: ${snippet}`);
      }
    }
  }
}

export async function runDlrmsDiscovery() {
  try {
    const { response: pageResponse, text: html } = await get(target, "text/html,application/xhtml+xml");
    console.log(`[DLRMS-DISCOVERY] page=${pageResponse.status} bytes=${Buffer.byteLength(html)}`);

    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
      .map((m) => m[1])
      .filter(Boolean);

    const loaded = [];
    for (const src of scripts) {
      const url = new URL(src, ORIGIN);
      if (url.origin !== ORIGIN) continue;
      try {
        const { response, text } = await get(url.toString(), "application/javascript,text/javascript,*/*;q=0.8");
        loaded.push({ src, status: response.status, text });
      } catch {}
    }

    const hookChunk = loaded.find((item) => item.src.includes("9499-") && item.text.includes("8802:function"));
    if (!hookChunk) {
      console.log("[DLRMS-DISCOVERY] module8802=not-found");
      return;
    }

    const module8802 = extractWebpackModule(hookChunk.text, "8802");
    if (!module8802) {
      console.log("[DLRMS-DISCOVERY] module8802=parse-failed");
      return;
    }

    console.log(`[DLRMS-DISCOVERY] module8802-src=${hookChunk.src} bytes=${Buffer.byteLength(module8802)}`);
    console.log(`[DLRMS-DISCOVERY] module8802-head :: ${sanitize(module8802.slice(0, 12000))}`);
    logMatches("module8802", module8802, [
      "sJ:function",
      "sJ:",
      "displayCode",
      "DISPLAY_CODE",
      "verification",
      "verify",
      "khatian",
      "public",
      "api-core",
      "gateway",
      "axios",
      "useSWR",
      "fetch\\(",
      "CREATED_AT",
    ]);

    // Extract module IDs referenced by module 8802 and inspect likely endpoint/constants helpers.
    const referencedIds = [...new Set([...module8802.matchAll(/n\((\d+)\)/g)].map((m) => m[1]))];
    console.log(`[DLRMS-DISCOVERY] module8802-references=${JSON.stringify(referencedIds)}`);
    for (const id of referencedIds) {
      for (const item of loaded) {
        const moduleText = extractWebpackModule(item.text, id);
        if (!moduleText) continue;
        if (!/(khatian|display|verification|verify|api|gateway|public|axios|fetch|swr)/i.test(moduleText)) continue;
        console.log(`[DLRMS-DISCOVERY] helper-module=${id} src=${item.src} bytes=${Buffer.byteLength(moduleText)}`);
        logMatches(`helper-${id}`, moduleText, [
          "khatian",
          "display",
          "verification",
          "verify",
          "api/public",
          "api-core",
          "gateway",
          "axios",
          "baseURL",
          "fetch\\(",
        ]);
      }
    }
  } catch (error) {
    console.log(`[DLRMS-DISCOVERY] fatal=${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`);
  }
}
