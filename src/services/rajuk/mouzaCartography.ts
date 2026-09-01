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
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    area2 += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(area2) < 1e-15) return null;
  return [cx / (3 * area2), cy / (3 * area2)];
}

function pointInRing(point: readonly [number, number], ring: number[][]): boolean {
  let inside = false;
  const [px, py] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function labelPoint(feature: RajukPlotFeature): [number, number] | null {
  const rings = feature.geometry?.rings ?? [];
  const outer = rings[0];
  if (!outer || outer.length < 3) return null;
  const centroid = ringCentroid(outer);
  if (centroid && pointInRing(centroid, outer)) return centroid;
  const average = outer.reduce<[number, number]>((sum, p) => [sum[0] + Number(p[0]), sum[1] + Number(p[1])], [0, 0]);
  const fallback: [number, number] = [average[0] / outer.length, average[1] / outer.length];
  if (pointInRing(fallback, outer)) return fallback;
  const first = outer[0];
  return first ? [Number(first[0]), Number(first[1])] : null;
}

function textSizeForFeature(feature: RajukPlotFeature, extent: GeoExtent): number {
  const ring = feature.geometry?.rings?.[0] ?? [];
  if (ring.length < 3) return 5;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, Number(x)); maxX = Math.max(maxX, Number(x));
    minY = Math.min(minY, Number(y)); maxY = Math.max(maxY, Number(y));
  }
  const width = ((maxX - minX) / Math.max(extent.xmax - extent.xmin, 1e-12)) * DRAW_W;
  const height = ((maxY - minY) / Math.max(extent.ymax - extent.ymin, 1e-12)) * DRAW_H;
  const diagonal = Math.sqrt(Math.max(width, 0) * Math.max(height, 0));
  return Math.max(4.2, Math.min(8.5, diagonal * 0.34));
}

export function drawAdaptivePlotLabels(
  doc: jsPDF,
  features: RajukPlotFeature[],
  extent: GeoExtent,
  project: PdfProject,
  isMs: (feature: RajukPlotFeature) => boolean,
): void {
  const occupied: Array<{ x: number; y: number; r: number }> = [];
  const ranked = [...features].sort((a, b) => {
    const ar = a.geometry?.rings?.[0]?.length ?? 0;
    const br = b.geometry?.rings?.[0]?.length ?? 0;
    return br - ar;
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  for (const feature of ranked) {
    const a = feature.attributes as Record<string, unknown>;
    const label = String(a.plot_no ?? a.rs_plot_no ?? a.ms_plot_no ?? "").trim();
    const point = labelPoint(feature);
    if (!label || !point) continue;
    const [x, y] = project(point[0], point[1], extent);
    const size = textSizeForFeature(feature, extent);
    const radius = Math.max(2.4, doc.getTextWidth(label) * (size / 5.2) * 0.6);
    const collision = occupied.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + radius + 0.8);
    if (collision && size <= 5) continue;
    doc.setFontSize(size);
    doc.text(isMs(feature) ? `MS ${label}` : label, x, y, { align: "center", baseline: "middle" });
    occupied.push({ x, y, r: radius });
  }
}

export function drawNorthArrow(doc: jsPDF, x = PAGE_W - 24, y = MARGIN + 8): void {
  doc.setDrawColor(25, 35, 45);
  doc.setFillColor(25, 35, 45);
  doc.setLineWidth(0.35);
  doc.line(x, y + 16, x, y + 3);
  doc.triangle(x, y, x - 2.2, y + 5, x + 2.2, y + 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(25, 35, 45);
  doc.text("N", x, y - 1.5, { align: "center" });
}

function metersPerDegreeLat(latitude: number): number {
  const phi = (latitude * Math.PI) / 180;
  return 111132.92 - 559.82 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi);
}
function metersPerDegreeLon(latitude: number): number {
  const phi = (latitude * Math.PI) / 180;
  return 111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi);
}

export function drawScaleBar(doc: jsPDF, extent: GeoExtent, x = MARGIN, y = PAGE_H - 5): void {
  const lat = (extent.ymin + extent.ymax) / 2;
  const mPerDegX = metersPerDegreeLon(lat);
  const groundWidthM = Math.max(1, (extent.xmax - extent.xmin) * mPerDegX);
  const candidates = [25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  const target = groundWidthM * 0.16;
  const meters = candidates.reduce((best, value) => Math.abs(value - target) < Math.abs(best - target) ? value : best, candidates[0]);
  const paperWidth = (meters / groundWidthM) * DRAW_W;

  doc.setDrawColor(20, 30, 40);
  doc.setFillColor(20, 30, 40);
  doc.setLineWidth(0.35);
  doc.rect(x, y - 3.5, paperWidth, 2, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + paperWidth / 2, y - 3.5, paperWidth / 2, 2, "F");
  doc.setDrawColor(20, 30, 40);
  doc.rect(x, y - 3.5, paperWidth, 2, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(20, 30, 40);
  doc.text("0", x, y + 1.5);
  doc.text(`${meters >= 1000 ? `${meters / 1000} km` : `${meters} m`}`, x + paperWidth, y + 1.5, { align: "right" });
}

export function drawCoordinateGrid(doc: jsPDF, extent: GeoExtent, project: PdfProject): void {
  const latSpan = extent.ymax - extent.ymin;
  const lonSpan = extent.xmax - extent.xmin;
  const stepLat = latSpan > 0.05 ? 0.01 : latSpan > 0.01 ? 0.002 : 0.001;
  const stepLon = lonSpan > 0.05 ? 0.01 : lonSpan > 0.01 ? 0.002 : 0.001;
  doc.setDrawColor(90, 100, 110);
  doc.setLineWidth(0.08);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(80, 90, 100);
  for (let lon = Math.ceil(extent.xmin / stepLon) * stepLon; lon < extent.xmax; lon += stepLon) {
    const [x] = project(lon, extent.ymin, extent);
    doc.line(x, MARGIN + 10, x, MARGIN + 10 + DRAW_H);
  }
  for (let lat = Math.ceil(extent.ymin / stepLat) * stepLat; lat < extent.ymax; lat += stepLat) {
    const [, y] = project(extent.xmin, lat, extent);
    doc.line(MARGIN, y, MARGIN + DRAW_W, y);
  }
}

export function drawScaleText(doc: jsPDF, extent: GeoExtent, y = 8): void {
  const lat = (extent.ymin + extent.ymax) / 2;
  const groundWidthM = Math.max(1, (extent.xmax - extent.xmin) * metersPerDegreeLon(lat));
  const scaleDenominator = Math.round((groundWidthM / (DRAW_W / 1000)) / 100) * 100;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(50, 60, 70);
  doc.text(`Approx. scale 1:${Math.max(100, scaleDenominator).toLocaleString("en-US")}`, PAGE_W - MARGIN, y + 4, { align: "right" });
}
