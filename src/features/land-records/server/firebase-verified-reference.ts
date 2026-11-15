import type { KhatianDetails } from "../types";

const TRAILING_PARTIAL = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;

export interface FirebaseVerifiedKhatianReference {
  reportId: string;
  generatedAt?: string;
  owners: string[];
  dags: string[];
  totalLand?: string;
}

function enabled(): boolean {
  const raw = process.env.LANDBD_FIREBASE_VERIFIED_REFERENCE_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  return process.env.NODE_ENV !== "test";
}

function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
}

function splitCurrent(value: string | undefined): string[] {
  return String(value ?? "")
    .replace(TRAILING_PARTIAL, "")
    .split(/[,،;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").normalize("NFC").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function multisetCounts(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of values) {
    const key = normalize(item);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function multisetCovers(container: string[], subset: string[]): boolean {
  const counts = multisetCounts(container);
  for (const item of subset) {
    const key = normalize(item);
    const remaining = counts.get(key) ?? 0;
    if (remaining <= 0) return false;
    counts.set(key, remaining - 1);
  }
  return true;
}

function multisetDelta(container: string[], subset: string[]): string[] {
  const used = multisetCounts(subset);
  const output: string[] = [];
  for (const item of container) {
    const key = normalize(item);
    const remaining = used.get(key) ?? 0;
    if (remaining > 0) used.set(key, remaining - 1);
    else output.push(item);
  }
  return output;
}

export function compatibleFirebaseExpansion(
  currentValue: string | undefined,
  snapshotValues: string[],
): string[] {
  const candidate = snapshotValues.filter(Boolean);
  if (!candidate.length) return [];

  const current = splitCurrent(currentValue);
  if (!current.length) return candidate;
  if (!multisetCovers(candidate, current)) return [];

  const partial = TRAILING_PARTIAL.test(String(currentValue ?? "").trim());
  if (!partial && candidate.length <= current.length) return [];
  return multisetDelta(candidate, current);
}

function sameWhenPresent(snapshotValue: unknown, currentValue: string | undefined): boolean {
  const a = normalize(snapshotValue);
  const b = normalize(currentValue);
  return !a || !b || a === b;
}

export async function fetchFirebaseVerifiedKhatianReference(
  base: KhatianDetails,
  signal?: AbortSignal,
): Promise<FirebaseVerifiedKhatianReference | null> {
  if (!enabled() || signal?.aborted) return null;

  try {
    const { collections, isFirebaseAdminReady } = await import("@/src/modules/database/firebaseAdmin");
    if (!isFirebaseAdminReady() || signal?.aborted) return null;

    const snapshot = await collections.reportVerifications
      .where("recordId", "==", base.ID)
      .limit(25)
      .get();

    const candidates = snapshot.docs
      .map((doc) => doc.data() as Record<string, unknown>)
      .filter((row) =>
        row.documentType === "KHATIAN_VIEW" &&
        normalize(row.khatianNo) === normalize(base.KHATIAN_NO) &&
        sameWhenPresent(row.survey, base.SURVEY_NAME) &&
        sameWhenPresent(row.district, base.DISTRICT_NAME) &&
        sameWhenPresent(row.upazila, base.UPAZILA_NAME) &&
        sameWhenPresent(row.mouza, base.MOUZA_NAME) &&
        sameWhenPresent(row.jlNumber, base.JL_NUMBER)
      )
      .sort((a, b) => String(b.generatedAt ?? "").localeCompare(String(a.generatedAt ?? "")));

    for (const row of candidates) {
      const owners = compatibleFirebaseExpansion(base.OWNERS, stringArray(row.owners));
      const dags = compatibleFirebaseExpansion(base.DAGS, stringArray(row.dags));
      const snapshotTotalLand = String(row.totalLand ?? "").trim();
      const totalLand = !String(base.TOTAL_LAND ?? "").trim() && snapshotTotalLand
        ? snapshotTotalLand
        : undefined;

      if (!owners.length && !dags.length && !totalLand) continue;
      return {
        reportId: String(row.reportId ?? "unknown"),
        generatedAt: typeof row.generatedAt === "string" ? row.generatedAt : undefined,
        owners,
        dags,
        totalLand,
      };
    }
  } catch {
    // Firebase is non-authoritative and never blocks the official path.
  }

  return null;
}
