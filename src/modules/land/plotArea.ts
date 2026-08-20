import type { MeasurementResult } from "./geometry";

/** 1 m² ≈ 10.7639104167 ft² */
const SQM_TO_SQFT = 10.76391041671;

/**
 * Convert ArcGIS Shape__Area (typically m² on RAJUK FeatureServer) into
 * the same BD land units used by the land-measurement module.
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
    katha: sqFt / 720,
    bigha: sqFt / 14400,
    acre: sqFt / 43560,
    ojutangsho: sqFt / 4.356,
  };
}

/** Prefer explicit area fields, else Shape__Area (m²). */
export function areaFromPlotAttributes(attributes: Record<string, unknown>): MeasurementResult {
  const explicitKatha = Number(attributes.rs_plot_area ?? attributes.plot_area_katha ?? attributes.area_katha);
  if (Number.isFinite(explicitKatha) && explicitKatha > 0) {
    const sqFt = explicitKatha * 720;
    return {
      isValid: true,
      sqFt,
      shotok: sqFt / 435.6,
      katha: explicitKatha,
      bigha: sqFt / 14400,
      acre: sqFt / 43560,
      ojutangsho: sqFt / 4.356,
    };
  }

  const shapeArea = Number(attributes.Shape__Area ?? attributes.shape__area);
  return areaFromSquareMeters(shapeArea);
}

export function formatAreaValue(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}
