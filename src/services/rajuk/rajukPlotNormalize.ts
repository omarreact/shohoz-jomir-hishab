import "server-only";
import type { RajukPlotFeature, RajukPlotKind } from "@/src/types/rajuk-runtime";
import { areaFromSquareMeters } from "@/src/modules/land/plotArea";

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export type PlotLayerSource = "rs" | "ms" | "unknown";

export function classifyPlotKind(attributes: Record<string, unknown>): RajukPlotKind {
  const hasRs = present(attributes.rs_plot_no);
  const hasMs = present(attributes.ms_plot_no);
  if (hasRs && hasMs) return "mixed";
  if (hasRs) return "rs";
  if (hasMs) return "ms";
  return "unknown";
}

/**
 * address_search examples:
 *   "452, Shambhupura -JL 285, Sonargaon Upazila"
 *   "452, Patira -JL 023, Gulshan Thana"
 */
export function parseAddressSearch(address: string | null | undefined): {
  plotHint: string | null;
  mauza: string | null;
  jlNo: string | null;
  thanaUpazila: string | null;
} {
  if (!address || !String(address).trim()) {
    return { plotHint: null, mauza: null, jlNo: null, thanaUpazila: null };
  }
  const raw = String(address).trim();
  const m = raw.match(/^\s*([^,]+)\s*,\s*(.+?)\s*-\s*JL\s*0*(\d+)\s*,\s*(.+?)\s*$/i);
  if (!m) {
    return { plotHint: null, mauza: null, jlNo: null, thanaUpazila: raw };
  }
  return {
    plotHint: m[1].trim(),
    mauza: m[2].trim(),
    jlNo: m[3].replace(/^0+/, "") || m[3],
    thanaUpazila: m[4].trim(),
  };
}

/**
 * @param source which FeatureServer layer the row came from.
 * MS layer (5) must never invent RS-* labels from plot_no.
 */
export function enrichPlotAttributes(
  raw: Record<string, unknown>,
  extras?: { district?: string; upazila?: string; mauza?: string; jl?: string },
  source: PlotLayerSource = "unknown",
): Record<string, unknown> {
  const parsed = parseAddressSearch(
    present(raw.address_search) ? String(raw.address_search) : null,
  );

  const shapeArea = Number(raw.Shape__Area ?? raw.shape__area);
  const area = Number.isFinite(shapeArea) && shapeArea > 0 ? areaFromSquareMeters(shapeArea) : null;

  let rsPlot: string | null = present(raw.rs_plot_no) ? String(raw.rs_plot_no) : null;
  let msPlot: string | null = present(raw.ms_plot_no) ? String(raw.ms_plot_no) : null;

  // Layer-aware fallback for bare plot_no — do not copy RS rules onto MS rows
  if (source === "ms") {
    if (!msPlot && present(raw.plot_no)) msPlot = `MS-${raw.plot_no}`;
    // Never fabricate RS from MS layer
    if (!present(raw.rs_plot_no)) rsPlot = null;
  } else if (source === "rs") {
    if (!rsPlot && present(raw.plot_no)) rsPlot = `RS-${raw.plot_no}`;
    if (!present(raw.ms_plot_no)) msPlot = null;
  } else {
    // Unknown source: only invent RS if no MS field at all
    if (!rsPlot && !msPlot && present(raw.plot_no)) rsPlot = `RS-${raw.plot_no}`;
  }

  const attributes: Record<string, unknown> = {
    ...raw,
    _layer_source: source,
    plot_no: raw.plot_no ?? parsed.plotHint ?? null,
    rs_plot_no: rsPlot,
    ms_plot_no: msPlot,
    rs_jl_no: present(raw.rs_jl_no)
      ? raw.rs_jl_no
      : present(raw.jl_no)
        ? raw.jl_no
        : parsed.jlNo ?? extras?.jl ?? null,
    jl_no: present(raw.jl_no) ? raw.jl_no : parsed.jlNo ?? extras?.jl ?? null,
    rs_plot_type: source === "ms" ? "MS" : source === "rs" ? "RS" : rsPlot ? "RS" : msPlot ? "MS" : null,
    rs_plot_area:
      source === "ms"
        ? null
        : present(raw.rs_plot_area)
          ? raw.rs_plot_area
          : area?.isValid
            ? Number(area.katha.toFixed(4))
            : null,
    ms_plot_area:
      source === "ms" || msPlot
        ? present(raw.ms_plot_area)
          ? raw.ms_plot_area
          : area?.isValid
            ? Number(area.katha.toFixed(4))
            : null
        : null,
    rs_mauza_name: present(raw.rs_mauza_name)
      ? raw.rs_mauza_name
      : present(raw.mauza)
        ? raw.mauza
        : parsed.mauza ?? extras?.mauza ?? null,
    mauza: present(raw.mauza) ? raw.mauza : parsed.mauza ?? extras?.mauza ?? null,
    thana_upazila: present(raw.thana_upazila)
      ? raw.thana_upazila
      : present(raw.upazila_ps)
        ? raw.upazila_ps
        : parsed.thanaUpazila ?? extras?.upazila ?? null,
    upazila_ps: present(raw.upazila_ps)
      ? raw.upazila_ps
      : parsed.thanaUpazila ?? extras?.upazila ?? null,
    m_district: present(raw.m_district)
      ? raw.m_district
      : present(raw.district)
        ? raw.district
        : extras?.district ?? null,
    district: present(raw.district)
      ? raw.district
      : present(raw.m_district)
        ? raw.m_district
        : extras?.district ?? null,
    address_search: present(raw.address_search) ? raw.address_search : null,
    area_sq_m: Number.isFinite(shapeArea) ? shapeArea : null,
    area_katha: area?.isValid ? Number(area.katha.toFixed(4)) : null,
    area_shotok: area?.isValid ? Number(area.shotok.toFixed(4)) : null,
    area_sq_ft: area?.isValid ? Number(area.sqFt.toFixed(2)) : null,
    area_bigha: area?.isValid ? Number(area.bigha.toFixed(6)) : null,
    area_acre: area?.isValid ? Number(area.acre.toFixed(6)) : null,
  };

  attributes.plot_kind = classifyPlotKind(attributes);
  // Force kind from layer when classification is unknown
  if (attributes.plot_kind === "unknown" && source === "ms") attributes.plot_kind = "ms";
  if (attributes.plot_kind === "unknown" && source === "rs") attributes.plot_kind = "rs";
  return attributes;
}

export function enrichPlotFeature(
  feature: RajukPlotFeature,
  extras?: { district?: string; upazila?: string; mauza?: string; jl?: string },
  source: PlotLayerSource = "unknown",
): RajukPlotFeature {
  return {
    ...feature,
    attributes: enrichPlotAttributes(
      feature.attributes as Record<string, unknown>,
      extras,
      source,
    ) as RajukPlotFeature["attributes"],
  };
}
