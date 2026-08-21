import { NextRequest, NextResponse } from "next/server";
import {
  getDistricts,
  getMouzas,
  getPlots,
  getPlotsByExtent,
  getUpazilas,
  identifyByPoint,
} from "@/src/services/rajuk/rajukQuery.service";
import type { RajukPlotKind } from "@/src/types/rajuk-runtime";

export const dynamic = "force-dynamic";

function isRajukAuthFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("498") || m.includes("499") || m.includes("invalid token") ||
    m.includes("authorized server token") || m.includes("not configured") ||
    m.includes("authentication failed") || m.includes("token generation failed") ||
    m.includes("token exchange failed") || m.includes("expired or invalid") ||
    m.includes("username/password rejected")
  );
}

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const action = p.get("action");
    if (action === "districts") return NextResponse.json({ features: await getDistricts() });
    if (action === "upazilas") {
      const dGuid = p.get("d_guid");
      if (!dGuid) return NextResponse.json({ error: "d_guid is required" }, { status: 400 });
      return NextResponse.json({ features: await getUpazilas(dGuid) });
    }
    if (action === "mouzas") {
      const tGuid = p.get("t_guid");
      if (!tGuid) return NextResponse.json({ error: "t_guid is required" }, { status: 400 });
      const kind = p.get("kind") === "ms" ? "ms" : "rs";
      return NextResponse.json({ features: await getMouzas(tGuid, kind) });
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
      const xmin = Number(p.get("xmin")); const ymin = Number(p.get("ymin"));
      const xmax = Number(p.get("xmax")); const ymax = Number(p.get("ymax"));
      if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) return NextResponse.json({ error: "xmin,ymin,xmax,ymax required" }, { status: 400 });
      const kindParam = p.get("kind");
      const kind = kindParam === "rs" || kindParam === "ms" ? kindParam : "all";
      return NextResponse.json(await getPlotsByExtent({ kind, xmin, ymin, xmax, ymax, limit: Number(p.get("limit") || 400) }));
    }
    if (action === "identify") {
      const lat = Number(p.get("lat")); const lng = Number(p.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return NextResponse.json({ error: "Valid lat/lng are required" }, { status: 400 });
      return NextResponse.json(await identifyByPoint(lat, lng));
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RAJUK request failed";
    if (isRajukAuthFailure(message)) return NextResponse.json({ error: message, code: "RAJUK_AUTH", hint: "Open /api/rajuk/auth/diagnose for token status." }, { status: 503 });
    return NextResponse.json({ error: message, code: "RAJUK_UPSTREAM" }, { status: 502 });
  }
}
