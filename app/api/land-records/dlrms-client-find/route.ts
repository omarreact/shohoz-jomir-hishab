import { NextResponse } from "next/server";

const ORIGIN = "https://dlrms.land.gov.bd";
const TARGET = `${ORIGIN}/v/d416e64b-4015-4ad9-9d82-d0cb2f781eec`;
const TERMS = [
  "8802:function",
  "useFetchApplicationSurveyKhatian",
  "useFetchApplicationMutationKhatian",
  "useFetchApplicationBrsKhatian",
  "uyF",
  "API_APPLIED_KHATIAN_PRINT",
  "print-khatian",
  "serviceAccessUserType",
];

function unique<T>(items: T[]): T[] { return [...new Set(items)]; }
function contexts(source: string, term: string): string[] {
  const out: string[] = [];
  let from = 0;
  while (out.length < 10) {
    const i = source.indexOf(term, from);
    if (i < 0) break;
    out.push(source.slice(Math.max(0, i - 1800), Math.min(source.length, i + term.length + 3200)));
    from = i + term.length;
  }
  return out;
}

export async function GET() {
  try {
    const page = await fetch(TARGET, {
      cache: "no-store",
      headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)" },
      signal: AbortSignal.timeout(20_000),
    });
    const html = await page.text();
    const scripts = unique(
      [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
        .map((m) => m[1])
        .filter((s): s is string => Boolean(s)),
    );

    const results: Array<{ src: string; matches: Record<string, string[]> }> = [];
    for (const src of scripts.slice(0, 30)) {
      const url = new URL(src, ORIGIN);
      if (url.origin !== ORIGIN) continue;
      try {
        const r = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/javascript,text/javascript,*/*;q=0.8", Referer: TARGET },
          signal: AbortSignal.timeout(20_000),
        });
        if (!r.ok) continue;
        const body = (await r.text()).slice(0, 5_000_000);
        const matches: Record<string, string[]> = {};
        for (const term of TERMS) {
          const c = contexts(body, term);
          if (c.length) matches[term] = c;
        }
        if (Object.keys(matches).length) results.push({ src, matches });
      } catch {}
    }

    return NextResponse.json({ target: TARGET, terms: TERMS, results }, {
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "DLRMS client scan failed" }, { status: 502 });
  }
}
