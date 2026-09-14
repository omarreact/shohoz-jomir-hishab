/**
 * Client-side RS plot area lookup for Khatian Dag numbers.
 *
 * Production contract:
 * - Query RAJUK RS Plot layer (FeatureServer/0) by Dag only.
 * - Apply JL -> Mouza -> optional Upazila/Thana identity checks in memory.
 * - Accept exactly one RS parcel; zero/multiple candidates fail closed.
 * - Read area only from scalar JSON Shape__Area with a verified unit contract.
 * - Never calculate area from geometry, rings, coordinates or Shape__Length.
 */

import { acreFromJsonAttributes, formatAcre } from "@/src/modules/land/jsonArea";
import {
  mouzaNamesMatch,
  normalizeAdminName,
  normalizeMouzaName,
} from "./mouza-normalize";

export type DagMatchDiagnostics = {
  dagNo: string;
  rawCandidateCount: number;
  dagCandidateCount: number;
  jlCandidateCount: number;
  mouzaCandidateCount: number;
  adminCandidateCount: number | null;
  finalCandidateCount: number;
  status: "resolved" | "unresolved";
  reason:
    | "resolved"
    | "invalid_dag"
    | "missing_jl"
    | "missing_mouza"
    | "zero_dag_candidates"
    | "zero_jl_candidates"
    | "zero_mouza_candidates"
    | "zero_admin_candidates"
    | "ambiguous_identity"
    | "missing_shape_area"
    | "invalid_shape_area_unit"
    | "request_failed";
  objectId?: string;
  areaAcre?: number;
  areaSourceField?: "Shape__Area";
  areaSourceUnit?: string;
  normalizedMouza?: string;
};

export type DagMapAreaRow = {
  dagNo: string;
  rsAreaAcre?: number;
  msAreaAcre?: number;
  rsAreaLabel?: string;
  msAreaLabel?: string;
  rsFeatureId?: string;
  msFeatureId?: string;
  matchNote?: string;
  diagnostics?: DagMatchDiagnostics;
};

export type DagMapLookupInput = {
  dags: string[];
  mouzaName: string;
  jlNumber: string;
  upazilaName?: string;
  districtName?: string;
  signal?: AbortSignal;
};

type PlotFeature = { attributes?: Record<string, unknown> };

type CandidateSelection = {
  feature?: PlotFeature;
  area?: { acre: number; label: string; sourceUnit: string };
  diagnostics: DagMatchDiagnostics;
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

function asciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));
}

export function normalizeJl(value: unknown): string {
  const digits = asciiDigits(String(value ?? "")).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+/, "") || "0";
}

export function normalizeDagNumber(value: unknown): string {
  const raw = asciiDigits(String(value ?? ""))
    .trim()
    .replace(/^RS\s*[-:]?\s*/i, "");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+/, "") || "0";
}

function parseAddressSearch(value: unknown): {
  plotNo: string;
  mouza: string;
  jl: string;
  admin: string;
} {
  const raw = String(value ?? "").trim();
  if (!raw) return { plotNo: "", mouza: "", jl: "", admin: "" };
  const match = raw.match(/^\s*([^,]+)\s*,\s*(.+?)\s*-\s*JL\s*0*(\d+)\s*,\s*(.+?)\s*$/i);
  if (!match) return { plotNo: "", mouza: "", jl: "", admin: "" };
  return {
    plotNo: normalizeDagNumber(match[1]),
    mouza: match[2].trim(),
    jl: normalizeJl(match[3]),
    admin: match[4].trim(),
  };
}

function featureIdentity(feature: PlotFeature) {
  const attrs = feature.attributes ?? {};
  const parsed = parseAddressSearch(attrs.address_search);
  const objectId = attrs.objectid != null ? String(attrs.objectid) : "";
  const pGuid = attrs.p_guid != null ? String(attrs.p_guid) : "";
  return {
    attrs,
    objectId,
    uniqueKey: pGuid || objectId || JSON.stringify([
      attrs.plot_no,
      attrs.rs_plot_no,
      attrs.jl_no,
      attrs.rs_jl_no,
      attrs.mauza,
      attrs.rs_mauza_name,
      attrs.address_search,
    ]),
    parsed,
  };
}

function dedupeFeatures(features: PlotFeature[]): PlotFeature[] {
  const seen = new Set<string>();
  const output: PlotFeature[] = [];
  for (const feature of features) {
    const key = featureIdentity(feature).uniqueKey;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(feature);
  }
  return output;
}

function isRsFeature(feature: PlotFeature): boolean {
  const attrs = feature.attributes ?? {};
  return (
    attrs._layer_source === "rs"
    || attrs.plot_kind === "rs"
    || (Boolean(attrs.rs_plot_no) && !attrs.ms_plot_no)
  );
}

function dagMatches(feature: PlotFeature, dagNo: string): boolean {
  const { attrs, parsed } = featureIdentity(feature);
  const wanted = normalizeDagNumber(dagNo);
  if (!wanted) return false;
  const candidates = [attrs.plot_no, attrs.rs_plot_no, parsed.plotNo];
  return candidates.some((value) => normalizeDagNumber(value) === wanted);
}

