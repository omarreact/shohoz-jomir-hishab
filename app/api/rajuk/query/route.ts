import { NextRequest, NextResponse } from "next/server";
import { getDistricts, getMouzas, getPlots, getUpazilas, identifyByPoint } from "@/src/services/rajuk/rajukQuery.service";

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ features: await getMouzas(tGuid) });
    }
    if (action === "plots") {
      const raw = p.get("plot_no");
      const plotNo = raw ? Number(raw) : undefined;
      if (raw && plotNo !== undefined && (!Number.isInteger(plotNo) || plotNo < 0)) return NextResponse.json({ error: "plot_no must be an integer" }, { status: 400 });
      return NextResponse.json(await getPlots({ plotNo, mouza: p.get("mouza") || undefined, jl: p.get("jl") || undefined, upazila: p.get("upazila") || undefined, resultRecordCount: Number(p.get("limit") || 50), resultOffset: Number(p.get("offset") || 0) }));
    }
    if (action === "identify") {
      const lat = Number(p.get("lat"));
      const lng = Number(p.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return NextResponse.json({ error: "Valid lat/lng are required" }, { status: 400 });
      return NextResponse.json(await identifyByPoint(lat, lng));
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "RAJUK request failed" }, { status: 502 });
  }
}
