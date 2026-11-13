import { FullKhatianSchema, type FullKhatian, type FullKhatianDag, type FullKhatianOwner, type KhatianTracking, type SourceEvidence } from "../full-khatian";
import type { KhatianDetails, KhatianIndex, KhatianPage } from "../types";
import { enrichKhatianDetailsWithReferenceDatasets } from "./reference-khatian-resolver";
import { mergeTrackingOwnerRows, reconstructKhatian } from "./khatian-reconstruction";
import { providers } from "./provider";
import { DLRMS_PUBLIC_EXTRA_ENDPOINTS, fetchPublicHalSabek, fetchPublicKhatianTracking } from "./dlrms-public-extras";
import { getLisfProvider } from "./lisf-provider";
import {
  extractStructuredPublicRecord,
  extractVerifiedMirrorCompactRow,
  mirrorRecordMatchesBase,
  fetchStrictPublicMirrorRecord,
  publicMirrorBaseUrl,
  restoreOfficialDetailBase,
} from "./public-structured-record";

export interface FullKhatianInput {
  surveyKey: string;
  id: number;
  owner?: string;
  dagNumber?: string;
  jlNumberId?: number;
  mouzaId?: number;
  verificationUuid?: string;
  /** Internal, already-resolved public tracking record. Never accepted from the browser. */
  tracking?: KhatianTracking;
  divisionBbsCode?: string;
  districtBbsCode?: string;
  upazilaBbsCode?: string;
}

interface BbsLocationCodes {
  divisionBbsCode?: string;
  districtBbsCode?: string;
  upazilaBbsCode?: string;
}

