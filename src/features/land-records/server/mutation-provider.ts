/**
 * Mutation Verification Provider - server-only
 * Fetches public data from mutation.land.gov.bd.
 */

const MUTATION_HOME = "https://mutation.land.gov.bd";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function str(record: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = record[key];
    if (v !== undefined && v !== null && v !== "") return String(v).trim() || undefined;
  }
  return undefined;
}

function unwrap(raw: unknown): unknown {
  const r = asRecord(raw);
  if (!r) return raw;
  if (r.data !== undefined) return r.data;
  if (r.result !== undefined) return r.result;
  return raw;
}

async function mutationGet(path: string, referer: string, signal?: AbortSignal): Promise<unknown> {
  const url = `${MUTATION_HOME}${path}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json, text/html;q=0.9, */*;q=0.8",
      Origin: MUTATION_HOME,
      Referer: referer,
      "User-Agent": "LandBD/1.0",
    },
    signal: signal ?? AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(`Mutation public request failed (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }

  const html = await response.text();
  const jsonMatch =
    html.match(/window\.__(?:DATA|STATE|INITIAL_DATA)__\s*=\s*(\{[\s\S]*?\});/) ||
    html.match(/application\/json"[^>]*>(\{[\s\S]*?})<\/script>/);
  if (jsonMatch?.[1]) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
  }
  return null;
}

export interface MutationVerificationRecord {
  qrKey: string;
  khatianNo?: string;
  applicationNo?: string;
  mutationCaseNo?: string;
  dcrNo?: string;
  office?: string;
  district?: string;
  upazila?: string;
  mouza?: string;
  jlNo?: string;
  owners: string[];
  dags: string[];
  totalLand?: string;
  deedNo?: string;
  deedDate?: string;
  sourceKhatian?: string;
  verifiedAt?: string;
  verificationPageUrl: string;
  structuredResponse: boolean;
}

const QR_KEY_RE = /^[0-9a-f]{6,16}$/i;

export function isValidMutationQrKey(key: string): boolean {
  return QR_KEY_RE.test(key.trim());
}

export function extractMutationQrKey(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /https?:\/\/mutation\.land\.gov\.bd\/qr-vk\/([0-9a-f]{6,16})/i,
  );
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase();
  if (QR_KEY_RE.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

function parseOwnerList(record: JsonRecord): string[] {
  const candidates = [record.OWNERS, record.owners, record.OWNER_NAMES, record.ownerNames, record.OWNER_NAME];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.split(/[,\u060C;]+/).map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(c) && c.length > 0) {
      return (c as unknown[]).map((item) => {
        const r = asRecord(item);
        return r ? (str(r, "name", "NAME", "owner_name", "OWNER_NAME") ?? "") : String(item);
      }).filter(Boolean);
    }
  }
  return [];
}

function parseDagList(record: JsonRecord): string[] {
  const candidates = [record.DAGS, record.dags, record.DAG_NUMBERS, record.dagNumbers, record.DAG_NO];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.split(/[,\u060C;]+/).map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(c) && c.length > 0) {
      return (c as unknown[]).map((item) => {
        const r = asRecord(item);
        return r ? (str(r, "dag_no", "DAG_NO", "dagNo", "dag", "DAG") ?? String(item)) : String(item);
      }).filter(Boolean);
    }
  }
  return [];
}

