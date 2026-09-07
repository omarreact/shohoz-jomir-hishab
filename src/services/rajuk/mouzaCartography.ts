import type { jsPDF } from "jspdf";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export type GeoExtent = { xmin: number; ymin: number; xmax: number; ymax: number };
export type PdfProject = (lng: number, lat: number, extent: GeoExtent) => readonly [number, number];

const MARGIN = 14;
const PAGE_W = 420;
const PAGE_H = 297;
const DRAW_W = PAGE_W - MARGIN * 2;
const DRAW_H = PAGE_H - MARGIN * 2 - 16;

function ringCentroid(ring: number[][]): [number, number] | null {
  if (ring.length < 3) return null;
  let area2 = 0; let cx = 0; let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]; const [x2, y2] = ring[i + 1]; const cross = x1 * y2 - x2 * y1;
    area2 += cross; cx += (x1 + x2) * cross; cy += (y1 + y2) * cross;
  }
  if (Math.abs(area2) < 1e-15) return null;
  return [cx / (3 * area2), cy / (3 * area2)];
}

function pointInRing(point: readonly [number, number], ring: number[][]): boolean {
  let inside = false; const [px, py] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function labelPoint(feature: RajukPlotFeature): [number, number] | null {
  const outer = feature.geometry?.rings?.[0]; if (!outer || outer.length < 3) return null;
  const centroid = ringCentroid(outer); if (centroid && pointInRing(centroid, outer)) return centroid;
  const average = outer.reduce<[number, number]>((sum, p) => [sum[0] + Number(p[0]), sum[1] + Number(p[1])], [0, 0]);
  const fallback: [number, number] = [average[0] / outer.length, average[1] / outer.length];
  if (pointInRing(fallback, outer)) return fallback;
  const first = outer[0]; return first ? [Number(first[0]), Number(first[1])] : null;
}

function projectedArea(feature: RajukPlotFeature, extent: GeoExtent): number {
  const ring = feature.geometry?.rings?.[0] ?? []; if (ring.length < 3) return 0;
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of ring) { minX = Math.min(minX, Number(x)); maxX = Math.max(maxX, Number(x)); minY = Math.min(minY, Number(y)); maxY = Math.max(maxY, Number(y)); }
  const width = ((maxX - minX) / Math.max(extent.xmax - extent.xmin, 1e-12)) * DRAW_W;
  const height = ((maxY - minY) / Math.max(extent.ymax - extent.ymin, 1e-12)) * DRAW_H;
  return Math.max(0, width * height);
}

function textSizeForFeature(feature: RajukPlotFeature, extent: GeoExtent): number {
  return Math.max(4.2, Math.min(8.5, Math.sqrt(projectedArea(feature, extent)) * 0.34));
}

function drawTextHalo(doc: jsPDF, value: string, x: number, y: number, size: number): void {
  doc.setFontSize(size); doc.setTextColor(255, 255, 255); doc.setLineWidth(1.5); doc.setDrawColor(255, 255, 255);
  doc.text(value, x, y, { align: "center", baseline: "middle", renderingMode: "fillThenStroke" });
  doc.setTextColor(20, 20, 20); doc.setLineWidth(0.2); doc.setDrawColor(20, 20, 20);
  doc.text(value, x, y, { align: "center", baseline: "middle" });
}

