import { NextResponse } from "next/server";

const HOME = "https://dlrms.land.gov.bd/";
const ORIGIN = "https://dlrms.land.gov.bd";
const PAPER_BASE = "https://gateway.dlrms.land.gov.bd/core-api/api/applications/print-khatian";
const ID_RE = /^\d{1,12}$/;
const SECRET_KEY = /(authorization|cookie|password|passwd|secret|token|refresh[_-]?token|access[_-]?token)/i;

function setCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  return h.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);
}

function cookieValue(headers: string[], name: string): string | undefined {
  const re = new RegExp(`(?:^|[,;]\\s*)${name}=([^;]+)`);
  for (const header of headers) {
    const value = header.match(re)?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
}

async function publicToken(): Promise<string> {
  const response = await fetch(HOME, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`DLRMS homepage failed (${response.status})`);
  const token = cookieValue(setCookies(response.headers), "dlrms_app_token");
  if (!token) throw new Error("DLRMS public application token was not issued");
  return token;
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 14) return "[nested data omitted]";
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid khatian/application id" }, { status: 400 });

  try {
    const token = await publicToken();
    const upstream = await fetch(`${PAPER_BASE}/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        Origin: ORIGIN,
        Referer: `${ORIGIN}/`,
        "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
      },
      signal: AbortSignal.timeout(25_000),
    });

    const raw = await upstream.text();
    let body: unknown = raw;
    try { body = JSON.parse(raw); } catch {}

    return NextResponse.json(
      {
        endpoint: `${PAPER_BASE}/{id}`,
        id,
        upstreamStatus: upstream.status,
        upstreamContentType: upstream.headers.get("content-type") ?? "",
        body: sanitize(body),
      },
      {
        status: upstream.ok ? 200 : 502,
        headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DLRMS paper request failed" },
      { status: 502, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
    );
  }
}
