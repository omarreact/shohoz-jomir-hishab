import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/src/services/rajuk/rajukAuth.service";
import { getLayer } from "@/src/services/rajuk/rajukLayers.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("layer") || "dap";
    const layer = getLayer(key);
    const url = new URL(layer.service);
    url.searchParams.set("f", "json");
    if (layer.auth) url.searchParams.set("token", await getValidToken(layer.service));
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.error) return NextResponse.json({ error: data.error?.message || `RAJUK metadata failed (${response.status})` }, { status: response.status || 502 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "RAJUK metadata failed" }, { status: 502 });
  }
}
