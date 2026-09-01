import "server-only";
import { getValidToken, RAJUK_SERVER } from "./rajukAuth.service";
import { getLayer } from "./rajukLayers.service";
import { getPlots } from "./rajukQuery.service";
import { decodePng } from "@/src/lib/gis/pngDecode";
import { encodeRgbaPng } from "@/src/lib/gis/pngEncode";
import { writeRgbaGeoTiff } from "@/src/lib/gis/geoTiffWriter";
import { createZipStore } from "@/src/lib/gis/zipStore";
import { rasterizePolygonMask } from "@/src/lib/gis/polygonMask";
import {
  ringsToBbox3857,
  chooseZoomForBudget,
  tileRangeForBbox,
  tileOrigin3857,
  type BBox3857,
} from "@/src/lib/gis/webMercatorTiles";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export type MouzaExportFormat = "geotiff" | "raw" | "png" | "jpeg";
export type MouzaExportLayers = "rs" | "ms" | "combined";

export type MouzaExportRequest = {
  mouza: string;
  jl?: string;
  format: MouzaExportFormat;
  layers: MouzaExportLayers;
  maxDim?: number;
  satellite?: boolean;
};

export type MouzaExportResult = {
  filename: string;
  contentType: string;
  body: Buffer;
  meta: {
    mouza: string;
    width: number;
    height: number;
    zoom: number;
    resolution: number;
    crs: string;
    extent: BBox3857;
    tileCount: number;
    plotCount: number;
  };
};

const TILE_SIZE = 256;
const MAX_ZOOM = 20;
const MIN_ZOOM = 14;
const MAX_DIM_DEFAULT = 6144;
const MAX_TILES = 400;
const CONCURRENCY = 6;

function featureBelongsToMouza(feature: RajukPlotFeature, mauzaName: string): boolean {
  const target = mauzaName.trim().toLowerCase();
  if (!target) return false;
  const a = feature.attributes as Record<string, unknown>;
  const names = [a.rs_mauza_name, a.mauza, a.ms_mauza_name, a.ms_mauza]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter(Boolean);
  return names.includes(target);
}

