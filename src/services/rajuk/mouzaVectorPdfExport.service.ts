import "server-only";

import { jsPDF } from "jspdf";
import { getPlots } from "./rajukQuery.service";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export type MouzaVectorPdfLayers = "rs" | "ms" | "combined";

export type MouzaVectorPdfRequest = {
  mouza: string;
  jl?: string;
  layers: MouzaVectorPdfLayers;
};

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
    extent: { xmin: number; ymin: number; xmax: number; ymax: number };
    tileCount: number;
    plotCount: number;
  };
};

const PAGE_W = 420;
const PAGE_H = 297;
const MARGIN = 14;
const DRAW_W = PAGE_W - MARGIN * 2;
const DRAW_H = PAGE_H - MARGIN * 2 - 16;
const MAX_POINTS_PER_RING = 900;

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

function collectExtent(features: RajukPlotFeature[]) {
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  for (const feature of features) {
    for (const ring of feature.geometry?.rings ?? []) {
      for (const coord of ring) {
        const x = Number(coord[0]);
        const y = Number(coord[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        xmin = Math.min(xmin, x);
        ymin = Math.min(ymin, y);
        xmax = Math.max(xmax, x);
        ymax = Math.max(ymax, y);
      }
    }
  }
  if (!Number.isFinite(xmin)) return null;
  return { xmin, ymin, xmax, ymax };
}

function project(lng: number, lat: number, extent: NonNullable<ReturnType<typeof collectExtent>>) {
  const dx = Math.max(extent.xmax - extent.xmin, 1e-12);
  const dy = Math.max(extent.ymax - extent.ymin, 1e-12);
  const x = MARGIN + ((lng - extent.xmin) / dx) * DRAW_W;
  const y = MARGIN + 10 + (1 - (lat - extent.ymin) / dy) * DRAW_H;
  return [x, y] as const;
}

function drawRing(doc: jsPDF, ring: number[][], extent: NonNullable<ReturnType<typeof collectExtent>>) {
  const points = simplifyRing(ring);
  if (points.length < 3) return;
  const projected = points
    .map(([lng, lat]) => project(Number(lng), Number(lat), extent))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (projected.length < 3) return;

  const relative: Array<[number, number]> = [];
  for (let i = 1; i < projected.length; i += 1) {
    relative.push([projected[i][0] - projected[i - 1][0], projected[i][1] - projected[i - 1][1]]);
  }
  doc.lines(relative, projected[0][0], projected[0][1], [1, 1], "S", true);
}

function drawFeature(doc: jsPDF, feature: RajukPlotFeature, extent: NonNullable<ReturnType<typeof collectExtent>>, ms: boolean) {
  doc.setDrawColor(ms ? 105 : 37, ms ? 55 : 99, ms ? 180 : 235);
  doc.setLineWidth(ms ? 0.18 : 0.22);
  doc.setFillColor(255, 255, 255);
  for (const ring of feature.geometry?.rings ?? []) drawRing(doc, ring, extent);
}

function drawLabels(doc: jsPDF, features: RajukPlotFeature[], extent: NonNullable<ReturnType<typeof collectExtent>>) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(35, 35, 35);
  for (const feature of features) {
    const rings = feature.geometry?.rings ?? [];
    const first = rings[0]?.[0];
    if (!first) continue;
    const label = String(feature.attributes.plot_no ?? feature.attributes.rs_plot_no ?? feature.attributes.ms_plot_no ?? "").trim();
    if (!label) continue;
    const [x, y] = project(Number(first[0]), Number(first[1]), extent);
    if (x < MARGIN || x > PAGE_W - MARGIN || y < MARGIN || y > PAGE_H - MARGIN) continue;
    doc.text(label, x, y, { align: "center", baseline: "middle" });
  }
}

export async function exportMouzaVectorPdf(input: MouzaVectorPdfRequest): Promise<MouzaVectorPdfResult> {
  const normalized = input.mouza.trim();
  if (!normalized) throw new Error("Mouza is required");

  const collection = await getPlots({
    mouza: normalized,
    jl: input.jl,
    kind: "all",
    resultRecordCount: 2000,
    resultOffset: 0,
  });
  const all = (collection.features ?? []).filter((f) => {
    const a = f.attributes as Record<string, unknown>;
    const names = [a.rs_mauza_name, a.mauza, a.ms_mauza_name, a.ms_mauza]
      .map((v) => String(v ?? "").trim().toLowerCase())
      .filter(Boolean);
    return names.includes(normalized.toLowerCase());
  });

  const features = all.filter((f) => {
    const ms = isMs(f);
    return input.layers === "combined" || (input.layers === "ms" ? ms : !ms);
  });
  if (!features.length) throw new Error(`No plots found for ${normalized}`);

  const extent = collectExtent(features);
  if (!extent) throw new Error("No valid plot geometry found");

  const padX = Math.max((extent.xmax - extent.xmin) * 0.02, 0.00001);
  const padY = Math.max((extent.ymax - extent.ymin) * 0.02, 0.00001);
  const padded = {
    xmin: extent.xmin - padX,
    ymin: extent.ymin - padY,
    xmax: extent.xmax + padX,
    ymax: extent.ymax + padY,
  };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PAGE_W, PAGE_H], compress: true, putOnlyUsedFonts: true });
  doc.setProperties({
    title: `LandBD Vector Mouza Map - ${normalized}`,
    subject: "RS/MS cadastral vector map",
    creator: "LandBD",
    author: "LandBD",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 40);
  doc.text(`LandBD — ${normalized}`, MARGIN, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`Vector cadastral map · ${input.layers === "combined" ? "RS + MS" : input.layers.toUpperCase()} · ${features.length} plots`, MARGIN, 12);

  doc.setFillColor(250, 250, 250);
  doc.rect(MARGIN, MARGIN, DRAW_W, DRAW_H, "F");
  for (const feature of features) drawFeature(doc, feature, padded, isMs(feature));
  drawLabels(doc, features, padded);

  const legendY = PAGE_H - 5;
  doc.setFontSize(6);
  doc.setDrawColor(37, 99, 235);
  doc.line(MARGIN, legendY, MARGIN + 7, legendY);
  doc.setTextColor(35, 35, 35);
  doc.text("RS", MARGIN + 9, legendY + 1.5);
  doc.setDrawColor(105, 55, 180);
  doc.line(MARGIN + 25, legendY, MARGIN + 32, legendY);
  doc.text("MS", MARGIN + 34, legendY + 1.5);
  doc.text("Editable/vector geometry — not a raster screenshot", MARGIN + 55, legendY + 1.5);

  const arrayBuffer = doc.output("arraybuffer");
  const body = Buffer.from(arrayBuffer);
  return {
    filename: `landbd-${safeFilePart(normalized)}-${input.layers}-vector.pdf`,
    contentType: "application/pdf",
    body,
    meta: {
      mouza: normalized,
      width: PAGE_W,
      height: PAGE_H,
      zoom: 0,
      resolution: 0,
      crs: "EPSG:4326 vector geometry",
      extent: padded,
      tileCount: 0,
      plotCount: features.length,
    },
  };
}
