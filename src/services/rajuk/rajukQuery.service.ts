import "server-only";
import { getValidToken, invalidateToken, refreshToken, RAJUK_SERVER } from "./rajukAuth.service";
import { RAJUK_DB } from "./rajukLayers.service";
import { classifyPlotKind, enrichPlotFeature, type PlotLayerSource } from "./rajukPlotNormalize";
import { fetchWithRetry } from "./rajukFetch";
import type { RajukDistrict, RajukMauza, RajukPlotCollection, RajukPlotFeature, RajukPlotFilters, RajukUpazila, RajukIdentifyResult } from "@/src/types/rajuk-runtime";

const escapeSql = (value: string) => value.replace(/'/g, "''");
type ArcGisError = { code?: number; message?: string; details?: string[] };
type ArcGisEnvelope = { error?: ArcGisError | string };
const LAYER_RS_PLOT = 0;
const LAYER_MS_PLOT = 5;

function authErrorMessage(data: ArcGisEnvelope): string {
  if (!data?.error) return "";
  if (typeof data.error === "string") return data.error;
  return data.error.message || "";
}
function isAuthError(status: number, data: ArcGisEnvelope) {
  const raw = data?.error;
  const code = typeof raw === "object" && raw ? raw.code : undefined;
  const message = authErrorMessage(data).toLowerCase();
  return status === 401 || status === 403 || code === 401 || code === 403 || code === 498 || code === 499 || message.includes("token required") || message.includes("invalid token") || message.includes("token is required");
}
async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(`RAJUK returned non-JSON response (${response.status}): ${text.slice(0, 300)}`); }
}
async function requestLayer<T>(layerId: number, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const serverUrl = `${RAJUK_DB}/${layerId}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  query.set("f", "json");
  const publicResponse = await fetchWithRetry(`${serverUrl}/query?${query.toString()}`, { timeoutMs: 20_000, retries: 2 });
  const publicData = await parseJson<T & ArcGisEnvelope>(publicResponse);
  if (!isAuthError(publicResponse.status, publicData)) {
    if (!publicResponse.ok || publicData.error) throw new Error(authErrorMessage(publicData) || `RAJUK layer ${layerId} query failed (${publicResponse.status})`);
    return publicData;
  }
  let token: string;
  try { token = await getValidToken(RAJUK_SERVER); } catch (error) { throw new Error(`RAJUK layer ${layerId} requires an authorized server token: ${error instanceof Error ? error.message : "authentication failed"}`); }
  const authenticatedQuery = new URLSearchParams(query);
  authenticatedQuery.set("token", token);
  let response = await fetchWithRetry(`${serverUrl}/query?${authenticatedQuery.toString()}`, { timeoutMs: 20_000, retries: 2 });
  let data = await parseJson<T & ArcGisEnvelope>(response);
  if (isAuthError(response.status, data)) {
    await invalidateToken(RAJUK_SERVER);
    const freshToken = await refreshToken(RAJUK_SERVER);
    authenticatedQuery.set("token", freshToken);
    response = await fetchWithRetry(`${serverUrl}/query?${authenticatedQuery.toString()}`, { timeoutMs: 20_000, retries: 1 });
    data = await parseJson<T & ArcGisEnvelope>(response);
  }
  if (!response.ok || data.error) throw new Error(authErrorMessage(data) || `RAJUK layer ${layerId} query failed (${response.status})`);
  return data;
}
function annotatePlots(collection: RajukPlotCollection, extras: { district?: string; upazila?: string; mauza?: string; jl?: string } | undefined, source: PlotLayerSource): RajukPlotCollection {
  return { ...collection, features: (collection.features ?? []).map((f) => enrichPlotFeature(f, extras, source)) };
}
export async function getDistricts(): Promise<RajukDistrict[]> {
  const data = await requestLayer<{ features?: { attributes: RajukDistrict }[] }>(10, { where: "1=1", outFields: "m_district,d_guid", returnGeometry: false, returnDistinctValues: true, orderByFields: "m_district ASC" });
  return (data.features ?? []).map((f) => f.attributes);
}
export async function getUpazilas(dGuid: string): Promise<RajukUpazila[]> {
  const data = await requestLayer<{ features?: { attributes: RajukUpazila }[] }>(9, { where: `d_guid='${escapeSql(dGuid)}'`, outFields: "upazila_ps,t_guid,d_guid,m_district", returnGeometry: false, orderByFields: "upazila_ps ASC" });
  return (data.features ?? []).map((f) => f.attributes);
}

export async function getMouzas(tGuid: string, kind: "rs" | "ms" = "rs"): Promise<RajukMauza[]> {
  if (kind === "ms") {
    // MS address data MUST come from FeatureServer/5. Do not use the RS
    // mauza layer and do not ask ArcGIS for DISTINCT/order-by combinations;
    // some RAJUK server versions return "Unable to complete operation" for
    // that combination. Fetch the MS rows and de-duplicate in application code.
    const context = await requestLayer<{ features?: { attributes: RajukUpazila }[] }>(9, {
      where: `t_guid='${escapeSql(tGuid)}'`,
      outFields: "upazila_ps,t_guid,d_guid,m_district",
      returnGeometry: false,
      resultRecordCount: 1,
    });
    const admin = context.features?.[0]?.attributes;
    if (!admin?.upazila_ps) return [];

    let data: { features?: { attributes: Record<string, unknown> }[] };
    try {
      data = await requestLayer<{ features?: { attributes: Record<string, unknown> }[] }>(LAYER_MS_PLOT, {
        where: `address_search LIKE '%${escapeSql(admin.upazila_ps.trim())}%'`,
        outFields: "*",
        returnGeometry: false,
        resultRecordCount: 2000,
      });
    } catch (error) {
      // Fallback: if the published service rejects address_search filtering,
      // query the layer without a DISTINCT/order operation and filter rows
      // locally using the returned address attributes.
      data = await requestLayer<{ features?: { attributes: Record<string, unknown> }[] }>(LAYER_MS_PLOT, {
        where: "1=1",
        outFields: "*",
        returnGeometry: false,
        resultRecordCount: 2000,
      });
    }

    const wantedUpazila = admin.upazila_ps.trim().toLowerCase();
    const wantedDistrict = String(admin.m_district ?? "").trim().toLowerCase();
    const seen = new Set<string>();
    const result: RajukMauza[] = [];
    for (const feature of data.features ?? []) {
      const a = feature.attributes ?? {};
      const address = String(a.address_search ?? "").toLowerCase();
      const upazila = String(a.upazila_ps ?? a.thana_upazila ?? "").trim();
      const district = String(a.m_district ?? a.district ?? "").trim();
      if (address && !address.includes(wantedUpazila) && upazila.toLowerCase() !== wantedUpazila) continue;
      if (wantedDistrict && district && district.toLowerCase() !== wantedDistrict && !address.includes(wantedDistrict)) continue;
      const mauza = String(a.mauza ?? a.mauza_name ?? a.ms_mauza_name ?? "").trim();
      const jl = String(a.jl_no ?? a.ms_jl_no ?? a.jl ?? "").trim();
      if (!mauza || !jl) continue;
      const key = `${mauza.toLowerCase()}|${jl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        mauza,
        jl_no: jl,
        m_guid: `ms-${key.replace(/[^a-z0-9|_-]/gi, "-")}`,
        t_guid: admin.t_guid,
        d_guid: admin.d_guid,
        upazila_ps: upazila || admin.upazila_ps,
        m_district: district || admin.m_district,
      });
    }
    return result.sort((a, b) => `${a.mauza}|${a.jl_no}`.localeCompare(`${b.mauza}|${b.jl_no}`, undefined, { numeric: true }));
  }
  const data = await requestLayer<{ features?: { attributes: RajukMauza }[] }>(1, { where: `t_guid='${escapeSql(tGuid)}'`, outFields: "mauza,jl_no,m_guid,t_guid,d_guid,upazila_ps,m_district", returnGeometry: false, orderByFields: "mauza ASC", resultRecordCount: 5000 });
  return (data.features ?? []).map((f) => f.attributes);
}

