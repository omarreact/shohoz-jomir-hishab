import {
  FullKhatianSchema,
  type FullKhatian,
  type FullKhatianDag,
  type FullKhatianOwner,
  type KhatianTracking,
  type SourceEvidence,
} from "../full-khatian";
import type { KhatianDetails } from "../types";
import { providers } from "./provider";
import {
  DLRMS_PUBLIC_EXTRA_ENDPOINTS,
  fetchPublicHalSabek,
  fetchPublicKhatianTracking,
} from "./dlrms-public-extras";
import { getLisfProvider } from "./lisf-provider";
import { extractStructuredPublicRecord } from "./public-structured-record";

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

const TRAILING_PARTIAL = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;

function splitVisibleList(value: string | undefined): string[] {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  const visible = raw.replace(TRAILING_PARTIAL, "").replace(/,\s*$/u, "").trim();
  if (!visible) return [];
  return visible
    .split(/[,،;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isTruncated(value: string | undefined): boolean {
  return Boolean(value?.trim() && TRAILING_PARTIAL.test(value.trim()));
}

function publicOwners(base: KhatianDetails): FullKhatianOwner[] {
  return splitVisibleList(base.OWNERS).map((name) => ({
    name,
    source: "DLRMS_PUBLIC" as const,
  }));
}

function publicDags(base: KhatianDetails): FullKhatianDag[] {
  return splitVisibleList(base.DAGS).map((dagNo) => ({
    dagNo,
    source: "DLRMS_PUBLIC" as const,
  }));
}

function trackingMatchesBase(base: KhatianDetails, tracking: KhatianTracking): boolean {
  if (!tracking.khatianNo || tracking.khatianNo.trim() !== base.KHATIAN_NO.trim()) return false;
  if (base.SURVEY_ID && tracking.surveyId && base.SURVEY_ID !== tracking.surveyId) return false;
  if (base.JL_NUMBER_ID && tracking.jlNumberId && base.JL_NUMBER_ID !== tracking.jlNumberId) return false;
  return true;
}

function directPublicWarnings(base: KhatianDetails): string[] {
  const fields = [
    ["OWNERS", base.OWNERS],
    ["DAGS", base.DAGS],
    ["GUARDIANS", base.GUARDIANS],
  ] as const;

  return fields.flatMap(([field, value]) =>
    isTruncated(value)
      ? [
          `DLRMS public ${field} field is truncated. LandBD is showing only the value returned by the official public endpoint and does not reconstruct or expand it.`,
        ]
      : [],
  );
}

export async function getFullKhatian(
  input: FullKhatianInput,
  signal?: AbortSignal,
): Promise<FullKhatian> {
  const fetchedAt = new Date().toISOString();
  const warnings: string[] = [];

  // IMPORTANT: the public record is now source-faithful. No list lookup,
  // mirror lookup, per-Dag lookup, or cross-response reconstruction is applied.
  const base = await providers.landRecords.getKhatian(input.surveyKey, input.id, signal);
  warnings.push(...directPublicWarnings(base));

  let tracking: KhatianTracking | undefined = input.tracking;
  if (!tracking && input.verificationUuid) {
    try {
      tracking = await fetchPublicKhatianTracking(input.verificationUuid, base, signal);
    } catch (error) {
      warnings.push(
        `DLRMS verification lookup failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  if (tracking) {
    tracking = {
      ...tracking,
      matchesBaseRecord: trackingMatchesBase(base, tracking),
    };
    if (!tracking.matchesBaseRecord) {
      warnings.push(
        "The supplied DLRMS verification UUID resolved to a different khatian. Tracking data is shown separately and is not merged into the public record.",
      );
    }
  }

  const locationCodes = {
    divisionBbsCode:
      input.divisionBbsCode ||
      (tracking?.matchesBaseRecord ? tracking.divisionBbsCode : undefined),
    districtBbsCode:
      input.districtBbsCode ||
      (tracking?.matchesBaseRecord ? tracking.districtBbsCode : undefined),
    upazilaBbsCode:
      input.upazilaBbsCode ||
      (tracking?.matchesBaseRecord ? tracking.upazilaBbsCode : undefined),
  };

  const jlNumberId =
    base.JL_NUMBER_ID ||
    (tracking?.matchesBaseRecord ? tracking.jlNumberId : undefined) ||
    input.jlNumberId;

  let halSabek: FullKhatian["halSabek"] = [];
  if (
    locationCodes.divisionBbsCode &&
    locationCodes.districtBbsCode &&
    locationCodes.upazilaBbsCode &&
    jlNumberId
  ) {
    try {
      halSabek = await fetchPublicHalSabek(
        {
          surveyKey: input.surveyKey,
          divisionBbsCode: locationCodes.divisionBbsCode,
          districtBbsCode: locationCodes.districtBbsCode,
          upazilaBbsCode: locationCodes.upazilaBbsCode,
          jlNumberId,
          khatianNo: base.KHATIAN_NO,
        },
        signal,
      );
    } catch (error) {
      warnings.push(
        `DLRMS hal-sabek lookup failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  let lisf;
  try {
    lisf = await getLisfProvider().enrichKhatian(base, locationCodes, signal);
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

  const directStructured = extractStructuredPublicRecord(
    base.PUBLIC_RECORD,
    "DLRMS_PUBLIC",
  );

  // Never reconstruct public DLRMS data by combining multiple public responses.
  // Prefer one direct source representation at a time.
  const directOwners = directStructured.owners.length
    ? directStructured.owners
    : publicOwners(base);
  const directDags = directStructured.dags.length
    ? directStructured.dags
    : publicDags(base);

  const owners =
    lisf.status === "ready" && lisf.owners.length ? lisf.owners : directOwners;
  const dags =
    lisf.status === "ready" && lisf.dags.length ? lisf.dags : directDags;

  const evidence: SourceEvidence[] = [
    {
      field: "official public khatian detail exactly as returned",
      source: "DLRMS_PUBLIC",
      endpoint: `https://gateway.dlrms.land.gov.bd/core-api/api/public/index-khatian/${input.surveyKey}/{id}`,
      official: true,
      access: "public",
      fetchedAt,
    },
  ];

  if (tracking) {
    evidence.push({
      field: "verification tracking (kept separate; not merged into base)",
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
      field: "authorized LISF owner/dag enrichment",
      source: "LISF_AUTHORIZED",
      endpoint: process.env.LISF_BASE_URL?.trim() || "https://api.land.gov.bd/live",
      official: true,
      access: "authorized-private",
      fetchedAt,
    });
  } else if (lisf.status === "mock") {
    evidence.push({
      field: "development LISF-shaped data",
      source: "LISF_MOCK",
      official: false,
      access: "mock",
      fetchedAt,
    });
  }

  return FullKhatianSchema.parse({
    base,
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
