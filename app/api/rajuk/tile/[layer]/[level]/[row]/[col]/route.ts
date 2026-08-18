import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/src/services/rajuk/rajukAuth.service";
import { getLayer } from "@/src/services/rajuk/rajukLayers.service";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ layer: string; level: string; row: string; col: string }> }) {
  try {
    const { layer: key, level, row, col } = await context.params;
    const layer = getLayer(key);
    if (![level, row, col].every((v) => /^\d+$/.test(v))) return new NextResponse("Invalid tile coordinates", { status: 400 });
    const url = `${layer.service}/tile/${level}/${row}/${col}`;
    const query = new URLSearchParams({ f: "image" });
    if (layer.auth) query.set("token", await getValidToken(layer.service));
    const response = await fetch(`${url}?${query}`, { cache: layer.auth ? "no-store" : "force-cache" });
    if (!response.ok) return new NextResponse(await response.text(), { status: response.status });
    return new NextResponse(await response.arrayBuffer(), { headers: { "content-type": response.headers.get("content-type") || "image/png", "cache-control": layer.auth ? "private, max-age=300" : "public, max-age=86400" } });
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "RAJUK tile failed", { status: 502 });
  }
}
