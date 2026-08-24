import { NextRequest, NextResponse } from "next/server";
import { getValidToken, invalidateToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { getLayer } from "@/src/services/rajuk/rajukLayers.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Longer timeout + retries for filtered / high-latency WiFi paths to RAJUK. */
const TIMEOUT_MS = 20_000;
const RETRIES = 2;

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

async function fetchTileOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/png,image/jpeg,image/*,*/*;q=0.8",
        Referer: "https://masterplan.rajuk.gov.bd/",
        Origin: "https://masterplan.rajuk.gov.bd",
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

/** ArcGIS often returns HTTP 200 with JSON body `{ error: { code: 499 } }` instead of status 499. */
function isTokenErrorStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 498 || status === 499;
}

async function needsTokenRetry(response: Response): Promise<boolean> {
  if (isTokenErrorStatus(response.status)) return true;

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("json") && !contentType.includes("text")) return false;

  try {
    const clone = response.clone();
    const text = await clone.text();
    if (!text || text.length > 4000) return false;
    if (/token\s*required|invalid\s*token|"code"\s*:\s*49[89]/i.test(text)) return true;
    try {
      const data = JSON.parse(text) as { error?: { code?: number; message?: string } };
      const code = data?.error?.code;
      if (code === 498 || code === 499 || code === 401 || code === 403) return true;
      if (/token/i.test(String(data?.error?.message || ""))) return true;
    } catch {
      /* not JSON */
    }
  } catch {
    /* ignore body read errors */
  }
  return false;
}

function isImageResponse(response: Response): boolean {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return contentType.startsWith("image/") || contentType.includes("octet-stream");
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

    // Auth-required layers (e.g. MS): attach token on first request.
    // Public layers: try without token first, then retry with token on 498/499.
    if (layer.auth) {
      try {
        upstream.searchParams.set("token", await getValidToken(RAJUK_SERVER));
      } catch {
        /* fall through; may still work for some public tiles */
      }
    }

    let response = await fetchTileWithRetry(upstream.toString());

    if (await needsTokenRetry(response)) {
      await invalidateToken(RAJUK_SERVER);
      try {
        const token = await getValidToken(RAJUK_SERVER);
        upstream.searchParams.set("token", token);
        response = await fetchTileWithRetry(upstream.toString());
      } catch (authError) {
        const message = authError instanceof Error ? authError.message : "Token unavailable";
        return NextResponse.json({ error: `RAJUK auth failed: ${message}`, layer: key }, { status: 502 });
      }
    }

    // Empty / missing tiles → transparent pixel so Leaflet does not break the map
    if (response.status === 404) {
      return new NextResponse(TRANSPARENT_GIF, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "public, max-age=3600",
          "X-Proxy-Source": "landbd-rajuk-empty",
        },
      });
    }

    if (!response.ok || (await needsTokenRetry(response))) {
      return NextResponse.json(
        { error: `RAJUK tile request failed (${response.status})`, layer: key },
        { status: response.status >= 400 ? response.status : 502 },
      );
    }

    // Reject non-image bodies (JSON error disguised as 200)
    if (!isImageResponse(response)) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: "RAJUK returned non-image tile response",
          layer: key,
          detail: text.slice(0, 200),
        },
        { status: 502 },
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
