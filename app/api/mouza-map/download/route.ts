import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exportMouzaRaster } from "@/src/services/rajuk/mouzaRasterExport.service";
import { exportMouzaPublicationPdf } from "@/src/services/rajuk/mouzaPublicationPdfV2.service";
import { mouzaExportQuerySchema } from "@/src/services/rajuk/schemas/mouzaExport.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 800;

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
  const now = Date.now(); const key = clientKey(request); const current = rateStore.get(key);
  if (!current || current.resetAt <= now) { rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS }); if (rateStore.size > 2000) for (const [k, v] of rateStore) if (v.resetAt <= now) rateStore.delete(k); return true; }
  if (current.count >= RATE_LIMIT) return false; current.count += 1; return true;
}

function pdfCacheKey(input: { mouza: string; jl?: string; layers: string; satellite?: boolean }): string {
  const canonical = JSON.stringify({ renderer: "v3-max-fidelity", mouza: input.mouza.trim().toUpperCase(), jl: input.jl?.trim() ?? "", layers: input.layers, satellite: Boolean(input.satellite) });
  return createHash("sha256").update(canonical).digest("hex");
}

async function uploadPdfToBlob(result: Awaited<ReturnType<typeof exportMouzaPublicationPdf>>, key: string): Promise<{ url: string; downloadUrl: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not configured; large Vector PDF delivery requires Vercel Blob");
  const pathname = `landbd/mouza-pdf/${key}/${result.filename}`;
  const response = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(pathname).replace(/%2F/g, "/")}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "x-api-version": "11",
      "x-content-type": "application/pdf",
      access: "public",
      "x-add-random-suffix": "0",
      "x-cache-control-max-age": String(PDF_CACHE_AGE),
      "x-content-disposition": `attachment; filename=\"${result.filename.replace(/\"/g, "") }\"`,
    },
    body: result.body,
    signal: AbortSignal.timeout(TIMEOUT_FOR_BLOB_UPLOAD),
  });
  if (!response.ok) throw new Error(`Vercel Blob upload failed (${response.status})`);
  const payload = await response.json() as { url?: string; downloadUrl?: string };
  if (!payload.url) throw new Error("Vercel Blob upload returned no URL");
  return { url: payload.url, downloadUrl: payload.downloadUrl ?? payload.url };
}

const TIMEOUT_FOR_BLOB_UPLOAD = 120_000;

async function runExport(input: unknown) {
  const parsed = mouzaExportQuerySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid request", status: 400 as const };
  if (parsed.data.format === "vector-pdf") {
    const result = await exportMouzaPublicationPdf({ mouza: parsed.data.mouza, jl: parsed.data.jl, layers: parsed.data.layers, satellite: parsed.data.satellite });
    return { result, key: pdfCacheKey(parsed.data) };
  }
  const rasterRequest = { ...parsed.data, format: parsed.data.format === "raw" ? "raw" : "geotiff" } as const;
  return { result: await exportMouzaRaster(rasterRequest) };
}

function attachmentResponse(result: Awaited<ReturnType<typeof exportMouzaRaster>> | Awaited<ReturnType<typeof exportMouzaPublicationPdf>>) {
  return new NextResponse(new Uint8Array(result.body), { status: 200, headers: {
    "Content-Type": result.contentType,
    "Content-Disposition": `attachment; filename="${result.filename}"`,
    "Content-Length": String(result.body.length),
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    "X-LandBD-Mouza": encodeURIComponent(result.meta.mouza), "X-LandBD-Width": String(result.meta.width), "X-LandBD-Height": String(result.meta.height),
    "X-LandBD-Zoom": String(result.meta.zoom), "X-LandBD-Resolution": String(result.meta.resolution), "X-LandBD-CRS": result.meta.crs,
    "X-LandBD-Tiles": String(result.meta.tileCount), "X-LandBD-Plot-Count": String(result.meta.plotCount), "Vary": "Accept-Encoding",
  }});
}

async function handle(request: NextRequest, input: unknown) {
  if (!allowRequest(request)) return NextResponse.json({ error: "Too many export requests. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } });
  try {
    const out = await runExport(input);
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    if ("key" in out) {
      const blob = await uploadPdfToBlob(out.result, out.key);
      return NextResponse.redirect(blob.downloadUrl, { status: 303, headers: { "Cache-Control": `public, s-maxage=${PDF_CACHE_AGE}, stale-while-revalidate=604800`, "X-LandBD-Blob": "vercel-blob" } });
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
