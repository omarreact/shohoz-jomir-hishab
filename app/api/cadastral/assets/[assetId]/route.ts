import { findPublicCadastralAsset } from "@/src/features/geospatial-map/national-cadastral/public-assets";
import { getPublishedCadastralAsset, headPublishedCadastralAsset } from "@/src/features/geospatial-map/national-cadastral/storage";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ assetId: string }> };

async function resolveAsset(context: Context) {
  const { assetId } = await context.params;
  return findPublicCadastralAsset(assetId);
}

export async function GET(request: Request, context: Context) {
  const asset = await resolveAsset(context);
  if (!asset) return Response.json({ error: "Cadastral asset not found" }, { status: 404 });
  try {
    return await getPublishedCadastralAsset(asset, request.headers.get("range"));
  } catch (error) {
    console.error("[cadastral-assets] storage read failed", error instanceof Error ? error.message : String(error));
    return Response.json({ error: "Cadastral storage unavailable" }, { status: 503 });
  }
}

export async function HEAD(_request: Request, context: Context) {
  const asset = await resolveAsset(context);
  if (!asset) return new Response(null, { status: 404 });
  try {
    return await headPublishedCadastralAsset(asset);
  } catch {
    return new Response(null, { status: 503 });
  }
}
