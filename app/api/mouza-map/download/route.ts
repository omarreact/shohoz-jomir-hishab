import { createHash } from "node:crypto";
import { head, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { exportMouzaRaster } from "@/src/services/rajuk/mouzaRasterExport.service";
import { exportMouzaPublicationPdf } from "@/src/services/rajuk/mouzaPublicationPdfV2.service";
import { mouzaExportQuerySchema, type MouzaExportQuery } from "@/src/services/rajuk/schemas/mouzaExport.schema";
import { createPrivateDownloadToken } from "@/src/services/rajuk/privateMouzaPdfToken";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Heavy PDF generation can involve paginated geometry + satellite tiles. */
export const maxDuration = 300;

const RATE_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT = 5;
const PDF_RATE_LIMIT = 3;
const PDF_CACHE_AGE = 31_536_000;

type PdfCacheHit = { pathname: string; downloadToken: string; filename: string; size?: number };

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

async function runExport(input: unknown, isAdmin: boolean) {
  const parsed = mouzaExportQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid request", status: 400 as const };
  }

  const enforced = enforceVisitorExportPolicy(parsed.data, isAdmin);
  if (enforced.error) return { error: enforced.error, status: (enforced.status ?? 403) as 403 };

  const data = enforced.data;
  if (data.format === "vector-pdf") {
    if (!isAdmin) return { error: "Vector PDF export requires admin access.", status: 403 as const };

    const key = pdfCacheKey(data);
    const cached = await tryCachedPdf(key);
    if (cached) return { cached, key };

    const result = await exportMouzaPublicationPdf({
      mouza: data.mouza,
      jl: data.jl,
      layers: data.layers,
      satellite: data.satellite,
    });
    return { result, key };
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
      return NextResponse.json({ error: out.error }, { status: out.status, headers: { "Cache-Control": "no-store" } });
    }

    if ("cached" in out && out.cached) {
      const retrieveUrl = new URL("/api/mouza-map/retrieve", request.url);
      retrieveUrl.searchParams.set("token", out.cached.downloadToken);
      return NextResponse.json(
        { ok: true, downloadUrl: retrieveUrl.toString(), filename: out.cached.filename, size: out.cached.size, cache: "HIT" },
        { status: 200, headers: { "Cache-Control": "private, no-store", "X-LandBD-Blob": "vercel-blob-hit" } },
      );
    }

    if ("key" in out && "result" in out && typeof out.key === "string") {
      const result = out.result as Awaited<ReturnType<typeof exportMouzaPublicationPdf>>;
      const blob = await uploadPdfToBlob(result, out.key);
      const retrieveUrl = new URL("/api/mouza-map/retrieve", request.url);
      retrieveUrl.searchParams.set("token", blob.downloadToken);
      return NextResponse.json(
        { ok: true, downloadUrl: retrieveUrl.toString(), filename: result.filename, size: result.body.length, cache: "MISS" },
        { status: 201, headers: { "Cache-Control": "private, no-store", "X-LandBD-Blob": "vercel-blob-private" } },
      );
    }

    return attachmentResponse(out.result);
  } catch (error) {
    console.error("[LandBD][mouza-export] failed", {
      error,
      method: request.method,
      path: request.nextUrl.pathname,
      input,
    });

    if (isTimeoutError(error)) {
      return NextResponse.json(
        { error: "Mouza export timed out while contacting the spatial or satellite service. Please retry without satellite imagery or try again later." },
        { status: 504, headers: { "Cache-Control": "no-store", "Retry-After": "15" } },
      );
    }

    const message = error instanceof Error ? error.message : "Mouza download failed";
    const status = message.includes("No plots") || message.includes("Invalid") ? 400 : message.toLowerCase().includes("token") || message.toLowerCase().includes("auth") ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const p = request.nextUrl.searchParams;
  return handle(request, {
    mouza: p.get("mouza") ?? "",
    jl: p.get("jl") ?? undefined,
    format: p.get("format") ?? "geotiff",
    layers: p.get("layers") ?? "rs",
    maxDim: p.get("maxDim") ?? 6144,
    satellite: p.get("satellite") ?? false,
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return handle(request, {
    mouza: body.mouza ?? "",
    jl: body.jl,
    format: body.format ?? "geotiff",
    layers: body.layers ?? "rs",
    maxDim: body.maxDim ?? 6144,
    satellite: body.satellite ?? false,
  });
}
