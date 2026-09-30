import { NextRequest, NextResponse } from "next/server";
import { getPlots } from "@/src/services/rajuk/rajukQuery.service";
import { parseAddressSearch } from "@/src/services/rajuk/rajukPlotNormalize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TARGET = ["1974", "1977", "1990", "2006"];

function value(a: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const v = a[key];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
}

export async function GET(_request: NextRequest) {
  try {
    const result: Record<string, unknown> = {};
    for (const dag of TARGET) {
      const collection = await getPlots({
        plotNo: Number(dag),
        kind: "rs",
        resultRecordCount: 2000,
        resultOffset: 0,
      });

      const grouped = new Map<string, {
        jl: string;
        mouza: string;
        admin: string;
        count: number;
        sampleObjectId?: string;
        areaAcre?: string;
      }>();

      for (const feature of collection.features ?? []) {
        const a = (feature.attributes ?? {}) as Record<string, unknown>;
        const parsed = parseAddressSearch(value(a, "address_search"));
        const jl = value(a, "rs_jl_no", "jl_no") || parsed.jlNo || "";
        const mouza = value(a, "rs_mauza_name", "mauza") || parsed.mauza || "";
        const admin = value(a, "thana_upazila", "upazila_ps") || parsed.thanaUpazila || "";
        const key = [jl, mouza, admin].join("|");
        const current = grouped.get(key) || { jl, mouza, admin, count: 0 };
        current.count += 1;
        current.sampleObjectId ||= value(a, "objectid") || undefined;
        current.areaAcre ||= value(a, "area_acre") || undefined;
        grouped.set(key, current);
      }

      const identities = [...grouped.values()]
        .sort((a, b) => a.jl.localeCompare(b.jl) || a.mouza.localeCompare(b.mouza))
        .slice(0, 250);

      result[dag] = {
        rawCandidateCount: collection.features?.length ?? 0,
        identities,
      };
    }

    return NextResponse.json(
      { source: "RAJUK_RS_PLOT_LAYER", target: TARGET, result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research lookup failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
