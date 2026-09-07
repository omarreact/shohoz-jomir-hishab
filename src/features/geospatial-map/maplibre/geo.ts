import type { MapGeoJSONFeature } from "maplibre-gl";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("en-US")
      : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return String(value);
}

export function isMsFeature(feature: RajukPlotFeature): boolean {
  const attributes = feature.attributes as Record<string, unknown>;
  return attributes._layer_source === "ms" || attributes.plot_kind === "ms" || present(attributes.ms_plot_no);
}

export function isRsFeature(feature: RajukPlotFeature): boolean {
  const attributes = feature.attributes as Record<string, unknown>;
  return attributes._layer_source === "rs" || attributes.plot_kind === "rs" || (present(attributes.rs_plot_no) && !present(attributes.ms_plot_no));
}

export function rsNumber(feature: RajukPlotFeature): string {
  const attributes = feature.attributes as Record<string, unknown>;
  if (present(attributes.rs_plot_no)) return String(attributes.rs_plot_no);
  if (isRsFeature(feature) && present(attributes.plot_no)) return `RS-${attributes.plot_no}`;
  return "—";
}

export function msNumber(feature: RajukPlotFeature): string {
  const attributes = feature.attributes as Record<string, unknown>;
  if (present(attributes.ms_plot_no)) return String(attributes.ms_plot_no);
  if (isMsFeature(feature) && present(attributes.plot_no)) return `MS-${attributes.plot_no}`;
  return "—";
}

export function detailRows(feature: RajukPlotFeature, kind: "rs" | "ms") {
  const attributes = feature.attributes as Record<string, unknown>;
  if (kind === "ms") {
    return [
      ["এমএস দাগ নম্বর", msNumber(feature)],
      ["দাগ নং", formatValue(attributes.plot_no)],
      ["জেএল নং", formatValue(attributes.jl_no ?? attributes.rs_jl_no)],
      ["আয়তন (কাঠা)", formatValue(attributes.ms_plot_area ?? attributes.area_katha)],
      ["মৌজা", formatValue(attributes.mauza ?? attributes.rs_mauza_name)],
      ["থানা/উপজেলা", formatValue(attributes.thana_upazila ?? attributes.upazila_ps)],
      ["জেলা", formatValue(attributes.m_district ?? attributes.district)],
      ["ঠিকানা", formatValue(attributes.address_search)],
    ] as const;
  }
  return [
    ["আরএস দাগ নম্বর", rsNumber(feature)],
    ["দাগ নং", formatValue(attributes.plot_no)],
    ["জেএল নং", formatValue(attributes.rs_jl_no ?? attributes.jl_no)],
    ["আয়তন (কাঠা)", formatValue(attributes.rs_plot_area ?? attributes.area_katha)],
    ["মৌজা", formatValue(attributes.rs_mauza_name ?? attributes.mauza)],
    ["থানা/উপজেলা", formatValue(attributes.thana_upazila ?? attributes.upazila_ps)],
    ["জেলা", formatValue(attributes.m_district ?? attributes.district)],
    ["ঠিকানা", formatValue(attributes.address_search)],
  ] as const;
}

export function toGeoJson(feature: RajukPlotFeature): Feature<Polygon> | null {
  const rings = feature.geometry?.rings;
  if (!Array.isArray(rings) || rings.length === 0) return null;
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: rings },
    properties: feature.attributes ?? {},
  };
}

export function featuresToFc(features: RajukPlotFeature[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: features.map(toGeoJson).filter((feature): feature is Feature<Polygon> => Boolean(feature)),
  };
}

export function renderedFeatureToRajuk(feature: MapGeoJSONFeature, sourceKind: "rs" | "ms"): RajukPlotFeature | null {
  if (!feature.geometry || feature.geometry.type !== "Polygon") return null;
  const geometry = feature.geometry as GeoJSON.Polygon;
  if (!geometry.coordinates.length) return null;
  return {
    attributes: {
      ...(feature.properties ?? {}),
      objectid: Number(feature.properties?.objectid ?? 0),
      plot_no: feature.properties?.plot_no == null ? null : Number(feature.properties.plot_no),
      p_guid: feature.properties?.p_guid == null ? null : String(feature.properties.p_guid),
      rs_plot_no: feature.properties?.rs_plot_no == null ? null : String(feature.properties.rs_plot_no),
      ms_plot_no: feature.properties?.ms_plot_no == null ? null : String(feature.properties.ms_plot_no),
      address_search: feature.properties?.address_search == null ? null : String(feature.properties.address_search),
      Shape__Area: feature.properties?.Shape__Area == null ? null : Number(feature.properties.Shape__Area),
      Shape__Length: feature.properties?.Shape__Length == null ? null : Number(feature.properties.Shape__Length),
      plot_kind: sourceKind,
      _layer_source: sourceKind,
    },
    geometry: { rings: geometry.coordinates as number[][][] },
  };
}