export function drawAdaptivePlotLabels(doc: jsPDF, features: RajukPlotFeature[], extent: GeoExtent, project: PdfProject, isMs: (feature: RajukPlotFeature) => boolean): void {
  const occupied: Array<{ x: number; y: number; r: number }> = [];
  const density = features.length / Math.max(DRAW_W * DRAW_H, 1);
  const areaThreshold = density > 0.035 ? 22 : density > 0.02 ? 15 : 9;
  const ranked = [...features].sort((a, b) => projectedArea(b, extent) - projectedArea(a, extent));
  for (const feature of ranked) {
    if (projectedArea(feature, extent) < areaThreshold) continue;
    const a = feature.attributes as Record<string, unknown>; const label = String(a.plot_no ?? a.rs_plot_no ?? a.ms_plot_no ?? "").trim();
    const point = labelPoint(feature); if (!label || !point) continue;
    const [x, y] = project(point[0], point[1], extent); const size = textSizeForFeature(feature, extent);
    const display = isMs(feature) ? `MS ${label}` : label; doc.setFont("helvetica", "bold"); doc.setFontSize(size);
    const radius = Math.max(2.4, doc.getTextWidth(display) * 0.55);
    if (occupied.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + radius + 0.8)) continue;
    drawTextHalo(doc, display, x, y, size); occupied.push({ x, y, r: radius });
  }
}

export function drawNorthArrow(doc: jsPDF, x = PAGE_W - 24, y = MARGIN + 8): void {
  doc.setDrawColor(25, 35, 45); doc.setFillColor(25, 35, 45); doc.setLineWidth(0.35); doc.line(x, y + 16, x, y + 3);
  doc.triangle(x, y, x - 2.2, y + 5, x + 2.2, y + 5, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(25, 35, 45);
  doc.text("N", x, y - 1.5, { align: "center" });
}

function metersPerDegreeLon(latitude: number): number { const phi = (latitude * Math.PI) / 180; return 111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi); }

export function drawScaleBar(doc: jsPDF, extent: GeoExtent, x = MARGIN, y = PAGE_H - 5): void {
  const lat = (extent.ymin + extent.ymax) / 2; const groundWidthM = Math.max(1, (extent.xmax - extent.xmin) * metersPerDegreeLon(lat));
  const candidates = [25, 50, 100, 200, 500, 1000, 2000, 5000, 10000]; const target = groundWidthM * 0.16;
  const meters = candidates.reduce((best, value) => Math.abs(value - target) < Math.abs(best - target) ? value : best, candidates[0]);
  const paperWidth = (meters / groundWidthM) * DRAW_W;
  doc.setDrawColor(20, 30, 40); doc.setFillColor(20, 30, 40); doc.setLineWidth(0.35); doc.rect(x, y - 3.5, paperWidth, 2, "F");
  doc.setFillColor(255, 255, 255); doc.rect(x + paperWidth / 2, y - 3.5, paperWidth / 2, 2, "F"); doc.setDrawColor(20, 30, 40); doc.rect(x, y - 3.5, paperWidth, 2, "S");
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.5); doc.setTextColor(20, 30, 40); doc.text("0", x, y + 1.5);
  doc.text(`${meters >= 1000 ? `${meters / 1000} km` : `${meters} m`}`, x + paperWidth, y + 1.5, { align: "right" });
}

function formatCoordinate(value: number, positive: string, negative: string): string {
  const abs = Math.abs(value); const degrees = Math.floor(abs); const minutesFloat = (abs - degrees) * 60; const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60); const normalizedSeconds = seconds === 60 ? 0 : seconds; const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
  return `${degrees}°${normalizedMinutes.toString().padStart(2, "0")}'${normalizedSeconds.toString().padStart(2, "0")}\"${value >= 0 ? positive : negative}`;
}

