import { NextRequest, NextResponse } from "next/server";
import { getValidToken, invalidateToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { getLayer } from "@/src/services/rajuk/rajukLayers.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Longer timeout + retries for filtered / high-latency WiFi paths to RAJUK. */
const TIMEOUT_MS = 20_000;
const RETRIES = 2;

async function fetchTileOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/png,image/jpeg,image/*,*/*;q=0.8",
        Referer: "https://masterplan.rajuk.gov.bd/",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTileWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i <= RETRIES; i++) {
    try {
      const response = await fetchTileOnce(url);
      if (response.status >= 500 && i < RETRIES) {
        await new Promise((r) => setTimeout(r, 250 * (i + 1)));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (i < RETRIES) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Tile fetch failed");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layer: string; z: string; y: string; x: string }> },
) {
  const { layer: key, z, y, x } = await params;

  try {
    const layer = getLayer(key);
    if (!/^\d+$/.test(z) || !/^\d+$/.test(y) || !/^\d+$/.test(x)) {
      return NextResponse.json({ error: "Invalid tile coordinates" }, { status: 400 });
    }

    const upstream = new URL(`${layer.service}/tile/${z}/${y}/${x}`);

    // Public-first, then authorized token on 498/401.
    let response = await fetchTileWithRetry(upstream.toString());

    if (response.status === 498 || response.status === 499 || (layer.auth && response.status === 401)) {
      await invalidateToken(RAJUK_SERVER);
      upstream.searchParams.set("token", await getValidToken(RAJUK_SERVER));
      response = await fetchTileWithRetry(upstream.toString());
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `RAJUK tile request failed (${response.status})`, layer: key },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Proxy-Source": "landbd-rajuk",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RAJUK tile proxy failed";
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "RAJUK tile request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
