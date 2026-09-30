import { NextRequest, NextResponse } from "next/server";
import { selectUniqueRsCandidate } from "@/src/features/land-records/lib/dag-map-areas";
import { getPlots } from "@/src/services/rajuk/rajukQuery.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const numeric = /^\d{1,10}$/;
const MAX_DAGS = 24;
const CONCURRENCY = 4;

async function resolveOne(
  dagNumber: string,
  input: { jlNumber: string; mouzaName: string; upazilaName?: string },
) {
  const collection = await getPlots({
    plotNo: Number(dagNumber),
    kind: "rs",
    resultRecordCount: 2000,
    resultOffset: 0,
  });

  const selected = selectUniqueRsCandidate(collection.features ?? [], {
    dagNo: dagNumber,
    jlNumber: input.jlNumber,
    mouzaName: input.mouzaName,
    upazilaName: input.upazilaName,
  });

  if (!selected.feature || !selected.area) {
    return {
      resolved: false as const,
      dagNumber,
      diagnostics: selected.diagnostics,
    };
  }

  const attributes = selected.feature.attributes ?? {};
  return {
    resolved: true as const,
    dagNumber,
    source: "RAJUK_RS_PLOT_LAYER" as const,
    mapTotalAreaAcre: selected.area.acre,
    mapTotalAreaLabel: selected.area.label,
    areaSourceField: "Shape__Area" as const,
    areaSourceUnit: selected.area.sourceUnit,
    objectId: attributes.objectid != null ? String(attributes.objectid) : undefined,
    addressSearch: attributes.address_search ?? undefined,
    landUse: attributes.landuse ?? attributes.land_use ?? attributes.land_type ?? undefined,
    diagnostics: selected.diagnostics,
  };
}

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const rawDags = p.get("dagNumbers")?.trim() || "";
    const jlNumber = p.get("jlNumber")?.trim() || "";
    const mouzaName = p.get("mouzaName")?.trim() || "";
    const upazilaName = p.get("upazilaName")?.trim() || undefined;

    const dagNumbers = [...new Set(
      rawDags.split(",").map((item) => item.trim()).filter(Boolean),
    )];

    if (!dagNumbers.length || dagNumbers.length > MAX_DAGS || dagNumbers.some((dag) => !numeric.test(dag))) {
      return NextResponse.json(
        { error: `dagNumbers must contain 1-${MAX_DAGS} comma-separated numeric Dag numbers` },
        { status: 400 },
      );
    }
    if (!numeric.test(jlNumber)) {
      return NextResponse.json({ error: "Valid numeric jlNumber is required" }, { status: 400 });
    }
    if (!mouzaName || mouzaName.length > 120) {
      return NextResponse.json({ error: "mouzaName is required" }, { status: 400 });
    }

    const results: Awaited<ReturnType<typeof resolveOne>>[] = [];
    for (let offset = 0; offset < dagNumbers.length; offset += CONCURRENCY) {
      const chunk = dagNumbers.slice(offset, offset + CONCURRENCY);
      results.push(...await Promise.all(
        chunk.map((dagNumber) => resolveOne(dagNumber, { jlNumber, mouzaName, upazilaName })),
      ));
    }

    return NextResponse.json(
      {
        jlNumber,
        mouzaName,
        source: "RAJUK_RS_PLOT_LAYER",
        note: "Map parcel areas only; these are not Khatian share/area values.",
        results,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "RAJUK Dag lookup failed";
    return NextResponse.json(
      { error: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
