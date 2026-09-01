import "server-only";

import { jsPDF } from "jspdf";
import { getPlots } from "./rajukQuery.service";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import {
  drawAdaptivePlotLabels,
  drawCoordinateGrid,
  drawNorthArrow,
  drawScaleBar,
  drawScaleText,
  type GeoExtent,
} from "./mouzaCartography";

export type MouzaVectorPdfLayers = "rs" | "ms" | "combined";
export type MouzaVectorPdfRequest = { mouza: string; jl?: string; layers: MouzaVectorPdfLayers; satellite?: boolean };
export type MouzaVectorPdfResult = {
  filename: string;
  contentType: "application/pdf";
  body: Buffer;
  meta: {
    mouza: string;
    width: number;
    height: number;
    zoom: number;
    resolution: number;
    crs: string;
    extent: GeoExtent;
    tileCount: number;
    plotCount: number;
    satellite: boolean;
  };
};

const PAGE_W = 420;
const PAGE_H = 297;
const MARGIN = 14;
const DRAW_W = PAGE_W - MARGIN * 2;
const DRAW_H = PAGE_H - MARGIN * 2 - 16;
const MAX_POINTS_PER_RING = 900;
const PAGE_ASPECT = DRAW_W / DRAW_H;
const SATELLITE_TIMEOUT_MS = 15_000;
const SATELLITE_IMAGE_WIDTH = 3000;
const SATELLITE_IMAGE_HEIGHT = Math.round(SATELLITE_IMAGE_WIDTH / PAGE_ASPECT);

function isMs(feature: RajukPlotFeature): boolean {
  const a = feature.attributes as Record<string, unknown>;
  return a._layer_source === "ms" || a.plot_kind === "ms" || Boolean(String(a.ms_plot_no ?? "").trim());
}

function simplifyRing(ring: number[][]): number[][] {
  if (ring.length <= MAX_POINTS_PER_RING) return ring;
  const step = Math.ceil(ring.length / MAX_POINTS_PER_RING);
  const reduced: number[][] = [];
  for (let i = 0; i < ring.length; i += step) reduced.push(ring[i]);
  const first = ring[0];
  const last = reduced[reduced.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) reduced.push(first);
  return reduced;
}

function safeFilePart(value: string): string {
  return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "mouza";
}

