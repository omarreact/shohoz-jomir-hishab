import { FullKhatianSchema, type FullKhatian, type FullKhatianDag, type FullKhatianOwner, type KhatianTracking, type SourceEvidence } from "../full-khatian";
import type { KhatianDetails, KhatianPage } from "../types";
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

function publicOwners(base: KhatianDetails, tracking?: KhatianTracking): FullKhatianOwner[] {
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
    const fallbacks = publicRows.filter((row) => normalize(row.name) === name);
    result.push(...fallbacks.slice(0, count - matching));
  }
  return result;
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

async function safeSearch(
  input: Parameters<typeof providers.landRecords.listKhatians>[0],
  warnings: string[],
  signal?: AbortSignal,
): Promise<KhatianPage | null> {
  try {
    return await providers.landRecords.listKhatians(input, signal);
  } catch (error) {
    warnings.push(`DLRMS reconstruction lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
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
  return row;
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
  const preMirrorOwners = new Set(splitList(rebuilt.OWNERS).map(sourceKey));
  const preMirrorDags = new Set(splitList(rebuilt.DAGS).map(sourceKey));
  const [unverifiedMirrorRecord, unverifiedMirrorDagRecords] = await Promise.all([
    rebuilt.JL_NUMBER_ID
      ? fetchStrictPublicMirrorRecord({
          surveyKey: input.surveyKey,
          jlNumberId: rebuilt.JL_NUMBER_ID,
          khatianNo: rebuilt.KHATIAN_NO,
          id: rebuilt.ID,
        }, signal)
      : Promise.resolve(null),
    rebuilt.JL_NUMBER_ID
      ? fetchFilteredMirrorRecords(rebuilt, input.surveyKey, warnings, signal)
      : Promise.resolve([]),
  ]);
  // Reject misidentified mirror payloads before structured extraction.
  const mirrorRecord = mirrorRecordMatchesBase(rebuilt, unverifiedMirrorRecord)
    ? unverifiedMirrorRecord : null;
  const mirrorDagRecords = unverifiedMirrorDagRecords.filter((row) =>
    mirrorRecordMatchesBase(rebuilt, row));
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
    .map((record) => extractVerifiedMirrorCompactRow(rebuilt, record))
    .filter((row): row is NonNullable<typeof row> => row !== null);
  if (verifiedMirrorRows.length) {
    rebuilt = reconstructKhatian(rebuilt, verifiedMirrorRows);
  }

  const structuredPublicOwners = mergeStructuredOwners(officialStructured.owners, mirrorStructured.owners);
  const structuredPublicDags = mergeStructuredDags(officialStructured.dags, mirrorStructured.dags);
  rebuilt = enrichBaseFromStructuredPublic(rebuilt, structuredPublicOwners, structuredPublicDags);

  if (reconstructionStillPartial(rebuilt)) {
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
  const compactOwners = publicOwners(rebuilt, tracking).map((row) => ({
    ...row,
    source: preMirrorOwners.has(sourceKey(row.name)) ? row.source : ("DLRMS_MIRROR" as const),
  }));
  const compactDags = publicDags(rebuilt, tracking).map((row) => ({
    ...row,
    source: preMirrorDags.has(sourceKey(row.dagNo)) ? row.source : ("DLRMS_MIRROR" as const),
  }));
  const owners = mergeStructuredOwners(compactOwners, structuredOwners);
  const dags = mergeStructuredDags(compactDags, structuredDags);

  const evidence: SourceEvidence[] = [
    {
      field: "base, owners, dags, guardians, location, totalLand",
      source: "DLRMS_PUBLIC",
      endpoint: `https://gateway.dlrms.land.gov.bd/core-api/api/public/index-khatian/${input.surveyKey}/{id}`,
      official: true,
      access: "public",
      fetchedAt,
    },
  ];
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
      access: "public",
      fetchedAt,
    });
  }
  if (halSabek.length) {
    evidence.push({
      field: "current/previous dag mapping",
      source: "DLRMS_HAL_SABEK",
      endpoint: DLRMS_PUBLIC_EXTRA_ENDPOINTS.halSabek,
      official: true,
      access: "public",
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