function buildRsWhere(filters: RajukPlotFilters): string {
  const clauses: string[] = [];
  if (filters.plotNo !== undefined) { const n = Math.trunc(filters.plotNo); const s = escapeSql(String(n)); clauses.push(`(plot_no=${n} OR rs_plot_no='${s}' OR rs_plot_no='RS-${s}' OR rs_plot_no='RS-${String(n).padStart(3, "0")}')`); }
  if (filters.rsPlotNo?.trim()) { const v = escapeSql(filters.rsPlotNo.trim()); const bare = escapeSql(filters.rsPlotNo.trim().replace(/^RS-/i, "")); clauses.push(`(rs_plot_no='${v}' OR rs_plot_no='${bare}' OR plot_no=${Number(bare) || -1})`); }
  if (filters.msPlotNo?.trim() && !filters.rsPlotNo?.trim() && filters.plotNo === undefined) return "1=0";
  for (const term of [filters.mouza, filters.jl, filters.upazila]) if (term?.trim()) clauses.push(`address_search LIKE '%${escapeSql(term.trim())}%'`);
  return clauses.length ? clauses.join(" AND ") : "1=0";
}
function buildMsWhere(filters: RajukPlotFilters): string {
  const clauses: string[] = [];
  if (filters.plotNo !== undefined) { const n = Math.trunc(filters.plotNo); const s = escapeSql(String(n)); clauses.push(`(plot_no=${n} OR ms_plot_no='${s}' OR ms_plot_no='MS-${s}')`); }
  if (filters.msPlotNo?.trim()) { const v = escapeSql(filters.msPlotNo.trim()); const bare = escapeSql(filters.msPlotNo.trim().replace(/^MS-/i, "")); clauses.push(`(ms_plot_no='${v}' OR ms_plot_no='${bare}' OR plot_no=${Number(bare) || -1})`); }
  if (filters.rsPlotNo?.trim() && !filters.msPlotNo?.trim() && filters.plotNo === undefined) return "1=0";
  for (const term of [filters.mouza, filters.jl, filters.upazila]) if (term?.trim()) clauses.push(`address_search LIKE '%${escapeSql(term.trim())}%'`);
  return clauses.length ? clauses.join(" AND ") : "1=0";
}
export async function getPlots(filters: RajukPlotFilters): Promise<RajukPlotCollection> {
  const limit = Math.min(Math.max(filters.resultRecordCount ?? 50, 1), 2000);
  const offset = Math.max(filters.resultOffset ?? 0, 0);
  const extras = { mauza: filters.mouza, jl: filters.jl, upazila: filters.upazila };
  const wantRs = filters.kind !== "ms"; const wantMs = filters.kind !== "rs";
  const queries: Promise<{ source: PlotLayerSource; data: RajukPlotCollection }>[] = [];
  if (wantRs) queries.push(requestLayer<RajukPlotCollection>(LAYER_RS_PLOT, { where: buildRsWhere(filters), outFields: "*", returnGeometry: true, outSR: 4326, resultRecordCount: limit, resultOffset: offset, orderByFields: "plot_no ASC" }).then((data) => ({ source: "rs" as const, data })));
  if (wantMs) queries.push(requestLayer<RajukPlotCollection>(LAYER_MS_PLOT, { where: buildMsWhere(filters), outFields: "*", returnGeometry: true, outSR: 4326, resultRecordCount: limit, resultOffset: offset, orderByFields: "plot_no ASC" }).then((data) => ({ source: "ms" as const, data })));
  const parts = await Promise.all(queries);
  const merged: RajukPlotFeature[] = [];
  for (const part of parts) for (const f of annotatePlots(part.data, extras, part.source).features ?? []) merged.push(f);
  return { features: merged, count: merged.length };
}

