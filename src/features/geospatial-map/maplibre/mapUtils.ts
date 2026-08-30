import type { FeatureCollection, Geometry, Polygon } from "geojson";
import type { GeoJSONSource, Map as MapLibreInstance } from "maplibre-gl";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { GIS_REQUEST_TIMEOUT_MS } from "./types";

export function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return String(value);
}

export function isMsFeature(feature: RajukPlotFeature): boolean {
  const a = feature.attributes as Record<string, unknown>;
  return a._layer_source === "ms" || a.plot_kind === "ms" || present(a.ms_plot_no);
}

export function isRsFeature(feature: RajukPlotFeature): boolean {
  const a = feature.attributes as Record<string, unknown>;
  return a._layer_source === "rs" || a.plot_kind === "rs" || (present(a.rs_plot_no) && !present(a.ms_plot_no));
}

export function rsNumber(feature: RajukPlotFeature): string {
  const a = feature.attributes as Record<string, unknown>;
  if (present(a.rs_plot_no)) return String(a.rs_plot_no);
  if (isRsFeature(feature) && present(a.plot_no)) return `RS-${a.plot_no}`;
  return "—";
}

export function msNumber(feature: RajukPlotFeature): string {
  const a = feature.attributes as Record<string, unknown>;
  if (present(a.ms_plot_no)) return String(a.ms_plot_no);
  if (isMsFeature(feature) && present(a.plot_no)) return `MS-${a.plot_no}`;
  return "—";
}

export function detailRows(feature: RajukPlotFeature, kind: "rs" | "ms") {
  const a = feature.attributes as Record<string, unknown>;
  if (kind === "ms") {
    return [
      ["এমএস দাগ নম্বর", msNumber(feature)],
      ["দাগ নং", formatValue(a.plot_no)],
      ["জেএল নং", formatValue(a.jl_no ?? a.rs_jl_no)],
      ["আয়তন (কাঠা)", formatValue(a.ms_plot_area ?? a.area_katha)],
      ["মৌজা", formatValue(a.mauza ?? a.rs_mauza_name)],
      ["থানা/উপজেলা", formatValue(a.thana_upazila ?? a.upazila_ps)],
      ["জেলা", formatValue(a.m_district ?? a.district)],
      ["ঠিকানা", formatValue(a.address_search)],
    ] as const;
  }
  return [
    ["আরএস দাগ নম্বর", rsNumber(feature)],
    ["দাগ নং", formatValue(a.plot_no)],
    ["জেএল নং", formatValue(a.rs_jl_no ?? a.jl_no)],
    ["আয়তন (কাঠা)", formatValue(a.rs_plot_area ?? a.area_katha)],
    ["মৌজা", formatValue(a.rs_mauza_name ?? a.mauza)],
    ["থানা/উপজেলা", formatValue(a.thana_upazila ?? a.upazila_ps)],
    ["জেলা", formatValue(a.m_district ?? a.district)],
    ["ঠিকানা", formatValue(a.address_search)],
  ] as const;
}

export function toGeoJson(feature: RajukPlotFeature) {
  const rings = feature.geometry?.rings;
  if (!Array.isArray(rings) || rings.length === 0) return null;
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: rings },
    properties: feature.attributes ?? {},
  };
}

export function featuresToFc(features: RajukPlotFeature[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: features.map(toGeoJson).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature)),
  };
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GIS_REQUEST_TIMEOUT_MS);
  const abortFromExternal = () => controller.abort();
  externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}

export function createAccuracyPolygon(latitude: number, longitude: number, radiusMeters: number): FeatureCollection<Polygon> {
  const points: number[][] = [];
  const earthRadius = 6378137;
  const radius = Math.max(1, radiusMeters);
  const latRadius = (radius / earthRadius) * (180 / Math.PI);
  const cosLatitude = Math.cos((latitude * Math.PI) / 180);
  const lonRadius = latRadius / Math.max(Math.abs(cosLatitude), Number.EPSILON);
  for (let i = 0; i <= 48; i += 1) {
    const angle = (i / 48) * Math.PI * 2;
    points.push([longitude + Math.cos(angle) * lonRadius, latitude + Math.sin(angle) * latRadius]);
  }
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [points] }, properties: {} }] };
}

export function updateSourceData(map: MapLibreInstance, sourceId: string, data: FeatureCollection<Geometry>): boolean {
  if (!map.isStyleLoaded()) return false;
  const source = map.getSource(sourceId);
  if (!source || source.type !== "geojson") return false;
  (source as GeoJSONSource).setData(data);
  return true;
}
