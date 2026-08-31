export interface RajukDistrict { m_district: string; d_guid: string; }
export interface RajukUpazila { upazila_ps: string; t_guid: string; d_guid: string; m_district: string; }
export interface RajukMauza {
  mauza: string;
  jl_no: string | number;
  m_guid: string;
  t_guid: string;
  d_guid: string;
  upazila_ps: string;
  m_district: string;
}

/** RS-only, MS-only, both present, or neither. */
export type RajukPlotKind = "rs" | "ms" | "mixed" | "unknown";

export interface RajukPlotAttributes {
  objectid: number;
  plot_no: number | null;
  p_guid: string | null;
  rs_plot_no: string | null;
  ms_plot_no?: string | null;
  address_search: string | null;
  Shape__Area: number | null;
  Shape__Length: number | null;
  /** App-side classification after query. */
  plot_kind?: RajukPlotKind;
  [key: string]: unknown;
}

export interface RajukArcGISGeometry {
  rings: number[][][];
  spatialReference?: { wkid?: number; latestWkid?: number };
}
export interface RajukPlotFeature {
  /** Stable UI identity derived from the GIS feature when available. */
  plotId?: string | number | null;
  attributes: RajukPlotAttributes;
  geometry: RajukArcGISGeometry;
}
export interface RajukPlotCollection {
  features?: RajukPlotFeature[];
  count?: number;
  exceededTransferLimit?: boolean;
}
export interface RajukPlotFilters {
  plotNo?: number;
  rsPlotNo?: string;
  msPlotNo?: string;
  mouza?: string;
  jl?: string;
  upazila?: string;
  kind?: RajukPlotKind | "all";
  resultRecordCount?: number;
  resultOffset?: number;
}
export interface RajukIdentifyResult {
  features?: RajukPlotFeature[];
  count?: number;
}