export async function getPlotsByExtent(opts: { kind: "rs" | "ms" | "all"; xmin: number; ymin: number; xmax: number; ymax: number; limit?: number }): Promise<RajukPlotCollection> {
  const limit = Math.min(Math.max(opts.limit ?? 400, 1), 800);
  const geometry = JSON.stringify({ xmin: opts.xmin, ymin: opts.ymin, xmax: opts.xmax, ymax: opts.ymax, spatialReference: { wkid: 4326 } });
  const base = { where: "1=1", geometry, geometryType: "esriGeometryEnvelope", spatialRel: "esriSpatialRelIntersects", inSR: 4326, outSR: 4326, outFields: "*", returnGeometry: true, resultRecordCount: limit };
  const queries: Promise<{ source: PlotLayerSource; data: RajukPlotCollection }>[] = [];
  if (opts.kind === "rs" || opts.kind === "all") queries.push(requestLayer<RajukPlotCollection>(LAYER_RS_PLOT, base).then((data) => ({ source: "rs" as const, data })));
  if (opts.kind === "ms" || opts.kind === "all") queries.push(requestLayer<RajukPlotCollection>(LAYER_MS_PLOT, base).then((data) => ({ source: "ms" as const, data })));
  const parts = await Promise.all(queries); const merged: RajukPlotFeature[] = [];
  for (const part of parts) for (const f of annotatePlots(part.data, undefined, part.source).features ?? []) merged.push(f);
  return { features: merged, count: merged.length };
}
export async function identifyByPoint(lat: number, lng: number): Promise<RajukIdentifyResult> {
  const [rs, ms] = await Promise.all([
    requestLayer<RajukIdentifyResult>(LAYER_RS_PLOT, { geometry: `${lng},${lat}`, geometryType: "esriGeometryPoint", spatialRel: "esriSpatialRelIntersects", inSR: 4326, outSR: 4326, outFields: "*", returnGeometry: true, resultRecordCount: 5 }).then((data) => annotatePlots(data, undefined, "rs")),
    requestLayer<RajukIdentifyResult>(LAYER_MS_PLOT, { geometry: `${lng},${lat}`, geometryType: "esriGeometryPoint", spatialRel: "esriSpatialRelIntersects", inSR: 4326, outSR: 4326, outFields: "*", returnGeometry: true, resultRecordCount: 5 }).then((data) => annotatePlots(data, undefined, "ms")),
  ]);
  const features = [...(rs.features ?? []), ...(ms.features ?? [])]; return { features, count: features.length };
}
export { classifyPlotKind };