function parseMutationRecord(qrKey: string, raw: unknown): MutationVerificationRecord {
  const base: MutationVerificationRecord = {
    qrKey,
    owners: [],
    dags: [],
    verificationPageUrl: `${MUTATION_HOME}/qr-vk/${encodeURIComponent(qrKey)}`,
    structuredResponse: false,
  };

  const payload = asRecord(unwrap(raw));
  if (!payload) return base;
  base.structuredResponse = true;

  base.khatianNo = str(payload, "KHATIAN_NO", "khatian_no", "khatianNo", "KHATIAN_NUMBER");
  base.applicationNo = str(payload, "APPLICATION_NO", "application_no", "applicationNo", "APP_NO");
  base.mutationCaseNo = str(payload, "MUTATION_CASE_NO", "mutation_case_no", "mutationCaseNo", "CASE_NO");
  base.dcrNo = str(payload, "DCR_NO", "dcr_no", "dcrNo", "ONLINE_DCR", "online_dcr");
  base.office = str(payload, "OFFICE_NAME", "office_name", "officeName", "LAND_OFFICE");
  base.district = str(payload, "DISTRICT_NAME", "district_name", "districtName", "DISTRICT");
  base.upazila = str(payload, "UPAZILA_NAME", "upazila_name", "upazilaName", "UPAZILA", "CIRCLE");
  base.mouza = str(payload, "MOUZA_NAME", "mouza_name", "mouzaName", "MOUZA");
  base.jlNo = str(payload, "JL_NO", "jl_no", "jlNo", "JL_NUMBER", "jl_number");
  base.totalLand = str(payload, "TOTAL_LAND", "total_land", "totalLand", "TOTAL_AREA");
  base.deedNo = str(payload, "DEED_NO", "deed_no", "deedNo");
  base.deedDate = str(payload, "DEED_DATE", "deed_date", "deedDate");
  base.sourceKhatian = str(payload, "SOURCE_KHATIAN", "source_khatian", "sourceKhatian", "PREVIOUS_KHATIAN", "AGATE_KHATIAN");
  base.verifiedAt = str(payload, "VERIFIED_AT", "verified_at", "verifiedAt", "CREATED_AT");
  base.owners = parseOwnerList(payload);
  base.dags = parseDagList(payload);

  const nested = asRecord(payload.khatian ?? payload.mutation ?? payload.record);
  if (nested) {
    base.khatianNo = base.khatianNo ?? str(nested, "KHATIAN_NO", "khatian_no", "khatianNo");
    base.applicationNo = base.applicationNo ?? str(nested, "APPLICATION_NO", "application_no", "applicationNo");
    base.mutationCaseNo = base.mutationCaseNo ?? str(nested, "MUTATION_CASE_NO", "mutation_case_no", "mutationCaseNo", "CASE_NO");
    base.dcrNo = base.dcrNo ?? str(nested, "DCR_NO", "dcr_no", "dcrNo", "ONLINE_DCR");
    base.office = base.office ?? str(nested, "OFFICE_NAME", "office_name", "officeName");
    base.district = base.district ?? str(nested, "DISTRICT_NAME", "district_name", "districtName");
    base.mouza = base.mouza ?? str(nested, "MOUZA_NAME", "mouza_name", "mouzaName");
    base.totalLand = base.totalLand ?? str(nested, "TOTAL_LAND", "total_land", "totalLand");
    if (!base.owners.length) base.owners = parseOwnerList(nested);
    if (!base.dags.length) base.dags = parseDagList(nested);
  }

  return base;
}

export async function fetchMutationVerification(
  qrKey: string,
  signal?: AbortSignal,
): Promise<MutationVerificationRecord> {
  if (!isValidMutationQrKey(qrKey)) throw new Error(`Invalid mutation QR key: ${qrKey}`);

  const key = qrKey.toLowerCase().trim();
  const referer = `${MUTATION_HOME}/qr-vk/${encodeURIComponent(key)}`;

  const endpoints = [
    `/api/qr-vk/${encodeURIComponent(key)}`,
    `/api/verification/qr-vk/${encodeURIComponent(key)}`,
    `/qr-vk/${encodeURIComponent(key)}`,
  ];

  for (const path of endpoints) {
    try {
      const raw = await mutationGet(path, referer, signal);
      if (raw !== null) return parseMutationRecord(key, raw);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown";
      if (msg.includes("failed (4") || msg.includes("failed (5")) continue;
      throw error;
    }
  }

  return {
    qrKey: key,
    owners: [],
    dags: [],
    verificationPageUrl: `${MUTATION_HOME}/qr-vk/${encodeURIComponent(key)}`,
    structuredResponse: false,
  };
}

export async function fetchMutationDcr(
  dcrKey: string,
  signal?: AbortSignal,
): Promise<MutationVerificationRecord> {
  const key = dcrKey.trim();
  const referer = `${MUTATION_HOME}/online-dcr/${encodeURIComponent(key)}`;
  const endpoints = [
    `/api/online-dcr/${encodeURIComponent(key)}`,
    `/online-dcr/${encodeURIComponent(key)}`,
  ];
  for (const path of endpoints) {
    try {
      const raw = await mutationGet(path, referer, signal);
      if (raw !== null) {
        const record = parseMutationRecord(key, raw);
        record.verificationPageUrl = `${MUTATION_HOME}/online-dcr/${encodeURIComponent(key)}`;
        return record;
      }
    } catch { continue; }
  }
  return {
    qrKey: key, owners: [], dags: [],
    verificationPageUrl: `${MUTATION_HOME}/online-dcr/${encodeURIComponent(key)}`,
    structuredResponse: false,
  };
}
