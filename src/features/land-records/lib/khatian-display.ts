import type { KhatianDetails } from "../types";

/** Survey families used for section layout (not cosmetic themes). */
export type SurveyKind =
  | "CS"
  | "SA"
  | "RS"
  | "BRS"
  | "BS"
  | "MUTATION"
  | "OTHER";

export interface ParsedOwnerRow {
  name: string;
  guardian?: string;
}

export interface KhatianDisplayModel {
  kind: SurveyKind;
  badgeBn: string;
  surveyLabel: string;
  owners: ParsedOwnerRow[];
  dags: string[];
  guardians: string[];
  totalLand: string;
  isPartial: boolean;
  ownerCount: number;
  dagCount: number;
  publicRecord: Record<string, unknown>;
  reconstruction: Record<string, unknown> | null;
}

const TRAILING_PARTIAL = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;

export function splitPublicList(value: string | undefined | null): string[] {
  if (!value?.trim()) return [];
  const cleaned = value.trim().replace(TRAILING_PARTIAL, "").replace(/,\s*$/u, "").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/[,،]/u)
    .map((item) => item.trim())
    .filter((item) => item && item !== "..." && item !== "…");
}

export function detectSurveyKind(
  surveyName: string | undefined,
  surveyKey: string | undefined,
): SurveyKind {
  const blob = `${surveyName ?? ""} ${surveyKey ?? ""}`.toLocaleLowerCase("bn-BD");
  if (/নামজারি|mutation|namjari|মিউটেশন/.test(blob)) return "MUTATION";
  if (/\bcs\b|সি\s*এস|cadastral|সিএস/.test(blob)) return "CS";
  if (/\bsa\b|এস\.?\s*এ|এসএ/.test(blob)) return "SA";
  if (/\brs\b|আর\s*এস|আরএস/.test(blob)) return "RS";
  if (/\bbrs\b|বি\s*আর\s*এস|বিআরএস|ব্রিটশ|settlement/.test(blob)) return "BRS";
  if (/\bbs\b|বি\s*এস|বিএস/.test(blob)) return "BS";
  if (surveyKey === "CS") return "CS";
  if (surveyKey === "SA") return "SA";
  if (surveyKey === "RS") return "RS";
  if (surveyKey === "BRS") return "BRS";
  if (surveyKey === "BS") return "BS";
  return "OTHER";
}

export function surveyBadgeBn(kind: SurveyKind): string {
  switch (kind) {
    case "CS":
      return "সি এস";
    case "SA":
      return "এস এ";
    case "RS":
      return "আর এস";
    case "BRS":
      return "বি আর এস";
    case "BS":
      return "বি এস";
    case "MUTATION":
      return "নামজারি";
    default:
      return "খতিয়ান";
  }
}

export function buildOwnerRows(owners: string[], guardians: string[]): ParsedOwnerRow[] {
  if (!owners.length && !guardians.length) return [];
  if (!owners.length) {
    return guardians.map((g) => ({ name: "—", guardian: g }));
  }
  // Pair by index when counts match; otherwise list owners and show guardians separately.
  if (guardians.length === owners.length) {
    return owners.map((name, i) => ({ name, guardian: guardians[i] || undefined }));
  }
  return owners.map((name) => ({ name }));
}

export function isPartialPublicRecord(khatian: KhatianDetails | null | undefined): boolean {
  const reconstruction = khatian?.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION;
  if (
    reconstruction &&
    typeof reconstruction === "object" &&
    (reconstruction as Record<string, unknown>).UPSTREAM_TRUNCATION_REMAINS === true
  ) {
    return true;
  }
  const fields = [khatian?.OWNERS, khatian?.DAGS, khatian?.GUARDIANS];
  return fields.some((v) => Boolean(v && TRAILING_PARTIAL.test(v)));
}

export function buildKhatianDisplayModel(
  khatian: KhatianDetails,
  surveyKey?: string,
): KhatianDisplayModel {
  const kind = detectSurveyKind(khatian.SURVEY_NAME, surveyKey);
  const owners = splitPublicList(khatian.OWNERS);
  const dags = splitPublicList(khatian.DAGS);
  const guardians = splitPublicList(khatian.GUARDIANS);
  const publicRecord = (khatian.PUBLIC_RECORD ?? {}) as Record<string, unknown>;
  const reconstruction =
    publicRecord.LANDBD_RECONSTRUCTION && typeof publicRecord.LANDBD_RECONSTRUCTION === "object"
      ? (publicRecord.LANDBD_RECONSTRUCTION as Record<string, unknown>)
      : null;

  return {
    kind,
    badgeBn: surveyBadgeBn(kind),
    surveyLabel: khatian.SURVEY_NAME || surveyKey || "—",
    owners: buildOwnerRows(owners, guardians),
    dags,
    guardians,
    totalLand: (khatian.TOTAL_LAND || "").trim(),
    isPartial: isPartialPublicRecord(khatian),
    ownerCount: owners.length,
    dagCount: dags.length,
    publicRecord,
    reconstruction,
  };
}

/** Optional Bangla labels for known public DLRMS keys shown in tech section. */
export const PUBLIC_FIELD_LABELS_BN: Record<string, string> = {
  KHATIAN_ENTRY_ID: "খতিয়ান এন্ট্রি আইডি",
  JL_NUMBER_ID: "জে.এল. নম্বর আইডি",
  SURVEY_ID: "সার্ভে আইডি",
  IS_LOCKED: "লক অবস্থা",
};