export function drawCoordinateGrid(doc: jsPDF, extent: GeoExtent, project: PdfProject): void {
  const latSpan = extent.ymax - extent.ymin; const lonSpan = extent.xmax - extent.xmin;
  const stepLat = latSpan > 0.05 ? 0.01 : latSpan > 0.01 ? 0.002 : 0.001; const stepLon = lonSpan > 0.05 ? 0.01 : lonSpan > 0.01 ? 0.002 : 0.001;
  doc.setDrawColor(90, 100, 110); doc.setLineWidth(0.08); doc.setFont("helvetica", "normal"); doc.setFontSize(4.5); doc.setTextColor(80, 90, 100);
  for (let lon = Math.ceil(extent.xmin / stepLon) * stepLon; lon < extent.xmax; lon += stepLon) { const [x] = project(lon, extent.ymin, extent); doc.line(x, MARGIN + 10, x, MARGIN + 10 + DRAW_H); const label = formatCoordinate(lon, "E", "W"); doc.text(label, x, MARGIN + 8, { align: "center" }); doc.text(label, x, MARGIN + 10 + DRAW_H + 4, { align: "center" }); }
  for (let lat = Math.ceil(extent.ymin / stepLat) * stepLat; lat < extent.ymax; lat += stepLat) { const [, y] = project(extent.xmin, lat, extent); doc.line(MARGIN, y, MARGIN + DRAW_W, y); const label = formatCoordinate(lat, "N", "S"); doc.text(label, MARGIN - 1, y + 1, { align: "right" }); doc.text(label, MARGIN + DRAW_W + 1, y + 1, { align: "left" }); }
}

export function drawScaleText(doc: jsPDF, extent: GeoExtent, y = 8): void {
  const lat = (extent.ymin + extent.ymax) / 2; const groundWidthM = Math.max(1, (extent.xmax - extent.xmin) * metersPerDegreeLon(lat));
  const scaleDenominator = Math.round((groundWidthM / (DRAW_W / 1000)) / 100) * 100;
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); doc.setTextColor(50, 60, 70);
  doc.text(`Approx. Scale: 1:${Math.max(100, scaleDenominator).toLocaleString("en-US")}`, PAGE_W - MARGIN, y + 4, { align: "right" });
}

export function drawPublicationFooter(doc: jsPDF, meta: { mouza: string; jl: string; upazila: string; district: string; plots: number; layers: string; satellite: boolean; scale: string }): void {
  const top = PAGE_H - 25; const col1 = MARGIN; const col2 = 154; const col3 = 285;
  doc.setFillColor(248, 249, 250); doc.setDrawColor(185, 190, 195); doc.setLineWidth(0.2); doc.rect(MARGIN, top, DRAW_W, 16, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.setTextColor(30, 35, 40); doc.text("Mouza Details", col1 + 2, top + 4); doc.text("Map / Print", col2 + 2, top + 4); doc.text("Legend", col3 + 2, top + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.3);
  doc.text(`Name: ${meta.mouza || "N/A"}`, col1 + 2, top + 8); doc.text(`JL No: ${meta.jl || "N/A"}`, col1 + 2, top + 11); doc.text(`Upazila: ${meta.upazila || "N/A"}`, col1 + 2, top + 14); doc.text(`District: ${meta.district || "N/A"}  |  Plots: ${meta.plots}`, col1 + 52, top + 8);
  doc.text(`Print Ratio: ${meta.scale || "N/A"}  |  CRS: EPSG:4326`, col2 + 2, top + 8); doc.text(`Layers: ${meta.layers}  |  ${meta.satellite ? "Satellite + Vector" : "Vector"}`, col2 + 2, top + 11); doc.text("Publication-ready cadastral map", col2 + 2, top + 14);
  const swatch = (x: number, y: number, r: number, g: number, b: number, label: string, dashed = false) => { doc.setDrawColor(r, g, b); doc.setLineWidth(0.7); if (dashed) doc.setLineDashPattern([1.2, 0.8], 0); doc.line(x, y, x + 9, y); if (dashed) doc.setLineDashPattern([], 0); doc.setFontSize(5); doc.setTextColor(35, 40, 45); doc.text(label, x + 12, y + 1.5); };
  swatch(col3 + 2, top + 8, 255, 230, 0, "RS Line"); swatch(col3 + 2, top + 12, 0, 240, 255, "MS Line", true); swatch(col3 + 70, top + 8, 230, 0, 120, "Mouza Boundary"); swatch(col3 + 70, top + 12, 110, 120, 130, "Neighboring Mouza", true);
}
