import { NextRequest, NextResponse } from "next/server";
import { getValidToken, invalidateToken } from "@/src/services/rajuk/rajukAuth.service";
import { getLayer } from "@/src/services/rajuk/rajukLayers.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIMEOUT_MS = 8_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layer: string; z: string; y: string; x: string }> },
) {
  const { layer: key, z, y, x } = await params;

  try {
    const layer = getLayer(key);
    if (!/^\d+$/.test(z) || !/^\d+$/.test(y) || !/^\d+$/.test(x)) {
      return NextResponse.json({ error: "Invalid tile coordinates" }, { status: 400 });
    }

    const upstream = new URL(`${layer.service}/tile/${z}/${y}/${x}`);

    const fetchTile = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        return await fetch(upstream, {
          signal: controller.signal,
          headers: { Accept: "image/png,image/jpeg,image/*,*/*;q=0.8" },
          cache: "no-store",
        });
      } finally {
        clearTimeout(timer);
      }
    };

    // Public-first: every layer gets a token-free attempt. Only protected
    // services that actually reject the request receive the authorized token.
    let response = await fetchTile();

    if ((response.status === 498 || response.status === 499) || (layer.auth && response.status === 401)) {
      invalidateToken(layer.service);
      upstream.searchParams.set("token", await getValidToken(layer.service));
      response = await fetchTile();
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `RAJUK tile request failed (${response.status})`, layer: key },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const body = await response.arrayBuffer();
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Proxy-Source": "landbd-rajuk",
    });

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RAJUK tile proxy failed";
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "RAJUK tile request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
