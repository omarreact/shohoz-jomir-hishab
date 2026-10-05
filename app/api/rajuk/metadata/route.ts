import { NextRequest, NextResponse } from "next/server";
import {
  getValidToken,
  invalidateToken,
  refreshToken,
  RAJUK_SERVER,
  REFERER,
} from "@/src/services/rajuk/rajukAuth.service";
import {
  getRajukArcGisErrorCode,
  getRajukProxyErrorStatus,
  isRajukArcGisAuthError,
  sanitizeRajukDiagnosticUrl,
} from "@/src/services/rajuk/rajukProxyDiagnostics";
import { DATA_MONITOR_SERVICES } from "@/src/features/admin/data-monitor/api-registry";
import { RAJUK_DB, RAJUK_LAYERS } from "@/src/services/rajuk/rajukLayers.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


const UPSTREAM_ENDPOINTS: Readonly<Record<string, string>> = {
  "rs-plots": `${RAJUK_DB}/0`,
  "rs-mouza": `${RAJUK_DB}/1`,
  upazila: `${RAJUK_DB}/9`,
  district: `${RAJUK_DB}/10`,
  "dap-landuse": RAJUK_LAYERS.dap.service,
  "rs-mauza-tiles": RAJUK_LAYERS.rs.service,
  "ms-mauza-tiles": RAJUK_LAYERS.ms.service,
  flood: RAJUK_LAYERS.flood.service,
  "overlay-boundary": RAJUK_LAYERS.boundary.service,
  transport: RAJUK_LAYERS.transport.service,
};

function upstreamEndpoint(service: (typeof DATA_MONITOR_SERVICES)[number]): string {
  if (service.kind === "external") return service.endpoint;
  const endpoint = UPSTREAM_ENDPOINTS[service.id];
  if (!endpoint) throw new Error("No upstream endpoint configured for monitored service");
  return endpoint;
}

type MetadataAttempt = {
  response: Response;
  data: any;
  diagnosticUrl: string;
};

function errorMessage(data: any, status: number): string {
  if (typeof data?.error === "string") return data.error;
  return data?.error?.message || `Metadata failed (${status})`;
}

async function requestUpstream(url: URL, token?: string): Promise<MetadataAttempt> {
  const target = new URL(url.toString());
  target.searchParams.delete("token");
  target.searchParams.set("f", "json");
  if (token) target.searchParams.set("token", token);

  const response = await fetch(target, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      referer: REFERER,
      origin: "https://masterplan.rajuk.gov.bd",
    },
  });
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    response,
    data,
    diagnosticUrl: sanitizeRajukDiagnosticUrl(target),
  };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("service");
  const service = DATA_MONITOR_SERVICES.find((item) => item.id === id);
  if (!service) return NextResponse.json({ error: "Unknown service" }, { status: 404 });

  try {
    const url = new URL(upstreamEndpoint(service));
    const configuredAsProtected = service.kind === "feature" || service.id === "ms-mauza-tiles" || service.id === "flood";

    // Always try anonymously first. Public services must not depend on token health.
    let attempt = await requestUpstream(url);
    const authenticationRequired = isRajukArcGisAuthError(attempt.response.status, attempt.data);
    let tokenAttempted = false;
    let tokenRefreshAttempted = false;

    if (authenticationRequired) {
      tokenAttempted = true;
      try {
        attempt = await requestUpstream(url, await getValidToken(RAJUK_SERVER));
      } catch (authError) {
        return NextResponse.json({
          ok: false,
          error: authError instanceof Error ? authError.message : "RAJUK authentication failed",
          upstreamStatus: attempt.response.status,
          upstreamUrl: attempt.diagnosticUrl,
          authenticationRequired: true,
          configuredAsProtected,
          tokenAttempted,
          tokenRefreshAttempted,
          data: attempt.data,
        }, { status: 502 });
      }

      if (isRajukArcGisAuthError(attempt.response.status, attempt.data)) {
        tokenRefreshAttempted = true;
        await invalidateToken(RAJUK_SERVER);
        try {
          attempt = await requestUpstream(url, await refreshToken(RAJUK_SERVER));
        } catch (authError) {
          return NextResponse.json({
            ok: false,
            error: authError instanceof Error ? authError.message : "RAJUK token refresh failed",
            upstreamStatus: attempt.response.status,
            upstreamUrl: attempt.diagnosticUrl,
            authenticationRequired: true,
            configuredAsProtected,
            tokenAttempted,
            tokenRefreshAttempted,
            data: attempt.data,
          }, { status: 502 });
        }
      }
    }

    const upstreamOk = attempt.response.ok && !attempt.data?.error;
    const status = upstreamOk
      ? 200
      : getRajukProxyErrorStatus(attempt.response.status, attempt.data);

    return NextResponse.json({
      ok: upstreamOk,
      error: upstreamOk ? undefined : errorMessage(attempt.data, attempt.response.status),
      upstreamStatus: attempt.response.status,
      upstreamUrl: attempt.diagnosticUrl,
      authenticationRequired,
      configuredAsProtected,
      tokenAttempted,
      tokenRefreshAttempted,
      errorCode: getRajukArcGisErrorCode(attempt.data),
      data: attempt.data,
    }, { status });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Metadata request failed",
      upstreamStatus: 0,
      authenticationRequired: false,
      configuredAsProtected: false,
    }, { status: 502 });
  }
}
