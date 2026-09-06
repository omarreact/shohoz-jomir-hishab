import { NextResponse } from "next/server";

const DLRMS_ORIGIN = "https://dlrms.land.gov.bd";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_TIMEOUT_MS = 20_000;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function absoluteScriptUrl(src: string): string | null {
  try {
    const url = new URL(src, DLRMS_ORIGIN);
    if (url.origin !== DLRMS_ORIGIN) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function extractInterestingStrings(source: string): string[] {
  const hits: string[] = [];

  const absoluteUrls = source.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  for (const raw of absoluteUrls) {
    if (/dlrms|khatian|porcha|verify|verification|qr|print|download|gateway/i.test(raw)) {
      hits.push(raw.slice(0, 500));
    }
  }

  const pathLike = source.match(/\/(?:core-api\/)?api\/(?:public\/)?[A-Za-z0-9_./{}:[\]-]{2,180}/g) ?? [];
  for (const raw of pathLike) {
    if (/khatian|porcha|verify|verification|qr|print|download|entry|record|public/i.test(raw)) {
      hits.push(raw);
    }
  }

  const quoted = source.match(/["'`]([^"'`]{0,220}(?:khatian|porcha|verify|verification|qr|uuid|print|download|entry)[^"'`]{0,220})["'`]/gi) ?? [];
  for (const raw of quoted) hits.push(raw.slice(1, -1));

  return unique(hits)
    .map((item) => item.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]"))
    .filter((item) => !/(access[_-]?token|refresh[_-]?token|authorization|cookie)=/i.test(item))
    .slice(0, 150);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await context.params;
  if (!UUID_RE.test(uuid)) {
    return NextResponse.json({ error: "Invalid verification UUID" }, { status: 400 });
  }

  const target = `${DLRMS_ORIGIN}/v/${uuid}`;
  const page = await fetch(target, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const html = await page.text();
  const scriptSources = unique(
    [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((src): src is string => Boolean(src)),
  );

  const scriptResults: Array<{
    src: string;
    status: number;
    contentType: string;
    interesting: string[];
  }> = [];

  for (const src of scriptSources.slice(0, 24)) {
    const url = absoluteScriptUrl(src);
    if (!url) continue;

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Accept: "application/javascript,text/javascript,*/*;q=0.8",
          Referer: target,
          "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const body = (await response.text()).slice(0, 3_000_000);
      const interesting = extractInterestingStrings(body);
      if (interesting.length) {
        scriptResults.push({
          src,
          status: response.status,
          contentType: response.headers.get("content-type") ?? "",
          interesting,
        });
      }
    } catch {
      // Discovery is best-effort. A failed chunk should not hide the rest.
    }
  }

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const pageSignals = extractInterestingStrings(html);

  return NextResponse.json(
    {
      target,
      page: {
        status: page.status,
        finalUrl: page.url,
        contentType: page.headers.get("content-type") ?? "",
        title,
        htmlBytes: Buffer.byteLength(html),
        scriptsFound: scriptSources.length,
        signals: pageSignals,
      },
      scripts: scriptResults,
      note: "Only public client-side implementation strings are returned. Cookies, authorization values and token-like material are not exposed.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