const MAX_FILTERED_DAG_LOOKUPS = 24;
const FILTERED_DAG_CONCURRENCY = 8;
// The ZIP build has a recovery lookup against the unfiltered mouza index.
// Keep it bounded to avoid expensive bulk scans on every truncated record.
const PUBLIC_INDEX_PAGE_SIZE = 100;
const MAX_PUBLIC_INDEX_PAGES = 12;
const PUBLIC_INDEX_CONCURRENCY = 3;
const PUBLIC_INDEX_TIMEOUT_MS = 8_000;

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .replace(/(?:,\s*)?(?:\.{3,}|…)+\s*$/u, "")
    .split(/[,،;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizePlace(value: string | undefined): string {
  return (value ?? "")
    .replace(/[–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("bn-BD");
}

function trackingMatchesBase(base: KhatianDetails, tracking: KhatianTracking): boolean {
  if (!tracking.khatianNo || tracking.khatianNo.trim() !== base.KHATIAN_NO.trim()) return false;
  if (base.SURVEY_ID && tracking.surveyId && base.SURVEY_ID !== tracking.surveyId) return false;
  if (base.JL_NUMBER_ID && tracking.jlNumberId && base.JL_NUMBER_ID !== tracking.jlNumberId) return false;
  if (base.MOUZA_ID && tracking.mouzaId && base.MOUZA_ID !== tracking.mouzaId) return false;
  // DLRMS tracking KHATIAN_ID is an application/tracking identifier and is not
  // the same namespace as /public/index-khatian/{survey}/{id}; do not compare
  // those two unrelated IDs as if they were interchangeable.
  return true;
}

async function resolveBbsCodesFromPublicLocation(
  base: KhatianDetails,
  preset: BbsLocationCodes,
  warnings: string[],
  signal?: AbortSignal,
): Promise<BbsLocationCodes> {
  if (preset.divisionBbsCode && preset.districtBbsCode && preset.upazilaBbsCode) return preset;
  if (!base.DIVISION_NAME || !base.DISTRICT_NAME || !base.UPAZILA_NAME) return preset;

  try {
    let divisionBbsCode = preset.divisionBbsCode;
    if (!divisionBbsCode) {
      const divisions = await providers.landRecords.listDivisions(signal);
      divisionBbsCode = divisions.find(
        (item) => normalizePlace(item.NAME) === normalizePlace(base.DIVISION_NAME),
      )?.BBS_CODE;
    }
    if (!divisionBbsCode) return preset;

    let districtBbsCode = preset.districtBbsCode;
    if (!districtBbsCode) {
      const districts = await providers.landRecords.listDistricts(divisionBbsCode, signal);
      districtBbsCode = districts.find(
        (item) => normalizePlace(item.NAME) === normalizePlace(base.DISTRICT_NAME),
      )?.BBS_CODE;
    }
    if (!districtBbsCode) return { ...preset, divisionBbsCode };

    let upazilaBbsCode = preset.upazilaBbsCode;
    if (!upazilaBbsCode) {
      const upazilas = await providers.landRecords.listUpazilas(districtBbsCode, signal);
      upazilaBbsCode = upazilas.find(
        (item) => normalizePlace(item.NAME) === normalizePlace(base.UPAZILA_NAME),
      )?.BBS_CODE;
    }

    return { divisionBbsCode, districtBbsCode, upazilaBbsCode };
  } catch (error) {
    warnings.push(`DLRMS location-code lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return preset;
  }
}

function publicOwners(base: KhatianDetails): FullKhatianOwner[] {
  // The compact owner list has already been reconciled with matched tracking.
  // Unlike dag numbers, identical owner names can represent distinct source rows.
  const names = splitList(base.OWNERS);
  return names.map((name) => ({ name, source: "DLRMS_PUBLIC" as const }));
}

function publicDags(base: KhatianDetails, tracking?: KhatianTracking): FullKhatianDag[] {
  const dags = unique([
    ...splitList(base.DAGS),
    ...(tracking?.matchesBaseRecord ? splitList(tracking.dags) : []),
  ]);
  return dags.map((dagNo) => ({ dagNo, source: "DLRMS_PUBLIC" as const }));
}

function mergeStructuredOwners(publicRows: FullKhatianOwner[], enriched: FullKhatianOwner[]): FullKhatianOwner[] {
  // Equal names alone do not prove that the source lists refer to the same
  // ownership entry. Parent, share and address can distinguish separate rows.
  const normalize = (text: string | undefined) =>
    (text ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
  const detail = (row: FullKhatianOwner) =>
    Boolean(row.fatherOrHusband || row.shareRaw || row.address);
  const identity = (row: FullKhatianOwner) =>
    [row.name, row.fatherOrHusband, row.shareRaw, row.address].map(normalize).join("|");
  const result: FullKhatianOwner[] = [];
  for (const candidate of [...enriched, ...publicRows]) {
    const sameName = result.filter((row) => normalize(row.name) === normalize(candidate.name));
    if (!sameName.length) {
      result.push(candidate);
      continue;
    }
    if (!detail(candidate) && sameName.some(detail)) continue;
    if (detail(candidate) && sameName.every((row) => !detail(row))) {
      for (let i = result.length - 1; i >= 0; i -= 1) {
        if (normalize(result[i].name) === normalize(candidate.name)) result.splice(i, 1);
      }
      result.push(candidate);
      continue;
    }
    if (!result.some((row) => identity(row) === identity(candidate))) result.push(candidate);
  }
  // Enrichment may identify only one of several same-name owner entries.
  // Keep the original published row count, without copying a guardian/share
  // from the identified person to their still-unlinked namesakes.
  const required = new Map<string, number>();
  for (const owner of publicRows) {
    const name = normalize(owner.name);
    required.set(name, (required.get(name) ?? 0) + 1);
  }
  for (const [name, count] of required) {
    const matching = result.filter((row) => normalize(row.name) === name).length;
    if (matching >= count) continue;
    const existingBySource = new Map<string, number>();
    for (const row of result.filter((item) => normalize(item.name) === name)) {
      existingBySource.set(row.source, (existingBySource.get(row.source) ?? 0) + 1);
    }
    const visitedBySource = new Map<string, number>();
    const fallbacks = publicRows.filter((row) => {
      if (normalize(row.name) !== name) return false;
      const occurrence = (visitedBySource.get(row.source) ?? 0) + 1;
      visitedBySource.set(row.source, occurrence);
      return occurrence > (existingBySource.get(row.source) ?? 0);
    });
    result.push(...fallbacks.slice(0, count - matching));
  }

  // Keep the official compact owner order; newly discovered rows without a
  // compact counterpart follow it. Repeated names use occurrence-aware matching.
  const remaining = [...result];
  const ordered: FullKhatianOwner[] = [];
  for (const row of publicRows) {
    let index = remaining.findIndex((item) =>
      normalize(item.name) === normalize(row.name) && item.source === row.source);
    if (index < 0) index = remaining.findIndex((item) => normalize(item.name) === normalize(row.name));
    if (index >= 0) ordered.push(...remaining.splice(index, 1));
  }
  return [...ordered, ...remaining];
}

function mergeStructuredDags(publicRows: FullKhatianDag[], enriched: FullKhatianDag[]): FullKhatianDag[] {
  // A dag may have more than one verified class/area row. A Map keyed only by
  // dag number silently discarded those legal sub-rows.
  const meaningful = (row: FullKhatianDag) =>
    Boolean(row.landType || row.agriculturalType || row.totalAreaRaw ||
      row.khatianAreaRaw || row.remarks || row.isGovernmentOwned !== undefined ||
      row.isRoad !== undefined || row.isWetland !== undefined ||
      row.isForest !== undefined || row.isReligiousType !== undefined);
  const identity = (row: FullKhatianDag) =>
    [row.dagNo, row.landType, row.agriculturalType, row.totalAreaRaw,
      row.khatianAreaRaw, row.remarks, row.isGovernmentOwned, row.isRoad,
      row.isWetland, row.isForest, row.isReligiousType]
      .map((value) => String(value ?? "").trim()).join("|");
  const result: FullKhatianDag[] = [];
  for (const candidate of [...enriched, ...publicRows]) {
    const sameNo = result.filter((row) => row.dagNo.trim() === candidate.dagNo.trim());
    if (!sameNo.length) {
      result.push(candidate);
      continue;
    }
    if (!meaningful(candidate) && sameNo.some(meaningful)) continue;
    if (meaningful(candidate) && sameNo.every((row) => !meaningful(row))) {
      for (let i = result.length - 1; i >= 0; i -= 1) {
        if (result[i].dagNo.trim() === candidate.dagNo.trim()) result.splice(i, 1);
      }
      result.push(candidate);
      continue;
    }
    if (!result.some((row) => identity(row) === identity(candidate))) result.push(candidate);
  }
  return result;
}

function restoreOfficialListRow(row: KhatianIndex): KhatianIndex {
  const provenance = row.LANDBD_MIRROR_ENRICHMENT;
  if (!provenance) return row;
  return {
    ...row,
    OWNERS: provenance.OWNERS?.official ?? row.OWNERS,
    DAGS: provenance.DAGS?.official ?? row.DAGS,
    GUARDIANS: provenance.GUARDIANS?.official ?? row.GUARDIANS,
    TOTAL_LAND: provenance.TOTAL_LAND?.official ?? row.TOTAL_LAND,
  };
}

async function safeSearch(
  input: Parameters<typeof providers.landRecords.listKhatians>[0],
  warnings: string[],
  signal?: AbortSignal,
): Promise<KhatianPage | null> {
  try {
    const page = await providers.landRecords.listKhatians(input, signal);
    return {
      ...page,
      items: page.items.map(restoreOfficialListRow),
    };
  } catch (error) {
    warnings.push(`DLRMS reconstruction lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
}

/**
 * DLRMS's KHATIAN_NO-filtered index sometimes contains only abbreviated
 * owner/dag lists while an unfiltered mouza index page contains fuller data.
 * Recover only the same official record ID, khatian number and mouza/JL.
 * This is a bounded best-effort fallback, not a claim of completeness.
 */
async function findUnfilteredPublicKhatian(
  base: KhatianDetails,
  surveyKey: string,
  warnings: string[],
  signal?: AbortSignal,
): Promise<KhatianPage["items"][number] | null> {
  if (!base.JL_NUMBER_ID) return null;

  const lookupSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(PUBLIC_INDEX_TIMEOUT_MS)])
    : AbortSignal.timeout(PUBLIC_INDEX_TIMEOUT_MS);
  const loadPage = (page: number) =>
    safeSearch({
      surveyKey,
      jlNumberId: base.JL_NUMBER_ID,
      page,
      pageSize: PUBLIC_INDEX_PAGE_SIZE,
    }, warnings, lookupSignal);
  const findSameRecord = (page: KhatianPage | null) =>
    page?.items.find((row) =>
      row.ID === base.ID &&
      row.KHATIAN_NO.trim() === base.KHATIAN_NO.trim() &&
      row.JL_NUMBER_ID === base.JL_NUMBER_ID &&
      (!base.MOUZA_ID || !row.MOUZA_ID || row.MOUZA_ID === base.MOUZA_ID),
    ) ?? null;

  const first = await loadPage(1);
  if (!first) return null;
  const firstMatch = findSameRecord(first);
  if (firstMatch) return firstMatch;
  if (!first.hasNextPage && !first.total) return null;

  const reportedPages = first.total === undefined
    ? undefined
    : Math.max(1, Math.ceil(first.total / PUBLIC_INDEX_PAGE_SIZE));
  const lastPage = Math.min(reportedPages ?? MAX_PUBLIC_INDEX_PAGES, MAX_PUBLIC_INDEX_PAGES);
  for (let page = 2; page <= lastPage && !lookupSignal.aborted; page += PUBLIC_INDEX_CONCURRENCY) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(PUBLIC_INDEX_CONCURRENCY, lastPage - page + 1) },
        (_, offset) => loadPage(page + offset)),
    );
    for (const candidate of pages) {
      const match = findSameRecord(candidate);
      if (match) return match;
    }
    if (reportedPages === undefined && pages.every((candidate) => !candidate?.hasNextPage)) break;
  }

  if (reportedPages !== undefined && reportedPages > MAX_PUBLIC_INDEX_PAGES) {
    warnings.push("BRS public index recovery reached its page limit; the record may still be incomplete.");
  }
  return null;
}

