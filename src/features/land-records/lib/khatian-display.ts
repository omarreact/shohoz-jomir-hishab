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
  /** Display mapping only — sequential public GUARDIANS entry, not a proven legal link. */
  guardian?: string;
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
  /** Guardian strings left after sequential fill of owner rows. */
  extraGuardians: string[];
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
 * Display rule: place returned GUARDIANS into owner rows in order.
 * This is sequential presentation only — not a claim of verified owner↔guardian pairs.
 */
export function buildOwnerRows(
  owners: string[],
  guardians: string[],
  shares: Array<string | undefined> = [],
): { rows: ParsedOwnerRow[]; extraGuardians: string[] } {
  if (!owners.length && !guardians.length) {
    return { rows: [], extraGuardians: [] };
  }

  if (!owners.length) {
    return {
      rows: guardians.map((g) => ({ name: "—", guardian: g })),
      extraGuardians: [],
    };
  }

  const rows: ParsedOwnerRow[] = owners.map((name, i) => ({
    name,
    guardian: guardians[i]?.trim() || undefined,
    share: shares[i]?.trim() || undefined,
  }));

  const extraGuardians =
    guardians.length > owners.length
      ? guardians.slice(owners.length).filter((g) => g.trim())
      : [];

  return { rows, extraGuardians };
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

/**
 * Build dag rows. Per-dag area/class only when structured public data maps to that dag.
 * Never divides TOTAL_LAND across dags.
 */
export function buildDagRows(
  dagNumbers: string[],
  publicRecord: Record<string, unknown>,
): ParsedDagRow[] {
  const structured =
    publicRecord.DAG_DETAILS ??
    publicRecord.DAGS_DETAIL ??
    publicRecord.PLOTS ??
    publicRecord.LAND_PLOTS ??
    publicRecord.dagDetails ??
    publicRecord.plots;

  const byDag = new Map<string, ParsedDagRow>();

  if (Array.isArray(structured)) {
    for (const item of structured) {
      const row = asRecord(item);
      if (!row) continue;
      const dagNo = pickString(row, [
        "DAG_NO",
        "DAG_NUMBER",
        "DAG",
        "dagNo",
        "dag_number",
        "PLOT_NO",
        "plotNo",
      ]);
      if (!dagNo) continue;
      byDag.set(dagNo, {
        dagNo,
        landClass: pickString(row, ["LAND_CLASS", "CLASS", "জমির_শ্রেণী", "landClass", "TYPE"]),
        area: pickString(row, [
          "SHARE_AREA",
          "KHATIAN_AREA",
          "AREA",
          "LAND_AMOUNT",
          "অংশানুযায়ী_জমির_পরিমাণ",
          "shareArea",
        ]),
        totalArea: pickString(row, ["TOTAL_AREA", "DAG_TOTAL", "দাগের_মোট_পরিমাণ", "totalArea"]),
        khatianShare: pickString(row, ["KHATIAN_SHARE", "SHARE", "অংশ", "hissa"]),
        shareArea: pickString(row, ["SHARE_AREA", "অংশানুযায়ী_জমির_পরিমাণ"]),
      });
    }
  }

  return dagNumbers.map((dagNo) => {
    const hit = byDag.get(dagNo);
    if (hit) return hit;
    return { dagNo };
  });
}

/** Optional owner shares array from public record (same order as OWNERS when provided). */
export function extractOwnerShares(publicRecord: Record<string, unknown>, ownerCount: number): Array<string | undefined> {
  const raw =
    publicRecord.OWNER_SHARES ??
    publicRecord.SHARES ??
    publicRecord.OWNER_SHARE_LIST ??
    publicRecord.ownerShares;

  if (Array.isArray(raw)) {
    return Array.from({ length: ownerCount }, (_, i) => {
      const v = raw[i];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
      const rec = asRecord(v);
      if (rec) return pickString(rec, ["SHARE", "অংশ", "share", "HISS"]);
      return undefined;
    });
  }

  if (typeof raw === "string" && raw.trim()) {
    const parts = splitPublicList(raw);
    return Array.from({ length: ownerCount }, (_, i) => parts[i]);
  }

  return Array.from({ length: ownerCount }, () => undefined);
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
  const ownerNames = splitPublicList(khatian.OWNERS);
  const dagNumbers = splitPublicList(khatian.DAGS);
  const guardians = splitPublicList(khatian.GUARDIANS);
  const publicRecord = (khatian.PUBLIC_RECORD ?? {}) as Record<string, unknown>;
  const reconstruction =
    publicRecord.LANDBD_RECONSTRUCTION && typeof publicRecord.LANDBD_RECONSTRUCTION === "object"
      ? (publicRecord.LANDBD_RECONSTRUCTION as Record<string, unknown>)
      : null;

  const shares = extractOwnerShares(publicRecord, ownerNames.length);
  const { rows: owners, extraGuardians } = buildOwnerRows(ownerNames, guardians, shares);
  const dags = buildDagRows(dagNumbers, publicRecord);

  return {
    kind,
    badgeBn: surveyBadgeBn(kind),
    surveyLabel: khatian.SURVEY_NAME || surveyKey || "—",
    owners,
    dags,
    extraGuardians,
    totalLand: (khatian.TOTAL_LAND || "").trim(),
    isPartial: isPartialPublicRecord(khatian),
    ownerCount: ownerNames.length,
    dagCount: dagNumbers.length,
    publicRecord,
    reconstruction,
    hasOwnerShares: owners.some((o) => Boolean(o.share)),
    hasDagAreas: dags.some((d) => Boolean(d.area || d.shareArea || d.totalArea)),
    hasLandClass: dags.some((d) => Boolean(d.landClass)),
  };
}

export const PUBLIC_FIELD_LABELS_BN: Record<string, string> = {
  KHATIAN_ENTRY_ID: "খতিয়ান এন্ট্রি আইডি",
  JL_NUMBER_ID: "জে.এল. নম্বর আইডি",
  SURVEY_ID: "সার্ভে আইডি",
  IS_LOCKED: "লক অবস্থা",
};
