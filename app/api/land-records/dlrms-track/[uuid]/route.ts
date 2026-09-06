import { NextResponse } from "next/server";

const DLRMS_HOME_URL = "https://dlrms.land.gov.bd/";
const DLRMS_ORIGIN = "https://dlrms.land.gov.bd";
const TRACKING_BASE = "https://gateway.dlrms.land.gov.bd/core-api/api/public/applications/khatian-application-tracking";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET_KEY = /(authorization|cookie|password|passwd|secret|token|refresh[_-]?token|access[_-]?token)/i;

function setCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  return h.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);
}

function cookieValue(headers: string[], name: string): string | undefined {
  const re = new RegExp(`(?:^|[,;]\\s*)${name}=([^;]+)`);
  for (const header of headers) {
    const found = header.match(re)?.[1]?.trim();
    if (found) return found;
  }
  return undefined;
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[nested data omitted]";
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (!value || typeof value !== "object") return String(value ?? "");
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(key)) continue;
    output[key] = sanitize(item, depth + 1);
  }
  return output;
}

async function publicToken(): Promise<string> {
  const home = await fetch(DLRMS_HOME_URL, {
    cache: "no-store",
    headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!home.ok) throw new Error(`DLRMS homepage failed (${home.status})`);
  const token = cookieValue(setCookies(home.headers), "dlrms_app_token");
  if (!token) throw new Error("DLRMS public application token was not issued");
  return token;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await context.params;
  if (!UUID_RE.test(uuid)) return NextResponse.json({ error: "Invalid verification UUID" }, { status: 400 });

  try {
    const token = await publicToken();
    const url = `${TRACKING_BASE}/${encodeURIComponent(uuid)}`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        Origin: DLRMS_ORIGIN,
        Referer: `${DLRMS_ORIGIN}/v/${uuid}`,
        "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
      },
      signal: AbortSignal.timeout(25_000),
    });

    const raw = await response.text();
    let body: unknown = raw;
    try { body = JSON.parse(raw); } catch {}

    return NextResponse.json(
      {
        endpoint: `${TRACKING_BASE}/{displayCode}`,
        displayCode: uuid,
        upstreamStatus: response.status,
        upstreamContentType: response.headers.get("content-type") ?? "",
        body: sanitize(body),
      },
      {
        status: response.ok ? 200 : 502,
        headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DLRMS tracking request failed" },
      { status: 502, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
    );
  }
}
