import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDistricts, getMouzas, getPlots, getPlotsByExtent, getUpazilas, identifyByPoint, searchMouzas } from "@/src/services/rajuk/rajukQuery.service";
import { toCalculationSafeKhatiyanPlot, RajukParcelDomainError } from "@/src/services/rajuk/rajukKhatiyanAdapter";
import {
  formatRajukServerTiming,
  getRajukHttpCallBudget,
  withRajukRequestMetrics,
} from "@/src/services/rajuk/rajukObservability";
import { logger, withTrace } from "@/src/shared/logger";
import type { RajukPlotFeature, RajukPlotKind } from "@/src/types/rajuk-runtime";

export const dynamic = "force-dynamic";

const RAJUK_SLOW_REQUEST_MS = 3_000;

function isRajukAuthFailure(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("498") || m.includes("499") || m.includes("invalid token") || m.includes("authorized server token") || m.includes("not configured") || m.includes("authentication failed") || m.includes("token generation failed") || m.includes("token exchange failed") || m.includes("expired or invalid") || m.includes("username/password rejected");
}

function parseShapeAreaUnit(value: string | null): "square-feet" | "square-meters" {
  if (value === "square-meters") return "square-meters";
  return "square-feet";
}

function adaptParcel(feature: RajukPlotFeature, unit: "square-feet" | "square-meters") {
  return toCalculationSafeKhatiyanPlot(feature, {
    measurementProfile: "khatiyan-record",
    shapeAreaUnit: unit,
  });
}

async function identifyWithCalculationBoundary(lat: number, lng: number) {
  const result = await identifyByPoint(lat, lng);
  const features = Array.isArray(result.features) ? result.features : [];
  const shapeAreaUnit = "square-feet" as const;
  const adapted = features.map((feature) => adaptParcel(feature, shapeAreaUnit));
  return {
    ...result,
    measurementProfile: "khatiyan-record" as const,
    shapeAreaUnit,
    calculationSafePlots: adapted,
  };
}

