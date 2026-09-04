import type { KhatianDetails, KhatianPage, LandRecordProvider } from "../types";

const DLRMS_HOME_URL = "https://dlrms.land.gov.bd/";
const DLRMS_GATEWAY_URL = "https://gateway.dlrms.land.gov.bd";
const DLRMS_API_URL = `${DLRMS_GATEWAY_URL}/core-api/api/public`;
const REQUEST_TIMEOUT_MS = 25_000;
const TOKEN_EXPIRY_SKEW_MS = 60_000;

type Stage = "auth" | "divisions" | "districts" | "upazilas" | "surveys" | "mouzas" | "khatians" | "khatian-details";
type JsonRecord = Record<string, unknown>;

interface PublicSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

let session: PublicSession | null = null;
let sessionPromise: Promise<PublicSession> | null = null;

export class DlrmsProviderError extends Error {
  constructor(
    message: string,
    public readonly stage: Stage,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DlrmsProviderError";
  }
}

function cookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const values = withGetSetCookie.getSetCookie?.();
  if (values?.length) return values;
  const combined = headers.get("set-cookie");
  return combined ? [combined] : [];
}

function cookieValue(headers: string[], name: string): string | undefined {
  const pattern = new RegExp(`(?:^|[,;]\\s*)${name}=([^;]+)`);
  for (const header of headers) {
    const match = header.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function cookieExpiry(headers: string[], name: string): number | undefined {
  const cookie = headers.find((header) => header.includes(`${name}=`));
  const match = cookie?.match(/expires=([^;]+)/i);
  const timestamp = match?.[1] ? Date.parse(match[1]) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

async function bootstrapSession(): Promise<PublicSession> {
  const configured = process.env.DLRMS_ACCESS_TOKEN?.trim();
  if (configured) return { accessToken: configured, expiresAt: Date.now() + 5 * 60_000 };

  const response = await fetch(DLRMS_HOME_URL, {
    cache: "no-store",
    headers: { Accept: "text/html" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new DlrmsProviderError(`DLRMS public session failed (${response.status}).`, "auth", response.status);
  }

  const cookies = cookieHeaders(response.headers);
  const accessToken = cookieValue(cookies, "dlrms_app_token");
  const refreshToken = cookieValue(cookies, "dlrms_app_refresh_token");
  if (!accessToken) {
    throw new DlrmsProviderError("DLRMS did not issue a public application token.", "auth", 502);
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: cookieExpiry(cookies, "dlrms_app_token") ?? Date.now() + 10 * 60_000,
  };
}

async function publicSession(force = false): Promise<PublicSession> {
  if (!force && session && session.expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) return session;
  if (!force && sessionPromise) return sessionPromise;

  sessionPromise = bootstrapSession()
    .then((created) => {
      session = created;
      return created;
    })
    .finally(() => {
      sessionPromise = null;
    });
  return sessionPromise;
}

async function refreshSession(current: PublicSession): Promise<PublicSession> {
  if (!current.refreshToken || process.env.DLRMS_ACCESS_TOKEN?.trim()) return publicSession(true);

  try {
    const response = await fetch(`${DLRMS_GATEWAY_URL}/api/renew-app-token`, {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "R-Token": current.refreshToken },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return publicSession(true);
    const body = await response.json() as JsonRecord;
    const accessToken = stringValue(body, "access_token");
    const refreshToken = optionalString(body, "refresh_token") || current.refreshToken;
    const expiresIn = optionalNumber(body, "expires_in") ?? 600;
    session = { accessToken, refreshToken, expiresAt: Date.now() + expiresIn * 1000 };
    return session;
  } catch {
    return publicSession(true);
  }
}

function records(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter((v): v is JsonRecord => !!v && typeof v === "object");
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as JsonRecord;
  for (const key of ["data", "content", "items", "results", "rows"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.filter((v): v is JsonRecord => !!v && typeof v === "object");
    if (value && typeof value === "object") {
      const nested = records(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function dataRecord(payload: unknown): JsonRecord {
  if (!payload || typeof payload !== "object") return {};
  const outer = payload as JsonRecord;
  return outer.data && typeof outer.data === "object" && !Array.isArray(outer.data)
    ? outer.data as JsonRecord
    : outer;
}

function value(row: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function numberValue(row: JsonRecord, ...keys: string[]): number {
  const v = value(row, ...keys);
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`Expected numeric field: ${keys.join("/")}`);
  return n;
}

function optionalNumber(row: JsonRecord, ...keys: string[]): number | undefined {
  const v = value(row, ...keys);
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function stringValue(row: JsonRecord, ...keys: string[]): string {
  const v = value(row, ...keys);
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  throw new Error(`Expected string field: ${keys.join("/")}`);
}

function optionalString(row: JsonRecord, ...keys: string[]): string {
  const v = value(row, ...keys);
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  return String(v);
}

function query(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(`${DLRMS_API_URL}${path}`);
  for (const [key, item] of Object.entries(params)) {
    if (item !== undefined && item !== "") url.searchParams.set(key, String(item));
  }
  return url.toString();
}

async function requestJson(url: string, stage: Stage, signal?: AbortSignal, retry = true): Promise<unknown> {
  const activeSession = await publicSession();
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${activeSession.accessToken}` },
    signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 401 && retry) {
    await refreshSession(activeSession);
    return requestJson(url, stage, signal, false);
  }
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new DlrmsProviderError(`DLRMS request failed (${response.status})${body ? `: ${body}` : ""}`, stage, response.status);
  }
  try {
    return await response.json();
  } catch {
    throw new DlrmsProviderError("DLRMS returned invalid JSON.", stage, response.status);
  }
}

function normalizeRows<T>(rows: JsonRecord[], mapper: (row: JsonRecord) => T, stage: Stage): T[] {
  try {
    return rows.map(mapper);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown response shape";
    throw new DlrmsProviderError(`DLRMS ${stage} response shape is incompatible: ${message}`, stage);
  }
}

function normalizeKhatian(row: JsonRecord, fallback: { jlNumberId?: number; mouzaId?: number } = {}) {
  return {
    ID: numberValue(row, "ID", "id"),
    KHATIAN_NO: stringValue(row, "KHATIAN_NO", "khatianNo"),
    OWNERS: optionalString(row, "OWNERS", "owners"),
    DAGS: optionalString(row, "DAGS", "dags"),
    GUARDIANS: optionalString(row, "GUARDIANS", "guardians"),
    JL_NUMBER_ID: optionalNumber(row, "JL_NUMBER_ID", "jlNumberId") ?? fallback.jlNumberId ?? 0,
    MOUZA_ID: optionalNumber(row, "MOUZA_ID", "mouzaId") ?? fallback.mouzaId ?? 0,
  };
}

export const dlrmsLandRecordProvider: LandRecordProvider = {
  async listDivisions(signal) {
    const data = await requestJson(query("/divisions", { ROW_STATUS: 1 }), "divisions", signal);
    return normalizeRows(records(data), (row) => ({
      ID: numberValue(row, "ID", "id"), NAME: stringValue(row, "NAME", "name"),
      NAME_EN: stringValue(row, "NAME_EN", "nameEn"), BBS_CODE: stringValue(row, "BBS_CODE", "bbsCode"),
      ROW_STATUS: numberValue(row, "ROW_STATUS", "rowStatus"),
    }), "divisions");
  },

  async listDistricts(divisionBbsCode, signal) {
    const data = await requestJson(query("/districts", { ROW_STATUS: 1 }), "districts", signal);
    const rows = records(data).filter((row) => !divisionBbsCode || String(value(row, "DIVISION_BBS_CODE") ?? "") === divisionBbsCode);
    return normalizeRows(rows, (row) => ({
      ID: numberValue(row, "ID", "id"), NAME: stringValue(row, "NAME", "name"),
      NAME_EN: stringValue(row, "NAME_EN", "nameEn"), BBS_CODE: stringValue(row, "BBS_CODE", "bbsCode"),
      DIVISION_BBS_CODE: stringValue(row, "DIVISION_BBS_CODE", "divisionBbsCode"),
      ROW_STATUS: numberValue(row, "ROW_STATUS", "rowStatus"),
    }), "districts");
  },

  async listUpazilas(districtBbsCode, signal) {
    const data = await requestJson(query("/upazilas", { ROW_STATUS: 1 }), "upazilas", signal);
    const rows = records(data).filter((row) => !districtBbsCode || String(value(row, "DISTRICT_BBS_CODE") ?? "") === districtBbsCode);
    return normalizeRows(rows, (row) => ({
      ID: numberValue(row, "ID", "id"), NAME: stringValue(row, "NAME", "name"),
      NAME_EN: stringValue(row, "NAME_EN", "nameEn"), BBS_CODE: stringValue(row, "BBS_CODE", "bbsCode"),
      DISTRICT_BBS_CODE: stringValue(row, "DISTRICT_BBS_CODE", "districtBbsCode"),
      ROW_STATUS: numberValue(row, "ROW_STATUS", "rowStatus"),
    }), "upazilas");
  },

  async listSurveys(input, signal) {
    const data = await requestJson(query("/upazilas/surveys", {
      DISTRICT_BBS_CODE: input.districtBbsCode, UPAZILA_BBS_CODE: input.upazilaBbsCode,
    }), "surveys", signal);
    return normalizeRows(records(data), (row) => ({
      SURVEY_ID: numberValue(row, "SURVEY_ID", "ID"), LOCAL_NAME: stringValue(row, "LOCAL_NAME", "NAME"),
      SURVEY_ORDER: numberValue(row, "SURVEY_ORDER", "ORDER"),
    }), "surveys").sort((a, b) => a.SURVEY_ORDER - b.SURVEY_ORDER);
  },

  async listMouzas(input, signal) {
    const data = await requestJson(query("/mouzas/jl-numbers", {
      DISTRICT_BBS_CODE: input.districtBbsCode, UPAZILA_BBS_CODE: input.upazilaBbsCode, SURVEY_ID: input.surveyId,
    }), "mouzas", signal);
    return normalizeRows(records(data), (row) => ({
      ID: numberValue(row, "ID", "id"), MOUZA_ID: numberValue(row, "MOUZA_ID", "mouzaId"),
      MOUZA_NAME: stringValue(row, "MOUZA_NAME", "mouzaName"), JL_NUMBER: stringValue(row, "JL_NUMBER", "jlNumber"),
      DISTRICT_NAME: optionalString(row, "DISTRICT_NAME") || input.districtName,
      UPAZILA_NAME: optionalString(row, "UPAZILA_NAME") || input.upazilaName,
      SURVEY_ID: numberValue(row, "SURVEY_ID", "surveyId"), SURVEY_NAME: optionalString(row, "SURVEY_NAME"),
      SURVEY_NAME_EN: optionalString(row, "SURVEY_NAME_EN") || input.surveyKey,
    }), "mouzas");
  },

  async listKhatians(input, signal): Promise<KhatianPage> {
    const data = await requestJson(query(`/index-khatian/${input.surveyKey}`, {
      SURVEY: input.surveyKey, JL_NUMBER_ID: input.jlNumberId, KHATIAN_NO: input.khatianNo,
      OWNER: input.owner, DAG_NUMBER: input.dagNumber, PAGE_NO: input.page, PAGE_SIZE: input.pageSize,
    }), "khatians", signal);
    const container = dataRecord(data);
    const rows = records(container);
    const meta = container.meta && typeof container.meta === "object" ? container.meta as JsonRecord : {};
    const total = optionalNumber(meta, "totalItems", "TOTAL", "total", "itemCount")
      ?? optionalNumber(container, "totalItems", "TOTAL", "total");
    const totalPages = optionalNumber(meta, "totalPages", "TOTAL_PAGES", "lastPage");
    return {
      items: normalizeRows(rows, (row) => normalizeKhatian(row, { jlNumberId: input.jlNumberId }), "khatians"),
      page: input.page, pageSize: input.pageSize, total,
      hasNextPage: totalPages ? input.page < totalPages : rows.length === input.pageSize,
    };
  },

  async getKhatian(surveyKey, id, signal): Promise<KhatianDetails> {
    const payload = await requestJson(`${DLRMS_API_URL}/index-khatian/${surveyKey}/${id}`, "khatian-details", signal);
    const row = dataRecord(payload);
    return {
      ...normalizeKhatian(row), KHATIAN_ENTRY_ID: optionalNumber(row, "KHATIAN_ENTRY_ID"),
      IS_LOCKED: optionalNumber(row, "IS_LOCKED") ?? 0, DIVISION_NAME: optionalString(row, "DIVISION_NAME"),
      DISTRICT_NAME: optionalString(row, "DISTRICT_NAME"), UPAZILA_NAME: optionalString(row, "UPAZILA_NAME"),
      JL_NUMBER: optionalString(row, "JL_NUMBER"), MOUZA_NAME: optionalString(row, "MOUZA_NAME"),
      SURVEY_ID: optionalNumber(row, "SURVEY_ID"), SURVEY_NAME: optionalString(row, "SURVEY_NAME"),
      TOTAL_LAND: optionalString(row, "TOTAL_LAND"),
    };
  },
};
