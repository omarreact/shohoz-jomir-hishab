import type { HalSabekEntry, KhatianTracking } from "../full-khatian";

const DLRMS_HOME_URL = "https://dlrms.land.gov.bd/";
const DLRMS_ORIGIN = "https://dlrms.land.gov.bd";
const GATEWAY_PUBLIC = "https://gateway.dlrms.land.gov.bd/core-api/api/public";
const TRACKING_BASE = `${GATEWAY_PUBLIC}/applications/khatian-application-tracking`;
const HAL_SABEK_ENDPOINT = `${GATEWAY_PUBLIC}/hal-sabeks/khatian`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SURVEYS = new Set(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);

type JsonRecord = Record<string, unknown>;

function setCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  return h.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);
}

function cookieValue(headers: string[], name: string): string | undefined {
  const re = new RegExp(`(?:^|[,;]\\s*)${name}=([^;]+)`);
  for (const header of headers) {
    const found = header.match(re)?.[1]?.trim();
    if (found) return found;
  }
  return undefined;
}

async function publicToken(signal?: AbortSignal): Promise<string> {
  const configured = process.env.DLRMS_ACCESS_TOKEN?.trim();
  if (configured) return configured;

  const response = await fetch(DLRMS_HOME_URL, {
    cache: "no-store",
    headers: { Accept: "text/html", "User-Agent": "LandBD/1.0" },
    signal: signal ?? AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`DLRMS public session failed (${response.status})`);
  const token = cookieValue(setCookies(response.headers), "dlrms_app_token");
  if (!token) throw new Error("DLRMS public application token was not issued");
  return token;
}

async function publicGet(url: string, referer: string, signal?: AbortSignal): Promise<unknown> {
  const token = await publicToken(signal);
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Origin: DLRMS_ORIGIN,
      Referer: referer,
      "User-Agent": "LandBD/1.0",
    },
    signal: signal ?? AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 240);
    throw new Error(`DLRMS public request failed (${response.status})${body ? `: ${body}` : ""}`);
  }
  return response.json();
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function unwrapData(value: unknown): unknown {
  const record = asRecord(value);
  return record && record.data !== undefined ? record.data : value;
}

function stringValue(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function numberValue(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export async function fetchPublicKhatianTracking(
  uuid: string,
  base?: { KHATIAN_NO: string; SURVEY_ID?: number },
  signal?: AbortSignal,
): Promise<KhatianTracking> {
  if (!UUID_RE.test(uuid)) throw new Error("Invalid DLRMS verification UUID");
  const payload = unwrapData(await publicGet(
    `${TRACKING_BASE}/${encodeURIComponent(uuid)}`,
    `${DLRMS_ORIGIN}/v/${encodeURIComponent(uuid)}`,
    signal,
  ));
  const record = asRecord(payload);
  if (!record) throw new Error("DLRMS tracking response is not an object");

  const khatianNo = stringValue(record, "KHATIAN_NO");
  const surveyId = numberValue(record, "SURVEY_ID");
  const matchesBaseRecord = base
    ? Boolean(
        khatianNo && khatianNo.trim() === base.KHATIAN_NO.trim() &&
        (!base.SURVEY_ID || !surveyId || base.SURVEY_ID === surveyId),
      )
    : true;

  return {
    displayCode: stringValue(record, "APPLICATION_DISPLAY_CODE") ?? uuid,
    surveyId,
    khatianId: numberValue(record, "KHATIAN_ID"),
    khatianNo,
    officeId: record.OFFICE_ID === null ? null : numberValue(record, "OFFICE_ID"),
    applicationStatus: numberValue(record, "APPLICATION_STATUS"),
    createdAt: stringValue(record, "CREATED_AT"),
    mouzaId: numberValue(record, "MOUZA_ID"),
    jlNumberId: numberValue(record, "JL_NUMBER_ID"),
    owners: stringValue(record, "OWNERS"),
    dags: stringValue(record, "DAGS"),
    totalLandRaw: record.TOTAL_LAND === null ? null : stringValue(record, "TOTAL_LAND"),
    divisionBbsCode: stringValue(record, "DIVISION_BBS_CODE"),
    divisionName: stringValue(record, "DIVISION_NAME"),
    districtBbsCode: stringValue(record, "DISTRICT_BBS_CODE"),
    districtName: stringValue(record, "DISTRICT_NAME"),
    upazilaBbsCode: stringValue(record, "UPAZILA_BBS_CODE"),
    upazilaName: stringValue(record, "UPAZILA_NAME"),
    mouzaName: stringValue(record, "MOUZA_NAME"),
    matchesBaseRecord,
  };
}

export interface HalSabekQuery {
  surveyKey: string;
  divisionBbsCode: string;
  districtBbsCode: string;
  upazilaBbsCode: string;
  jlNumberId: number;
  khatianNo: string;
}

export async function fetchPublicHalSabek(input: HalSabekQuery, signal?: AbortSignal): Promise<HalSabekEntry[]> {
  const survey = input.surveyKey.toUpperCase();
  if (!SURVEYS.has(survey)) throw new Error("Invalid DLRMS survey for hal-sabek lookup");

  const params = new URLSearchParams({
    DIVISION_BBS_CODE: input.divisionBbsCode,
    DISTRICT_BBS_CODE: input.districtBbsCode,
    UPAZILA_BBS_CODE: input.upazilaBbsCode,
    SURVEY_TYPE: survey,
    JL_NUMBER_ID: String(input.jlNumberId),
    KHATIAN_NO: input.khatianNo,
  });
  const payload = unwrapData(await publicGet(`${HAL_SABEK_ENDPOINT}?${params}`, DLRMS_HOME_URL, signal));
  const rows = Array.isArray(payload) ? payload : [];

  return rows.flatMap((value) => {
    const record = asRecord(value);
    if (!record) return [];
    const currentDag = stringValue(record, "CURRENT_DAG") ?? stringValue(record, "currentDag");
    const previousDag = stringValue(record, "PREVIOUS_DAG") ?? stringValue(record, "previousDag");
    if (!currentDag && !previousDag) return [];
    return [{
      currentDag: currentDag ?? "",
      previousDag: previousDag ?? "",
      source: "DLRMS_HAL_SABEK" as const,
    }];
  });
}

export const DLRMS_PUBLIC_EXTRA_ENDPOINTS = {
  tracking: `${TRACKING_BASE}/{displayCode}`,
  halSabek: HAL_SABEK_ENDPOINT,
} as const;
