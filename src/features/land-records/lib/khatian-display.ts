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
  /** Individual share when present in structured public data. */
  share?: string;
}

export interface ParsedDagRow {
  dagNo: string;
  landClass?: string;
  /** Dag-specific area only when source provides it for this dag. */
  area?: string;
  totalArea?: string;
  khatianShare?: string;
  shareArea?: string;
}

export interface KhatianDisplayModel {
  kind: SurveyKind;
  badgeBn: string;
  surveyLabel: string;
  owners: ParsedOwnerRow[];
  dags: ParsedDagRow[];
  /**
   * Public GUARDIANS list in upstream order — never paired to owners.
   * LandBD does not claim a legal owner↔guardian relationship from this list alone.
   */
  guardians: string[];
  totalLand: string;
  isPartial: boolean;
  ownerCount: number;
  dagCount: number;
  publicRecord: Record<string, unknown>;
  reconstruction: Record<string, unknown> | null;
  /** True when at least one owner row has a share value. */
  hasOwnerShares: boolean;
  /** True when at least one dag row has a verified area field. */
  hasDagAreas: boolean;
  hasLandClass: boolean;
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
  if (/\bbrs\b|বি\s*আর\s*এস|বিআরএস|settlement/.test(blob)) return "BRS";
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

/**
 * Owners only — never inject GUARDIANS into owner rows.
 * Shares are attached by index only when structured public share data exists.
 */
export function buildOwnerRows(
  owners: string[],
  shares: Array<string | undefined> = [],
): ParsedOwnerRow[] {
  return owners.map((name, i) => ({
    name,
    share: shares[i]?.trim() || undefined,
  }));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(row: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}
