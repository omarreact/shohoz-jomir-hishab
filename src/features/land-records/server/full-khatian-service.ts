import { FullKhatianSchema, type FullKhatian, type FullKhatianDag, type FullKhatianOwner, type KhatianTracking, type SourceEvidence } from "../full-khatian";
import type { KhatianDetails, KhatianPage } from "../types";
import { reconstructKhatian } from "./khatian-reconstruction";
import { providers } from "./provider";
import { DLRMS_PUBLIC_EXTRA_ENDPOINTS, fetchPublicHalSabek, fetchPublicKhatianTracking } from "./dlrms-public-extras";
import { getLisfProvider } from "./lisf-provider";

export interface FullKhatianInput {
  surveyKey: string;
  id: number;
  owner?: string;
  dagNumber?: string;
  jlNumberId?: number;
  verificationUuid?: string;
  divisionBbsCode?: string;
  districtBbsCode?: string;
  upazilaBbsCode?: string;
}

interface BbsLocationCodes {
  divisionBbsCode?: string;
  districtBbsCode?: string;
  upazilaBbsCode?: string;
}

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

export async function getFullKhatian(input: FullKhatianInput, signal?: AbortSignal): Promise<FullKhatian> {
  const warnings: string[] = [];
  const fetchedAt = new Date().toISOString();
  const baseDetail = await providers.landRecords.getKhatian(input.surveyKey, input.id, signal);
  const jlNumberId = baseDetail.JL_NUMBER_ID || input.jlNumberId;

  let rebuilt = baseDetail;
  if (jlNumberId) {
    const exactLookup = safeSearch({
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
      row.ID === baseDetail.ID || row.KHATIAN_NO.trim() === baseDetail.KHATIAN_NO.trim();
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

  let tracking: KhatianTracking | undefined;
  if (input.verificationUuid) {
    try {
      tracking = await fetchPublicKhatianTracking(input.verificationUuid, rebuilt, signal);
      if (!tracking.matchesBaseRecord) {
        warnings.push("The supplied DLRMS verification UUID resolved to a different khatian; tracking data was not merged into the base record.");
      }
    } catch (error) {
      warnings.push(`DLRMS verification lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  rebuilt = enrichBaseFromTracking(rebuilt, tracking);

  const locationCodes = await resolveBbsCodesFromPublicLocation(rebuilt, {
    divisionBbsCode: input.divisionBbsCode || (tracking?.matchesBaseRecord ? tracking.divisionBbsCode : undefined),
    districtBbsCode: input.districtBbsCode || (tracking?.matchesBaseRecord ? tracking.districtBbsCode : undefined),
    upazilaBbsCode: input.upazilaBbsCode || (tracking?.matchesBaseRecord ? tracking.upazilaBbsCode : undefined),
  }, warnings, signal);

  let halSabek: FullKhatian["halSabek"] = [];
  if (
    locationCodes.divisionBbsCode &&
    locationCodes.districtBbsCode &&
    locationCodes.upazilaBbsCode &&
    rebuilt.JL_NUMBER_ID
  ) {
    try {
      halSabek = await fetchPublicHalSabek({
        surveyKey: input.surveyKey,
        divisionBbsCode: locationCodes.divisionBbsCode,
        districtBbsCode: locationCodes.districtBbsCode,
        upazilaBbsCode: locationCodes.upazilaBbsCode,
        jlNumberId: rebuilt.JL_NUMBER_ID,
        khatianNo: rebuilt.KHATIAN_NO,
      }, signal);
    } catch (error) {
      warnings.push(`DLRMS hal-sabek lookup failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  let lisf;
  try {
    lisf = await getLisfProvider().enrichKhatian(rebuilt, signal);
  } catch (error) {
    lisf = {
      status: "error" as const,
      message: error instanceof Error ? error.message : "LISF enrichment failed",
      owners: [],
      dags: [],
      referenceKhatians: [],
      referenceDags: [],
      deeds: [],
    };
  }

  const useAuthorizedLisf = lisf.status === "ready";
  const owners = mergeStructuredOwners(publicOwners(rebuilt, tracking), useAuthorizedLisf ? lisf.owners : []);
  const dags = mergeStructuredDags(publicDags(rebuilt, tracking), useAuthorizedLisf ? lisf.dags : []);

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
