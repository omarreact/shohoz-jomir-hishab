/**
 * Client-side lookup of RS/MS plot areas for Khatian dag numbers.
 * Reuses /api/rajuk/query (same stack as GIS map). Never fabricates area.
 */

import { areaFromGisFeature } from "@/src/modules/land/plotArea";

export type DagMapAreaRow = {
  dagNo: string;
  rsAreaLabel?: string;
  msAreaLabel?: string;
  rsFeatureId?: string;
  msFeatureId?: string;
  matchNote?: string;
};

export type DagMapLookupInput = {
  dags: string[];
  mouzaName: string;
  jlNumber: string;
  upazilaName?: string;
  districtName?: string;
  signal?: AbortSignal;
};

function normalizeToken(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("bn-BD")
    .normalize("NFC");
}

function normalizeJl(value: string): string {
  const digits = value.replace(/[^0-9০-৯]/g, "");
  // map Bangla digits to ASCII
  const map: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  const ascii = [...digits].map((c) => map[c] ?? c).join("");
  return ascii.replace(/^0+/, "") || ascii;
}

function formatAcreLabel(acre: number, shotok: number): string {
  const a = acre.toLocaleString("bn-BD", { maximumFractionDigits: 4, minimumFractionDigits: 0 });
  const s = shotok.toLocaleString("bn-BD", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return `${a} একর (${s} শতাংশ)`;
}

function areaLabelFromFeature(feature: {
  attributes?: Record<string, unknown>;
  geometry?: { rings?: number[][][] };
}): string | undefined {
  const rings = feature.geometry?.rings;
  const attrs = feature.attributes ?? {};
  const measured = areaFromGisFeature({ rings, attributes: attrs });
  if (measured.isValid && measured.acre > 0) {
    return formatAcreLabel(measured.acre, measured.shotok);
  }

  // Attribute fallbacks used by GIS UI (katha)
  const kathaRaw = attrs.rs_plot_area ?? attrs.ms_plot_area ?? attrs.area_katha;
  const katha = typeof kathaRaw === "number" ? kathaRaw : Number(kathaRaw);
  if (Number.isFinite(katha) && katha > 0) {
    // Bangladesh standard: 1 decimal (শতাংশ) ≈ 1.65 katha is regional; use plotArea path if possible.
    // Prefer geodesic path above; here only show katha as secondary label.
    const k = katha.toLocaleString("bn-BD", { maximumFractionDigits: 4 });
    return `${k} কাঠা (মানচিত্র বৈশিষ্ট্য)`;
  }

  return undefined;
}

function isRsFeature(attrs: Record<string, unknown>): boolean {
  return (
    attrs._layer_source === "rs" ||
    attrs.plot_kind === "rs" ||
    (Boolean(attrs.rs_plot_no) && !attrs.ms_plot_no)
  );
}

function isMsFeature(attrs: Record<string, unknown>): boolean {
  return (
    attrs._layer_source === "ms" ||
    attrs.plot_kind === "ms" ||
    Boolean(attrs.ms_plot_no)
  );
}

function jlMatches(attrs: Record<string, unknown>, jl: string): boolean {
  if (!jl) return true;
  const want = normalizeJl(jl);
  if (!want) return true;
  const candidates = [attrs.jl_no, attrs.rs_jl_no, attrs.ms_jl_no, attrs.jl];
  for (const c of candidates) {
    if (c == null) continue;
    if (normalizeJl(String(c)) === want) return true;
  }
  // address_search often embeds "JL 5" / "JL 023"
  const address = String(attrs.address_search ?? "");
  const m = address.match(/JL\s*0*(\d+)/i);
  if (m && normalizeJl(m[1]) === want) return true;
  return false;
}

function mouzaMatches(attrs: Record<string, unknown>, mouza: string): boolean {
  if (!mouza.trim()) return true;
  const want = normalizeToken(mouza);
  const candidates = [
    attrs.mauza,
    attrs.rs_mauza_name,
    attrs.ms_mauza_name,
    attrs.mauza_name,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const got = normalizeToken(String(c));
    if (got === want || got.includes(want) || want.includes(got)) return true;
  }
  const address = normalizeToken(String(attrs.address_search ?? ""));
  return address.includes(want);
}

async function queryPlotsForDag(
  dagNo: string,
  input: DagMapLookupInput,
): Promise<{ rs?: string; ms?: string; rsId?: string; msId?: string }> {
  const plotNo = Number(String(dagNo).replace(/[^0-9০-৯]/g, "").replace(/[০-৯]/g, (d) =>
    String("০১২৩৪৫৬৭৮৯".indexOf(d)),
  ));
  if (!Number.isFinite(plotNo) || plotNo < 0) return {};

  const params = new URLSearchParams({
    action: "plots",
    plot_no: String(Math.trunc(plotNo)),
    limit: "20",
  });
  if (input.mouzaName.trim()) params.set("mouza", input.mouzaName.trim());
  if (input.jlNumber.trim()) params.set("jl", input.jlNumber.trim());
  if (input.upazilaName?.trim()) params.set("upazila", input.upazilaName.trim());

  const res = await fetch(`/api/rajuk/query?${params.toString()}`, {
    method: "GET",
    signal: input.signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return {};

  const data = (await res.json()) as {
    features?: Array<{ attributes?: Record<string, unknown>; geometry?: { rings?: number[][][] } }>;
  };
  const features = Array.isArray(data.features) ? data.features : [];

  let rsLabel: string | undefined;
  let msLabel: string | undefined;
  let rsId: string | undefined;
  let msId: string | undefined;

  for (const feature of features) {
    const attrs = feature.attributes ?? {};
    if (!jlMatches(attrs, input.jlNumber)) continue;
    if (!mouzaMatches(attrs, input.mouzaName)) continue;

    const label = areaLabelFromFeature(feature);
    if (!label) continue;

    const objectId = attrs.objectid != null ? String(attrs.objectid) : undefined;

    if (isMsFeature(attrs) && !msLabel) {
      msLabel = label;
      msId = objectId;
    } else if (isRsFeature(attrs) && !rsLabel) {
      rsLabel = label;
      rsId = objectId;
    } else if (!rsLabel && !msLabel) {
      // Unknown kind — treat as RS-style if only one
      rsLabel = label;
      rsId = objectId;
    }
  }

  return { rs: rsLabel, ms: msLabel, rsId, msId };
}

/**
 * Resolve map-derived areas for a list of dags. Fault-tolerant: failures return empty labels.
 */
export async function resolveDagMapAreas(input: DagMapLookupInput): Promise<DagMapAreaRow[]> {
  const unique = [...new Set(input.dags.map((d) => d.trim()).filter(Boolean))];
  if (!unique.length) return [];

  // Bound concurrency to avoid hammering RAJUK
  const concurrency = 3;
  const results: DagMapAreaRow[] = [];

  for (let i = 0; i < unique.length; i += concurrency) {
    const slice = unique.slice(i, i + concurrency);
    const settled = await Promise.all(
      slice.map(async (dagNo) => {
        try {
          const hit = await queryPlotsForDag(dagNo, input);
          return {
            dagNo,
            rsAreaLabel: hit.rs,
            msAreaLabel: hit.ms,
            rsFeatureId: hit.rsId,
            msFeatureId: hit.msId,
          } satisfies DagMapAreaRow;
        } catch {
          return { dagNo } satisfies DagMapAreaRow;
        }
      }),
    );
    results.push(...settled);
  }

  // Preserve original dag order (including duplicates)
  const byDag = new Map(results.map((r) => [r.dagNo, r]));
  return input.dags.map((dagNo) => byDag.get(dagNo) ?? { dagNo });
}
