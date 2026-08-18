import "server-only";
import { getValidToken, invalidateToken } from "./rajukAuth.service";
import { RAJUK_DB } from "./rajukLayers.service";
import type { RajukDistrict, RajukMauza, RajukPlotCollection, RajukPlotFilters, RajukUpazila, RajukIdentifyResult } from "@/src/types/rajuk-runtime";

const escapeSql = (value: string) => value.replace(/'/g, "''");

async function requestLayer<T>(layerId: number, params: Record<string, string | number | boolean | undefined>, retry = true): Promise<T> {
  const serverUrl = `${RAJUK_DB}/${layerId}`;
  const token = await getValidToken(serverUrl); const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  query.set("f", "json"); query.set("token", token);
  const response = await fetch(`${serverUrl}/query?${query.toString()}`, { cache: "no-store" }); const data = await response.json();
  const authError = response.status === 498 || response.status === 499 || data?.error?.code === 498 || data?.error?.code === 499;
  if (authError && retry) { invalidateToken(serverUrl); return requestLayer<T>(layerId, params, false); }
  if (!response.ok || data.error) throw new Error(data.error?.message || `RAJUK layer ${layerId} query failed (${response.status})`);
  return data as T;
}

export async function getDistricts(): Promise<RajukDistrict[]> { const data = await requestLayer<{ features?: { attributes: RajukDistrict }[] }>(10, { where: "1=1", outFields: "m_district,d_guid", returnGeometry: false, returnDistinctValues: true, orderByFields: "m_district ASC" }); return (data.features ?? []).map(f => f.attributes); }
export async function getUpazilas(dGuid: string): Promise<RajukUpazila[]> { const data = await requestLayer<{ features?: { attributes: RajukUpazila }[] }>(9, { where: `d_guid='${escapeSql(dGuid)}'`, outFields: "upazila_ps,t_guid,d_guid,m_district", returnGeometry: false, orderByFields: "upazila_ps ASC" }); return (data.features ?? []).map(f => f.attributes); }
export async function getMouzas(tGuid: string): Promise<RajukMauza[]> { const data = await requestLayer<{ features?: { attributes: RajukMauza }[] }>(1, { where: `t_guid='${escapeSql(tGuid)}'`, outFields: "mauza,jl_no,m_guid,t_guid,d_guid,upazila_ps,m_district", returnGeometry: false, orderByFields: "mauza ASC", resultRecordCount: 5000 }); return (data.features ?? []).map(f => f.attributes); }
export async function getPlots(filters: RajukPlotFilters): Promise<RajukPlotCollection> { const clauses: string[] = []; if (filters.plotNo !== undefined) clauses.push(`plot_no=${Math.trunc(filters.plotNo)}`); for (const term of [filters.mouza, filters.jl, filters.upazila]) if (term?.trim()) clauses.push(`address_search LIKE '%${escapeSql(term.trim())}%'`); return requestLayer<RajukPlotCollection>(0, { where: clauses.length ? clauses.join(" AND ") : "1=0", outFields: "objectid,plot_no,p_guid,rs_plot_no,address_search,Shape__Area,Shape__Length", returnGeometry: true, outSR: 4326, resultRecordCount: Math.min(Math.max(filters.resultRecordCount ?? 50, 1), 100), resultOffset: Math.max(filters.resultOffset ?? 0, 0), orderByFields: "plot_no ASC" }); }
export async function identifyByPoint(lat: number, lng: number): Promise<RajukIdentifyResult> { return requestLayer<RajukIdentifyResult>(0, { geometry: `${lng},${lat}`, geometryType: "esriGeometryPoint", spatialRel: "esriSpatialRelIntersects", inSR: 4326, outSR: 4326, outFields: "objectid,plot_no,p_guid,rs_plot_no,address_search,Shape__Area,Shape__Length", returnGeometry: true, resultRecordCount: 5 }); }
