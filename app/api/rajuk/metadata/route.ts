import { NextRequest, NextResponse } from "next/server";
import { getValidToken, invalidateToken, refreshToken } from "@/src/services/rajuk/rajukAuth.service";
import { DATA_MONITOR_SERVICES } from "@/src/features/admin/data-monitor/api-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthError(data: any, status: number) {
  return status === 401 || status === 403 || data?.error?.code === 498 || data?.error?.code === 499 || /invalid token|token required|token is required/i.test(String(data?.error?.message ?? data?.error ?? ""));
}

function errorCode(data: any): number | undefined {
  const code = Number(data?.error?.code);
  return Number.isFinite(code) ? code : undefined;
}

async function requestUpstream(url: URL, token?: string) {
  const target = new URL(url.toString());
  target.searchParams.set("f", "json");
  if (token) target.searchParams.set("token", token);
  const response = await fetch(target, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Referer: "https://masterplan.rajuk.gov.bd/",
      Origin: "https://masterplan.rajuk.gov.bd",
    },
  });
  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { response, data, url: target.toString() };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("service");
  const service = DATA_MONITOR_SERVICES.find((item) => item.id === id);
  if (!service) return NextResponse.json({ error: "Unknown service" }, { status: 404 });

  try {
    const url = new URL(service.endpoint);
    const requiresToken = service.kind === "feature" || service.id === "ms-mauza-tiles" || service.id === "flood";

    // Always test the upstream anonymously first. This is important because some
    // RAJUK services are genuinely public and must not be forced through auth.
    let attempt = await requestUpstream(url);
    let refreshed = false;

    if (requiresToken && isAuthError(attempt.data, attempt.response.status)) {
      try {
        const token = await getValidToken("https://masterplan.rajuk.gov.bd/server");
        attempt = await requestUpstream(url, token);
      } catch (authError) {
        return NextResponse.json({
          ok: false,
          error: authError instanceof Error ? authError.message : "RAJUK authentication failed",
          upstreamStatus: attempt.response.status,
          upstreamUrl: attempt.url,
          authenticationRequired: true,
          tokenAttempted: false,
          data: attempt.data,
        }, { status: 502 });
      }

      if (isAuthError(attempt.data, attempt.response.status)) {
        await invalidateToken("https://masterplan.rajuk.gov.bd/server");
        try {
          const token = await refreshToken("https://masterplan.rajuk.gov.bd/server");
          attempt = await requestUpstream(url, token);
          refreshed = true;
        } catch (authError) {
          return NextResponse.json({
            ok: false,
            error: authError instanceof Error ? authError.message : "RAJUK token refresh failed",
            upstreamStatus: attempt.response.status,
            upstreamUrl: attempt.url,
            authenticationRequired: true,
            tokenAttempted: true,
            tokenRefreshAttempted: true,
            data: attempt.data,
          }, { status: 502 });
        }
      }
    }

    const authFailed = isAuthError(attempt.data, attempt.response.status);
    const upstreamOk = attempt.response.ok && !attempt.data?.error;
    const status = upstreamOk ? 200 : authFailed ? 502 : (attempt.response.status >= 400 ? attempt.response.status : 502);

    return NextResponse.json({
      ok: upstreamOk,
      error: upstreamOk ? undefined : (attempt.data?.error?.message || attempt.data?.error || `Metadata failed (${attempt.response.status})`),
      upstreamStatus: attempt.response.status,
      upstreamUrl: attempt.url,
      authenticationRequired: requiresToken && authFailed,
      tokenAttempted: requiresToken,
      tokenRefreshAttempted: refreshed,
      errorCode: errorCode(attempt.data),
      data: attempt.data,
    }, { status });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Metadata request failed",
      upstreamStatus: 0,
      authenticationRequired: false,
    }, { status: 502 });
  }
}
