import type { KhatianDetails } from "../types";
import type { FullKhatianDag, FullKhatianOwner, LisfEnrichment } from "../full-khatian";
import { providers } from "./provider";

export interface LisfLocationContext {
  divisionBbsCode?: string;
  districtBbsCode?: string;
  upazilaBbsCode?: string;
}

export interface LisfProvider {
  enrichKhatian(
    base: KhatianDetails,
    contextOrSignal?: LisfLocationContext | AbortSignal,
    signal?: AbortSignal,
  ): Promise<LisfEnrichment>;
}

type JsonRecord = Record<string, unknown>;

const DEFAULT_LISF_BASE_URL = "https://api.land.gov.bd/live";
const REQUEST_TIMEOUT_MS = 20_000;

function splitList(value: string): string[] {
  return value
    .split(/[,،;]+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\.{3,}$/.test(part));
}

function normalizedKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function normalizePlace(value: unknown): string {
  return String(value ?? "")
    .replace(/[–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("bn-BD");
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return Boolean(
    value &&
    typeof value === "object" &&
    "aborted" in value &&
    typeof (value as AbortSignal).addEventListener === "function",
  );
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function unwrapRecord(payload: unknown, depth = 0): JsonRecord | null {
  if (depth > 5) return null;
  const direct = asRecord(payload);
  if (direct) {
    for (const key of ["data", "content", "result", "results", "response"]) {
      if (direct[key] !== undefined) {
        const nested = unwrapRecord(direct[key], depth + 1);
        if (nested) return nested;
      }
    }
    return direct;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = unwrapRecord(item, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

function pick(record: JsonRecord | null, aliases: string[]): unknown {
  if (!record) return undefined;
  const wanted = new Set(aliases.map(normalizedKey));
  for (const [key, value] of Object.entries(record)) {
    if (wanted.has(normalizedKey(key))) return value;
  }
  return undefined;
}

function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function rawString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function lisfBaseUrl(): string {
  return (process.env.LISF_BASE_URL?.trim() || DEFAULT_LISF_BASE_URL).replace(/\/$/, "");
}

function configuredCredentials(): { serviceId: string; accessCode: string } | null {
  const serviceId = process.env.LISF_SERVICE_ID?.trim() || "";
  const accessCode = process.env.LISF_ACCESS_CODE?.trim() || "";
  return serviceId && accessCode ? { serviceId, accessCode } : null;
}

async function resolveBbsContext(
  base: KhatianDetails,
  preset: LisfLocationContext,
  signal?: AbortSignal,
): Promise<LisfLocationContext> {
  let divisionBbsCode = preset.divisionBbsCode;
  let districtBbsCode = preset.districtBbsCode;
  let upazilaBbsCode = preset.upazilaBbsCode;

  if (!divisionBbsCode && base.DIVISION_NAME) {
    const rows = await providers.landRecords.listDivisions(signal);
    divisionBbsCode = rows.find(
      (row) => normalizePlace(row.NAME) === normalizePlace(base.DIVISION_NAME),
    )?.BBS_CODE;
  }

  if (!districtBbsCode && divisionBbsCode && base.DISTRICT_NAME) {
    const rows = await providers.landRecords.listDistricts(divisionBbsCode, signal);
    districtBbsCode = rows.find(
      (row) => normalizePlace(row.NAME) === normalizePlace(base.DISTRICT_NAME),
    )?.BBS_CODE;
  }

  if (!upazilaBbsCode && districtBbsCode && base.UPAZILA_NAME) {
    const rows = await providers.landRecords.listUpazilas(districtBbsCode, signal);
    upazilaBbsCode = rows.find(
      (row) => normalizePlace(row.NAME) === normalizePlace(base.UPAZILA_NAME),
    )?.BBS_CODE;
  }

  return { divisionBbsCode, districtBbsCode, upazilaBbsCode };
}

/**
 * The official LISF integration examples transmit service_id and access_code as
 * HTTPS request headers. They calculate an HMAC in sample code but do not send
 * that calculated value. LandBD follows the documented transmitted fields and
 * does not invent a signature header/canonicalization contract.
 */
async function requestLisf(
  path: string,
  params: Record<string, string | undefined>,
  credentials: { serviceId: string; accessCode: string },
  signal?: AbortSignal,
): Promise<unknown> {
  const url = new URL(`${lisfBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        service_id: credentials.serviceId,
        access_code: credentials.accessCode,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`LISF request failed (${response.status})`);
    }

    const payload = await response.json();
    const record = unwrapRecord(payload);
    const apiError = rawString(pick(record, ["error", "error_message", "message"]));
    if (apiError && /invalid|missing|blocked|restricted|error/i.test(apiError)) {
      throw new Error(`LISF rejected request: ${apiError.slice(0, 160)}`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Official LISF survey_type values for survey Khatian endpoints. */
export function lisfSurveyType(base: Pick<KhatianDetails, "SURVEY_ID" | "SURVEY_NAME">): string | null {
  switch (base.SURVEY_ID) {
    case 7: return "1"; // BRS
    case 1: return "2"; // CS
    case 3: return "3"; // SA
    case 5: return "5"; // DIARA
    case 2: return "6"; // RS
    default: break;
  }

  const name = normalizePlace(base.SURVEY_NAME).replace(/\s+/g, "");
  if (/brs|বিআরএস/.test(name)) return "1";
  if (/cs|সিএস/.test(name)) return "2";
  if (/sa|এসএ/.test(name)) return "3";
  if (/city|সিটি/.test(name)) return "4";
  if (/diara|দিয়ারা|দিয়ারা/.test(name)) return "5";
  if (/rs|আরএস/.test(name)) return "6";
  return null;
}

function parseMoujaPairs(payload: unknown): Array<{ code: string; name: string }> {
  const record = unwrapRecord(payload);
  const codes = list(pick(record, [
    "Mouja Code List",
    "Mouza Code List",
    "mouja_code_list",
    "mouza_code_list",
    "mouja_codes",
    "mouza_codes",
  ]));
  const names = list(pick(record, [
    "Mouja Name List",
    "Mouza Name List",
    "mouja_name_list",
    "mouza_name_list",
    "mouja_names",
    "mouza_names",
  ]));

  const parallel = Array.from({ length: Math.max(codes.length, names.length) }, (_, index) => ({
    code: rawString(codes[index]) || "",
    name: rawString(names[index]) || "",
  })).filter((row) => row.code && row.name);
  if (parallel.length) return parallel;

  const payloadRecord = asRecord(payload);
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payloadRecord?.data)
      ? payloadRecord.data as unknown[]
      : [];
  return rows.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const code = rawString(pick(row, ["mouja_code", "mouza_code", "code", "id"]));
    const name = rawString(pick(row, ["mouja_name", "mouza_name", "name", "title"]));
    return code && name ? [{ code, name }] : [];
  });
}

async function resolveBbsMoujaCode(
  base: KhatianDetails,
  context: LisfLocationContext,
  credentials: { serviceId: string; accessCode: string },
  signal?: AbortSignal,
): Promise<string | null> {
  const districtCode = context.districtBbsCode?.trim();
  const upazilaCode = context.upazilaBbsCode?.trim();
  if (!districtCode || !upazilaCode || !base.MOUZA_NAME?.trim()) return null;

  const payload = await requestLisf("/api/moujalist/", {
    area_code_type: "1",
    division_code: context.divisionBbsCode?.trim(),
    district_code: districtCode,
    upazila_code: upazilaCode,
    return_type: "1",
  }, credentials, signal);

  const wanted = normalizePlace(base.MOUZA_NAME);
  const candidates = parseMoujaPairs(payload).filter((row) => normalizePlace(row.name) === wanted);
  return candidates.length === 1 ? candidates[0].code : null;
}

export function parseLisfDagInfo(payload: unknown): FullKhatianDag[] {
  const record = unwrapRecord(payload);
  const dags = list(pick(record, ["Dag Number List", "dag_number_list", "dag_numbers"]));
  const landTypes = list(pick(record, ["Dag Number Land Type List", "dag_number_land_type_list", "land_type_list"]));
  const totals = list(pick(record, ["Total Area amount List", "Total Area Amount List", "total_area_amount_list", "total_area_list"]));
  const khatianAreas = list(pick(record, ["Khatian Area Amount List", "khatian_area_amount_list", "khatian_area_list"]));

  return dags.flatMap((value, index) => {
    const dagNo = rawString(value);
    if (!dagNo) return [];
    const landType = rawString(landTypes[index]);
    const totalAreaRaw = rawString(totals[index]);
    const khatianAreaRaw = rawString(khatianAreas[index]);
    return [{
      dagNo,
      ...(landType ? { landType } : {}),
      ...(totalAreaRaw ? { totalAreaRaw } : {}),
      ...(khatianAreaRaw ? { khatianAreaRaw } : {}),
      source: "LISF_AUTHORIZED" as const,
    }];
  });
}

export function parseLisfOwnerInfo(payload: unknown): FullKhatianOwner[] {
  const record = unwrapRecord(payload);
  const names = list(pick(record, ["Land Owner Name List", "land_owner_name_list", "owner_name_list"]));
  const guardians = list(pick(record, [
    "Land Owner Father/Husband Name List",
    "land_owner_father_husband_name_list",
    "father_husband_name_list",
  ]));
  const addresses = list(pick(record, ["Land Owner Address List", "land_owner_address_list", "owner_address_list"]));
  const shares = list(pick(record, ["Land Owner Percentage List", "land_owner_percentage_list", "owner_percentage_list"]));

  return names.flatMap((value, index) => {
    const name = rawString(value);
    if (!name) return [];
    const fatherOrHusband = rawString(guardians[index]);
    const address = rawString(addresses[index]);
    const shareRaw = rawString(shares[index]);
    return [{
      name,
      ...(fatherOrHusband ? { fatherOrHusband } : {}),
      ...(address ? { address } : {}),
      ...(shareRaw ? { shareRaw } : {}),
      source: "LISF_AUTHORIZED" as const,
    }];
  });
}

const disabledProvider: LisfProvider = {
  async enrichKhatian() {
    return {
      status: "disabled",
      message: "LISF authorized enrichment is disabled. Public DLRMS data remains available.",
      owners: [],
      dags: [],
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    };
  },
};

/** Development-only adapter; never invents legal detail fields. */
const mockProvider: LisfProvider = {
  async enrichKhatian(base) {
    const owners: FullKhatianOwner[] = splitList(base.OWNERS).map((name) => ({
      name,
      source: "LISF_MOCK",
    }));
    const dags: FullKhatianDag[] = splitList(base.DAGS).map((dagNo) => ({
      dagNo,
      source: "LISF_MOCK",
    }));
    return {
      status: "mock",
      message: "Development mock only; no private LISF request was made.",
      owners,
      dags,
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    };
  },
};

const authorizedProvider: LisfProvider = {
  async enrichKhatian(base, contextOrSignal, explicitSignal) {
    const signal = isAbortSignal(contextOrSignal) ? contextOrSignal : explicitSignal;
    const preset = isAbortSignal(contextOrSignal) ? {} : (contextOrSignal ?? {});
    const credentials = configuredCredentials();
    if (!credentials) {
      return {
        status: "not-configured",
        message: "Authorized LISF service_id/access_code are not configured on the LandBD server.",
        owners: [],
        dags: [],
        referenceKhatians: [],
        referenceDags: [],
        deeds: [],
      };
    }

    const surveyType = lisfSurveyType(base);
    if (!surveyType) {
      return {
        status: "not-configured",
        message: `LISF khatiandaginfo does not have a confirmed survey_type mapping for ${base.SURVEY_NAME || base.SURVEY_ID || "this survey"}.`,
        owners: [],
        dags: [],
        referenceKhatians: [],
        referenceDags: [],
        deeds: [],
      };
    }

    try {
      const context = await resolveBbsContext(base, preset, signal);
      const moujaCode = await resolveBbsMoujaCode(base, context, credentials, signal);
      if (!moujaCode) {
        return {
          status: "not-configured",
          message: "LISF BBS Mouja code could not be resolved uniquely for this Khatian.",
          owners: [],
          dags: [],
          referenceKhatians: [],
          referenceDags: [],
          deeds: [],
        };
      }

      const common = {
        area_code_type: "1",
        division_code: context.divisionBbsCode?.trim(),
        district_code: context.districtBbsCode?.trim(),
        upazila_code: context.upazilaBbsCode?.trim(),
        mouja_code: moujaCode,
        khatian_number: base.KHATIAN_NO.trim(),
        khatian_type: "1",
        survey_type: surveyType,
        return_type: "1",
      };

      const [dagPayload, ownerPayload] = await Promise.all([
        requestLisf("/api/khatiandaginfo/", common, credentials, signal),
        requestLisf("/api/khatianownerinfo/", common, credentials, signal),
      ]);

      const dags = parseLisfDagInfo(dagPayload);
      const owners = parseLisfOwnerInfo(ownerPayload);
      return {
        status: "ready",
        message: "Authorized LISF Khatian owner/Dag enrichment loaded.",
        owners,
        dags,
        referenceKhatians: [],
        referenceDags: [],
        deeds: [],
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Authorized LISF enrichment failed.",
        owners: [],
        dags: [],
        referenceKhatians: [],
        referenceDags: [],
        deeds: [],
      };
    }
  },
};

export function getLisfProvider(): LisfProvider {
  if (process.env.LISF_ENABLED?.trim() !== "1") return disabledProvider;
  if (process.env.LISF_PROVIDER?.trim().toLowerCase() === "mock") return mockProvider;
  return authorizedProvider;
}