function jlMatches(feature: PlotFeature, jlNumber: string): boolean {
  const { attrs, parsed } = featureIdentity(feature);
  const wanted = normalizeJl(jlNumber);
  if (!wanted) return false;
  const candidates = [attrs.jl_no, attrs.rs_jl_no, attrs.jl, parsed.jl];
  return candidates.some((value) => normalizeJl(value) === wanted);
}

function featureMouzaMatches(feature: PlotFeature, mouzaName: string): boolean {
  const { attrs, parsed } = featureIdentity(feature);
  const candidates = [attrs.mauza, attrs.rs_mauza_name, attrs.mauza_name, parsed.mouza];
  return candidates.some((value) => mouzaNamesMatch(value, mouzaName));
}

function featureAdminMatches(feature: PlotFeature, adminName: string): boolean {
  const wanted = normalizeAdminName(adminName);
  if (!wanted) return false;
  const { attrs, parsed } = featureIdentity(feature);
  const candidates = [attrs.thana_upazila, attrs.upazila_ps, attrs.upazila, parsed.admin];
  return candidates.some((value) => normalizeAdminName(value) === wanted);
}

/**
 * Extract Acre exclusively from Shape__Area in the normalized JSON attributes.
 * Even if area_acre exists, this path deliberately reconstructs the extractor
 * input so Shape__Area is the sole scalar source field.
 */
function areaFromShapeJson(attributes: Record<string, unknown>): {
  acre: number;
  label: string;
  sourceUnit: string;
} | null {
  const shapeArea = attributes.Shape__Area ?? attributes.shape__area;
  if (shapeArea == null || String(shapeArea).trim() === "") return null;

  const explicitUnit = attributes.shape_area_unit
    ?? attributes.shapeAreaUnit
    ?? attributes.Shape__Area_Unit
    ?? attributes.shape__area_unit
    ?? (attributes.area_source_field === "Shape__Area" ? attributes.area_source_unit : undefined);

  const result = acreFromJsonAttributes({
    Shape__Area: shapeArea,
    shape_area_unit: explicitUnit,
  });
  if (!result || result.sourceField !== "Shape__Area") return null;

  return {
    acre: result.acre,
    label: formatAcre(result.acre),
    sourceUnit: result.sourceUnit,
  };
}

export function selectUniqueRsCandidate(
  features: PlotFeature[],
  input: Pick<DagMapLookupInput, "mouzaName" | "jlNumber" | "upazilaName"> & { dagNo: string },
): CandidateSelection {
  const diagnostics: DagMatchDiagnostics = {
    dagNo: input.dagNo,
    rawCandidateCount: features.length,
    dagCandidateCount: 0,
    jlCandidateCount: 0,
    mouzaCandidateCount: 0,
    adminCandidateCount: null,
    finalCandidateCount: 0,
    status: "unresolved",
    reason: "zero_dag_candidates",
    normalizedMouza: normalizeMouzaName(input.mouzaName),
  };

  if (!normalizeDagNumber(input.dagNo)) {
    diagnostics.reason = "invalid_dag";
    return { diagnostics };
  }
  if (!normalizeJl(input.jlNumber)) {
    diagnostics.reason = "missing_jl";
    return { diagnostics };
  }
  if (!normalizeMouzaName(input.mouzaName)) {
    diagnostics.reason = "missing_mouza";
    return { diagnostics };
  }

  const rawRs = dedupeFeatures(features.filter(isRsFeature));
  const dagCandidates = rawRs.filter((feature) => dagMatches(feature, input.dagNo));
  diagnostics.dagCandidateCount = dagCandidates.length;
  if (!dagCandidates.length) {
    diagnostics.reason = "zero_dag_candidates";
    return { diagnostics };
  }

  const jlCandidates = dagCandidates.filter((feature) => jlMatches(feature, input.jlNumber));
  diagnostics.jlCandidateCount = jlCandidates.length;
  if (!jlCandidates.length) {
    diagnostics.reason = "zero_jl_candidates";
    return { diagnostics };
  }

  const mouzaCandidates = jlCandidates.filter((feature) => featureMouzaMatches(feature, input.mouzaName));
  diagnostics.mouzaCandidateCount = mouzaCandidates.length;
  if (!mouzaCandidates.length) {
    diagnostics.reason = "zero_mouza_candidates";
    return { diagnostics };
  }

  let finalCandidates = mouzaCandidates;

  // Upazila/Thana is a secondary ambiguity breaker. A unique Dag+JL+Mouza
  // parcel is already sufficient; an admin label mismatch must not reject a
  // unique Patira parcel where DLRMS and RAJUK use different admin systems.
  if (finalCandidates.length > 1 && input.upazilaName?.trim()) {
    const adminCandidates = finalCandidates.filter((feature) =>
      featureAdminMatches(feature, input.upazilaName || ""),
    );
    diagnostics.adminCandidateCount = adminCandidates.length;
    finalCandidates = adminCandidates;
    if (!finalCandidates.length) {
      diagnostics.reason = "zero_admin_candidates";
      diagnostics.finalCandidateCount = 0;
      return { diagnostics };
    }
  }

  finalCandidates = dedupeFeatures(finalCandidates);
  diagnostics.finalCandidateCount = finalCandidates.length;
  if (finalCandidates.length !== 1) {
    diagnostics.reason = "ambiguous_identity";
    return { diagnostics };
  }

  const feature = finalCandidates[0];
  const attrs = feature.attributes ?? {};
  const shapeAreaPresent = attrs.Shape__Area != null || attrs.shape__area != null;
  if (!shapeAreaPresent) {
    diagnostics.reason = "missing_shape_area";
    return { diagnostics };
  }

  const area = areaFromShapeJson(attrs);
  if (!area) {
    diagnostics.reason = "invalid_shape_area_unit";
    return { diagnostics };
  }

  diagnostics.status = "resolved";
  diagnostics.reason = "resolved";
  diagnostics.objectId = attrs.objectid != null ? String(attrs.objectid) : undefined;
  diagnostics.areaAcre = area.acre;
  diagnostics.areaSourceField = "Shape__Area";
  diagnostics.areaSourceUnit = area.sourceUnit;

  return { feature, area, diagnostics };
}

