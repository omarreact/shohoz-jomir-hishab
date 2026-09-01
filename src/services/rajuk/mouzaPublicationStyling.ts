import type { jsPDF } from "jspdf";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import type { GeoExtent, PdfProject } from "./mouzaCartography";

export const PDF_COLORS = {
  rs: [255, 230, 0] as const,
  ms: [0, 240, 255] as const,
  casing: [20, 20, 20] as const,
  mouza: [235, 35, 120] as const,
  neighbor: [190, 210, 225] as const,
  text: [20, 20, 20] as const,
  halo: [255, 255, 255] as const,
};

export function drawCasedRing(doc: jsPDF, ring: number[][], extent: GeoExtent, project: PdfProject, color: readonly [number, number, number], width = 0.55, dash?: readonly [number, number]): void {
  if (ring.length < 3) return;
  const p = ring.map(([x, y]) => project(Number(x), Number(y), extent));
  const rel: Array<[number, number]> = [];
  for (let i = 1; i < p.length; i += 1) rel.push([p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]]);
  if (dash) doc.setLineDashPattern([...dash], 0);
  doc.setDrawColor(...PDF_COLORS.casing); doc.setLineWidth(width + 1);
  doc.lines(rel, p[0][0], p[0][1], [1, 1], "S", true);
  doc.setDrawColor(...color); doc.setLineWidth(width);
  doc.lines(rel, p[0][0], p[0][1], [1, 1], "S", true);
  if (dash) doc.setLineDashPattern([], 0);
}

export function drawCadastralFeatures(doc: jsPDF, features: RajukPlotFeature[], extent: GeoExtent, project: PdfProject, isMs: (f: RajukPlotFeature) => boolean): void {
  for (const feature of features) {
    const color = isMs(feature) ? PDF_COLORS.ms : PDF_COLORS.rs;
    for (const ring of feature.geometry?.rings ?? []) drawCasedRing(doc, ring, extent, project, color, 0.5, isMs(feature) ? [2, 1] : undefined);
  }
}

export function drawMouzaBoundary(doc: jsPDF, geometry: { rings?: number[][][] } | null, extent: GeoExtent, project: PdfProject): void {
  if (!geometry) return;
  for (const ring of geometry.rings ?? []) drawCasedRing(doc, ring, extent, project, PDF_COLORS.mouza, 2.5);
}

export function drawHaloText(doc: jsPDF, value: string, x: number, y: number, size: number, options?: { align?: "left" | "center" | "right" }): void {
  doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(...PDF_COLORS.halo); doc.setLineWidth(1.5);
  doc.text(value, x, y, { align: options?.align ?? "left", renderingMode: "fillThenStroke" } as never);
  doc.setTextColor(...PDF_COLORS.text); doc.setLineWidth(0.2);
  doc.text(value, x, y, { align: options?.align ?? "left" });
}

export function drawThreeColumnFooter(doc: jsPDF, details: string[], center: string[], legend: Array<{label:string;color:readonly[number,number,number];dash?:readonly[number,number]}>, y = 277): void {
  const left = 14, mid = 168, right = 302;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.2); doc.setTextColor(20,30,40);
  doc.text("Mouza Details", left, y); doc.text("Map Reference", mid, y); doc.text("Legend", right, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.4);
  details.forEach((v,i)=>doc.text(v,left,y+5+i*3.5));
  center.forEach((v,i)=>doc.text(v,mid,y+5+i*3.5));
  legend.forEach((item,i)=>{const yy=y+5+i*5; if(item.dash)doc.setLineDashPattern([...item.dash],0); doc.setDrawColor(...item.color);doc.setLineWidth(1.1);doc.line(right,yy-1,right+12,yy-1);if(item.dash)doc.setLineDashPattern([],0);doc.setTextColor(20,30,40);doc.text(item.label,right+15,yy);});
}
