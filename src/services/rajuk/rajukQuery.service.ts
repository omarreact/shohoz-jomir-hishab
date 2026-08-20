import "server-only";
import { getValidToken, invalidateToken, RAJUK_SERVER } from "./rajukAuth.service";
import { RAJUK_DB } from "./rajukLayers.service";
import type { RajukDistrict, RajukMauza, RajukPlotCollection, RajukPlotFilters, RajukUpazila, RajukIdentifyResult } from "@/src/types/rajuk-runtime";

const escapeSql = (value: string) => value.replace(/'/g, "''");

function isAuthError(status: number, data: { error?: { code?: number; message?: string } }) {
  const code = data?.error?.code;
  const message = String(data?.error?.message || "").toLowerCase();
  return status === 401 || status === 403 || code === 401 || code === 403 || code === 498 || code === 499 || message.includes("token required") || message.includes("invalid token") || message.includes("token is required");
}

async function requestLayer<T>(layerId: number, params: Record<string, string | number | boolean | undefined>, retry = true): Promise<T> {
  const serverUrl = `${RAJUK_DB}/${layerId}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  query.set("f", "json");

  // First try the public operation. Some RAJUK layers expose query anonymously even
  // when other operations require authentication.
  const publicResponse = await fetch(`${serverUrl}/query?${query.toString()}`, { cache: "no-store" });
  const publicData = await publicResponse.json() as T & { error?: { code?: number; message?: string } };

  if (!isAuthError(publicResponse.status, publicData)) {
    if (!publicResponse.ok || publicData.error) throw new Error(publicData.error?.message || `RAJUK layer ${layerId} query failed (${publicResponse.status})`);
    return publicData as T;
  }

  if (!retry) throw new Error(publicData.error?.message || `RAJUK authorization failed for layer ${layerId}`);

  // Authentication is required for the actual query operation. Keep the token server-side.
  let token: string;
  try {
    token = await getValidToken(RAJUK_SERVER);
  } catch (firstAuthError) {
    throw new Error(`RAJUK query requires authentication, but the server could not obtain a valid token: ${firstAuthError instanceof Error ? firstAuthError.message : "authentication failed"}`);
  }

  query.set("token", token);
  const response = await fetch(`${serverUrl}/query?${query.toString()}`, { cache: "no-store" });
  const data = await response.json() as T & { error?: { code?: number; message?: string } };

  if (isAuthError(response.status, data)) {
    await invalidateToken(RAJUK_SERVER);
    if (retry) {
      // One forced refresh/retry prevents an expired cached Token 2 from breaking the UI.
      const freshToken = await getValidToken(RAJUK_SERVER);
      query.set("token", freshToken);
      const retryResponse = await fetch(`${serverUrl}/query?${query.toString()}`, { cache: "no-store" });
      const retryData = await retryResponse.json() as T & { error?: { code?: number; message?: string } };
      if (!isAuthError(retryResponse.status, retryData) && retryResponse.ok && !retryData.error) return retryData as T;
      throw new Error(retryData.error?.message || `RAJUK layer ${layerId} authentication failed after token refresh`);
    }
  }

  if (!response.ok || data.error) throw new Error(data.error?.message || `RAJUK layer ${layerId} query failed (${response.status})`);
  return data as T;
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
    outFields: "*", returnGeometry: true, outSR: 4326,
    resultRecordCount: Math.min(Math.max(filters.resultRecordCount ?? 50, 1), 2000),
    resultOffset: Math.max(filters.resultOffset ?? 0, 0), orderByFields: "plot_no ASC",
  });
}

export async function identifyByPoint(lat: number, lng: number): Promise<RajukIdentifyResult> {
  return requestLayer<RajukIdentifyResult>(0, {
    geometry: `${lng},${lat}`, geometryType: "esriGeometryPoint", spatialRel: "esriSpatialRelIntersects", inSR: 4326, outSR: 4326,
    outFields: "*", returnGeometry: true, resultRecordCount: 5,
  });
}
