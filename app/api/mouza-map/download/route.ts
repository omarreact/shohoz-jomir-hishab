import { NextRequest, NextResponse } from "next/server";
import {
  exportMouzaRaster,
  type MouzaExportFormat,
  type MouzaExportLayers,
} from "@/src/services/rajuk/mouzaRasterExport.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Allow longer GIS mosaic work on platforms that honor this. */
export const maxDuration = 60;

function parseFormat(v: string | null): MouzaExportFormat {
  if (v === "raw") return "raw";
  return "geotiff";
}

function parseLayers(v: string | null): MouzaExportLayers {
  if (v === "ms" || v === "combined") return v;
  return "rs";
}

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const mouza = (p.get("mouza") || "").trim();
    if (mouza.length < 2) {
      return NextResponse.json({ error: "mouza is required" }, { status: 400 });
    }
    if (mouza.length > 120 || /[<>"']/.test(mouza)) {
      return NextResponse.json({ error: "Invalid mouza parameter" }, { status: 400 });
    }

    const format = parseFormat(p.get("format"));
    const layers = parseLayers(p.get("layers"));
    const jl = p.get("jl") || undefined;
    const maxDimRaw = Number(p.get("maxDim") || 6144);
    const maxDim = Number.isFinite(maxDimRaw) ? maxDimRaw : 6144;

    const result = await exportMouzaRaster({
      mouza,
      jl,
      format,
      layers,
      maxDim,
    });

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
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mouza download failed";
    const status =
      message.includes("No plots") || message.includes("Invalid")
        ? 400
        : message.toLowerCase().includes("token") || message.toLowerCase().includes("auth")
          ? 503
          : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      mouza?: string;
      jl?: string;
      format?: string;
      layers?: string;
      maxDim?: number;
    };
    const mouza = String(body.mouza || "").trim();
    if (mouza.length < 2) {
      return NextResponse.json({ error: "mouza is required" }, { status: 400 });
    }
    if (mouza.length > 120 || /[<>"']/.test(mouza)) {
      return NextResponse.json({ error: "Invalid mouza parameter" }, { status: 400 });
    }

    const result = await exportMouzaRaster({
      mouza,
      jl: body.jl,
      format: parseFormat(body.format ?? null),
      layers: parseLayers(body.layers ?? null),
      maxDim: body.maxDim,
    });

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
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mouza download failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
