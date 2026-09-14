const SQ_FT_PER_ACRE = 43_560;
const SQ_M_PER_ACRE = 4_046.8564224;
const SQ_FT_PER_KATHA = 720;
const SQ_FT_PER_BIGHA = 14_400;
const DECIMALS_PER_ACRE = 100;

export type JsonAreaUnit = "acre" | "square-feet" | "square-meters" | "decimal" | "katha" | "bigha";

export type JsonAreaResult = {
  acre: number;
  sourceField: string;
  sourceUnit: JsonAreaUnit;
  sourceValue: number;
};

const BN_TO_EN: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => BN_TO_EN[digit] ?? digit);
}

function positiveNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const normalized = toAsciiDigits(value).replace(/,/g, "").trim();
  if (!normalized) return null;
  const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toAcre(value: number, unit: JsonAreaUnit): number {
  switch (unit) {
    case "acre": return value;
    case "square-feet": return value / SQ_FT_PER_ACRE;
    case "square-meters": return value / SQ_M_PER_ACRE;
    case "decimal": return value / DECIMALS_PER_ACRE;
    case "katha": return (value * SQ_FT_PER_KATHA) / SQ_FT_PER_ACRE;
    case "bigha": return (value * SQ_FT_PER_BIGHA) / SQ_FT_PER_ACRE;
  }
}

function readField(
  attributes: Record<string, unknown>,
  keys: readonly string[],
  unit: JsonAreaUnit,
): JsonAreaResult | null {
  for (const key of keys) {
    if (!(key in attributes)) continue;
    const value = positiveNumber(attributes[key]);
    if (value == null) continue;
    const acre = toAcre(value, unit);
    if (!Number.isFinite(acre) || acre <= 0) continue;
    return { acre, sourceField: key, sourceUnit: unit, sourceValue: value };
  }
  return null;
}

function normalizeUnit(value: unknown): JsonAreaUnit | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (["acre", "acres", "ac", "একর"].includes(raw)) return "acre";
  if (["sqft", "sq ft", "square feet", "square-feet", "ft2", "ft²"].includes(raw)) return "square-feet";
  if (["sqm", "sq m", "square meter", "square meters", "square-meters", "m2", "m²"].includes(raw)) return "square-meters";
  if (["decimal", "decimals", "shotok", "shotangsho", "শতক", "শতাংশ"].includes(raw)) return "decimal";
  if (["katha", "কাঠা"].includes(raw)) return "katha";
  if (["bigha", "বিঘা"].includes(raw)) return "bigha";
  return null;
}

/**
 * Read a plot area exclusively from scalar JSON attributes and return Acre.
 *
 * Rules:
 * - Never inspect geometry, polygon rings, coordinates or Shape__Length.
 * - Prefer an explicit Acre field.
 * - Convert only fields whose unit is explicit in the field contract/name.
 * - Shape__Area is accepted only when the same JSON object explicitly carries
 *   a supported shape-area unit. A bare Shape__Area is deliberately ignored.
 * - Unknown/ambiguous fields fail closed and return null.
 */
export function acreFromJsonAttributes(attributes: Record<string, unknown> | null | undefined): JsonAreaResult | null {
  const attrs = attributes ?? {};

  return (
    readField(attrs, ["area_acre", "area_acres", "acre", "acres", "plot_area_acre", "total_area_acre", "rs_area_acre", "ms_area_acre"], "acre")
    ?? readField(attrs, ["area_sq_ft", "area_sqft", "area_square_feet", "square_feet", "plot_area_sq_ft"], "square-feet")
    ?? readField(attrs, ["area_sq_m", "area_sqm", "area_square_meters", "square_meters", "plot_area_sq_m"], "square-meters")
    ?? readField(attrs, ["area_decimal", "area_decimals", "area_shotok", "area_shotangsho", "decimal_area"], "decimal")
    // Existing RAJUK JSON uses these attributes as katha-valued plot-area fields.
    ?? readField(attrs, ["rs_plot_area", "ms_plot_area", "area_katha", "plot_area_katha"], "katha")
    ?? readField(attrs, ["area_bigha", "plot_area_bigha"], "bigha")
    ?? readGenericArea(attrs)
    ?? readShapeAreaWithExplicitUnit(attrs)
  );
}

function readGenericArea(attributes: Record<string, unknown>): JsonAreaResult | null {
  const unit = normalizeUnit(attributes.area_unit ?? attributes.areaUnit ?? attributes.unit);
  if (!unit) return null;
  for (const key of ["area", "plot_area", "total_area"] as const) {
    const value = positiveNumber(attributes[key]);
    if (value == null) continue;
    const acre = toAcre(value, unit);
    if (Number.isFinite(acre) && acre > 0) {
      return { acre, sourceField: key, sourceUnit: unit, sourceValue: value };
    }
  }
  return null;
}

function readShapeAreaWithExplicitUnit(attributes: Record<string, unknown>): JsonAreaResult | null {
  const unit = normalizeUnit(
    attributes.shape_area_unit
      ?? attributes.shapeAreaUnit
      ?? attributes.Shape__Area_Unit
      ?? attributes.shape__area_unit,
  );
  if (!unit) return null;
  const value = positiveNumber(attributes.Shape__Area ?? attributes.shape__area);
  if (value == null) return null;
  const acre = toAcre(value, unit);
  return Number.isFinite(acre) && acre > 0
    ? { acre, sourceField: "Shape__Area", sourceUnit: unit, sourceValue: value }
    : null;
}

/** Parse a DLRMS area string and normalize it to Acre for display. */
export function acreFromDlrmsValue(value: unknown, bareNumberUnit: JsonAreaUnit = "acre"): number | null {
  const numeric = positiveNumber(value);
  if (numeric == null) return null;
  const text = toAsciiDigits(String(value ?? "")).trim().toLowerCase();
  let unit: JsonAreaUnit | null = null;
  if (/একর|\bacres?\b/.test(text)) unit = "acre";
  else if (/শতাংশ|শতক|\bdecimal(?:s)?\b|\bshotok\b|\bshotangsho\b/.test(text)) unit = "decimal";
  else if (/কাঠা|\bkatha\b/.test(text)) unit = "katha";
  else if (/বিঘা|\bbigha\b/.test(text)) unit = "bigha";
  else if (/\bsq\.?\s*ft\b|square\s*feet|ft²|ft2/.test(text)) unit = "square-feet";
  else if (/\bsq\.?\s*m\b|square\s*meters?|m²|m2/.test(text)) unit = "square-meters";
  else unit = bareNumberUnit;

  const acre = toAcre(numeric, unit);
  return Number.isFinite(acre) && acre > 0 ? acre : null;
}

export function formatAcre(value: number | null | undefined, maximumFractionDigits = 6): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  return `${value.toLocaleString("bn-BD", { maximumFractionDigits, minimumFractionDigits: 0 })} একর`;
}
