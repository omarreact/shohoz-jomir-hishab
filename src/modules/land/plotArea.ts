import type { MeasurementResult } from "./geometry";
import { BANGLADESH_STANDARD, getLandMeasurementStandard, type LandMeasurementStandard } from "./standards";

/** 1 m² ≈ 10.7639104167 ft² (international foot) */
const SQM_TO_SQFT = 10.76391041671;

/** WGS84 authalic mean radius (m) — matches common GIS geodesic area */
const EARTH_RADIUS_M = 6_371_008.8;

export type AreaConversionOptions = {
  standard?: LandMeasurementStandard["id"] | LandMeasurementStandard;
};

function resolveStandard(options?: AreaConversionOptions): LandMeasurementStandard {
  if (typeof options?.standard === "object") return options.standard;
  return getLandMeasurementStandard(options?.standard ?? BANGLADESH_STANDARD.id);
}

/**
 * Convert square metres into Bangladesh land units.
 *
 * The standard is explicit so a caller can deliberately select a local/deed
 * profile instead of silently assuming that every katha/bigha convention is
 * identical.
 */
export function areaFromSquareMeters(
  sqm: number,
  options?: AreaConversionOptions,
): MeasurementResult {
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

  const standard = resolveStandard(options);
  const sqFt = sqm * SQM_TO_SQFT;
  const katha = sqFt / standard.squareFeetPerKatha;

  return {
    isValid: true,
    sqFt,
    shotok: sqFt / standard.squareFeetPerDecimal,
    katha,
    bigha: katha / standard.kathasPerBigha,
    acre: sqFt / (standard.squareFeetPerDecimal * standard.decimalsPerAcre),
    ojutangsho: sqFt / (standard.squareFeetPerDecimal / 100),
  };
}

/** Convert square feet to the same explicit land-measurement profile. */
export function areaFromSquareFeet(
  sqFt: number,
  options?: AreaConversionOptions,
): MeasurementResult {
  if (!Number.isFinite(sqFt) || sqFt <= 0) {
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

  return areaFromSquareMeters(sqFt / SQM_TO_SQFT, options);
}

/** Reverse conversion helpers using the same explicit standard. */
export function squareFeetFromKatha(
  katha: number,
  options?: AreaConversionOptions,
): number {
  const standard = resolveStandard(options);
  return Number.isFinite(katha) ? katha * standard.squareFeetPerKatha : NaN;
}

export function squareFeetFromBigha(
  bigha: number,
  options?: AreaConversionOptions,
): number {
  const standard = resolveStandard(options);
  return Number.isFinite(bigha)
    ? bigha * standard.kathasPerBigha * standard.squareFeetPerKatha
    : NaN;
}

export function squareFeetFromShotok(
  shotok: number,
  options?: AreaConversionOptions,
): number {
  const standard = resolveStandard(options);
  return Number.isFinite(shotok) ? shotok * standard.squareFeetPerDecimal : NaN;
}

export function squareFeetFromAcre(
  acre: number,
  options?: AreaConversionOptions,
): number {
  const standard = resolveStandard(options);
  return Number.isFinite(acre)
    ? acre * standard.decimalsPerAcre * standard.squareFeetPerDecimal
    : NaN;
}

/**
 * Signed geodesic area of a polygon ring in m².
 * Coordinates are [lng, lat] in WGS84.
 *
 * The sign is intentionally preserved: ArcGIS polygon rings use winding
 * direction to distinguish exterior rings from holes. Keeping that sign
 * allows multipart polygons and holes to be combined without assuming that
 * every ring after the first one is a hole.
 */
function signedRingAreaSquareMeters(ring: number[][]): number {
  if (!Array.isArray(ring) || ring.length < 3) return 0;

  const toRad = Math.PI / 180;
  let total = 0;

  // Treat the ring as closed even when the final coordinate is omitted.
  for (let i = 0; i < ring.length; i++) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    if (!Array.isArray(current) || !Array.isArray(next)) continue;

    const lon1 = Number(current[0]);
    const lat1 = Number(current[1]);
    const lon2 = Number(next[0]);
    const lat2 = Number(next[1]);
    if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) continue;

    total +=
      (lon2 - lon1) *
      toRad *
      (2 + Math.sin(lat1 * toRad) + Math.sin(lat2 * toRad));
  }

  return (total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

export function ringAreaSquareMeters(ring: number[][]): number {
  return Math.abs(signedRingAreaSquareMeters(ring));
}

export function areaFromGisRings(rings: number[][][] | undefined | null): number {
  if (!Array.isArray(rings) || rings.length === 0) return 0;

  let signedArea = 0;
  for (const ring of rings) {
    signedArea += signedRingAreaSquareMeters(ring);
  }

  const area = Math.abs(signedArea);
  return Number.isFinite(area) && area > 0 ? area : 0;
}

export type GisAreaSource = "geometry" | "shape_area" | "none";

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
  standard?: AreaConversionOptions["standard"];
}): MeasurementResult & { source: GisAreaSource; area_sq_m: number } {
  const { sqm, source } = resolveGisAreaSqm(input);
  const result = areaFromSquareMeters(sqm, { standard: input.standard });
  return { ...result, source, area_sq_m: sqm };
}

/** Attributes-only path (Shape__Area). Prefer areaFromGisFeature when rings exist. */
export function areaFromPlotAttributes(
  attributes: Record<string, unknown>,
  options?: AreaConversionOptions,
): MeasurementResult {
  return areaFromGisFeature({ attributes, standard: options?.standard });
}

export function formatAreaValue(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}
