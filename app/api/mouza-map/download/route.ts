import { createHash } from "node:crypto";
import { head, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { exportMouzaRaster } from "@/src/services/rajuk/mouzaRasterExport.service";
import { exportMouzaPublicationPdf } from "@/src/services/rajuk/mouzaPublicationPdfV2.service";
import { mouzaExportQuerySchema, type MouzaExportQuery } from "@/src/services/rajuk/schemas/mouzaExport.schema";
import { createPrivateDownloadToken } from "@/src/services/rajuk/privateMouzaPdfToken";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import {
  allowRateLimit,
  releaseDistributedLock,
  tryAcquireDistributedLock,
  type DistributedLock,
} from "@/src/modules/security/redisRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT = 5;
const PDF_RATE_LIMIT = 3;
const PDF_CACHE_AGE = 31_536_000;
const PDF_LOCK_TTL_SECONDS = 240;
const PDF_LOCK_RETRY_AFTER_SECONDS = 10;

type PdfCacheHit = { pathname: string; downloadToken: string; filename: string; size?: number };

type PdfGeneration = {
  result: Awaited<ReturnType<typeof exportMouzaPublicationPdf>>;
  key: string;
  lock: DistributedLock;
};

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

function pdfCacheKey(input: { mouza: string; jl?: string; layers: string; satellite?: boolean }): string {
  const canonical = JSON.stringify({
    renderer: "v3-max-fidelity",
    mouza: input.mouza.trim().toUpperCase(),
    jl: input.jl?.trim() ?? "",
    layers: input.layers,
    satellite: Boolean(input.satellite),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function pdfBlobPathname(key: string): string {
  return `landbd/mouza-pdf/${key}/publication-v2.pdf`;
}

async function tryCachedPdf(key: string): Promise<PdfCacheHit | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const pathname = pdfBlobPathname(key);
  try {
    const meta = await head(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!meta) return null;
    return {
      pathname,
      downloadToken: createPrivateDownloadToken(pathname),
      filename: pathname.split("/").pop() || "landbd-mouza-map.pdf",
      size: typeof meta.size === "number" ? meta.size : undefined,
    };
  } catch {
    return null;
  }
}

async function uploadPdfToBlob(
  result: Awaited<ReturnType<typeof exportMouzaPublicationPdf>>,
  key: string,
): Promise<{ pathname: string; downloadToken: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured; large Vector PDF delivery requires a Vercel Blob store");
  }

  const pathname = pdfBlobPathname(key);
  await put(pathname, result.body, {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/pdf",
    cacheControlMaxAge: PDF_CACHE_AGE,
    multipart: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { pathname, downloadToken: createPrivateDownloadToken(pathname) };
}

async function resolveIsAdmin(request: NextRequest): Promise<boolean> {
  try {
    const user = await verifyServerAuth(request);
    return isAdminRole(user.role);
  } catch {
    return false;
  }
}

function enforceVisitorExportPolicy(data: MouzaExportQuery, isAdmin: boolean): { data: MouzaExportQuery; error?: string; status?: number } {
  if (isAdmin) return { data };
  if (data.format !== "png") {
    return {
      data,
      error: "Visitors may only download high-resolution PNG mouza maps. Sign in as admin for GeoTIFF, RAW, or Vector PDF.",
      status: 403,
    };
  }
  return {
    data: {
      ...data,
      format: "png",
      layers: "combined",
      satellite: true,
      maxDim: Math.min(Math.max(data.maxDim ?? 6144, 2048), 6144),
    },
  };
}

async function runExport(input: unknown, isAdmin: boolean): Promise<
  | { error: string; status: number }
  | { cached: PdfCacheHit; key: string }
  | PdfGeneration
  | { result: Awaited<ReturnType<typeof exportMouzaRaster>> }
> {
  const parsed = mouzaExportQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid request", status: 400 };
  }

  const enforced = enforceVisitorExportPolicy(parsed.data, isAdmin);
  if (enforced.error) return { error: enforced.error, status: enforced.status ?? 403 };

  const data = enforced.data;
  if (data.format === "vector-pdf") {
    if (!isAdmin) return { error: "Vector PDF export requires admin access.", status: 403 };

    const key = pdfCacheKey(data);
    const cached = await tryCachedPdf(key);
    if (cached) return { cached, key };

    // Prevent a serverless cache stampede when several admins request the same
    // expensive Mouza export concurrently on different Vercel instances.
    const lock = await tryAcquireDistributedLock(`mouza-pdf:${key}`, PDF_LOCK_TTL_SECONDS);
    if (!lock) {
      // A previous invocation may have completed between the cache check and lock attempt.
      const completed = await tryCachedPdf(key);
      if (completed) return { cached: completed, key };
      return { error: "এই মৌজার PDF ইতিমধ্যে তৈরি হচ্ছে। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন।", status: 409 };
    }

    try {
      const result = await exportMouzaPublicationPdf({
        mouza: data.mouza,
        jl: data.jl,
        layers: data.layers,
        satellite: data.satellite,
      });
      return { result, key, lock };
    } catch (error) {
      await releaseDistributedLock(lock).catch((releaseError) => {
        console.error("[LandBD][mouza-export] failed to release PDF lock after generation error", { releaseError });
      });
      throw error;
    }
  }

  const rasterFormat = data.format === "raw" ? "raw" : data.format === "png" ? "png" : data.format === "jpeg" ? "jpeg" : "geotiff";
  return {
    result: await exportMouzaRaster({
      mouza: data.mouza,
      jl: data.jl,
      format: rasterFormat,
      layers: data.layers,
      maxDim: data.maxDim,
      satellite: data.satellite,
    }),
  };
}

function attachmentResponse(result: Awaited<ReturnType<typeof exportMouzaRaster>>): Response {
  return new NextResponse(new Uint8Array(result.body), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": String(result.body.length),
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-LandBD-Mouza": encodeURIComponent(result.meta.mouza),
      "X-LandBD-Width": String(result.meta.width),
      "X-LandBD-Height": String(result.meta.height),
      "X-LandBD-Zoom": String(result.meta.zoom),
      "X-LandBD-Resolution": String(result.meta.resolution),
      "X-LandBD-CRS": result.meta.crs,
      "X-LandBD-Tiles": String(result.meta.tileCount),
      "X-LandBD-Plot-Count": String(result.meta.plotCount),
      Vary: "Accept-Encoding",
    },
  });
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "TimeoutError") return true;
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return true;
  return false;
}

