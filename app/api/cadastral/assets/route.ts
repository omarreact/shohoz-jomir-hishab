import { NextResponse } from "next/server";
import { NATIONAL_CADASTRAL_SURVEYS, type NationalCadastralSurvey } from "@/src/features/geospatial-map/national-cadastral/catalog";
import { listPublicCadastralAssets } from "@/src/features/geospatial-map/national-cadastral/public-assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const districtBbsCode = params.get("districtBbsCode")?.trim() || undefined;
  const surveyRaw = params.get("survey")?.trim().toUpperCase();
  if (surveyRaw && !NATIONAL_CADASTRAL_SURVEYS.includes(surveyRaw as NationalCadastralSurvey)) {
    return NextResponse.json({ error: "Invalid survey" }, { status: 400 });
  }
  const assets = listPublicCadastralAssets({
    districtBbsCode,
    survey: surveyRaw as NationalCadastralSurvey | undefined,
  });
  return NextResponse.json({ items: assets, total: assets.length }, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
