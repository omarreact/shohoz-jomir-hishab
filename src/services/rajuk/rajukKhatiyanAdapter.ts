import type { KhatiyanPlot } from "@/src/shared/types";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export type RajukShapeAreaUnit = "square-feet" | "square-meters";
export type RajukKhatiyanMeasurementProfile = "khatiyan-record";

/** Values published by the Ministry's Khatiyan reference table. */
const KHATIYAN_SQ_FT_PER_DECIMAL = 432;
const SQ_FT_PER_SQ_M = 10.763910416709722;

export class RajukParcelDomainError extends Error {
  readonly code: "INVALID_FEATURE" | "INVALID_AREA" | "INVALID_GEOMETRY" | "UNSUPPORTED_PROFILE";
  constructor(code: RajukParcelDomainError["code"], message: string) {
    super(message);
    this.name = "RajukParcelDomainError";
    this.code = code;
  }
}

export interface RajukKhatiyanAdapterOptions {
  measurementProfile: RajukKhatiyanMeasurementProfile;
  shapeAreaUnit: RajukShapeAreaUnit;
  /** Optional record labels; the adapter never fabricates legal record values. */
  record?: Partial<Pick<KhatiyanPlot, "cs" | "rs" | "city" | "bds" | "t">>;
}

export interface CalculationSafeRajukPlot {
  plot: KhatiyanPlot;
  source: {
    objectId: number;
    plotNo: number | null;
    pGuid: string | null;
    plotKind: RajukPlotFeature["attributes"]["plot_kind"];
    shapeArea: number;
    shapeAreaUnit: RajukShapeAreaUnit;
    measurementProfile: RajukKhatiyanMeasurementProfile;
  };
}

function assertFinitePositive(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RajukParcelDomainError("INVALID_AREA", `${label} must be a positive finite number`);
  }
}

function validateCoordinates(feature: RajukPlotFeature): void {
  const rings = feature.geometry?.rings;
  if (!Array.isArray(rings) || rings.length === 0) {
    throw new RajukParcelDomainError("INVALID_GEOMETRY", "RAJUK parcel geometry must contain at least one ring");
  }
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4) {
      throw new RajukParcelDomainError("INVALID_GEOMETRY", "RAJUK parcel ring is invalid");
    }
    for (const coordinate of ring) {
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        throw new RajukParcelDomainError("INVALID_GEOMETRY", "RAJUK parcel coordinate is invalid");
      }
      const [x, y] = coordinate;
      if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
        throw new RajukParcelDomainError("INVALID_GEOMETRY", "RAJUK parcel contains non-finite coordinates");
      }
      // RajukPlotFeature is normalized to WGS84 by the server boundary.
      if (x < -180 || x > 180 || y < -90 || y > 90) {
        throw new RajukParcelDomainError("INVALID_GEOMETRY", "RAJUK parcel coordinate is outside WGS84 bounds");
      }
    }
  }
}

function areaToDecimal(area: number, unit: RajukShapeAreaUnit): number {
  const squareFeet = unit === "square-feet" ? area : area * SQ_FT_PER_SQ_M;
  return squareFeet / KHATIYAN_SQ_FT_PER_DECIMAL;
}

export function toCalculationSafeKhatiyanPlot(
  feature: RajukPlotFeature,
  options: RajukKhatiyanAdapterOptions,
): CalculationSafeRajukPlot {
  if (!feature || !feature.attributes || !feature.geometry) {
    throw new RajukParcelDomainError("INVALID_FEATURE", "RAJUK parcel feature is incomplete");
  }
  if (options.measurementProfile !== "khatiyan-record") {
    throw new RajukParcelDomainError("UNSUPPORTED_PROFILE", "Unsupported Khatiyan measurement profile");
  }
  const attrs = feature.attributes;
  if (!Number.isInteger(attrs.objectid) || attrs.objectid < 0) {
    throw new RajukParcelDomainError("INVALID_FEATURE", "RAJUK parcel objectid is invalid");
  }
  if (attrs.plot_no !== null && (!Number.isInteger(attrs.plot_no) || attrs.plot_no < 0)) {
    throw new RajukParcelDomainError("INVALID_FEATURE", "RAJUK parcel plot number is invalid");
  }
  assertFinitePositive(attrs.Shape__Area, "RAJUK Shape__Area");
  validateCoordinates(feature);

  const decimalArea = areaToDecimal(attrs.Shape__Area, options.shapeAreaUnit);
  assertFinitePositive(decimalArea, "Converted Khatiyan area");

  const record = options.record ?? {};
  const plot: KhatiyanPlot = {
    id: attrs.objectid,
    plotId: attrs.plot_no ?? attrs.objectid,
    source: "rajuk",
    measurementProfile: options.measurementProfile,
    shapeAreaUnit: options.shapeAreaUnit,
    cs: record.cs ?? "",
    rs: record.rs ?? (attrs.rs_plot_no ?? ""),
    city: record.city ?? "",
    bds: record.bds ?? (attrs.p_guid ?? ""),
    t: record.t ?? "",
    a: String(decimalArea),
  };

  return {
    plot,
    source: {
      objectId: attrs.objectid,
      plotNo: attrs.plot_no,
      pGuid: attrs.p_guid,
      plotKind: attrs.plot_kind,
      shapeArea: attrs.Shape__Area,
      shapeAreaUnit: options.shapeAreaUnit,
      measurementProfile: options.measurementProfile,
    },
  };
}