async function fetchRsCandidatesByDag(dagNo: string, signal?: AbortSignal): Promise<PlotFeature[]> {
  const normalizedDag = normalizeDagNumber(dagNo);
  if (!normalizedDag) return [];

  // Broad identity query by Dag only. No address_search/Mouza/JL/Upazila SQL
  // filters are allowed here; all identity checks happen deterministically in
  // memory after the candidate list is returned from RS FeatureServer layer 0.
  const params = new URLSearchParams({
    action: "plots",
    kind: "rs",
    plot_no: normalizedDag,
    limit: "2000",
  });

  const response = await fetch(`/api/rajuk/query?${params.toString()}`, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`RAJUK candidate query failed (${response.status})`);
  const data = (await response.json()) as { features?: PlotFeature[] };
  return Array.isArray(data.features) ? data.features : [];
}

function logDiagnostics(diagnostics: DagMatchDiagnostics) {
  // Intentional production diagnostic: contains parcel identity counts only,
  // no auth material or personal data. This is used to diagnose unresolved
  // Khatian Dags such as BRS 41/312 without weakening fail-closed matching.
  console.info("[LandBD][RAJUK Dag Acre]", diagnostics);
}

async function queryRsAreaForDag(dagNo: string, input: DagMapLookupInput): Promise<DagMapAreaRow> {
  try {
    const features = await fetchRsCandidatesByDag(dagNo, input.signal);
    const selected = selectUniqueRsCandidate(features, {
      dagNo,
      mouzaName: input.mouzaName,
      jlNumber: input.jlNumber,
      upazilaName: input.upazilaName,
    });
    logDiagnostics(selected.diagnostics);

    if (!selected.feature || !selected.area) {
      return {
        dagNo,
        rsAreaLabel: "—",
        matchNote: selected.diagnostics.reason,
        diagnostics: selected.diagnostics,
      };
    }

    const attrs = selected.feature.attributes ?? {};
    return {
      dagNo,
      rsAreaAcre: selected.area.acre,
      rsAreaLabel: selected.area.label,
      rsFeatureId: attrs.objectid != null ? String(attrs.objectid) : undefined,
      matchNote: "RS match: exact Dag + JL + normalized Mouza",
      diagnostics: selected.diagnostics,
    };
  } catch {
    const diagnostics: DagMatchDiagnostics = {
      dagNo,
      rawCandidateCount: 0,
      dagCandidateCount: 0,
      jlCandidateCount: 0,
      mouzaCandidateCount: 0,
      adminCandidateCount: null,
      finalCandidateCount: 0,
      status: "unresolved",
      reason: "request_failed",
      normalizedMouza: normalizeMouzaName(input.mouzaName),
    };
    logDiagnostics(diagnostics);
    return { dagNo, rsAreaLabel: "—", matchNote: diagnostics.reason, diagnostics };
  }
}

/** Resolve JSON-derived RS Acre values for a list of Khatian Dags. */
export async function resolveDagMapAreas(input: DagMapLookupInput): Promise<DagMapAreaRow[]> {
  const unique = [...new Set(input.dags.map((dag) => dag.trim()).filter(Boolean))];
  if (!unique.length) return [];

  const concurrency = 3;
  const results: DagMapAreaRow[] = [];

  for (let index = 0; index < unique.length; index += concurrency) {
    const slice = unique.slice(index, index + concurrency);
    const settled = await Promise.all(
      slice.map((dagNo) => queryRsAreaForDag(dagNo, input)),
    );
    results.push(...settled);
  }

  const byDag = new Map(results.map((row) => [row.dagNo, row]));
  return input.dags.map((dagNo) => byDag.get(dagNo) ?? { dagNo, rsAreaLabel: "—" });
}
