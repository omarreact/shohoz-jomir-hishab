import { NextResponse } from "next/server";

const HOME = "https://dlrms.land.gov.bd/";
const ORIGIN = "https://dlrms.land.gov.bd";
const ENDPOINT = "https://gateway.dlrms.land.gov.bd/core-api/api/public/hal-sabeks/khatian";
const SURVEYS = new Set(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);

function setCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  return h.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);
}
function cookieValue(headers: string[], name: string): string | undefined {
  const re = new RegExp(`(?:^|[,;]\\s*)${name}=([^;]+)`);
  for (const header of headers) { const v = header.match(re)?.[1]?.trim(); if (v) return v; }
}
async function publicToken(): Promise<string> {
  const r = await fetch(HOME, {
    cache: "no-store",
    headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; LandBD-Research/1.0)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`DLRMS homepage failed (${r.status})`);
  const token = cookieValue(setCookies(r.headers), "dlrms_app_token");
  if (!token) throw new Error("DLRMS public application token was not issued");
  return token;
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const survey = (sp.get("survey") ?? "").toUpperCase();
  const division = sp.get("divisionBbsCode") ?? "";
  const district = sp.get("districtBbsCode") ?? "";
  const upazila = sp.get("upazilaBbsCode") ?? "";
  const jlNumberId = sp.get("jlNumberId") ?? "";
  const khatianNo = sp.get("khatianNo") ?? "";

  if (!SURVEYS.has(survey) || !/^\d{1,3}$/.test(division) || !/^\d{1,3}$/.test(district) || !/^\d{1,3}$/.test(upazila) || !/^\d+$/.test(jlNumberId) || !/^[\p{L}\p{N}./-]{1,80}$/u.test(khatianNo)) {
    return NextResponse.json({ error: "Invalid hal-sabek query" }, { status: 400 });
  }

  try {
    const token = await publicToken();
    const query = new URLSearchParams({
      DIVISION_BBS_CODE: division,
      DISTRICT_BBS_CODE: district,
      UPAZILA_BBS_CODE: upazila,
      SURVEY_TYPE: survey,
      JL_NUMBER_ID: jlNumberId,
      KHATIAN_NO: khatianNo,
    });
    const upstream = await fetch(`${ENDPOINT}?${query}`, {
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
    const text = await upstream.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch {}
    return NextResponse.json({
      endpoint: ENDPOINT,
      query: Object.fromEntries(query.entries()),
      upstreamStatus: upstream.status,
      body,
    }, {
      status: upstream.ok ? 200 : 502,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hal-sabek lookup failed" }, { status: 502 });
  }
}
