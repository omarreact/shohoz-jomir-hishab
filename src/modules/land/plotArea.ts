import type { MeasurementResult } from "./geometry";

/** 1 m² ≈ 10.7639104167 ft² (international foot) */
const SQM_TO_SQFT = 10.76391041671;

/** Dhaka / RAJUK urban standard: 1 কাঠা = 720 sq ft */
const SQFT_PER_KATHA = 720;

/** WGS84 authalic mean radius (m) — matches common GIS geodesic area */
const EARTH_RADIUS_M = 6_371_008.8;

/**
 * Convert square metres into BD land units (কাঠা / শতক / বিঘা / একর).
 */
export function areaFromSquareMeters(sqm: number): MeasurementResult {
  if (!Number.isFinite(sqm) || sqm <= 0) {
    return {
      isValid: false,
      errorMsg: "ক্ষেত্রফল পাওয়া যায়নি।",
      sqFt: 0,
      shotok: 0,
      katha: 0,
      bigha: 0,
      acre: 0,
      ojutangsho: 0,
    };
  }

  const sqFt = sqm * SQM_TO_SQFT;
  return {
    isValid: true,
    sqFt,
    shotok: sqFt / 435.6,
    katha: sqFt / SQFT_PER_KATHA,
    bigha: sqFt / 14400,
    acre: sqFt / 43560,
    ojutangsho: sqFt / 4.356,
  };
}

/**
 * Geodesic (spherical) area of a polygon ring in m².
 * Coordinates are [lng, lat] in WGS84 — the GIS বহুভুজ itself.
 */
export function ringAreaSquareMeters(ring: number[][]): number {
  if (!Array.isArray(ring) || ring.length < 3) return 0;

  let total = 0;
  const toRad = Math.PI / 180;
  const n = ring.length;

  for (let i = 0; i < n - 1; i++) {
    const lon1 = Number(ring[i][0]);
    const lat1 = Number(ring[i][1]);
    const lon2 = Number(ring[i + 1][0]);
    const lat2 = Number(ring[i + 1][1]);
    if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) continue;
    total +=
      (lon2 - lon1) *
      toRad *
      (2 + Math.sin(lat1 * toRad) + Math.sin(lat2 * toRad));
  }

  // Close ring if first ≠ last
  const a = ring[0];
  const b = ring[n - 1];
  if (a && b && (a[0] !== b[0] || a[1] !== b[1])) {
    const lon1 = Number(b[0]);
    const lat1 = Number(b[1]);
    const lon2 = Number(a[0]);
    const lat2 = Number(a[1]);
    if ([lon1, lat1, lon2, lat2].every(Number.isFinite)) {
      total +=
        (lon2 - lon1) *
        toRad *
        (2 + Math.sin(lat1 * toRad) + Math.sin(lat2 * toRad));
    }
  }

  return (Math.abs(total) * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

/**
 * Area of ArcGIS-style geometry `{ rings: number[][][] }` in m².
 * First ring = exterior; subsequent rings treated as holes (subtracted).
 */
export function areaFromGisRings(rings: number[][][] | undefined | null): number {
  if (!Array.isArray(rings) || rings.length === 0) return 0;
  let area = 0;
  for (let i = 0; i < rings.length; i++) {
    const part = ringAreaSquareMeters(rings[i]);
    if (i === 0) area += part;
    else area -= part;
  }
  return area > 0 ? area : 0;
}

export type GisAreaSource = "geometry" | "shape_area" | "none";

/**
 * Prefer the actual GIS polygon (rings) when present — closest to বহুভুজ ক্ষেত্রফল.
 * Fall back to Shape__Area (m²) from the FeatureServer attribute.
 */
export function resolveGisAreaSqm(input: {
  rings?: number[][][] | null;
  attributes?: Record<string, unknown> | null;
}): { sqm: number; source: GisAreaSource } {
  const fromRings = areaFromGisRings(input.rings);
  if (fromRings > 0) {
    return { sqm: fromRings, source: "geometry" };
  }

  const attrs = input.attributes ?? {};
  const shapeArea = Number(attrs.Shape__Area ?? attrs.shape__area ?? attrs.area_sq_m);
  if (Number.isFinite(shapeArea) && shapeArea > 0) {
    return { sqm: shapeArea, source: "shape_area" };
  }

  return { sqm: 0, source: "none" };
}

/** Build MeasurementResult from GIS geometry and/or Shape__Area. */
export function areaFromGisFeature(input: {
  rings?: number[][][] | null;
  attributes?: Record<string, unknown> | null;
}): MeasurementResult & { source: GisAreaSource; area_sq_m: number } {
  const { sqm, source } = resolveGisAreaSqm(input);
  const result = areaFromSquareMeters(sqm);
  return { ...result, source, area_sq_m: sqm };
}

/** Attributes-only path (Shape__Area). Prefer areaFromGisFeature when rings exist. */
export function areaFromPlotAttributes(attributes: Record<string, unknown>): MeasurementResult {
  return areaFromGisFeature({ attributes });
}

export function formatAreaValue(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}
