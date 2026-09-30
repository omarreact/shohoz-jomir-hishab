export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ORIGIN = "https://settlement.gov.bd";
const DISTRICT_ID = "010500000";
const COMCOD = "4105";
const GULSHAN_UNIT = "010505000";
const PATIRA_UNIT = "010505005";

function digits(value: string | null, fallback = ""): string {
  const v = (value || fallback).trim();
  if (!/^\d{1,20}$/.test(v)) throw new Error("Invalid numeric parameter");
  return v;
}

async function postForm(path: string, form: Record<string, string>) {
  const body = new URLSearchParams(form);
  const res = await fetch(`${ORIGIN}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Origin: ORIGIN,
      Referer: `${ORIGIN}/Map/MapSearch`,
      "User-Agent": "Mozilla/5.0 (compatible; LandBDResearch/1.0)",
      "X-Requested-With": "XMLHttpRequest",
    },
    body,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, contentType: res.headers.get("content-type"), data };
}

function absoluteUrl(src: string): string | null {
  try {
    const url = new URL(src, ORIGIN);
    return url.hostname === "settlement.gov.bd" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function discoverScripts() {
  const page = await fetch(`${ORIGIN}/Map/MapSearch`, {
    cache: "no-store",
    headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; LandBDResearch/1.0)" },
    signal: AbortSignal.timeout(20000),
  });
  const html = await page.text();
  const scriptSources = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => absoluteUrl(m[1]))
    .filter((v): v is string => Boolean(v));

  const endpoints = new Set<string>();
  const evidence: Array<{ script: string; matches: string[] }> = [];

  for (const script of [...new Set(scriptSources)].slice(0, 40)) {
    try {
      const res = await fetch(script, {
        cache: "no-store",
        headers: { Accept: "*/*", Referer: `${ORIGIN}/Map/MapSearch`, "User-Agent": "Mozilla/5.0 (compatible; LandBDResearch/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const js = await res.text();
      const matches = new Set<string>();

      for (const m of js.matchAll(/\/(?:Khatian|Map)\/[A-Za-z0-9_/-]+/g)) {
        const value = m[0].replace(/[),;]+$/, "");
        endpoints.add(value);
        matches.add(value);
      }
      for (const m of js.matchAll(/(?:url\s*:\s*|ajax\s*\(\s*)["']([^"']*(?:Get|MapSearch|Khatian)[^"']*)["']/gi)) {
        const value = m[1];
        if (value && value.length < 220) {
          endpoints.add(value);
          matches.add(value);
        }
      }

      if (matches.size) evidence.push({ script, matches: [...matches].sort() });
    } catch {}
  }

  return {
    pageStatus: page.status,
    scriptCount: scriptSources.length,
    scripts: [...new Set(scriptSources)],
    endpoints: [...endpoints].sort(),
    evidence,
  };
}

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const mode = sp.get("mode") || "scripts";

    if (mode === "scripts") {
      return Response.json(await discoverScripts(), { headers: { "Cache-Control": "no-store" } });
    }

    if (mode === "surveys") {
      const result = await postForm("/Khatian/GetSurveyListDistrictWise", {
        districtid: DISTRICT_ID,
        comcod: COMCOD,
      });
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    if (mode === "thanas") {
      const rsnum = digits(sp.get("rsnum"));
      const result = await postForm("/Khatian/GetThanaListBySurveyMap", {
        comcod: COMCOD,
        rsno1: rsnum,
        districtid: DISTRICT_ID,
      });
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    if (mode === "mouzas") {
      const rsnum = digits(sp.get("rsnum"));
      const unitcod = digits(sp.get("unitcod"), GULSHAN_UNIT);
      const result = await postForm("/Khatian/GetMouzaListBySurveyMap", {
        comcod: COMCOD,
        rsnum,
        unitcod,
      });
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    if (mode === "sheet") {
      const rsnum = digits(sp.get("rsnum"));
      const sheetno = digits(sp.get("sheetno"), "001");
      const unitcod = digits(sp.get("unitcod"), PATIRA_UNIT);
      const result = await postForm("/Khatian/GetSheetJsonBySurvey", {
        rsnum,
        comcod: COMCOD,
        unitcod,
        sheetno,
      });
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    return Response.json({ error: "Unsupported mode" }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Research request failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
