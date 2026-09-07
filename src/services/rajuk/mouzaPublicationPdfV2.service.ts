import "server-only";
import { jsPDF } from "jspdf";
import { getPlots } from "./rajukQuery.service";
import { RAJUK_DB } from "./rajukLayers.service";
import { getValidToken } from "./rajukAuth.service";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { drawNorthArrow, drawScaleBar, drawScaleText, drawCoordinateGrid, drawPublicationFooter, type GeoExtent } from "./mouzaCartography";

export type MouzaPublicationRequest = { mouza: string; jl?: string; layers: "rs" | "ms" | "combined"; satellite?: boolean };
export type MouzaPublicationResult = { filename: string; contentType: "application/pdf"; body: Buffer; meta: { mouza: string; width: number; height: number; zoom: number; resolution: number; crs: string; extent: GeoExtent; tileCount: number; plotCount: number; satellite: boolean } };
type Ring = number[][];
type Polygon = { rings: Ring[] };
type Row = { attributes: Record<string, unknown>; geometry?: Polygon };
type Tile = { bytes: Buffer; format: "PNG" | "JPEG"; x: number; y: number; z: number };

const W = 420, H = 297, M = 14, TOP = 26, BOTTOM = 25, DW = W - M * 2, DH = H - TOP - BOTTOM;
const TIMEOUT = 15_000;
const SAT_ZOOM = 20;
const TILE_SIZE = 256;
const TILE_BATCH = 32;
const MAX_NEIGHBORS = 24;
const WEB_MERCATOR_MAX_LAT = 85.0511287798066;

const txt = (a: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) { const v = String(a[k] ?? "").trim(); if (v) return v; }
  return "N/A";
};
const safe = (v: string) => v.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "mouza";
const isMs = (f: RajukPlotFeature) => { const a = f.attributes as Record<string, unknown>; return a._layer_source === "ms" || a.plot_kind === "ms" || Boolean(String(a.ms_plot_no ?? "").trim()); };

function extent(features: RajukPlotFeature[]): GeoExtent | null {
  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const f of features) for (const r of f.geometry?.rings ?? []) for (const p of r) {
    const x = Number(p[0]), y = Number(p[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) { xmin = Math.min(xmin, x); ymin = Math.min(ymin, y); xmax = Math.max(xmax, x); ymax = Math.max(ymax, y); }
  }
  return Number.isFinite(xmin) ? { xmin, ymin, xmax, ymax } : null;
}

function mercatorY(lat: number): number { const clamped = Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, lat)); const r = clamped * Math.PI / 180; return Math.log(Math.tan(Math.PI / 4 + r / 2)); }
function inverseMercatorY(y: number): number { return Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI)); }

function fit(e: GeoExtent): GeoExtent {
  const cx = (e.xmin + e.xmax) / 2;
  const xw = Math.max(e.xmax - e.xmin, 1e-12) * 1.08;
  const y1 = mercatorY(e.ymin), y2 = mercatorY(e.ymax), cy = (y1 + y2) / 2;
  const yw = Math.max(y2 - y1, 1e-12) * 1.08;
  const targetYw = xw / (DW / DH);
  const targetXw = yw * (DW / DH);
  const fw = xw / yw < DW / DH ? targetXw : xw;
  const fyw = xw / yw < DW / DH ? yw : targetYw;
  return { xmin: cx - fw / 2, xmax: cx + fw / 2, ymin: inverseMercatorY(cy - fyw / 2), ymax: inverseMercatorY(cy + fyw / 2) };
}

function project(lon: number, lat: number, e: GeoExtent): readonly [number, number] {
  const x = (lon - e.xmin) / Math.max(e.xmax - e.xmin, 1e-12);
  const yMin = mercatorY(e.ymin), yMax = mercatorY(e.ymax), y = (mercatorY(lat) - yMin) / Math.max(yMax - yMin, 1e-12);
  return [M + x * DW, TOP + (1 - y) * DH];
}

function ring(doc: jsPDF, r: Ring, e: GeoExtent): void {
  if (r.length < 3) return;
  const p = r.map(([x, y]) => project(Number(x), Number(y), e));
  const rel: Array<[number, number]> = [];
  for (let i = 1; i < p.length; i++) rel.push([p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]]);
  doc.lines(rel, p[0][0], p[0][1], [1, 1], "S", true);
}

