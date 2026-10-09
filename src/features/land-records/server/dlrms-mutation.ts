import type { Mouza } from "../types";
import {
  MUTATION_SURVEY_ID,
  MUTATION_SURVEY_KEY,
  MUTATION_SURVEY_LABEL,
} from "../types";
import { DlrmsProviderError } from "./dlrms-provider";

const DLRMS_HOME_URL = "https://dlrms.land.gov.bd/";
const DLRMS_ORIGIN = "https://dlrms.land.gov.bd";
const DLRMS_GATEWAY_URL = "https://gateway.dlrms.land.gov.bd";
const DLRMS_PUBLIC_API_URL = `${DLRMS_GATEWAY_URL}/core-api/api/public`;
const REQUEST_TIMEOUT_MS = 25_000;
const TOKEN_EXPIRY_SKEW_MS = 60_000;

type JsonRecord = Record<string, unknown>;

interface PublicSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

let session: PublicSession | null = null;
let sessionPromise: Promise<PublicSession> | null = null;

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

function optionalString(row: JsonRecord, ...keys: string[]): string {
  const v = value(row, ...keys);
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  return String(v);
}

async function requestMutationJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const activeSession = await publicSession();
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${activeSession.accessToken}`,
      Origin: DLRMS_ORIGIN,
      Referer: DLRMS_HOME_URL,
    },
    signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    throw new DlrmsProviderError(
      `DLRMS mutation mouza request failed (${response.status})${body ? `: ${body}` : ""}`,
      "mouzas",
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new DlrmsProviderError("DLRMS mutation mouza endpoint returned invalid JSON.", "mouzas", response.status);
  }
}

export async function listMutationMouzas(
  input: { districtBbsCode: string; upazilaBbsCode: string; districtName: string; upazilaName: string },
  signal?: AbortSignal,
): Promise<Mouza[]> {
  const url = new URL(`${DLRMS_PUBLIC_API_URL}/mouzas/jl-numbers`);
  url.searchParams.set("DISTRICT_BBS_CODE", input.districtBbsCode);
  url.searchParams.set("UPAZILA_BBS_CODE", input.upazilaBbsCode);

  const payload = await requestMutationJson(url.toString(), signal);
  return records(payload).map((row) => ({
    ID: numberValue(row, "ID", "id"),
    MOUZA_ID: numberValue(row, "MOUZA_ID", "mouzaId"),
    MOUZA_NAME: optionalString(row, "MOUZA_NAME", "mouzaName"),
    JL_NUMBER: optionalString(row, "JL_NUMBER", "jlNumber"),
    DISTRICT_NAME: optionalString(row, "DISTRICT_NAME") || input.districtName,
    UPAZILA_NAME: optionalString(row, "UPAZILA_NAME") || input.upazilaName,
    SURVEY_ID: MUTATION_SURVEY_ID,
    SURVEY_NAME: optionalString(row, "MUTATION_SURVEY_NAME") || MUTATION_SURVEY_LABEL,
    SURVEY_NAME_EN: optionalString(row, "MUTATION_SURVEY_NAME_EN") || MUTATION_SURVEY_KEY,
  }));
}
