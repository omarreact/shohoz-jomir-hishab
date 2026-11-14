import { NextResponse } from "next/server";
import { nationalCadastralCatalog, nationalCadastralSummary } from "@/src/features/geospatial-map/national-cadastral/catalog";
export const dynamic="force-dynamic";
export async function GET(){
  return NextResponse.json({summary:nationalCadastralSummary(),policy:nationalCadastralCatalog.policy,storage:{provider:nationalCadastralCatalog.storage.provider,prefix:nationalCadastralCatalog.storage.prefix},sources:nationalCadastralCatalog.sources,districts:nationalCadastralCatalog.districts,updatedAt:nationalCadastralCatalog.updatedAt},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=3600"}});
}