async function handle(request: NextRequest, input: unknown): Promise<Response> {
  try {
    const isAdmin = await resolveIsAdmin(request);
    const wantsPdf = typeof input === "object" && input !== null && "format" in input && (input as { format?: string }).format === "vector-pdf";
    const limit = wantsPdf ? PDF_RATE_LIMIT : RATE_LIMIT;
    const key = `mouza-export:${clientKey(request)}:${wantsPdf ? "pdf" : "raster"}`;

    let allowed = false;
    try {
      allowed = await allowRateLimit(key, limit, RATE_WINDOW_SECONDS);
    } catch (rateError) {
      console.error("[LandBD][mouza-export] rate limiter unavailable", { error: rateError });
      return NextResponse.json(
        { error: "Export service is temporarily unavailable. Please try again shortly." },
        { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } },
      );
    }

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many export requests. Please wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(RATE_WINDOW_SECONDS), "Cache-Control": "no-store" } },
      );
    }

    const out = await runExport(input, isAdmin);
    if ("error" in out) {
      const headers: Record<string, string> = { "Cache-Control": "no-store" };
      if (out.status === 409) headers["Retry-After"] = String(PDF_LOCK_RETRY_AFTER_SECONDS);
      return NextResponse.json({ error: out.error }, { status: out.status, headers });
    }

    if ("cached" in out && out.cached) {
      const retrieveUrl = new URL("/api/mouza-map/retrieve", request.url);
      retrieveUrl.searchParams.set("token", out.cached.downloadToken);
      return NextResponse.json(
        { ok: true, downloadUrl: retrieveUrl.toString(), filename: out.cached.filename, size: out.cached.size, cache: "HIT" },
        { status: 200, headers: { "Cache-Control": "private, no-store", "X-LandBD-Blob": "vercel-blob-hit" } },
      );
    }

    if ("lock" in out && "key" in out && "result" in out) {
      const generation = out as PdfGeneration;
      try {
        const blob = await uploadPdfToBlob(generation.result, generation.key);
        const retrieveUrl = new URL("/api/mouza-map/retrieve", request.url);
        retrieveUrl.searchParams.set("token", blob.downloadToken);
        return NextResponse.json(
          { ok: true, downloadUrl: retrieveUrl.toString(), filename: generation.result.filename, size: generation.result.body.length, cache: "MISS" },
          { status: 201, headers: { "Cache-Control": "private, no-store", "X-LandBD-Blob": "vercel-blob-private" } },
        );
      } finally {
        await releaseDistributedLock(generation.lock).catch((releaseError) => {
          console.error("[LandBD][mouza-export] failed to release PDF lock", { releaseError, key: generation.key });
        });
      }
    }

    if (!("result" in out) || !out.result) {
      return NextResponse.json({ error: "Mouza export produced no result" }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    return attachmentResponse(out.result);
  } catch (error) {
    if (isTimeoutError(error)) {
      return NextResponse.json({ error: "Mouza export timed out. Please try again with a smaller output." }, { status: 504, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[LandBD][mouza-export] unexpected error", { error });
    return NextResponse.json({ error: "Mouza export failed unexpectedly." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: NextRequest) {
  const input = Object.fromEntries(request.nextUrl.searchParams.entries());
  return handle(request, input);
}

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  return handle(request, input);
}