async function collectFilteredDagRows(
  base: KhatianDetails,
  surveyKey: string,
  warnings: string[],
  signal?: AbortSignal,
): Promise<KhatianPage["items"]> {
  if (!base.JL_NUMBER_ID) return [];

  const allDagNumbers = unique(splitList(base.DAGS));
  if (!allDagNumbers.length) return [];

  const dagNumbers = allDagNumbers.slice(0, MAX_FILTERED_DAG_LOOKUPS);
  if (allDagNumbers.length > dagNumbers.length) {
    warnings.push(
      `DLRMS per-dag reconstruction was limited to the first ${MAX_FILTERED_DAG_LOOKUPS} of ${allDagNumbers.length} published dags.`,
    );
  }

  const output: KhatianPage["items"] = [];
  for (let offset = 0; offset < dagNumbers.length; offset += FILTERED_DAG_CONCURRENCY) {
    const chunk = dagNumbers.slice(offset, offset + FILTERED_DAG_CONCURRENCY);
    const pages = await Promise.all(
      chunk.map((dagNumber) =>
        safeSearch(
          {
            surveyKey,
            jlNumberId: base.JL_NUMBER_ID,
            page: 1,
            pageSize: 100,
            khatianNo: base.KHATIAN_NO,
            dagNumber,
          },
          warnings,
          signal,
        ),
      ),
    );

    for (const page of pages) {
      if (!page) continue;
      for (const row of page.items) {
        if (row.ID === base.ID && row.KHATIAN_NO.trim() === base.KHATIAN_NO.trim()) {
          output.push(row);
        }
      }
    }
  }

  return output;
}

