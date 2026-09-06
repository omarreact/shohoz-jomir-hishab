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

function redact(input: string): string {
  return input
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]")
    .replace(/(access[_-]?token|refresh[_-]?token|authorization|cookie)(["'=:\s]+)[^,;\s"']+/gi, "$1$2[redacted]");
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
  return unique(hits).map(redact).slice(0, 150);
}

function contextsFor(source: string, keywords: string[], radius = 700, maxPerKeyword = 8) {
  return keywords.flatMap((keyword) => {
    const snippets: string[] = [];
    const haystack = source.toLowerCase();
    const needle = keyword.toLowerCase();
    let cursor = 0;
    while (snippets.length < maxPerKeyword) {
      const index = haystack.indexOf(needle, cursor);
      if (index < 0) break;
      const start = Math.max(0, index - radius);
      const end = Math.min(source.length, index + keyword.length + radius);
      snippets.push(redact(source.slice(start, end)));
      cursor = index + needle.length;
    }
    return snippets.length ? [{ keyword, snippets: unique(snippets) }] : [];
  });
}

async function fetchScript(src: string, referer: string): Promise<{ status: number; contentType: string; body: string } | null> {
  const url = absoluteScriptUrl(src);
  if (!url) return null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/javascript,text/javascript,*/*;q=0.8",
        Referer: referer,
        "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      body: (await response.text()).slice(0, 3_000_000),
    };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await context.params;
  if (!UUID_RE.test(uuid)) return NextResponse.json({ error: "Invalid verification UUID" }, { status: 400 });

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
    bytes: number;
    interesting: string[];
    contexts?: ReturnType<typeof contextsFor>;
  }> = [];
  const dynamicChunkIds: string[] = [];

  for (const src of scriptSources.slice(0, 24)) {
    const fetched = await fetchScript(src, target);
    if (!fetched) continue;
    const { status, contentType, body } = fetched;
    const interesting = extractInterestingStrings(body);
    const isVerificationPageChunk = /\/pages\/v\//i.test(src);

    if (isVerificationPageChunk) {
      for (const match of body.matchAll(/\.e\((\d+)\)/g)) dynamicChunkIds.push(match[1]);
    }

    if (interesting.length || isVerificationPageChunk) {
      scriptResults.push({
        src,
        status,
        contentType,
        bytes: Buffer.byteLength(body),
        interesting,
        ...(isVerificationPageChunk
          ? {
              contexts: contextsFor(body, [
                "displayCode",
                "khatian.view",
                "api/public",
                "gateway.dlrms",
                "api-core.dlrms",
                "verification",
                "verify",
                "uuid",
                "KHATIAN_ENTRY_ID",
                "KHATIAN_ID",
                "khatian",
                ".e(",
              ]),
            }
          : {}),
      });
    }
  }

  const webpackSrc = scriptSources.find((src) => /\/webpack-[^/]+\.js$/i.test(src));
  let webpack: { src: string; bytes: number; dynamicChunkIds: string[]; contexts: ReturnType<typeof contextsFor> } | null = null;
  if (webpackSrc) {
    const fetched = await fetchScript(webpackSrc, target);
    if (fetched) {
      const ids = unique(dynamicChunkIds);
      webpack = {
        src: webpackSrc,
        bytes: Buffer.byteLength(fetched.body),
        dynamicChunkIds: ids,
        contexts: contextsFor(fetched.body, ids, 1200, 12),
      };
    }
  }

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
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
        scriptSources,
        signals: extractInterestingStrings(html),
      },
      scripts: scriptResults,
      webpack,
      note: "Only public client-side implementation strings are returned. Authorization values, cookies and token-like material are redacted.",
    },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}
