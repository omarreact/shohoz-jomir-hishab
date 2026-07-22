import { NextResponse } from "next/server";
import {
  buildRajukTileServiceUrl,
  normalizeRajukService,
} from "@/lib/api/rajukTiles";
import { container } from "@/lib/di/container";
import { RajukTokenManager } from "@/lib/rajuk/manager";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TILE_TIMEOUT_MS = 10_000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");
    const x = searchParams.get("x");
    const y = searchParams.get("y");
    const z = searchParams.get("z");
    const format = searchParams.get("f") || (x && y && z ? "png" : "pjson");

    if (!service) {
      return NextResponse.json(
        { error: "Missing service parameter" },
        { status: 400 },
      );
    }

    // Inject token server-side — never expose raw token to frontend
    let token: string | undefined;
    try {
      const tokenManager = container.resolve(RajukTokenManager);
      token = await tokenManager.getToken();
    } catch (err) {
      logger.error({ err }, "Failed to acquire Rajuk token for tile proxy");
      return NextResponse.json(
        { error: "Failed to authenticate with tile service" },
        { status: 502 },
      );
    }

    const normalizedService = normalizeRajukService(service);
    const rajukUrl = buildRajukTileServiceUrl(
      normalizedService,
      x || undefined,
      y || undefined,
      z || undefined,
      token,
      format || undefined,
    );

    // Use AbortController for timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(rajukUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept:
            "image/png,image/jpeg,image/*,*/*;q=0.8,application/json,text/plain,*/*;q=0.5",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      logger.warn(
        { status: response.status, service, x, y, z },
        "Tile upstream returned error",
      );
      return NextResponse.json(
        {
          error: `Failed to fetch Rajuk service: ${response.status} ${response.statusText}`,
          upstreamUrl: rajukUrl,
          upstreamBody: errorBody,
        },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const headers = new Headers();
    headers.set("Content-Type", contentType);

    // Rajuk sometimes returns 200 OK with JSON error (e.g., invalid token) for tiles
    const isJsonContent =
      contentType.includes("json") || contentType.includes("text");
    if (isJsonContent) {
      headers.set("Cache-Control", "no-store, max-age=0");
    } else if (response.status !== 200) {
      headers.set("Cache-Control", "no-store, max-age=0");
    } else {
      // Only cache successful image tile responses
      headers.set(
        "Cache-Control",
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      );
    }

    headers.set("X-Proxy-Source", "rajuk-tile");

    const etag = response.headers.get("etag");
    if (etag) {
      headers.set("ETag", etag);
    }

    const lastModified = response.headers.get("last-modified");
    if (lastModified) {
      headers.set("Last-Modified", lastModified);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown tile proxy error";
    logger.error({ err: message }, "Tile proxy error");

    const isAbortError =
      error instanceof DOMException && error.name === "AbortError";
    if (isAbortError) {
      return NextResponse.json(
        { error: "Tile upstream timed out" },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
