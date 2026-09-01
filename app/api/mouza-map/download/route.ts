import { NextRequest, NextResponse } from "next/server";
import { exportMouzaRaster } from "@/src/services/rajuk/mouzaRasterExport.service";
import { exportMouzaPublicationPdf } from "@/src/services/rajuk/mouzaPublicationPdfV2.service";
import { mouzaExportQuerySchema } from "@/src/services/rajuk/schemas/mouzaExport.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
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
    if (rateStore.size > 2000) {
      for (const [entryKey, entry] of rateStore) if (entry.resetAt <= now) rateStore.delete(entryKey);
    }
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

async function runExport(input: unknown) {
  const parsed = mouzaExportQuerySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid request", status: 400 as const };
  if (parsed.data.format === "vector-pdf") {
    return { result: await exportMouzaPublicationPdf({ mouza: parsed.data.mouza, jl: parsed.data.jl, layers: parsed.data.layers, satellite: parsed.data.satellite }) };
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
    "X-LandBD-Mouza": encodeURIComponent(result.meta.mouza), "X-LandBD-Width": String(result.meta.width),
    "X-LandBD-Height": String(result.meta.height), "X-LandBD-Zoom": String(result.meta.zoom),
    "X-LandBD-Resolution": String(result.meta.resolution), "X-LandBD-CRS": result.meta.crs,
    "X-LandBD-Tiles": String(result.meta.tileCount), "X-LandBD-Plot-Count": String(result.meta.plotCount),
    "Vary": "Accept-Encoding",
  }});
}

async function handle(request: NextRequest, input: unknown) {
  if (!allowRequest(request)) {
    return NextResponse.json({ error: "Too many export requests. Please wait a few minutes and try again." }, {
      status: 429,
      headers: { "Retry-After": "600", "Cache-Control": "no-store" },
    });
  }
  try {
    const out = await runExport(input);
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
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