function collectExtent(features: RajukPlotFeature[]): GeoExtent | null {
  let xmin = Infinity; let ymin = Infinity; let xmax = -Infinity; let ymax = -Infinity;
  for (const feature of features) {
    for (const ring of feature.geometry?.rings ?? []) {
      for (const coord of ring) {
        const x = Number(coord[0]); const y = Number(coord[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        xmin = Math.min(xmin, x); ymin = Math.min(ymin, y); xmax = Math.max(xmax, x); ymax = Math.max(ymax, y);
      }
    }
  }
  if (!Number.isFinite(xmin)) return null;
  return { xmin, ymin, xmax, ymax };
}

function fitExtentToPage(extent: GeoExtent): GeoExtent {
  const centerX = (extent.xmin + extent.xmax) / 2;
  const centerY = (extent.ymin + extent.ymax) / 2;
  const width = Math.max(extent.xmax - extent.xmin, 1e-12);
  const height = Math.max(extent.ymax - extent.ymin, 1e-12);
  const aspect = width / height;
  let fittedWidth = width;
  let fittedHeight = height;
  if (aspect < PAGE_ASPECT) fittedWidth = height * PAGE_ASPECT;
  else if (aspect > PAGE_ASPECT) fittedHeight = width / PAGE_ASPECT;
  fittedWidth *= 1.04;
  fittedHeight *= 1.04;
  return { xmin: centerX - fittedWidth / 2, ymin: centerY - fittedHeight / 2, xmax: centerX + fittedWidth / 2, ymax: centerY + fittedHeight / 2 };
}

function project(lng: number, lat: number, extent: GeoExtent): readonly [number, number] {
  const dx = Math.max(extent.xmax - extent.xmin, 1e-12);
  const dy = Math.max(extent.ymax - extent.ymin, 1e-12);
  return [MARGIN + ((lng - extent.xmin) / dx) * DRAW_W, MARGIN + 10 + (1 - (lat - extent.ymin) / dy) * DRAW_H];
}

function drawRing(doc: jsPDF, ring: number[][], extent: GeoExtent): void {
  const points = simplifyRing(ring);
  if (points.length < 3) return;
  const projected = points.map(([lng, lat]) => project(Number(lng), Number(lat), extent)).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (projected.length < 3) return;
  const relative: Array<[number, number]> = [];
  for (let i = 1; i < projected.length; i += 1) relative.push([projected[i][0] - projected[i - 1][0], projected[i][1] - projected[i - 1][1]]);
  doc.lines(relative, projected[0][0], projected[0][1], [1, 1], "S", true);
}

function drawFeature(doc: jsPDF, feature: RajukPlotFeature, extent: GeoExtent, ms: boolean): void {
  doc.setDrawColor(ms ? 105 : 37, ms ? 55 : 99, ms ? 180 : 235);
  doc.setLineWidth(ms ? 0.18 : 0.22);
  for (const ring of feature.geometry?.rings ?? []) drawRing(doc, ring, extent);
}

async function fetchSatelliteImage(extent: GeoExtent): Promise<Buffer> {
  const params = new URLSearchParams({
    bbox: `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`,
    bboxSR: "4326", imageSR: "4326", size: `${SATELLITE_IMAGE_WIDTH},${SATELLITE_IMAGE_HEIGHT}`,
    format: "jpg", f: "image", dpi: "150", compressionQuality: "80", transparent: "false",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SATELLITE_TIMEOUT_MS);
  try {
    const response = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params.toString()}`, { signal: controller.signal, headers: { accept: "image/jpeg" } });
    if (!response.ok) throw new Error(`Satellite imagery request failed (${response.status})`);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("image/")) throw new Error("Satellite imagery service returned a non-image response");
    return Buffer.from(await response.arrayBuffer());
  } finally { clearTimeout(timeout); }
}

async function getAllMouzaPlots(mouza: string, jl?: string): Promise<RajukPlotFeature[]> {
  const pageSize = 2000;
  const features: RajukPlotFeature[] = [];
  let offset = 0;
  for (;;) {
    const page = await getPlots({ mouza, jl, kind: "all", resultRecordCount: pageSize, resultOffset: offset });
    const rows = page.features ?? [];
    features.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  const seen = new Set<string>();
  return features.filter((feature, index) => {
    const a = feature.attributes as Record<string, unknown>;
    const key = String(a.objectid ?? a.OBJECTID ?? a.plot_id ?? `${isMs(feature) ? "ms" : "rs"}-${a.plot_no ?? index}`);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export async function exportMouzaVectorPdf(input: MouzaVectorPdfRequest): Promise<MouzaVectorPdfResult> {
  const normalized = input.mouza.trim();
  if (!normalized) throw new Error("Mouza is required");
  const all = await getAllMouzaPlots(normalized, input.jl);
  const features = all.filter((f) => {
    const ms = isMs(f);
    return input.layers === "combined" || (input.layers === "ms" ? ms : !ms);
  });
  if (!features.length) throw new Error(`No plots found for ${normalized}`);
  const extent = collectExtent(features);
  if (!extent) throw new Error("No valid plot geometry found");
  const fitted = fitExtentToPage(extent);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PAGE_W, PAGE_H], compress: true, putOnlyUsedFonts: true });
  doc.setProperties({ title: `LandBD Vector Mouza Map - ${normalized}`, subject: `${input.satellite ? "Satellite + " : ""}RS/MS cadastral vector map`, creator: "LandBD", author: "LandBD" });

  doc.setFillColor(250, 250, 250);
  doc.rect(MARGIN, MARGIN + 10, DRAW_W, DRAW_H, "F");
  let satellite = false;
  if (input.satellite) {
    try {
      const image = await fetchSatelliteImage(fitted);
      doc.addImage(image, "JPEG", MARGIN, MARGIN + 10, DRAW_W, DRAW_H, undefined, "FAST");
      satellite = true;
    } catch (error) {
      console.warn("LandBD satellite PDF backdrop unavailable; continuing with vector-only PDF:", error);
    }
  }

  // Light coordinate grid gives the printed map geographic reference without changing the vector geometry.
  drawCoordinateGrid(doc, fitted, project);
  for (const feature of features) drawFeature(doc, feature, fitted, isMs(feature));
  drawAdaptivePlotLabels(doc, features, fitted, project, isMs);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 40);
  doc.text(`LandBD — ${normalized}`, MARGIN, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`${satellite ? "Satellite + " : ""}Vector cadastral map · ${input.layers === "combined" ? "RS + MS" : input.layers.toUpperCase()} · ${features.length} plots`, MARGIN, 12);
  drawScaleText(doc, fitted, 4);
  drawNorthArrow(doc);
  drawScaleBar(doc, fitted);

  const legendY = PAGE_H - 5;
  doc.setFontSize(6);
  doc.setDrawColor(37, 99, 235); doc.line(MARGIN + 55, legendY, MARGIN + 62, legendY);
  doc.setTextColor(35, 35, 35); doc.text("RS", MARGIN + 64, legendY + 1.5);
  doc.setDrawColor(105, 55, 180); doc.line(MARGIN + 80, legendY, MARGIN + 87, legendY);
  doc.text("MS", MARGIN + 89, legendY + 1.5);
  doc.text(satellite ? "Satellite backdrop + vector cadastral geometry" : "Vector cadastral geometry", MARGIN + 110, legendY + 1.5);

  const body = Buffer.from(doc.output("arraybuffer"));
  return {
    filename: `landbd-${safeFilePart(normalized)}-${input.layers}${satellite ? "-satellite" : ""}-vector.pdf`,
    contentType: "application/pdf", body,
    meta: { mouza: normalized, width: PAGE_W, height: PAGE_H, zoom: 0, resolution: satellite ? 150 : 0, crs: "EPSG:4326 vector geometry", extent: fitted, tileCount: satellite ? 1 : 0, plotCount: features.length, satellite },
  };
}