function poly(doc: jsPDF, g: Polygon, e: GeoExtent, kind: "rs" | "ms" | "neighbor"): void {
  if (kind === "neighbor") { doc.setDrawColor(110, 120, 130); doc.setLineWidth(.14); doc.setLineDashPattern([1.2, 1], 0); for (const r of g.rings ?? []) ring(doc, r, e); doc.setLineDashPattern([], 0); return; }
  const c = kind === "rs" ? [255, 230, 0] : [0, 240, 255];
  doc.setDrawColor(18, 22, 28); doc.setLineWidth(.7); for (const r of g.rings ?? []) ring(doc, r, e);
  doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(.38); if (kind === "ms") doc.setLineDashPattern([1.6, .8], 0); for (const r of g.rings ?? []) ring(doc, r, e); if (kind === "ms") doc.setLineDashPattern([], 0);
}

function mouzaBoundary(doc: jsPDF, g: Polygon | null, e: GeoExtent): void {
  if (!g) return; doc.setDrawColor(30, 10, 22); doc.setLineWidth(1.5); for (const r of g.rings ?? []) ring(doc, r, e); doc.setDrawColor(230, 0, 120); doc.setLineWidth(1.05); for (const r of g.rings ?? []) ring(doc, r, e);
}

function ringExtent(rings: Ring[]): GeoExtent | null {
  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const r of rings) for (const p of r) { const x = Number(p[0]), y = Number(p[1]); if (Number.isFinite(x) && Number.isFinite(y)) { xmin = Math.min(xmin, x); ymin = Math.min(ymin, y); xmax = Math.max(xmax, x); ymax = Math.max(ymax, y); } }
  return Number.isFinite(xmin) ? { xmin, ymin, xmax, ymax } : null;
}

async function query<T>(layer: number, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const q = new URLSearchParams(); for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v)); q.set("f", "json");
  let r = await fetch(`${RAJUK_DB}/${layer}/query?${q}`, { signal: AbortSignal.timeout(TIMEOUT) });
  if (r.status === 401 || r.status === 403) { q.set("token", await getValidToken("https://masterplan.rajuk.gov.bd/server/rest/services")); r = await fetch(`${RAJUK_DB}/${layer}/query?${q}`, { signal: AbortSignal.timeout(TIMEOUT) }); }
  if (!r.ok) throw new Error(`RAJUK mouza query failed (${r.status})`); return await r.json() as T;
}

async function context(mouza: string, jl?: string) {
  const where = `UPPER(mauza) = UPPER('${mouza.replace(/'/g, "''")}')${jl ? ` AND jl_no='${jl.replace(/'/g, "''")}'` : ""}`;
  const fields = "mauza,jl_no,m_guid,t_guid,upazila_ps,m_district,upazila,thana,district";
  const current = await query<{ features?: Row[] }>(1, { where, outFields: fields, returnGeometry: true, resultRecordCount: 1 });
  const row = current.features?.[0]; const geometry = row?.geometry ?? null; const attributes = row?.attributes ?? {};
  if (!geometry) return { geometry: null, neighbors: [] as Row[], attributes };
  const e = ringExtent(geometry.rings ?? []); if (!e) return { geometry, neighbors: [] as Row[], attributes };
  const envelope = JSON.stringify({ xmin: e.xmin, ymin: e.ymin, xmax: e.xmax, ymax: e.ymax, spatialReference: { wkid: 4326 } });
  const data = await query<{ features?: Row[] }>(1, { geometry: envelope, geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: fields, returnGeometry: true, resultRecordCount: MAX_NEIGHBORS + 1 });
  const key = `${txt(attributes, ["mauza", "mauza_name"]).toLowerCase()}|${txt(attributes, ["jl_no", "jl"])}`;
  return { geometry, attributes, neighbors: (data.features ?? []).filter(x => `${txt(x.attributes, ["mauza", "mauza_name"]).toLowerCase()}|${txt(x.attributes, ["jl_no", "jl"])}` !== key).slice(0, MAX_NEIGHBORS) };
}

function lonLatToTile(lon: number, lat: number, z: number): readonly [number, number] { const n = 2 ** z; const x = ((lon + 180) / 360) * n; const c = Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, lat)) * Math.PI / 180; const y = (1 - Math.asinh(Math.tan(c)) / Math.PI) / 2 * n; return [x, y]; }
function tileLon(x: number, z: number): number { return x / (2 ** z) * 360 - 180; }
function tileLat(y: number, z: number): number { const n = Math.PI - 2 * Math.PI * y / (2 ** z); return 180 / Math.PI * Math.atan(Math.sinh(n)); }

async function fetchTile(x: number, y: number, z: number): Promise<Tile> {
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), headers: { accept: "image/png,image/jpeg,image/*" } });
  if (!r.ok) throw new Error(`Satellite tile ${z}/${y}/${x} failed (${r.status})`);
  const ct = (r.headers.get("content-type") ?? "").toLowerCase(); const format = ct.includes("png") ? "PNG" : "JPEG";
  return { bytes: Buffer.from(await r.arrayBuffer()), format, x, y, z };
}