function collectRings(features: RajukPlotFeature[]): number[][][] {
  const rings: number[][][] = [];
  for (const f of features) {
    for (const ring of f.geometry?.rings ?? []) {
      if (Array.isArray(ring) && ring.length >= 3) rings.push(ring as number[][]);
    }
  }
  return rings;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function fetchTilePng(layerKey: "rs" | "ms", z: number, x: number, y: number): Promise<Uint8Array | null> {
  const layer = getLayer(layerKey);
  let url = `${layer.service}/tile/${z}/${y}/${x}`;
  if (layer.auth) {
    try {
      const token = await getValidToken(RAJUK_SERVER);
      url += `?token=${encodeURIComponent(token)}`;
    } catch {
      return null;
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/png,image/*",
        Referer: "https://masterplan.rajuk.gov.bd/",
        Origin: "https://masterplan.rajuk.gov.bd/",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    if (ct.includes("json") || buf[0] === 0x7b) return null;
    if (buf[0] === 0x47 && buf[1] === 0x49) return null;
    try {
      const decoded = decodePng(buf);
      return decoded.rgba;
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSatelliteBackdrop(
  extent: { xmin: number; ymin: number; xmax: number; ymax: number },
  width: number,
  height: number,
): Promise<Uint8Array | null> {
  const params = new URLSearchParams({
    bbox: `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${width},${height}`,
    format: "png32",
    f: "image",
    transparent: "false",
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params}`,
      { signal: controller.signal, headers: { Accept: "image/png,image/*" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100 || buf[0] !== 0x89) return null;
    const decoded = decodePng(buf);
    if (decoded.rgba.length !== width * height * 4) return null;
    return decoded.rgba;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function underlaySatellite(base: Uint8Array, satellite: Uint8Array, width: number, height: number): void {
  const n = width * height * 4;
  for (let i = 0; i < n; i += 4) {
    const a = base[i + 3];
    if (a === 0) {
      base[i] = satellite[i];
      base[i + 1] = satellite[i + 1];
      base[i + 2] = satellite[i + 2];
      base[i + 3] = 255;
    } else if (a < 255) {
      const aa = a / 255;
      const ia = 1 - aa;
      base[i] = Math.round(base[i] * aa + satellite[i] * ia);
      base[i + 1] = Math.round(base[i + 1] * aa + satellite[i + 1] * ia);
      base[i + 2] = Math.round(base[i + 2] * aa + satellite[i + 2] * ia);
      base[i + 3] = 255;
    }
  }
}

function compositeTiles(opts: {
  layerKeys: Array<"rs" | "ms">;
  z: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  tileRgba: Map<string, Uint8Array | null>;
}): { width: number; height: number; rgba: Uint8Array; originX: number; originY: number; resolution: number } {
  const { layerKeys, z, minX, minY, maxX, maxY, tileRgba } = opts;
  const tilesX = maxX - minX + 1;
  const tilesY = maxY - minY + 1;
  const width = tilesX * TILE_SIZE;
  const height = tilesY * TILE_SIZE;
  const rgba = new Uint8Array(width * height * 4);
  const { originX, originY, resolution } = tileOrigin3857(z, minX, minY, TILE_SIZE);

  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      const dx = (tx - minX) * TILE_SIZE;
      const dy = (ty - minY) * TILE_SIZE;
      for (const layerKey of layerKeys) {
        const src = tileRgba.get(`${layerKey}:${z}:${tx}:${ty}`);
        if (!src) continue;
        for (let row = 0; row < TILE_SIZE; row++) {
          for (let col = 0; col < TILE_SIZE; col++) {
            const si = (row * TILE_SIZE + col) * 4;
            const a = src[si + 3];
            if (a === 0) continue;
            const di = ((dy + row) * width + (dx + col)) * 4;
            if (layerKeys.length === 1 || a === 255) {
              rgba[di] = src[si];
              rgba[di + 1] = src[si + 1];
              rgba[di + 2] = src[si + 2];
              rgba[di + 3] = a;
            } else {
              const oa = rgba[di + 3] / 255;
              const na = a / 255;
              const outA = na + oa * (1 - na);
              if (outA <= 0) continue;
              rgba[di] = Math.round((src[si] * na + rgba[di] * oa * (1 - na)) / outA);
              rgba[di + 1] = Math.round((src[si + 1] * na + rgba[di + 1] * oa * (1 - na)) / outA);
              rgba[di + 2] = Math.round((src[si + 2] * na + rgba[di + 2] * oa * (1 - na)) / outA);
              rgba[di + 3] = Math.round(outA * 255);
            }
          }
        }
      }
    }
  }
  return { width, height, rgba, originX, originY, resolution };
}

function applyMask(rgba: Uint8Array, mask: Uint8Array, width: number, height: number): void {
  for (let i = 0; i < width * height; i++) {
    if (!mask[i]) {
      const p = i * 4;
      rgba[p] = 0;
      rgba[p + 1] = 0;
      rgba[p + 2] = 0;
      rgba[p + 3] = 0;
    }
  }
}

function cropToMaskBounds(
  rgba: Uint8Array,
  mask: Uint8Array,
  width: number,
  height: number,
  originX: number,
  originY: number,
  resolution: number,
): { rgba: Uint8Array; width: number; height: number; originX: number; originY: number } {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return { rgba, width, height, originX, originY };
  minX = Math.max(0, minX - 2);
  minY = Math.max(0, minY - 2);
  maxX = Math.min(width - 1, maxX + 2);
  maxY = Math.min(height - 1, maxY + 2);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((minY + y) * width + (minX + x)) * 4;
      const di = (y * w + x) * 4;
      out[di] = rgba[si];
      out[di + 1] = rgba[si + 1];
      out[di + 2] = rgba[si + 2];
      out[di + 3] = rgba[si + 3];
    }
  }
  return {
    rgba: out,
    width: w,
    height: h,
    originX: originX + minX * resolution,
    originY: originY - minY * resolution,
  };
}

function buildEnviHdr(opts: {
  width: number;
  height: number;
  bands: number;
  originX: number;
  originY: number;
  resolution: number;
}): string {
  return [
    "ENVI",
    "description = {LandBD Mouza RAW export — EPSG:3857 Web Mercator}",
    `samples = ${opts.width}`,
    `lines = ${opts.height}`,
    `bands = ${opts.bands}`,
    "header offset = 0",
    "file type = ENVI Standard",
    "data type = 1",
    "interleave = bip",
    "byte order = 0",
    `map info = {Arbitrary, 1.0000, 1.0000, ${opts.originX}, ${opts.originY}, ${opts.resolution}, ${opts.resolution}, units=Meters}`,
    'coordinate system string = {PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]}',
    "",
  ].join("\n");
}

const PRJ_3857 = `PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0],AUTHORITY["EPSG","3857"]]`;

function safeName(name: string): string {
  return name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "mouza";
}

export async function exportMouzaRaster(req: MouzaExportRequest): Promise<MouzaExportResult> {
  const mouza = req.mouza.trim();
  if (mouza.length < 2 || mouza.length > 120) {
    throw new Error("Invalid mouza name");
  }
  const maxDim = Math.min(Math.max(req.maxDim ?? MAX_DIM_DEFAULT, 1024), 8192);

  const collection = await getPlots({
    mouza,
    jl: req.jl,
    kind: "all",
    resultRecordCount: 800,
  });
  const features = (collection.features ?? []).filter((f) => featureBelongsToMouza(f, mouza));
  if (!features.length) {
    throw new Error(`No plots found for mouza "${mouza}"`);
  }

  const rings = collectRings(features);
  if (!rings.length) throw new Error("Mouza geometry has no rings");

  const bbox = ringsToBbox3857(rings);
  if (!bbox) throw new Error("Could not compute Mouza extent");

  let z = chooseZoomForBudget(bbox, maxDim, MAX_ZOOM, MIN_ZOOM, TILE_SIZE);
  let range = tileRangeForBbox(bbox, z, TILE_SIZE);
  let tileCount = (range.maxX - range.minX + 1) * (range.maxY - range.minY + 1);
  while (tileCount > MAX_TILES && z > MIN_ZOOM) {
    z -= 1;
    range = tileRangeForBbox(bbox, z, TILE_SIZE);
    tileCount = (range.maxX - range.minX + 1) * (range.maxY - range.minY + 1);
  }

  const layerKeys: Array<"rs" | "ms"> =
    req.layers === "combined" ? ["rs", "ms"] : req.layers === "ms" ? ["ms"] : ["rs"];

  const jobs: Array<{ layerKey: "rs" | "ms"; z: number; x: number; y: number }> = [];
  for (const layerKey of layerKeys) {
    for (let ty = range.minY; ty <= range.maxY; ty++) {
      for (let tx = range.minX; tx <= range.maxX; tx++) {
        jobs.push({ layerKey, z, x: tx, y: ty });
      }
    }
  }

  const fetched = await mapPool(jobs, CONCURRENCY, async (job) => {
    const rgba = await fetchTilePng(job.layerKey, job.z, job.x, job.y);
    return { ...job, rgba };
  });

  const tileRgba = new Map<string, Uint8Array | null>();
  for (const f of fetched) {
    tileRgba.set(`${f.layerKey}:${f.z}:${f.x}:${f.y}`, f.rgba);
  }

  const mosaic = compositeTiles({
    layerKeys,
    z,
    minX: range.minX,
    minY: range.minY,
    maxX: range.maxX,
    maxY: range.maxY,
    tileRgba,
  });

  if (req.satellite) {
    const sat = await fetchSatelliteBackdrop(
      {
        xmin: mosaic.originX,
        ymin: mosaic.originY - mosaic.height * mosaic.resolution,
        xmax: mosaic.originX + mosaic.width * mosaic.resolution,
        ymax: mosaic.originY,
      },
      mosaic.width,
      mosaic.height,
    );
    if (sat) underlaySatellite(mosaic.rgba, sat, mosaic.width, mosaic.height);
  }

  const mask = rasterizePolygonMask({
    rings,
    width: mosaic.width,
    height: mosaic.height,
    originX: mosaic.originX,
    originY: mosaic.originY,
    resolution: mosaic.resolution,
  });
  applyMask(mosaic.rgba, mask, mosaic.width, mosaic.height);
  const cropped = cropToMaskBounds(
    mosaic.rgba,
    mask,
    mosaic.width,
    mosaic.height,
    mosaic.originX,
    mosaic.originY,
    mosaic.resolution,
  );

  const year = new Date().getFullYear();
  const base = `${safeName(mouza)}_${req.layers.toUpperCase()}_${year}`;
  const meta = {
    mouza,
    width: cropped.width,
    height: cropped.height,
    zoom: z,
    resolution: mosaic.resolution,
    crs: "EPSG:3857",
    extent: {
      xmin: cropped.originX,
      ymax: cropped.originY,
      xmax: cropped.originX + cropped.width * mosaic.resolution,
      ymin: cropped.originY - cropped.height * mosaic.resolution,
    },
    tileCount,
    plotCount: features.length,
  };

  if (req.format === "png" || req.format === "jpeg") {
    let rgba = cropped.rgba;
    if (req.format === "jpeg") {
      rgba = new Uint8Array(cropped.rgba);
      for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] < 255) {
          const a = rgba[i + 3] / 255;
          rgba[i] = Math.round(rgba[i] * a + 255 * (1 - a));
          rgba[i + 1] = Math.round(rgba[i + 1] * a + 255 * (1 - a));
          rgba[i + 2] = Math.round(rgba[i + 2] * a + 255 * (1 - a));
          rgba[i + 3] = 255;
        }
      }
    }
    const body = encodeRgbaPng(cropped.width, cropped.height, rgba);
    const satTag = req.satellite ? "_SAT" : "";
    return {
      filename: `${base}${satTag}_share.png`,
      contentType: "image/png",
      body,
      meta,
    };
  }

  if (req.format === "geotiff") {
    const body = writeRgbaGeoTiff({
      width: cropped.width,
      height: cropped.height,
      rgba: cropped.rgba,
      originX: cropped.originX,
      originY: cropped.originY,
      resolution: mosaic.resolution,
      epsg: 3857,
    });
    return {
      filename: `${base}.tif`,
      contentType: "image/tiff",
      body,
      meta,
    };
  }

  const rawBuf = Buffer.from(cropped.rgba.buffer, cropped.rgba.byteOffset, cropped.width * cropped.height * 4);
  const hdr = buildEnviHdr({
    width: cropped.width,
    height: cropped.height,
    bands: 4,
    originX: cropped.originX,
    originY: cropped.originY,
    resolution: mosaic.resolution,
  });
  const zip = createZipStore([
    { name: `${base}.raw`, data: rawBuf },
    { name: `${base}.hdr`, data: Buffer.from(hdr, "utf8") },
    { name: `${base}.prj`, data: Buffer.from(PRJ_3857, "utf8") },
    {
      name: `${base}_readme.txt`,
      data: Buffer.from(
        [
          "LandBD Mouza RAW export",
          `Mouza: ${mouza}`,
          `Layers: ${req.layers}`,
          `CRS: EPSG:3857 (Web Mercator)`,
          `Size: ${cropped.width} x ${cropped.height}`,
          `Pixel size: ${mosaic.resolution} m`,
          `Source LOD/zoom: ${z}`,
          `Tiles: ${tileCount}`,
          "Format: BIP interleaved RGBA uint8",
          "Outside-Mouza pixels are transparent (alpha=0).",
          "",
        ].join("\n"),
        "utf8",
      ),
    },
  ]);

  return {
    filename: `${base}_RAW.zip`,
    contentType: "application/zip",
    body: zip,
    meta,
  };
}