async function observeRajukRequest(
  request: NextRequest,
  action: string | null,
  kind: string | null,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const startedAt = performance.now();

  return withTrace(requestId, async () => {
    const { value: response, metrics } = await withRajukRequestMetrics(handler);
    const durationMs = performance.now() - startedAt;
    const callBudget = getRajukHttpCallBudget(action, kind);
    const budgetExceeded = metrics.upstreamGroups > callBudget;
    const slow = durationMs >= RAJUK_SLOW_REQUEST_MS;
    const logData = {
      event: "rajuk_api_request",
      requestId,
      method: request.method,
      action: action || "unknown",
      kind: kind || "default",
      status: response.status,
      durationMs: Math.round(durationMs),
      upstreamGroups: metrics.upstreamGroups,
      httpAttempts: metrics.httpAttempts,
      retries: metrics.retries,
      layers: metrics.layers,
      callBudget,
      budgetExceeded,
      slow,
    };

    if (response.status >= 500 || budgetExceeded || slow) {
      logger.warn(logData, "RAJUK API request completed with production signal");
    } else {
      logger.info(logData, "RAJUK API request completed");
    }

    response.headers.set("x-request-id", requestId);
    response.headers.set("Server-Timing", formatRajukServerTiming(durationMs, metrics));
    response.headers.set("x-rajuk-upstream-groups", String(metrics.upstreamGroups));
    response.headers.set("x-rajuk-http-attempts", String(metrics.httpAttempts));
    response.headers.set("x-rajuk-retries", String(metrics.retries));
    response.headers.set("x-rajuk-call-budget", String(callBudget));

    return response;
  });
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "JSON request body is required" }, { status: 400 });
    }

    const payload = body as { action?: unknown; feature?: unknown; shapeAreaUnit?: unknown };
    if (payload.action !== "adapt-for-khatiyan") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (!payload.feature || typeof payload.feature !== "object") {
      return NextResponse.json({ error: "feature is required", code: "INVALID_FEATURE" }, { status: 400 });
    }

    const unit = payload.shapeAreaUnit === "square-meters" ? "square-meters" : "square-feet";
    const adapted = adaptParcel(payload.feature as RajukPlotFeature, unit);

    return NextResponse.json({
      source: "RAJUK",
      measurementProfile: "khatiyan-record",
      shapeAreaUnit: unit,
      plot: adapted.plot,
      provenance: adapted.source,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }
    if (error instanceof RajukParcelDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "RAJUK request failed";
    if (isRajukAuthFailure(message)) {
      return NextResponse.json({ error: message, code: "RAJUK_AUTH", hint: "Open /api/rajuk/auth/diagnose for token status." }, { status: 503 });
    }
    return NextResponse.json({ error: message, code: "RAJUK_UPSTREAM" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  return observeRajukRequest(request, "adapt-for-khatiyan", null, () => handlePOST(request));
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const p = request.nextUrl.searchParams;
    const action = p.get("action");
    const ms = p.get("kind") === "ms";

    if (action === "districts") return NextResponse.json({ features: await getDistricts(ms ? "ms" : "rs") });

    if (action === "upazilas") {
      const dGuid = p.get("d_guid");
      if (!dGuid) return NextResponse.json({ error: "d_guid is required" }, { status: 400 });
      return NextResponse.json({ features: await getUpazilas(dGuid, ms ? "ms" : "rs") });
    }

    if (action === "search-mouza") {
      const q = p.get("q") || p.get("query") || "";
      const limit = Number(p.get("limit") || 20);
      return NextResponse.json({ features: await searchMouzas(q, limit) });
    }

    if (action === "mouzas") {
      const tGuid = p.get("t_guid");
      if (!tGuid) return NextResponse.json({ error: "t_guid is required" }, { status: 400 });
      return NextResponse.json({ features: await getMouzas(tGuid, ms ? "ms" : "rs") });
    }

    if (action === "plots") {
      const raw = p.get("plot_no");
      const plotNo = raw ? Number(raw) : undefined;
      if (raw && plotNo !== undefined && (!Number.isInteger(plotNo) || plotNo < 0)) {
        return NextResponse.json({ error: "plot_no must be an integer" }, { status: 400 });
      }
      const kindParam = p.get("kind") as RajukPlotKind | "all" | null;
      const kind = kindParam === "rs" || kindParam === "ms" || kindParam === "mixed" || kindParam === "unknown" || kindParam === "all" ? kindParam : undefined;
      return NextResponse.json(await getPlots({
        plotNo,
        rsPlotNo: p.get("rs_plot_no") || undefined,
        msPlotNo: p.get("ms_plot_no") || undefined,
        mouza: p.get("mouza") || undefined,
        jl: p.get("jl") || undefined,
        upazila: p.get("upazila") || undefined,
        kind,
        resultRecordCount: Number(p.get("limit") || 50),
        resultOffset: Number(p.get("offset") || 0),
      }));
    }

    if (action === "extent") {
      const xmin = Number(p.get("xmin"));
      const ymin = Number(p.get("ymin"));
      const xmax = Number(p.get("xmax"));
      const ymax = Number(p.get("ymax"));
      if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) {
        return NextResponse.json({ error: "xmin,ymin,xmax,ymax required" }, { status: 400 });
      }
      const kindParam = p.get("kind");
      const kind = kindParam === "rs" || kindParam === "ms" ? kindParam : "all";
      return NextResponse.json(await getPlotsByExtent({ kind, xmin, ymin, xmax, ymax, limit: Number(p.get("limit") || 400) }));
    }

    if (action === "identify") {
      const lat = Number(p.get("lat"));
      const lng = Number(p.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ error: "Valid lat/lng are required" }, { status: 400 });
      }
      return NextResponse.json(await identifyWithCalculationBoundary(lat, lng));
    }

    if (action === "parcel") {
      const lat = Number(p.get("lat"));
      const lng = Number(p.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ error: "Valid lat/lng are required" }, { status: 400 });
      }
      const result = await identifyByPoint(lat, lng);
      const features = Array.isArray(result.features) ? result.features : [];
      if (!features.length) return NextResponse.json({ error: "No parcel found at this location", code: "PARCEL_NOT_FOUND" }, { status: 404 });
      const unit = parseShapeAreaUnit(p.get("shape_area_unit"));
      const adapted = features.map((feature) => adaptParcel(feature, unit));
      return NextResponse.json({ source: "RAJUK", measurementProfile: "khatiyan-record", shapeAreaUnit: unit, parcels: adapted });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof RajukParcelDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "RAJUK request failed";
    if (isRajukAuthFailure(message)) {
      return NextResponse.json({ error: message, code: "RAJUK_AUTH", hint: "Open /api/rajuk/auth/diagnose for token status." }, { status: 503 });
    }
    return NextResponse.json({ error: message, code: "RAJUK_UPSTREAM" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return observeRajukRequest(request, params.get("action"), params.get("kind"), () => handleGET(request));
}