async function drawMaximumResolutionSatellite(doc: jsPDF, e: GeoExtent): Promise<number> {
  const [fx0, fy0] = lonLatToTile(e.xmin, e.ymax, SAT_ZOOM); const [fx1, fy1] = lonLatToTile(e.xmax, e.ymin, SAT_ZOOM);
  const minX = Math.floor(Math.min(fx0, fx1)), maxX = Math.floor(Math.max(fx0, fx1)); const minY = Math.floor(Math.min(fy0, fy1)), maxY = Math.floor(Math.max(fy0, fy1));
  const tiles: Array<[number, number]> = []; for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) tiles.push([x, y]);
  doc.saveGraphicsState(); doc.rect(M, TOP, DW, DH); doc.clip();
  try {
    for (let i = 0; i < tiles.length; i += TILE_BATCH) {
      const batch = tiles.slice(i, i + TILE_BATCH); const fetched = await Promise.all(batch.map(([x, y]) => fetchTile(x, y, SAT_ZOOM)));
      for (const tile of fetched) {
        const west = tileLon(tile.x, tile.z), east = tileLon(tile.x + 1, tile.z), north = tileLat(tile.y, tile.z), south = tileLat(tile.y + 1, tile.z);
        const [x1, y1] = project(west, north, e); const [x2, y2] = project(east, south, e);
        const w = x2 - x1, h = y2 - y1; if (w <= 0 || h <= 0) continue;
        doc.addImage(tile.bytes, tile.format, x1, y1, w, h, undefined, "NONE");
      }
    }
  } finally { doc.restoreGraphicsState(); }
  return tiles.length;
}

function labelPoint(feature: RajukPlotFeature): readonly [number, number] | null {
  const ring = feature.geometry?.rings?.[0]; if (!ring || ring.length < 3) return null;
  let area2 = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[i + 1], cross = x1 * y2 - x2 * y1; area2 += cross; cx += (x1 + x2) * cross; cy += (y1 + y2) * cross; }
  if (Math.abs(area2) > 1e-15) { const p: [number, number] = [cx / (3 * area2), cy / (3 * area2)]; if (pointInRing(p, ring)) return p; }
  const avg: [number, number] = [ring.reduce((s, p) => s + Number(p[0]), 0) / ring.length, ring.reduce((s, p) => s + Number(p[1]), 0) / ring.length];
  return pointInRing(avg, ring) ? avg : [Number(ring[0][0]), Number(ring[0][1])];
}
function pointInRing(point: readonly [number, number], ring: Ring): boolean { let inside = false; const [px, py] = point; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / ((yj - yi) || Number.EPSILON) + xi) inside = !inside; } return inside; }

function drawEveryPlotLabel(doc: jsPDF, feature: RajukPlotFeature, e: GeoExtent): void {
  const p = labelPoint(feature); if (!p) return; const a = feature.attributes as Record<string, unknown>;
  const raw = txt(a, isMs(feature) ? ["ms_plot_no", "plot_no", "dag_no", "objectid"] : ["plot_no", "rs_plot_no", "dag_no", "objectid"]);
  const label = isMs(feature) ? `MS ${raw}` : raw;
  const [x, y] = project(p[0], p[1], e); doc.setFont("helvetica", "bold"); doc.setFontSize(5.2);
  doc.setTextColor(255, 255, 255); doc.setDrawColor(0, 0, 0); doc.setLineWidth(1.5); doc.text(label, x, y, { align: "center", baseline: "middle", renderingMode: "fillThenStroke" });
  doc.setTextColor(15, 15, 15); doc.setLineWidth(.18); doc.text(label, x, y, { align: "center", baseline: "middle" });
}
function drawEveryPlotLabelLayer(doc: jsPDF, features: RajukPlotFeature[], e: GeoExtent): void { doc.setCharSpace(0); for (const feature of features) drawEveryPlotLabel(doc, feature, e); }

function neighborLabels(doc: jsPDF, rows: Row[], e: GeoExtent): void {
  doc.setFont("helvetica", "bold"); doc.setFontSize(5.5); for (const n of rows) { if (!n.geometry) continue; const b = ringExtent(n.geometry.rings ?? []); if (!b) continue; const name = txt(n.attributes, ["mauza", "mauza_name"]); if (name === "N/A") continue; const [x, y] = project((b.xmin + b.xmax) / 2, (b.ymin + b.ymax) / 2, e); doc.setTextColor(255, 255, 255); doc.setDrawColor(0, 0, 0); doc.setLineWidth(1.5); doc.text(name, x, y, { align: "center", baseline: "middle", renderingMode: "fillThenStroke" }); doc.setTextColor(75, 80, 85); doc.setLineWidth(.15); doc.text(name, x, y, { align: "center", baseline: "middle" }); }
}