async function fetchFilteredMirrorRecords(
  base: KhatianDetails,
  surveyKey: string,
  warnings: string[],
  signal?: AbortSignal,
): Promise<Record<string, unknown>[]> {
  if (!base.JL_NUMBER_ID) return [];

  const allDagNumbers = unique(splitList(base.DAGS));
  if (!allDagNumbers.length) return [];

  const dagNumbers = allDagNumbers.slice(0, MAX_FILTERED_DAG_LOOKUPS);
  if (allDagNumbers.length > dagNumbers.length) {
    warnings.push(
      `Public mirror per-dag enrichment was limited to the first ${MAX_FILTERED_DAG_LOOKUPS} of ${allDagNumbers.length} published dags.`,
    );
  }

  const output: Record<string, unknown>[] = [];
  for (let offset = 0; offset < dagNumbers.length; offset += FILTERED_DAG_CONCURRENCY) {
    const chunk = dagNumbers.slice(offset, offset + FILTERED_DAG_CONCURRENCY);
    const records = await Promise.all(
      chunk.map((dagNumber) =>
        fetchStrictPublicMirrorRecord(
          {
            surveyKey,
            jlNumberId: base.JL_NUMBER_ID,
            khatianNo: base.KHATIAN_NO,
            id: base.ID,
            mouzaId: base.MOUZA_ID || undefined,
            dagNumber,
          },
          signal,
        ),
      ),
    );
    for (const record of records) {
      if (record) output.push(record);
    }
  }

  return output;
}

function enrichBaseFromTracking(base: KhatianDetails, tracking: KhatianTracking | undefined): KhatianDetails {
  if (!tracking?.matchesBaseRecord) return base;
  const owners = mergeTrackingOwnerRows(base.OWNERS, tracking.owners);
  const dags = unique([...splitList(base.DAGS), ...splitList(tracking.dags)]).join(", ");
  return {
    ...base,
    OWNERS: owners || base.OWNERS,
    DAGS: dags || base.DAGS,
    JL_NUMBER_ID: base.JL_NUMBER_ID || tracking.jlNumberId || 0,
    MOUZA_ID: base.MOUZA_ID || tracking.mouzaId || 0,
    TOTAL_LAND: base.TOTAL_LAND || tracking.totalLandRaw || "",
    DIVISION_NAME: base.DIVISION_NAME || tracking.divisionName || "",
    DISTRICT_NAME: base.DISTRICT_NAME || tracking.districtName || "",
    UPAZILA_NAME: base.UPAZILA_NAME || tracking.upazilaName || "",
    MOUZA_NAME: base.MOUZA_NAME || tracking.mouzaName || "",
    PUBLIC_RECORD: {
      ...(base.PUBLIC_RECORD ?? {}),
      LANDBD_PUBLIC_TRACKING: tracking,
    },
  };
}

