import "server-only";
import { getValidToken, invalidateToken, refreshToken, RAJUK_SERVER } from "./rajukAuth.service";
import { RAJUK_DB } from "./rajukLayers.service";
import type {
  RajukDistrict,
  RajukMauza,
  RajukPlotCollection,
  RajukPlotFeature,
  RajukPlotFilters,
  RajukPlotKind,
  RajukUpazila,
  RajukIdentifyResult,
} from "@/src/types/rajuk-runtime";

const escapeSql = (value: string) => value.replace(/'/g, "''");
type ArcGisError = { code?: number; message?: string; details?: string[] };
type ArcGisEnvelope = { error?: ArcGisError | string };

function authErrorMessage(data: ArcGisEnvelope): string {
  if (!data?.error) return "";
  if (typeof data.error === "string") return data.error;
  return data.error.message || "";
}

function isAuthError(status: number, data: ArcGisEnvelope) {
  const raw = data?.error;
  const code = typeof raw === "object" && raw ? raw.code : undefined;
  const message = authErrorMessage(data).toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    code === 401 ||
    code === 403 ||
    code === 498 ||
    code === 499 ||
    message.includes("token required") ||
    message.includes("invalid token") ||
    message.includes("token is required")
  );
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`RAJUK returned non-JSON response (${response.status}): ${text.slice(0, 300)}`);
  }
}

async function requestLayer<T>(layerId: number, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const serverUrl = `${RAJUK_DB}/${layerId}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  query.set("f", "json");

  const publicResponse = await fetch(`${serverUrl}/query?${query.toString()}`, {
    cache: "no-store",
    headers: { accept: "application/json", referer: "https://masterplan.rajuk.gov.bd/" },
  });
  const publicData = await parseJson<T & ArcGisEnvelope>(publicResponse);

  if (!isAuthError(publicResponse.status, publicData)) {
    if (!publicResponse.ok || publicData.error) {
      throw new Error(authErrorMessage(publicData) || `RAJUK layer ${layerId} query failed (${publicResponse.status})`);
    }
    return publicData;
  }

  let token: string;
  try {
    token = await getValidToken(RAJUK_SERVER);
  } catch (error) {
    throw new Error(
      `RAJUK layer ${layerId} requires an authorized server token: ${error instanceof Error ? error.message : "authentication failed"}`,
    );
  }

  const authenticatedQuery = new URLSearchParams(query);
  authenticatedQuery.set("token", token);
  let response = await fetch(`${serverUrl}/query?${authenticatedQuery.toString()}`, {
    cache: "no-store",
    headers: { accept: "application/json", referer: "https://masterplan.rajuk.gov.bd/" },
  });
  let data = await parseJson<T & ArcGisEnvelope>(response);

  if (isAuthError(response.status, data)) {
    await invalidateToken(RAJUK_SERVER);
    const freshToken = await refreshToken(RAJUK_SERVER);
    authenticatedQuery.set("token", freshToken);
    response = await fetch(`${serverUrl}/query?${authenticatedQuery.toString()}`, {
      cache: "no-store",
      headers: { accept: "application/json", referer: "https://masterplan.rajuk.gov.bd/" },
    });
    data = await parseJson<T & ArcGisEnvelope>(response);
  }

  if (!response.ok || data.error) {
    throw new Error(authErrorMessage(data) || `RAJUK layer ${layerId} query failed (${response.status})`);
  }
  return data;
}

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function classifyPlotKind(attributes: Record<string, unknown>): RajukPlotKind {
  const hasRs = present(attributes.rs_plot_no);
  const hasMs = present(attributes.ms_plot_no);
  if (hasRs && hasMs) return "mixed";
  if (hasRs) return "rs";
  if (hasMs) return "ms";
  return "unknown";
}

function annotatePlots(collection: RajukPlotCollection): RajukPlotCollection {
  const features = (collection.features ?? []).map((f) => {
    const attributes = { ...f.attributes, plot_kind: classifyPlotKind(f.attributes as Record<string, unknown>) };
    return { ...f, attributes } as RajukPlotFeature;
  });
  return { ...collection, features };
}

export async function getDistricts(): Promise<RajukDistrict[]> {
  const data = await requestLayer<{ features?: { attributes: RajukDistrict }[] }>(10, {
    where: "1=1",
    outFields: "m_district,d_guid",
    returnGeometry: false,
    returnDistinctValues: true,
    orderByFields: "m_district ASC",
  });
  return (data.features ?? []).map((f) => f.attributes);
}

export async function getUpazilas(dGuid: string): Promise<RajukUpazila[]> {
  const data = await requestLayer<{ features?: { attributes: RajukUpazila }[] }>(9, {
    where: `d_guid='${escapeSql(dGuid)}'`,
    outFields: "upazila_ps,t_guid,d_guid,m_district",
    returnGeometry: false,
    orderByFields: "upazila_ps ASC",
  });
  return (data.features ?? []).map((f) => f.attributes);
}

export async function getMouzas(tGuid: string): Promise<RajukMauza[]> {
  const data = await requestLayer<{ features?: { attributes: RajukMauza }[] }>(1, {
    where: `t_guid='${escapeSql(tGuid)}'`,
    outFields: "mauza,jl_no,m_guid,t_guid,d_guid,upazila_ps,m_district",
    returnGeometry: false,
    orderByFields: "mauza ASC",
    resultRecordCount: 5000,
  });
  return (data.features ?? []).map((f) => f.attributes);
}

export async function getPlots(filters: RajukPlotFilters): Promise<RajukPlotCollection> {
  const clauses: string[] = [];

  // Match generic, RS, or MS plot numbers so mixed parcels are found.
  if (filters.plotNo !== undefined) {
    const n = Math.trunc(filters.plotNo);
    const s = escapeSql(String(n));
    clauses.push(`(plot_no=${n} OR rs_plot_no='${s}' OR ms_plot_no='${s}')`);
  }
  if (filters.rsPlotNo?.trim()) {
    clauses.push(`rs_plot_no='${escapeSql(filters.rsPlotNo.trim())}'`);
  }
  if (filters.msPlotNo?.trim()) {
    clauses.push(`ms_plot_no='${escapeSql(filters.msPlotNo.trim())}'`);
  }

  for (const term of [filters.mouza, filters.jl, filters.upazila]) {
    if (term?.trim()) clauses.push(`address_search LIKE '%${escapeSql(term.trim())}%'`);
  }

  const data = await requestLayer<RajukPlotCollection>(0, {
    where: clauses.length ? clauses.join(" AND ") : "1=0",
    outFields: "*",
    returnGeometry: true,
    outSR: 4326,
    resultRecordCount: Math.min(Math.max(filters.resultRecordCount ?? 50, 1), 2000),
    resultOffset: Math.max(filters.resultOffset ?? 0, 0),
    orderByFields: "plot_no ASC",
  });

  let annotated = annotatePlots(data);
  if (filters.kind && filters.kind !== "all") {
    annotated = {
      ...annotated,
      features: (annotated.features ?? []).filter((f) => f.attributes.plot_kind === filters.kind),
    };
  }
  return annotated;
}

export async function identifyByPoint(lat: number, lng: number): Promise<RajukIdentifyResult> {
  const data = await requestLayer<RajukIdentifyResult>(0, {
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    inSR: 4326,
    outSR: 4326,
    outFields: "*",
    returnGeometry: true,
    resultRecordCount: 5,
  });
  return annotatePlots(data);
}
