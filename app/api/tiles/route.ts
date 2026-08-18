import { NextResponse } from "next/server";
import {
  buildRajukTileServiceUrl,
  normalizeRajukService,
} from "@/src/shared/http/api/rajukTiles";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { logger } from "@/src/shared/logger";

export const dynamic = "force-dynamic";

const TILE_TIMEOUT_MS = 10_000;

// Simple in-process token cache (reset on cold start / token failure)
let _cachedToken: string | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getRajukToken(): Promise<string | undefined> {
  if (_cachedToken && Date.now() < _cacheExpiry) return _cachedToken;
  try {
    const doc = await collections.settings.doc("rajukConfig").get();
    if (doc.exists) {
      const data = doc.data();
      const token = data?.token || data?.rajukToken || data?.mapToken;
      if (token && typeof token === "string" && token.trim()) {
        _cachedToken = token.trim();
        _cacheExpiry = Date.now() + CACHE_TTL_MS;
        return _cachedToken;
      }
    }
  } catch { /* Firestore unavailable — fall back */ }
  const env = process.env.RAJUK_MAP_TOKEN;
  if (env?.trim()) {
    _cachedToken = env.trim();
    _cacheExpiry = Date.now() + CACHE_TTL_MS;
    return _cachedToken;
  }
  return undefined;
}

function reportTokenFailure(code: number): void {
  if (code === 498 || code === 499) { _cachedToken = null; _cacheExpiry = 0; }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");
    const x = searchParams.get("x");
    const y = searchParams.get("y");
    const z = searchParams.get("z");
    const format = searchParams.get("f") || (x && y && z ? "png" : "pjson");

    if (!service) {
      return NextResponse.json({ error: "Missing service parameter" }, { status: 400 });
    }

    let token: string | undefined;
    try {
      token = await getRajukToken();
    } catch (err) {
      logger.warn({ err }, "Failed to acquire Rajuk token for tile proxy - falling back to public mode");
      token = undefined;
    }

    const normalizedService = normalizeRajukService(service);

    const performFetch = async (currentToken: string | undefined) => {
      const rajukUrl = buildRajukTileServiceUrl(
        normalizedService,
        x || undefined,
        y || undefined,
        z || undefined,
        currentToken,
        format || undefined,
      );
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS);
      try {
        const res = await fetch(rajukUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "image/png,image/jpeg,image/*,*/*;q=0.8,application/json,text/plain,*/*;q=0.5",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        });
        return { res, url: rajukUrl };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let { res: response, url: rajukUrl } = await performFetch(token);
    let isTokenError = false;

    if (!response.ok) {
      if (response.status === 498 || response.status === 499) {
        reportTokenFailure(response.status);
        isTokenError = true;
      }
      if (!isTokenError) {
        const errorBody = await response.text();
        logger.warn({ status: response.status, service, x, y, z }, "Tile upstream returned error");
        return NextResponse.json(
          { error: `Failed to fetch Rajuk service: ${response.status} ${response.statusText}`, upstreamUrl: rajukUrl, upstreamBody: errorBody },
          { status: response.status },
        );
      }
    }

    const contentType = response.headers.get("content-type") || "image/png";
    let headers = new Headers();
    headers.set("Content-Type", contentType);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isJsonContent = contentType.includes("json") || contentType.includes("text");
    if (isJsonContent) {
      headers.set("Cache-Control", "no-store, max-age=0");
      try {
        const text = buffer.toString("utf8");
        const json = JSON.parse(text);
        if (json.error && (json.error.code === 498 || json.error.code === 499)) {
          reportTokenFailure(json.error.code);
          isTokenError = true;
        }
      } catch { /* ignore parse errors */ }
    } else if (response.status !== 200) {
      headers.set("Cache-Control", "no-store, max-age=0");
    } else {
      headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    }

    if (isTokenError && token) {
      const retryResult = await performFetch(undefined);
      response = retryResult.res;
      rajukUrl = retryResult.url;
      if (!response.ok) {
        return NextResponse.json({ error: `Retry failed: ${response.status} ${response.statusText}` }, { status: response.status });
      }
      const retryContentType = response.headers.get("content-type") || "image/png";
      headers = new Headers();
      headers.set("Content-Type", retryContentType);
      headers.set("Cache-Control",
        !retryContentType.includes("json") && !retryContentType.includes("text") && response.status === 200
          ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
          : "no-store, max-age=0"
      );
      const retryBuffer = Buffer.from(await response.arrayBuffer());
      headers.set("X-Proxy-Source", "rajuk-tile");
      return new NextResponse(retryBuffer, { status: 200, headers });
    }

    headers.set("X-Proxy-Source", "rajuk-tile");
    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tile proxy error";
    logger.error({ err: message }, "Tile proxy error");
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Tile upstream timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