function enrichBaseFromStructuredPublic(
  base: KhatianDetails,
  owners: FullKhatianOwner[],
  dags: FullKhatianDag[],
): KhatianDetails {
  // Structured owner rows must not collapse repeated same-name entries.
  const ownerNames = mergeTrackingOwnerRows(base.OWNERS, owners.map((item) => item.name).join(", "));
  const dagNumbers = unique([...splitList(base.DAGS), ...dags.map((item) => item.dagNo)]);
  return {
    ...base,
    OWNERS: ownerNames || base.OWNERS,
    DAGS: dagNumbers.join(", ") || base.DAGS,
    PUBLIC_RECORD: {
      ...(base.PUBLIC_RECORD ?? {}),
      LANDBD_STRUCTURED_PUBLIC_COUNTS: {
        OWNERS: owners.length,
        DAGS: dags.length,
      },
    },
  };
}

function reconstructionStillPartial(base: KhatianDetails): boolean {
  const value = base.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (value as Record<string, unknown>).UPSTREAM_TRUNCATION_REMAINS === true;
}

function hasTruncatedListValue(row: KhatianPage["items"][number]): boolean {
  return [row.OWNERS, row.DAGS, row.GUARDIANS].some((value) => /(?:,\s*)?(?:\.{3,}|…)+\s*$/u.test(value.trim()));
}

function cachedListExpansion(base: KhatianDetails): KhatianPage["items"][number] | null {
  const value = base.PUBLIC_RECORD?.LANDBD_LIST_EXPANSION;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as KhatianPage["items"][number];
  if (
    Number(row.ID) !== base.ID ||
    String(row.KHATIAN_NO ?? "").trim() !== base.KHATIAN_NO.trim()
  ) {
    return null;
  }
  return restoreOfficialListRow(row);
}

