import type { District, Division, KhatianPage, LandRecordProvider, Mouza, Survey, Upazila } from "../types";

const DLRMS_BASE_URL = "https://gateway.dlrms.land.gov.bd/core-api/api/public";
const CACHE_SECONDS = 60 * 60 * 24;

class DlrmsProviderError extends Error {
  constructor(
    message: string,
    public readonly stage: "auth" | "divisions" | "districts" | "upazilas" | "surveys" | "mouzas" | "khatians",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DlrmsProviderError";
  }
}

type JsonRecord = Record<string, unknown>;

function configuredToken(): string {
  const token = process.env.DLRMS_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new DlrmsProviderError(
      "DLRMS server access token is not configured. Set DLRMS_ACCESS_TOKEN on the server.",
      "auth",
    );
  }
  return token;
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

function stringValue(row: JsonRecord, ...keys: string[]): string {
  const v = value(row, ...keys);
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  throw new Error(`Expected string field: ${keys.join("/")}`);
}

function optionalString(row: JsonRecord, ...keys: string[]): string {
  const v = value(row, ...keys);
  return v === undefined || v === null ? "" : String(v);
}

async function getJson(
  path: string,
  stage: ConstructorParameters<typeof DlrmsProviderError>[1],
  signal?: AbortSignal,
): Promise<unknown> {
  const token = configuredToken();
  const url = new URL(`${DLRMS_BASE_URL}${path}`);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 500);
    throw new DlrmsProviderError(
      `DLRMS request failed (${response.status}) at ${path}${body ? `: ${body}` : ""}`,
      stage,
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new DlrmsProviderError(`DLRMS returned non-JSON data at ${path}.`, stage, response.status);
  }
}

function normalizeRows<T>(rows: JsonRecord[], mapper: (row: JsonRecord) => T, stage: ConstructorParameters<typeof DlrmsProviderError>[1]): T[] {
  try {
    return rows.map(mapper);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown response shape";
    throw new DlrmsProviderError(`DLRMS ${stage} response shape is incompatible: ${message}`, stage);
  }
}

export const dlrmsLandRecordProvider: LandRecordProvider = {
  async listDivisions(signal) {
    const data = await getJson("/divisions?ROW_STATUS=1", "divisions", signal);
    return normalizeRows(records(data), (row) => ({
      ID: numberValue(row, "ID", "id"),
      NAME: stringValue(row, "NAME", "name", "NAME_BN", "nameBn"),
      NAME_EN: stringValue(row, "NAME_EN", "nameEn", "NAMEEN", "name_en"),
      BBS_CODE: stringValue(row, "BBS_CODE", "bbsCode", "BBS_CODE_NO", "bbs_code"),
      ROW_STATUS: numberValue(row, "ROW_STATUS", "rowStatus", "row_status"),
    }), "divisions");
  },

  async listDistricts(divisionBbsCode, signal) {
    const data = await getJson("/districts?ROW_STATUS=1", "districts", signal);
    const rows = records(data);
    const filtered = divisionBbsCode
      ? rows.filter((row) => String(value(row, "DIVISION_BBS_CODE", "divisionBbsCode", "DIVISION_CODE", "divisionCode") ?? "") === divisionBbsCode)
      : rows;
    return normalizeRows(filtered, (row) => ({
      ID: numberValue(row, "ID", "id"),
      NAME: stringValue(row, "NAME", "name", "NAME_BN", "nameBn"),
      NAME_EN: stringValue(row, "NAME_EN", "nameEn", "NAMEEN", "name_en"),
      BBS_CODE: stringValue(row, "BBS_CODE", "bbsCode", "BBS_CODE_NO", "bbs_code"),
      DIVISION_BBS_CODE: stringValue(row, "DIVISION_BBS_CODE", "divisionBbsCode", "DIVISION_CODE", "divisionCode"),
      ROW_STATUS: numberValue(row, "ROW_STATUS", "rowStatus", "row_status"),
    }), "districts");
  },

  async listUpazilas(districtBbsCode, signal) {
    const data = await getJson("/upazilas?ROW_STATUS=1", "upazilas", signal);
    const rows = records(data);
    const filtered = districtBbsCode
      ? rows.filter((row) => String(value(row, "DISTRICT_BBS_CODE", "districtBbsCode", "DISTRICT_CODE", "districtCode") ?? "") === districtBbsCode)
      : rows;
    return normalizeRows(filtered, (row) => ({
      ID: numberValue(row, "ID", "id"),
      NAME: stringValue(row, "NAME", "name", "NAME_BN", "nameBn"),
      NAME_EN: stringValue(row, "NAME_EN", "nameEn", "NAMEEN", "name_en"),
      BBS_CODE: stringValue(row, "BBS_CODE", "bbsCode", "BBS_CODE_NO", "bbs_code"),
      DISTRICT_BBS_CODE: stringValue(row, "DISTRICT_BBS_CODE", "districtBbsCode", "DISTRICT_CODE", "districtCode"),
      ROW_STATUS: numberValue(row, "ROW_STATUS", "rowStatus", "row_status"),
    }), "upazilas");
  },

  async listSurveys(_input, signal) {
    const data = await getJson("/surveys?ROW_STATUS=1", "surveys", signal);
    return normalizeRows(records(data), (row) => ({
      SURVEY_ID: numberValue(row, "SURVEY_ID", "SURVEYID", "ID", "id"),
      LOCAL_NAME: stringValue(row, "LOCAL_NAME", "localName", "NAME", "name", "NAME_BN", "nameBn"),
      SURVEY_ORDER: numberValue(row, "SURVEY_ORDER", "surveyOrder", "ORDER", "order", "SORT_ORDER", "sortOrder"),
    }), "surveys").sort((a, b) => a.SURVEY_ORDER - b.SURVEY_ORDER);
  },

  async listMouzas(_input, signal) {
    throw new DlrmsProviderError(
      "DLRMS Mouza endpoint is intentionally not guessed. Capture/verify the official request before enabling this stage.",
      "mouzas",
    );
  },

  async listKhatians(_input, _signal): Promise<KhatianPage> {
    throw new DlrmsProviderError(
      "DLRMS Khatian endpoint is intentionally not guessed. Capture/verify the official request before enabling this stage.",
      "khatians",
    );
  },
};
