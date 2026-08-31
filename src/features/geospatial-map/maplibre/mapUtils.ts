import type { FeatureCollection, Geometry } from "geojson";
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

/** Canonical MapLibre/GeoJSON coordinate contract: [longitude, latitude]. */
export function isValidLngLat(coordinate: unknown): coordinate is [number, number] {
  if (!Array.isArray(coordinate) || coordinate.length < 2) return false;
  const longitude = Number(coordinate[0]);
  const latitude = Number(coordinate[1]);
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
}

export function sanitizeRajukFeature(feature: RajukPlotFeature): RajukPlotFeature | null {
  const rings = feature.geometry?.rings;
  if (!Array.isArray(rings) || rings.length === 0) return null;

  const sanitizedRings: number[][][] = [];
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4) return null;
    const sanitizedRing: number[][] = [];
    for (const coordinate of ring) {
      if (!isValidLngLat(coordinate)) return null;
      sanitizedRing.push([coordinate[0], coordinate[1]]);
    }
    sanitizedRings.push(sanitizedRing);
  }

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      rings: sanitizedRings,
    },
  };
}

export function sanitizeRajukFeatures(features: RajukPlotFeature[]): RajukPlotFeature[] {
  return features.map(sanitizeRajukFeature).filter((feature): feature is RajukPlotFeature => feature !== null);
}

export function toGeoJson(feature: RajukPlotFeature) {
  const safeFeature = sanitizeRajukFeature(feature);
  if (!safeFeature) return null;
  const rings = safeFeature.geometry.rings;
  const a = (safeFeature.attributes ?? {}) as Record<string, unknown>;
  const plot = a.plot_no ?? a.PLOT_NO ?? a.dag_no ?? "";
  const label = isMsFeature(safeFeature)
    ? String(a.ms_plot_no ?? a.MS_PLOT_NO ?? (plot !== "" ? `MS-${plot}` : "MS"))
    : String(a.rs_plot_no ?? a.RS_PLOT_NO ?? (plot !== "" ? `RS-${plot}` : "RS"));
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: rings },
    properties: { ...a, label },
  };
}

export function featuresToFc(features: RajukPlotFeature[]): FeatureCollection<Geometry> {
  return {
    type: "FeatureCollection",
    features: features.map(toGeoJson).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature)),
  };
}

/** Recursively validate every GeoJSON position before handing data to MapLibre. */
function isValidCoordinateArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (typeof value[0] === "number") return isValidLngLat(value);
  return value.every(isValidCoordinateArray);
}

export function isSafeGeoJson(data: FeatureCollection<Geometry>): boolean {
  for (const feature of data.features) {
    if (!feature || feature.type !== "Feature") return false;
    if (feature.geometry === null) continue;
    if (feature.geometry.type === "GeometryCollection") {
      if (!feature.geometry.geometries.every((geometry) => geometry.type === "GeometryCollection" || isValidCoordinateArray(geometry.coordinates))) return false;
      continue;
    }
    if (!isValidCoordinateArray(feature.geometry.coordinates)) return false;
  }
  return true;
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GIS_REQUEST_TIMEOUT_MS);
  const parentSignal = externalSignal ?? init.signal;
  const abortFromExternal = () => controller.abort();
  parentSignal?.addEventListener("abort", abortFromExternal, { once: true });
  try {
    const { signal: _ignoredSignal, ...requestInit } = init;
    return await fetch(input, { ...requestInit, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortFromExternal);
  }
}

export function createAccuracyPolygon(latitude: number, longitude: number, radiusMeters: number): FeatureCollection<Geometry> {
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
  if (!isSafeGeoJson(data)) {
    console.error(`Rejected unsafe GeoJSON for MapLibre source (${sourceId})`);
    return false;
  }
  const source = map.getSource(sourceId);
  if (!source || source.type !== "geojson") return false;
  try {
    (source as GeoJSONSource).setData(data);
    return true;
  } catch (error) {
    console.error(`MapLibre GeoJSON source update failed (${sourceId}):`, error);
    return false;
  }
}
