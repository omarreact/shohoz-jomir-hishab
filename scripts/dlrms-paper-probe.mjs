const HOME = "https://dlrms.land.gov.bd/";
const ORIGIN = "https://dlrms.land.gov.bd";
const BASE = "https://gateway.dlrms.land.gov.bd/core-api/api/applications/print-khatian";
const IDS = [
  828626,    // CS 37 public index ID
  21814914,  // CS 37 KHATIAN_ENTRY_ID / QR KHATIAN_ID
  1102190,   // unrelated CS 16 public index ID
  3350283,   // unrelated CS 16 KHATIAN_ENTRY_ID
];

function cookieValue(setCookie, name) {
  const pattern = new RegExp(`(?:^|[,;]\\s*)${name}=([^;]+)`);
  for (const header of setCookie) {
    const value = header.match(pattern)?.[1]?.trim();
    if (value) return value;
  }
}

function cookies(headers) {
  return typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : headers.get("set-cookie")
      ? [headers.get("set-cookie")]
      : [];
}

function sanitize(value, depth = 0) {
  if (depth > 12) return "[nested data omitted]";
  if (value == null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  if (typeof value !== "object") return String(value);
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (/(authorization|cookie|password|passwd|secret|token|refresh[_-]?token|access[_-]?token)/i.test(key)) continue;
    out[key] = sanitize(item, depth + 1);
  }
  return out;
}

export async function runDlrmsPaperProbe() {
  try {
    const home = await fetch(HOME, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    const token = cookieValue(cookies(home.headers), "dlrms_app_token");
    console.log(`[DLRMS-PAPER] home=${home.status} anonymousTokenIssued=${Boolean(token)}`);
    if (!token) return;

    for (const id of IDS) {
      try {
        const response = await fetch(`${BASE}/${id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            Origin: ORIGIN,
            Referer: `${ORIGIN}/`,
            "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(25_000),
        });
        const raw = await response.text();
        let body = raw;
        try { body = JSON.parse(raw); } catch {}
        const safe = sanitize(body);
        const printable = typeof safe === "string" ? safe : JSON.stringify(safe);
        console.log(`[DLRMS-PAPER] id=${id} status=${response.status} type=${response.headers.get("content-type") || ""} bytes=${Buffer.byteLength(raw)}`);
        console.log(`[DLRMS-PAPER] body id=${id} :: ${printable.slice(0, 120000)}`);
      } catch (error) {
        console.log(`[DLRMS-PAPER] id=${id} fetchError=${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`);
      }
    }
  } catch (error) {
    console.log(`[DLRMS-PAPER] fatal=${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`);
  }
}
