import { NextRequest, NextResponse } from "next/server";
import { getValidToken, invalidateToken, refreshToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_QUERY_KEYS = new Set([
  "where", "outFields", "resultOffset", "resultRecordCount", "geometry",
  "geometryType", "spatialRel", "inSR", "outSR", "returnGeometry", "orderByFields",
  "returnIdsOnly", "returnCountOnly", "returnDistinctValues", "objectIds",
]);

function upstreamUrl(layerId: string) {
  if (!/^\d+$/.test(layerId)) throw new Error("layerId must be numeric");
  return `${RAJUK_SERVER}/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/${layerId}/query`;
}

async function fetchUpstream(url: string, params: URLSearchParams, token?: string) {
  const query = new URLSearchParams(params);
  query.set("f", "geojson");
  if (token) query.set("token", token);
  return fetch(`${url}?${query.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/json", Referer: "https://masterplan.rajuk.gov.bd/", Origin: "https://masterplan.rajuk.gov.bd" },
  });
}

function isAuthError(response: Response, data: any) {
  const message = String(data?.error?.message ?? data?.error ?? "");
  return response.status === 401 || response.status === 403 || data?.error?.code === 498 || data?.error?.code === 499 || /invalid token|token required|token is required/i.test(message);
}

export async function GET(request: NextRequest, context: { params: Promise<{ layerId: string }> }) {
  try {
    const { layerId } = await context.params;
    const url = upstreamUrl(layerId);
    const params = new URLSearchParams();
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (ALLOWED_QUERY_KEYS.has(key)) params.set(key, value);
    }
    params.set("f", "geojson");

    // Public-first: do not force a token onto genuinely public layers.
    let response = await fetchUpstream(url, params);
    let data = await response.json();

    if (isAuthError(response, data)) {
      const token = await getValidToken(RAJUK_SERVER);
      response = await fetchUpstream(url, params, token);
      data = await response.json();

      if (isAuthError(response, data)) {
        await invalidateToken(RAJUK_SERVER);
        const freshToken = await refreshToken(RAJUK_SERVER);
        response = await fetchUpstream(url, params, freshToken);
        data = await response.json();
      }
    }

    if (!response.ok || data?.error) {
      const code = Number(data?.error?.code);
      const status = code === 498 || code === 499 || /invalid token|token required/i.test(String(data?.error?.message ?? data?.error ?? ""))
        ? 502
        : response.status >= 400 ? response.status : 502;
      return NextResponse.json({
        ok: false,
        error: data?.error?.message || data?.error || "RAJUK FeatureServer request failed",
        code: Number.isFinite(code) ? code : undefined,
        upstreamStatus: response.status,
      }, { status });
    }

    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "RAJUK proxy failed" }, { status: 502 });
  }
}
