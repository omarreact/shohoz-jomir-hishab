import type { FullKhatianDag, FullKhatianOwner, LandRecordSource } from "../full-khatian";
import type { KhatianDetails } from "../types";

type JsonRecord = Record<string, unknown>;

const OWNER_ARRAY_KEYS = new Set([
  "OWNER_DETAILS",
  "OWNERS_DETAILS",
  "OWNER_INFO",
  "OWNERS_INFO",
  "OWNER_LIST",
  "OWNERS_LIST",
  "ownerDetails",
  "ownersDetails",
  "ownerInfo",
  "ownersInfo",
  "ownerList",
  "ownersList",
]);

const DAG_ARRAY_KEYS = new Set([
  "DAG_DETAILS",
  "DAGS_DETAILS",
  "DAG_INFO",
  "DAGS_INFO",
  "DAG_LIST",
  "DAGS_LIST",
  "KHATIAN_DAG_DETAILS",
  "dagDetails",
  "dagsDetails",
  "dagInfo",
  "dagsInfo",
  "dagList",
  "dagsList",
]);

const SENSITIVE_PUBLIC_FIELD = /(authorization|cookie|password|passwd|secret|token|refresh[_-]?token|access[_-]?token)/i;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function primitiveString(record: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return undefined;
}

function optionalBoolean(record: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "y"].includes(normalized)) return true;
      if (["0", "false", "no", "n"].includes(normalized)) return false;
    }
  }
  return undefined;
}

function collectNamedArrays(record: JsonRecord, keys: Set<string>, depth = 0): unknown[][] {
  if (depth > 5) return [];
  const output: unknown[][] = [];
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_PUBLIC_FIELD.test(key)) continue;
    if (keys.has(key) && Array.isArray(value)) output.push(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = asRecord(item);
        if (nested) output.push(...collectNamedArrays(nested, keys, depth + 1));
      }
    } else {
      const nested = asRecord(value);
      if (nested) output.push(...collectNamedArrays(nested, keys, depth + 1));
    }
  }
  return output;
}

function normalizedKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
}

