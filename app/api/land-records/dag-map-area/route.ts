import { NextRequest, NextResponse } from "next/server";
import { selectUniqueRsCandidate } from "@/src/features/land-records/lib/dag-map-areas";
import { getPlots } from "@/src/services/rajuk/rajukQuery.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const digits = /^\d{1,10}$/;

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const dagNumber = p.get("dagNumber")?.trim() || "";
    const jlNumber = p.get("jlNumber")?.trim() || "";
    const mouzaName = p.get("mouzaName")?.trim() || "";
    const upazilaName = p.get("upazilaName")?.trim() || undefined;

    if (!digits.test(dagNumber)) {
      return NextResponse.json({ error: "Valid numeric dagNumber is required" }, { status: 400 });
    }
    if (!digits.test(jlNumber)) {
      return NextResponse.json({ error: "Valid numeric jlNumber is required" }, { status: 400 });
    }
    if (!mouzaName || mouzaName.length > 120) {
      return NextResponse.json({ error: "mouzaName is required" }, { status: 400 });
    }

    // Query broadly by RS/BRS plot number, then fail closed unless exactly one
    // Dag + JL + normalized Mouza candidate survives.
    const collection = await getPlots({
      plotNo: Number(dagNumber),
      kind: "rs",
      resultRecordCount: 2000,
      resultOffset: 0,
    });

    const selected = selectUniqueRsCandidate(collection.features ?? [], {
      dagNo: dagNumber,
      jlNumber,
      mouzaName,
      upazilaName,
    });

    if (!selected.feature || !selected.area) {
      return NextResponse.json(
        {
          resolved: false,
          dagNumber,
          jlNumber,
          mouzaName,
          diagnostics: selected.diagnostics,
        },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const attributes = selected.feature.attributes ?? {};
    return NextResponse.json(
      {
        resolved: true,
        dagNumber,
        jlNumber,
        mouzaName,
        source: "RAJUK_RS_PLOT_LAYER",
        mapTotalAreaAcre: selected.area.acre,
        mapTotalAreaLabel: selected.area.label,
        areaSourceField: "Shape__Area",
        areaSourceUnit: selected.area.sourceUnit,
        objectId: attributes.objectid != null ? String(attributes.objectid) : undefined,
        addressSearch: attributes.address_search ?? undefined,
        landUse: attributes.landuse ?? attributes.land_use ?? attributes.land_type ?? undefined,
        diagnostics: selected.diagnostics,
        note: "Map parcel area only; this is not the Khatian share/area.",
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
