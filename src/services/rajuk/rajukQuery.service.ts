import "server-only";
import { getValidToken, invalidateToken, RAJUK_SERVER } from "./rajukAuth.service";
import { RAJUK_DB } from "./rajukLayers.service";
import type { RajukDistrict, RajukMauza, RajukPlotCollection, RajukPlotFilters, RajukUpazila, RajukIdentifyResult } from "@/src/types/rajuk-runtime";

const REQUEST_TIMEOUT_MS = 20_000;
const escapeSql = (value: string) => value.replace(/'/g, "''");

async function fetchJson(url: string): Promise<{ response: Response; data: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    const data = await response.json();
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

function isAuthError(response: Response, data: any): boolean {
  return response.status === 401 || response.status === 403 || response.status === 498 || response.status === 499
    || data?.error?.code === 401 || data?.error?.code === 403 || data?.error?.code === 498 || data?.error?.code === 499;
}

async function requestLayer<T>(layerId: number, params: Record<string, string | number | boolean | undefined>, retry = true): Promise<T> {
  const serverUrl = `${RAJUK_DB}/${layerId}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  query.set("f", "json");

  const publicResult = await fetchJson(`${serverUrl}/query?${query.toString()}`);
  if (!isAuthError(publicResult.response, publicResult.data)) {
    if (!publicResult.response.ok || publicResult.data?.error) {
      throw new Error(publicResult.data?.error?.message || `RAJUK layer ${layerId} query failed (${publicResult.response.status})`);
    }
    return publicResult.data as T;
  }

  if (!retry) {
    throw new Error(publicResult.data?.error?.message || `RAJUK authorization failed for layer ${layerId}`);
  }

  const token = await getValidToken(RAJUK_SERVER);
  query.set("token", token);
  const authenticatedResult = await fetchJson(`${serverUrl}/query?${query.toString()}`);

  if (isAuthError(authenticatedResult.response, authenticatedResult.data)) {
    await invalidateToken(RAJUK_SERVER);
    // One and only one refresh/retry prevents an auth failure from becoming a request loop.
    const freshToken = await getValidToken(RAJUK_SERVER);
    query.set("token", freshToken);
    const retryResult = await fetchJson(`${serverUrl}/query?${query.toString()}`);
    if (!retryResult.response.ok || retryResult.data?.error) {
      throw new Error(retryResult.data?.error?.message || `RAJUK layer ${layerId} query failed after token refresh (${retryResult.response.status})`);
    }
    return retryResult.data as T;
  }

  if (!authenticatedResult.response.ok || authenticatedResult.data?.error) {
    throw new Error(authenticatedResult.data?.error?.message || `RAJUK layer ${layerId} query failed (${authenticatedResult.response.status})`);
  }
  return authenticatedResult.data as T;
}

export async function getDistricts(): Promise<RajukDistrict[]> {
  const data = await requestLayer<{ features?: { attributes: RajukDistrict }[] }>(10, {
    where: "1=1", outFields: "m_district,d_guid", returnGeometry: false, returnDistinctValues: true, orderByFields: "m_district ASC",
  });
  return (data.features ?? []).map(f => f.attributes);
}

export async function getUpazilas(dGuid: string): Promise<RajukUpazila[]> {
  const data = await requestLayer<{ features?: { attributes: RajukUpazila }[] }>(9, {
    where: `d_guid='${escapeSql(dGuid)}'`, outFields: "upazila_ps,t_guid,d_guid,m_district", returnGeometry: false, orderByFields: "upazila_ps ASC",
  });
  return (data.features ?? []).map(f => f.attributes);
}

export async function getMouzas(tGuid: string): Promise<RajukMauza[]> {
  const data = await requestLayer<{ features?: { attributes: RajukMauza }[] }>(1, {
    where: `t_guid='${escapeSql(tGuid)}'`, outFields: "mauza,jl_no,m_guid,t_guid,d_guid,upazila_ps,m_district", returnGeometry: false, orderByFields: "mauza ASC", resultRecordCount: 5000,
  });
  return (data.features ?? []).map(f => f.attributes);
}

export async function getPlots(filters: RajukPlotFilters): Promise<RajukPlotCollection> {
  const clauses: string[] = [];
  if (filters.plotNo !== undefined) clauses.push(`plot_no=${Math.trunc(filters.plotNo)}`);
  for (const term of [filters.mouza, filters.jl, filters.upazila]) if (term?.trim()) clauses.push(`address_search LIKE '%${escapeSql(term.trim())}%'`);
  return requestLayer<RajukPlotCollection>(0, {
    where: clauses.length ? clauses.join(" AND ") : "1=0",
    outFields: "*",
    returnGeometry: true,
    outSR: 4326,
    resultRecordCount: Math.min(Math.max(filters.resultRecordCount ?? 50, 1), 2000),
    resultOffset: Math.max(filters.resultOffset ?? 0, 0),
    orderByFields: "plot_no ASC",
  });
}

export async function identifyByPoint(lat: number, lng: number): Promise<RajukIdentifyResult> {
  return requestLayer<RajukIdentifyResult>(0, {
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    inSR: 4326,
    outSR: 4326,
    outFields: "*",
    returnGeometry: true,
    resultRecordCount: 5,
  });
}