export async function getFullKhatian(input: FullKhatianInput, signal?: AbortSignal): Promise<FullKhatian> {
  const warnings: string[] = [];
  const fetchedAt = new Date().toISOString();
  const upstreamBase = await providers.landRecords.getKhatian(input.surveyKey, input.id, signal);
  const officialBase = restoreOfficialDetailBase(upstreamBase);
  const baseDetail: KhatianDetails = {
    ...officialBase,
    MOUZA_ID: officialBase.MOUZA_ID || input.mouzaId || 0,
  };
  const jlNumberId = baseDetail.JL_NUMBER_ID || input.jlNumberId;

  let rebuilt = baseDetail;
  if (jlNumberId) {
    const cachedExact = cachedListExpansion(baseDetail);
    const exactLookup = cachedExact
      ? Promise.resolve({
          items: [cachedExact],
          page: 1,
          pageSize: 1,
          total: 1,
          hasNextPage: false,
        } satisfies KhatianPage)
      : safeSearch({
          surveyKey: input.surveyKey,
          jlNumberId,
          page: 1,
          pageSize: 100,
          khatianNo: baseDetail.KHATIAN_NO,
        }, warnings, signal);
    const ownerLookup = input.owner
      ? safeSearch({
          surveyKey: input.surveyKey,
          jlNumberId,
          page: 1,
          pageSize: 100,
          khatianNo: baseDetail.KHATIAN_NO,
          owner: input.owner,
        }, warnings, signal)
      : Promise.resolve(null);
    const dagLookup = input.dagNumber
      ? safeSearch({
          surveyKey: input.surveyKey,
          jlNumberId,
          page: 1,
          pageSize: 100,
          khatianNo: baseDetail.KHATIAN_NO,
          dagNumber: input.dagNumber,
        }, warnings, signal)
      : Promise.resolve(null);

    const [exactPage, ownerPage, dagPage] = await Promise.all([exactLookup, ownerLookup, dagLookup]);
    const sameRecord = (row: { ID: number; KHATIAN_NO: string }) =>
      row.ID === baseDetail.ID && row.KHATIAN_NO.trim() === baseDetail.KHATIAN_NO.trim();
    const exactRows = exactPage?.items.filter(sameRecord) ?? [];
    const ownerRows = ownerPage?.items.filter(sameRecord) ?? [];
    const dagRows = dagPage?.items.filter(sameRecord) ?? [];
    rebuilt = reconstructKhatian(baseDetail, [...exactRows, ...ownerRows, ...dagRows], {
      owner: input.owner,
      dagNumber: input.dagNumber,
      ownerVerified: Boolean(input.owner && ownerRows.length),
      dagVerified: Boolean(input.dagNumber && dagRows.length),
    });
    // The uploaded ZIP recovered fuller BRS records from the unfiltered mouza
    // index. Only attempt this when the filtered official record is partial.
    if (reconstructionStillPartial(rebuilt) || exactRows.some(hasTruncatedListValue)) {
      const unfiltered = await findUnfilteredPublicKhatian(rebuilt, input.surveyKey, warnings, signal);
      if (unfiltered) rebuilt = reconstructKhatian(rebuilt, [unfiltered]);
    }
  }

  // Per-dag reconstruction and optional verification are independent after the
  // exact row is known. Run them together to avoid serial network latency.
  const filteredDagPromise = rebuilt.JL_NUMBER_ID
    ? collectFilteredDagRows(rebuilt, input.surveyKey, warnings, signal)
    : Promise.resolve([]);
  const trackingPromise: Promise<KhatianTracking | undefined> = input.tracking
    ? Promise.resolve(input.tracking)
    : input.verificationUuid
      ? fetchPublicKhatianTracking(input.verificationUuid, rebuilt, signal)
          .catch((error) => {
            warnings.push(`DLRMS verification lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
            return undefined;
          })
      : Promise.resolve(undefined);

  const [filteredDagRows, resolvedTracking] = await Promise.all([filteredDagPromise, trackingPromise]);
  if (filteredDagRows.length) {
    rebuilt = reconstructKhatian(rebuilt, filteredDagRows);
  }

  let tracking: KhatianTracking | undefined = resolvedTracking;

  if (tracking) {
    tracking = { ...tracking, matchesBaseRecord: trackingMatchesBase(rebuilt, tracking) };
    if (!tracking.matchesBaseRecord) {
      warnings.push("The supplied DLRMS verification UUID resolved to a different khatian; tracking data was not merged into the base record.");
    }
  }

  rebuilt = enrichBaseFromTracking(rebuilt, tracking);

  const officialStructured = extractStructuredPublicRecord(rebuilt.PUBLIC_RECORD, "DLRMS_PUBLIC");
  // Preserve the list before any additional mirror fetch. Newly added names
  // or dag numbers must never be attributed to the government gateway.
  const sourceKey = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
  // Track the number of each published name, not only whether it appears.
  // The second occurrence of a name supplied by a mirror is mirror evidence,
  // even when the official compact index already contains that name once.
  const preMirrorOwnerCounts = new Map<string, number>();
  for (const name of splitList(rebuilt.OWNERS)) {
    const normalized = sourceKey(name);
    preMirrorOwnerCounts.set(normalized, (preMirrorOwnerCounts.get(normalized) ?? 0) + 1);
  }
  // Official structured rows can be fuller than the official compact text.
  // They are first-party evidence, never mirror additions.
  const officialStructuredCounts = new Map<string, number>();
  for (const owner of officialStructured.owners) {
    const normalized = sourceKey(owner.name);
    officialStructuredCounts.set(normalized, (officialStructuredCounts.get(normalized) ?? 0) + 1);
    preMirrorOwnerCounts.set(normalized, Math.max(
      preMirrorOwnerCounts.get(normalized) ?? 0,
      officialStructuredCounts.get(normalized) ?? 0,
    ));
  }
  const preMirrorDags = new Set([
    ...splitList(rebuilt.DAGS).map(sourceKey),
    ...officialStructured.dags.map((dag) => sourceKey(dag.dagNo)),
  ]);
  const [unverifiedMirrorRecord, unverifiedMirrorDagRecords] = await Promise.all([
    rebuilt.JL_NUMBER_ID
      ? fetchStrictPublicMirrorRecord({
          surveyKey: input.surveyKey,
          jlNumberId: rebuilt.JL_NUMBER_ID,
          khatianNo: rebuilt.KHATIAN_NO,
          id: rebuilt.ID,
          mouzaId: rebuilt.MOUZA_ID || undefined,
        }, signal)
      : Promise.resolve(null),
    rebuilt.JL_NUMBER_ID
      ? fetchFilteredMirrorRecords(rebuilt, input.surveyKey, warnings, signal)
      : Promise.resolve([]),
  ]);
  // Reject misidentified mirror payloads before structured extraction.
  const mirrorRecord = mirrorRecordMatchesBase(rebuilt, unverifiedMirrorRecord, input.surveyKey)
    ? unverifiedMirrorRecord : null;
  const mirrorDagRecords = unverifiedMirrorDagRecords.filter((row) =>
    mirrorRecordMatchesBase(rebuilt, row, input.surveyKey));
  if (unverifiedMirrorRecord && !mirrorRecord) {
    warnings.push("Unverified mirror record ID/JL mismatch; source ignored.");
  }
  if (mirrorDagRecords.length !== unverifiedMirrorDagRecords.length) {
    warnings.push("Cross-khatian mirror dag rows rejected before enrichment.");
  }
  let mirrorStructured = extractStructuredPublicRecord(mirrorRecord ?? undefined, "DLRMS_MIRROR");
  for (const record of mirrorDagRecords) {
    const filtered = extractStructuredPublicRecord(record, "DLRMS_MIRROR");
    mirrorStructured = {
      owners: mergeStructuredOwners(mirrorStructured.owners, filtered.owners),
      dags: mergeStructuredDags(mirrorStructured.dags, filtered.dags),
    };
  }
  // Mirror sources sometimes return the complete comma-delimited OWNERS, GUARDIANS
  // and DAGS, without structured sub-record arrays. Previously that payload
  // was fetched but its main lists were never used.
  const verifiedMirrorRows = [mirrorRecord, ...mirrorDagRecords]
    .map((record) => extractVerifiedMirrorCompactRow(rebuilt, record, input.surveyKey))
    .filter((row): row is NonNullable<typeof row> => row !== null);
  if (verifiedMirrorRows.length) {
    rebuilt = reconstructKhatian(rebuilt, verifiedMirrorRows);
  }

  const structuredPublicOwners = mergeStructuredOwners(officialStructured.owners, mirrorStructured.owners);
  const structuredPublicDags = mergeStructuredDags(officialStructured.dags, mirrorStructured.dags);
  rebuilt = enrichBaseFromStructuredPublic(rebuilt, structuredPublicOwners, structuredPublicDags);

  // Capture the official/mirror state before the scoped bundled reference is
  // allowed to fill remaining compact fields. This lets the final owner/dag
  // rows keep truthful per-row provenance.
  const preReferenceOwnerCounts = new Map<string, number>();
  for (const owner of splitList(rebuilt.OWNERS)) {
    const normalized = sourceKey(owner);
    preReferenceOwnerCounts.set(normalized, (preReferenceOwnerCounts.get(normalized) ?? 0) + 1);
  }
  const preReferenceDags = new Set(splitList(rebuilt.DAGS).map(sourceKey));

  const referenceMatch = enrichKhatianDetailsWithReferenceDatasets(rebuilt, input.surveyKey);
  if (referenceMatch) {
    rebuilt = referenceMatch.record;
    warnings.push(
      "সরকারি DLRMS public row আংশিক/compact হওয়ায় registered LandBD reference dataset থেকে অনুপস্থিত display field পূরণ করা হয়েছে। এটি বর্তমান সরকারি প্রত্যয়ন নয়; আইনি ব্যবহারের আগে সরকারি মূল নথির সঙ্গে যাচাই করুন।",
    );
  } else if (reconstructionStillPartial(rebuilt)) {
    warnings.push("DLRMS-এর upstream compact তালিকার কিছু অংশ এখনো truncated/আংশিক। LandBD কেবল উৎসে পাওয়া তথ্যই দেখাচ্ছে; অনুপস্থিত তথ্য অনুমান করে যোগ করা হয়নি।");
  }

  const locationPreset = {
    divisionBbsCode: input.divisionBbsCode || (tracking?.matchesBaseRecord ? tracking.divisionBbsCode : undefined),
    districtBbsCode: input.districtBbsCode || (tracking?.matchesBaseRecord ? tracking.districtBbsCode : undefined),
    upazilaBbsCode: input.upazilaBbsCode || (tracking?.matchesBaseRecord ? tracking.upazilaBbsCode : undefined),
  };

  const locationPromise = resolveBbsCodesFromPublicLocation(
    rebuilt,
    locationPreset,
    warnings,
    signal,
  );

  // LISF is optional enrichment, so start it while DLRMS location/hal-sabek
  // work is progressing instead of waiting for those requests serially.
  const lisfPromise = getLisfProvider()
    .enrichKhatian(rebuilt, locationPreset, signal)
    .catch((error) => ({
      status: "error" as const,
      message: error instanceof Error ? error.message : "LISF enrichment failed",
      owners: [],
      dags: [],
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    }));

  const locationCodes = await locationPromise;
  const halSabekPromise: Promise<FullKhatian["halSabek"]> = (
    locationCodes.divisionBbsCode &&
    locationCodes.districtBbsCode &&
    locationCodes.upazilaBbsCode &&
    rebuilt.JL_NUMBER_ID
  )
    ? fetchPublicHalSabek({
        surveyKey: input.surveyKey,
        divisionBbsCode: locationCodes.divisionBbsCode,
        districtBbsCode: locationCodes.districtBbsCode,
        upazilaBbsCode: locationCodes.upazilaBbsCode,
        jlNumberId: rebuilt.JL_NUMBER_ID,
        khatianNo: rebuilt.KHATIAN_NO,
      }, signal).catch((error) => {
        warnings.push(`DLRMS hal-sabek lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
        return [];
      })
    : Promise.resolve([]);

  const [halSabek, lisf] = await Promise.all([halSabekPromise, lisfPromise]);

  const useAuthorizedLisf = lisf.status === "ready";
  const structuredOwners = useAuthorizedLisf
    ? mergeStructuredOwners(structuredPublicOwners, lisf.owners)
    : structuredPublicOwners;
  const structuredDags = useAuthorizedLisf
    ? mergeStructuredDags(structuredPublicDags, lisf.dags)
    : structuredPublicDags;
  const compactOwnerOccurrences = new Map<string, number>();
  const compactOwners = publicOwners(rebuilt).map((row) => {
    const normalized = sourceKey(row.name);
    const occurrence = (compactOwnerOccurrences.get(normalized) ?? 0) + 1;
    compactOwnerOccurrences.set(normalized, occurrence);
    const officialCount = preMirrorOwnerCounts.get(normalized) ?? 0;
    const preReferenceCount = preReferenceOwnerCounts.get(normalized) ?? 0;
    return {
      ...row,
      source: occurrence <= officialCount
        ? row.source
        : occurrence <= preReferenceCount
          ? ("DLRMS_MIRROR" as const)
          : ("LANDBD_REFERENCE" as const),
    };
  });
  const compactDags = publicDags(rebuilt, tracking).map((row) => {
    const normalized = sourceKey(row.dagNo);
    return {
      ...row,
      source: preMirrorDags.has(normalized)
        ? row.source
        : preReferenceDags.has(normalized)
          ? ("DLRMS_MIRROR" as const)
          : ("LANDBD_REFERENCE" as const),
    };
  });
  const owners = mergeStructuredOwners(compactOwners, structuredOwners);
  const dags = mergeStructuredDags(compactDags, structuredDags);

  const evidence: SourceEvidence[] = [
    {
      field: "base, owners, dags, guardians, location, totalLand",
      source: "DLRMS_PUBLIC",
      endpoint: `https://gateway.dlrms.land.gov.bd/core-api/api/public/index-khatian/${input.surveyKey}/{id}`,
      official: true,
      access: "public-session",
      fetchedAt,
    },
  ];
  if (referenceMatch) {
    evidence.push({
      field: `registered LandBD reference display fallback (${referenceMatch.enrichment.datasetId}): ${referenceMatch.enrichment.changedFields.join(", ")}`,
      source: "LANDBD_REFERENCE",
      official: false,
      access: "bundled-reference",
      fetchedAt,
    });
  }
  if (mirrorRecord || mirrorDagRecords.length) {
    evidence.push({
      field: "third-party mirror owner/dag expansion (not a government-issued record)",
      source: "DLRMS_MIRROR",
      endpoint: `${publicMirrorBaseUrl()}/index-khatian/${input.surveyKey}`,
      official: false,
      access: "public",
      fetchedAt,
    });
  }
  if (mirrorRecord || mirrorDagRecords.length) {
    warnings.push("কিছু তথ্য তৃতীয়-পক্ষের mirror থেকে এসেছে; এটি সরকারি প্রত্যয়ন নয়। মূল পর্চার সঙ্গে যাচাই করুন।");
  }
  if (tracking) {
    evidence.push({
      field: "verification tracking",
      source: "DLRMS_TRACKING",
      endpoint: DLRMS_PUBLIC_EXTRA_ENDPOINTS.tracking,
      official: true,
      access: "public-session",
      fetchedAt,
    });
  }
  if (halSabek.length) {
    evidence.push({
      field: "current/previous dag mapping",
      source: "DLRMS_HAL_SABEK",
      endpoint: DLRMS_PUBLIC_EXTRA_ENDPOINTS.halSabek,
      official: true,
      access: "public-session",
      fetchedAt,
    });
  }
  if (lisf.status === "ready") {
    evidence.push({
      field: "structured owner/dag/tax/reference/deed/formatted record enrichment",
      source: "LISF_AUTHORIZED",
      endpoint: process.env.LISF_BASE_URL?.trim() || "https://api.land.gov.bd/live",
      official: true,
      access: "authorized-private",
      fetchedAt,
    });
  } else if (lisf.status === "mock") {
    evidence.push({
      field: "development LISF-shaped enrichment",
      source: "LISF_MOCK",
      official: false,
      access: "mock",
      fetchedAt,
    });
  }

  return FullKhatianSchema.parse({
    base: rebuilt,
    owners,
    dags,
    tracking,
    halSabek,
    lisf,
    evidence,
    warnings,
    generatedAt: fetchedAt,
  });
}
