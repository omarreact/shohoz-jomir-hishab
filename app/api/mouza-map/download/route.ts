import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { exportMouzaRaster } from "@/src/services/rajuk/mouzaRasterExport.service";
import { exportMouzaPublicationPdf } from "@/src/services/rajuk/mouzaPublicationPdfV2.service";
import { mouzaExportQuerySchema } from "@/src/services/rajuk/schemas/mouzaExport.schema";
import { createPrivateDownloadToken } from "@/src/services/rajuk/privateMouzaPdfToken";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const PDF_CACHE_AGE = 31_536_000;
type RateEntry = { count: number; resetAt: number };
const rateStore = new Map<string, RateEntry>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

function allowRequest(request: NextRequest): boolean {
  const now = Date.now();
  const key = clientKey(request);
  const current = rateStore.get(key);
  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (rateStore.size > 2000) for (const [entryKey, entry] of rateStore) if (entry.resetAt <= now) rateStore.delete(entryKey);
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

function pdfCacheKey(input: { mouza: string; jl?: string; layers: string; satellite?: boolean }): string {
  const canonical = JSON.stringify({ renderer: "v3-max-fidelity", mouza: input.mouza.trim().toUpperCase(), jl: input.jl?.trim() ?? "", layers: input.layers, satellite: Boolean(input.satellite) });
  return createHash("sha256").update(canonical).digest("hex");
}

async function uploadPdfToBlob(result: Awaited<ReturnType<typeof exportMouzaPublicationPdf>>, key: string): Promise<{ pathname: string; downloadToken: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not configured; large Vector PDF delivery requires a Vercel Blob store");
  const pathname = `landbd/mouza-pdf/${key}/${result.filename}`;
  await put(pathname, result.body, { access: "private", addRandomSuffix: false, contentType: "application/pdf", cacheControlMaxAge: PDF_CACHE_AGE, multipart: true });
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

/** Visitors: PNG share only. Admins: full format matrix. */
function enforceVisitorExportPolicy(
  data: import("@/src/services/rajuk/schemas/mouzaExport.schema").MouzaExportQuery,
  isAdmin: boolean,
): { data: import("@/src/services/rajuk/schemas/mouzaExport.schema").MouzaExportQuery; error?: string; status?: number } {
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid request", status: 400 as const };
  const enforced = enforceVisitorExportPolicy(parsed.data, isAdmin);
  if (enforced.error) return { error: enforced.error, status: (enforced.status ?? 403) as 403 };
  const data = enforced.data;
  if (data.format === "vector-pdf") {
    const result = await exportMouzaPublicationPdf({ mouza: data.mouza, jl: data.jl, layers: data.layers, satellite: data.satellite });
    return { result, key: pdfCacheKey(data) };
  }
  const format = data.format;
  const rasterFormat =
    format === "raw" ? "raw" :
    format === "png" ? "png" :
    format === "jpeg" ? "jpeg" :
    "geotiff";
  const rasterRequest = {
    mouza: data.mouza,
    jl: data.jl,
    format: rasterFormat,
    layers: data.layers,
    maxDim: data.maxDim,
    satellite: data.satellite,
  } as const;
  return { result: await exportMouzaRaster(rasterRequest) };
}

function attachmentResponse(result: Awaited<ReturnType<typeof exportMouzaRaster>>) {
  return new NextResponse(new Uint8Array(result.body), { status: 200, headers: { "Content-Type": result.contentType, "Content-Disposition": `attachment; filename="${result.filename}"`, "Content-Length": String(result.body.length), "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800", "X-LandBD-Mouza": encodeURIComponent(result.meta.mouza), "X-LandBD-Width": String(result.meta.width), "X-LandBD-Height": String(result.meta.height), "X-LandBD-Zoom": String(result.meta.zoom), "X-LandBD-Resolution": String(result.meta.resolution), "X-LandBD-CRS": result.meta.crs, "X-LandBD-Tiles": String(result.meta.tileCount), "X-LandBD-Plot-Count": String(result.meta.plotCount), "Vary": "Accept-Encoding" } });
}

async function handle(request: NextRequest, input: unknown) {
  if (!allowRequest(request)) return NextResponse.json({ error: "Too many export requests. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } });
  try {
    const isAdmin = await resolveIsAdmin(request);
    const out = await runExport(input, isAdmin);
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    if ("key" in out) {
      const blob = await uploadPdfToBlob(out.result, out.key);
      const retrieveUrl = new URL("/api/mouza-map/retrieve", request.url);
      retrieveUrl.searchParams.set("token", blob.downloadToken);
      return NextResponse.json({ ok: true, downloadUrl: retrieveUrl.toString(), filename: out.result.filename, size: out.result.body.length }, { status: 201, headers: { "Cache-Control": "private, no-store", "X-LandBD-Blob": "vercel-blob-private" } });
    }
    return attachmentResponse(out.result);
  } catch (error) {
    console.error("[LandBD][mouza-export] failed", { error, input });
    const message = error instanceof Error ? error.message : "Mouza download failed";
    const status = message.includes("No plots") || message.includes("Invalid") ? 400 : message.toLowerCase().includes("token") || message.toLowerCase().includes("auth") ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  return handle(request, { mouza: p.get("mouza") ?? "", jl: p.get("jl") ?? undefined, format: p.get("format") ?? "geotiff", layers: p.get("layers") ?? "rs", maxDim: p.get("maxDim") ?? 6144, satellite: p.get("satellite") ?? false });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return handle(request, { mouza: body.mouza ?? "", jl: body.jl, format: body.format ?? "geotiff", layers: body.layers ?? "rs", maxDim: body.maxDim ?? 6144, satellite: body.satellite ?? false });
}
