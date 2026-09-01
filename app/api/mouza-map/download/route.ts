import { NextRequest, NextResponse } from "next/server";
import { exportMouzaRaster } from "@/src/services/rajuk/mouzaRasterExport.service";
import { exportMouzaVectorPdf } from "@/src/services/rajuk/mouzaVectorPdfExport.service";
import { mouzaExportQuerySchema } from "@/src/services/rajuk/schemas/mouzaExport.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function runExport(input: unknown) {
  const parsed = mouzaExportQuerySchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid request";
    return { error: msg as string, status: 400 as const };
  }
  if (parsed.data.format === "vector-pdf") {
    const result = await exportMouzaVectorPdf({
      mouza: parsed.data.mouza,
      jl: parsed.data.jl,
      layers: parsed.data.layers,
      satellite: parsed.data.satellite,
    });
    return { result };
  }

  const rasterRequest = {
    ...parsed.data,
    format: parsed.data.format === "raw" ? "raw" : "geotiff",
  } as const;
  const result = await exportMouzaRaster(rasterRequest);
  return { result };
}

function attachmentResponse(result: Awaited<ReturnType<typeof exportMouzaRaster>> | Awaited<ReturnType<typeof exportMouzaVectorPdf>>) {
  return new NextResponse(new Uint8Array(result.body), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": String(result.body.length),
      "Cache-Control": "no-store",
      "X-LandBD-Mouza": encodeURIComponent(result.meta.mouza),
      "X-LandBD-Width": String(result.meta.width),
      "X-LandBD-Height": String(result.meta.height),
      "X-LandBD-Zoom": String(result.meta.zoom),
      "X-LandBD-Resolution": String(result.meta.resolution),
      "X-LandBD-CRS": result.meta.crs,
      "X-LandBD-Tiles": String(result.meta.tileCount),
      "X-LandBD-Plot-Count": String(result.meta.plotCount),
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const out = await runExport({
      mouza: p.get("mouza") ?? "",
      jl: p.get("jl") ?? undefined,
      format: p.get("format") ?? "geotiff",
      layers: p.get("layers") ?? "rs",
      maxDim: p.get("maxDim") ?? 6144,
      satellite: p.get("satellite") ?? false,
    });
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    return attachmentResponse(out.result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mouza download failed";
    const status = message.includes("No plots") || message.includes("Invalid") ? 400 : message.toLowerCase().includes("token") || message.toLowerCase().includes("auth") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const out = await runExport({
      mouza: body.mouza ?? "",
      jl: body.jl,
      format: body.format ?? "geotiff",
      layers: body.layers ?? "rs",
      maxDim: body.maxDim ?? 6144,
      satellite: body.satellite ?? false,
    });
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    return attachmentResponse(out.result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mouza download failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