function dedupeOwners(rows: FullKhatianOwner[]): FullKhatianOwner[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = normalizedKey(row.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeDags(rows: FullKhatianDag[]): FullKhatianDag[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = normalizedKey(row.dagNo);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractStructuredPublicRecord(
  record: Record<string, unknown> | undefined,
  source: LandRecordSource = "DLRMS_PUBLIC",
): { owners: FullKhatianOwner[]; dags: FullKhatianDag[] } {
  if (!record) return { owners: [], dags: [] };

  const owners: FullKhatianOwner[] = [];
  for (const array of collectNamedArrays(record, OWNER_ARRAY_KEYS)) {
    for (const item of array) {
      const row = asRecord(item);
      if (!row) continue;
      const name = primitiveString(row, "NAME", "OWNER_NAME", "OWNER", "name", "ownerName");
      if (!name) continue;
      owners.push({
        name,
        fatherOrHusband: primitiveString(
          row,
          "FATHER_OR_HUSBAND",
          "FATHER_HUSBAND",
          "FATHER_HUSBAND_NAME",
          "FATHER_NAME",
          "HUSBAND_NAME",
          "GUARDIAN_NAME",
          "GUARDIAN",
          "fatherOrHusband",
          "fatherName",
          "husbandName",
          "guardianName",
        ),
        address: primitiveString(row, "ADDRESS", "OWNER_ADDRESS", "ADDRESS_DETAILS", "address", "ownerAddress"),
        shareRaw: primitiveString(row, "SHARE", "OWNER_SHARE", "SHARE_AMOUNT", "SHARE_VALUE", "ANSHO", "PART", "share", "ownerShare"),
        source,
      });
    }
  }

  const dags: FullKhatianDag[] = [];
  for (const array of collectNamedArrays(record, DAG_ARRAY_KEYS)) {
    for (const item of array) {
      const row = asRecord(item);
      if (!row) continue;
      const dagNo = primitiveString(row, "DAG_NO", "DAG_NUMBER", "DAG", "PLOT_NO", "PLOT_NUMBER", "dagNo", "dagNumber", "plotNo");
      if (!dagNo) continue;
      dags.push({
        dagNo,
        landType: primitiveString(row, "LAND_TYPE", "LAND_CLASS", "CLASS_NAME", "landType", "landClass"),
        agriculturalType: primitiveString(row, "AGRICULTURAL_TYPE", "AGRI_TYPE", "agriculturalType", "agriType"),
        totalAreaRaw: primitiveString(row, "TOTAL_AREA", "DAG_TOTAL_AREA", "TOTAL_LAND", "LAND_AMOUNT", "totalArea", "totalAreaRaw"),
        khatianAreaRaw: primitiveString(row, "KHATIAN_AREA", "KHATIAN_LAND", "AREA_IN_KHATIAN", "khatianArea", "khatianAreaRaw"),
        isGovernmentOwned: optionalBoolean(row, "IS_GOVERNMENT_OWNED", "GOVERNMENT_OWNED", "isGovernmentOwned"),
        isRoad: optionalBoolean(row, "IS_ROAD", "ROAD", "isRoad"),
        isWetland: optionalBoolean(row, "IS_WETLAND", "WETLAND", "isWetland"),
        isForest: optionalBoolean(row, "IS_FOREST", "FOREST", "isForest"),
        isReligiousType: optionalBoolean(row, "IS_RELIGIOUS_TYPE", "RELIGIOUS_TYPE", "isReligiousType"),
        remarks: primitiveString(row, "REMARKS", "REMARK", "COMMENTS", "remarks", "remark"),
        source,
      });
    }
  }

  return { owners: dedupeOwners(owners), dags: dedupeDags(dags) };
}

/**
 * The provider may enrich compact list fields after fetching the official detail
 * record. Before reconstructing a FullKhatian, reset those compact fields to the
 * exact official detail payload kept in PUBLIC_RECORD. This prevents a different
 * record with the same khatian number from contaminating the selected ID.
 */
export function restoreOfficialDetailBase(base: KhatianDetails): KhatianDetails {
  const record = base.PUBLIC_RECORD;
  if (!record) return base;
  return {
    ...base,
    OWNERS: primitiveString(record, "OWNERS", "owners") ?? base.OWNERS,
    DAGS: primitiveString(record, "DAGS", "dags") ?? base.DAGS,
    GUARDIANS: primitiveString(record, "GUARDIANS", "guardians") ?? base.GUARDIANS,
    TOTAL_LAND: primitiveString(record, "TOTAL_LAND", "totalLand", "LAND_AMOUNT", "landAmount") ?? base.TOTAL_LAND,
  };
}

function records(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["data", "content", "items", "results", "rows"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested.map(asRecord).filter((item): item is JsonRecord => Boolean(item));
    const nestedRecord = asRecord(nested);
    if (nestedRecord) {
      const found = records(nestedRecord);
      if (found.length) return found;
    }
  }
  return [];
}

function mirrorEnabled(): boolean {
  const raw = process.env.DLRMS_ENRICH_ENABLED?.trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

export function publicMirrorBaseUrl(): string {
  const configured = process.env.DLRMS_ENRICH_BASE_URL?.trim();
  return (configured || "https://eporcha.tech/api/dlrms").replace(/\/$/, "");
}

export async function fetchStrictPublicMirrorRecord(
  input: { surveyKey: string; jlNumberId: number; khatianNo: string; id: number },
  signal?: AbortSignal,
): Promise<JsonRecord | null> {
  if (!mirrorEnabled()) return null;

  const url = new URL(`${publicMirrorBaseUrl()}/index-khatian/${encodeURIComponent(input.surveyKey)}`);
  url.searchParams.set("SURVEY", input.surveyKey);
  url.searchParams.set("JL_NUMBER_ID", String(input.jlNumberId));
  url.searchParams.set("KHATIAN_NO", input.khatianNo);
  url.searchParams.set("PAGE_NO", "1");
  url.searchParams.set("PAGE_SIZE", "100");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return records(payload).find((row) => Number(row.ID ?? row.id) === input.id) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