function metersPerDegreeLon(latitude: number): number { const phi = latitude * Math.PI / 180; return 111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi); }
function scale(e: GeoExtent): string { const lat = (e.ymin + e.ymax) / 2; const ground = Math.max(1, (e.xmax - e.xmin) * metersPerDegreeLon(lat)); const den = Math.round((ground / (DW / 1000)) / 100) * 100; return `1:${Math.max(100, den).toLocaleString("en-US")}`; }

export async function exportMouzaPublicationPdf(input: MouzaPublicationRequest): Promise<MouzaPublicationResult> {
  const mouza = input.mouza.trim(); if (!mouza) throw new Error("Mouza is required");
  const all: RajukPlotFeature[] = [];
  for (let offset = 0;; offset += 2000) { const page = await getPlots({ mouza, jl: input.jl, kind: "all", resultRecordCount: 2000, resultOffset: offset }); const rows = page.features ?? []; all.push(...rows); if (rows.length < 2000) break; }
  const features = all.filter(f => input.layers === "combined" ? true : input.layers === "ms" ? isMs(f) : !isMs(f)); if (!features.length) throw new Error(`No plots found for ${mouza}`);
  const raw = extent(features); if (!raw) throw new Error("No valid plot geometry found"); const e = fit(raw);
  const ctx = await context(mouza, input.jl).catch(error => { console.warn("[LandBD][mouza-pdf] context metadata unavailable", { mouza, error }); return { geometry: null, neighbors: [] as Row[], attributes: {} as Record<string, unknown> }; });
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [W, H], compress: false, putOnlyUsedFonts: true });
  doc.setProperties({ title: `LandBD — ${mouza} Mouza Map`, subject: "Maximum-fidelity RS/MS cadastral publication map", creator: "LandBD" });
  doc.setFillColor(248, 249, 250); doc.rect(M, TOP, DW, DH, "F");
  let sat = false, tileCount = 0;
  if (input.satellite) { tileCount = await drawMaximumResolutionSatellite(doc, e); sat = true; }
  drawCoordinateGrid(doc, e, project);
  for (const n of ctx.neighbors) if (n.geometry) poly(doc, n.geometry, e, "neighbor");
  neighborLabels(doc, ctx.neighbors, e);
  for (const f of features) poly(doc, f.geometry, e, isMs(f) ? "ms" : "rs");
  drawEveryPlotLabelLayer(doc, features, e);
  mouzaBoundary(doc, ctx.geometry, e);
  const sample = (features[0]?.attributes ?? {}) as Record<string, unknown>;
  const jl = input.jl?.trim() || txt(ctx.attributes, ["jl_no", "jl"]) !== "N/A" ? (input.jl?.trim() || txt(ctx.attributes, ["jl_no", "jl"])) : txt(sample, ["jl_no", "rs_jl_no", "ms_jl_no", "jl"]);
  const upazila = txt(ctx.attributes, ["upazila_ps", "upazila", "thana", "thana_upazila"]) !== "N/A" ? txt(ctx.attributes, ["upazila_ps", "upazila", "thana", "thana_upazila"]) : txt(sample, ["upazila_ps", "upazila", "thana", "thana_upazila"]);
  const district = txt(ctx.attributes, ["m_district", "district", "district_name"]) !== "N/A" ? txt(ctx.attributes, ["m_district", "district", "district_name"]) : txt(sample, ["m_district", "district", "district_name"]);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20, 30, 40); doc.text(`LandBD — ${mouza}`, M, 9);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text(`JL: ${jl || "N/A"}    District: ${district || "N/A"}    Upazila: ${upazila || "N/A"}    Plots: ${features.length}`, M, 14); doc.setFontSize(6); doc.text(`Layers: ${input.layers.toUpperCase()}    CRS: EPSG:4326    Output: ${sat ? "Satellite + Vector" : "Vector"}`, M, 19);
  drawScaleText(doc, e, 8); drawNorthArrow(doc, W - 24, M + 8); drawScaleBar(doc, e, M, H - 5);
  drawPublicationFooter(doc, { mouza, jl: jl || "N/A", upazila: upazila || "N/A", district: district || "N/A", plots: features.length, layers: input.layers.toUpperCase(), satellite: sat, scale: scale(e) });
  const body = Buffer.from(doc.output("arraybuffer"));
  return { filename: `landbd-${safe(mouza)}-${input.layers}${sat ? "-satellite" : ""}-publication.pdf`, contentType: "application/pdf", body, meta: { mouza, width: W, height: H, zoom: SAT_ZOOM, resolution: sat ? SAT_ZOOM : 0, crs: "EPSG:4326 source / EPSG:3857 display", extent: e, tileCount, plotCount: features.length, satellite: sat } };
}
