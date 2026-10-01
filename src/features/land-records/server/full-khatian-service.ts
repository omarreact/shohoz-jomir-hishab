import { FullKhatianSchema, type FullKhatian, type FullKhatianDag, type FullKhatianOwner, type KhatianTracking, type SourceEvidence } from "../full-khatian";
import type { KhatianDetails, KhatianPage } from "../types";
import { reconstructKhatian } from "./khatian-reconstruction";
import { providers } from "./provider";
import { DLRMS_PUBLIC_EXTRA_ENDPOINTS, fetchPublicHalSabek, fetchPublicKhatianTracking } from "./dlrms-public-extras";
import { getLisfProvider } from "./lisf-provider";
import {
  extractStructuredPublicRecord,
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
  const names = unique([
    ...splitList(base.OWNERS),
    ...(tracking?.matchesBaseRecord ? splitList(tracking.owners) : []),
  ]);
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
  if (!enriched.length) return publicRows;
  const output = [...enriched];
  const known = new Set(enriched.map((item) => item.name.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD")));
  for (const item of publicRows) {
    const key = item.name.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
    if (!known.has(key)) output.push(item);
  }
  return output;
}

function mergeStructuredDags(publicRows: FullKhatianDag[], enriched: FullKhatianDag[]): FullKhatianDag[] {
  if (!enriched.length) return publicRows;
  const byDag = new Map<string, FullKhatianDag>();
  for (const item of publicRows) byDag.set(item.dagNo.trim(), item);
  for (const item of enriched) byDag.set(item.dagNo.trim(), item);
  return [...byDag.values()];
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
  const owners = unique([...splitList(base.OWNERS), ...splitList(tracking.owners)]).join(", ");
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
  const ownerNames = unique([...splitList(base.OWNERS), ...owners.map((item) => item.name)]);
  const dagNumbers = unique([...splitList(base.DAGS), ...dags.map((item) => item.dagNo)]);
  return {
    ...base,
    OWNERS: ownerNames.join(", ") || base.OWNERS,
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
  const [mirrorRecord, mirrorDagRecords] = await Promise.all([
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
  let mirrorStructured = extractStructuredPublicRecord(mirrorRecord ?? undefined, "DLRMS_PUBLIC");
  for (const record of mirrorDagRecords) {
    const filtered = extractStructuredPublicRecord(record, "DLRMS_PUBLIC");
    mirrorStructured = {
      owners: mergeStructuredOwners(mirrorStructured.owners, filtered.owners),
      dags: mergeStructuredDags(mirrorStructured.dags, filtered.dags),
    };
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
  const owners = mergeStructuredOwners(publicOwners(rebuilt, tracking), structuredOwners);
  const dags = mergeStructuredDags(publicDags(rebuilt, tracking), structuredDags);

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
      field: "strict-ID public mirror expansion and filtered structured owner/dag details",
      source: "DLRMS_PUBLIC",
      endpoint: `${publicMirrorBaseUrl()}/index-khatian/${input.surveyKey}`,
      official: false,
      access: "public",
      fetchedAt,
    });
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
