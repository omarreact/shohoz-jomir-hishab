/**
 * Client-side lookup of RS/MS plot areas for Khatian dag numbers.
 * Reuses /api/rajuk/query (same stack as GIS map).
 *
 * IMPORTANT: area is read only from JSON attributes and shown only in Acre.
 * Geometry/polygon coordinates are never used to calculate area here.
 */

import { acreFromJsonAttributes, formatAcre } from "@/src/modules/land/jsonArea";

export type DagMapAreaRow = {
  dagNo: string;
  rsAreaAcre?: number;
  msAreaAcre?: number;
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

type PlotFeature = { attributes?: Record<string, unknown> };

function normalizeToken(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("bn-BD")
    .normalize("NFC");
}

const BN_ROMAN: Record<string, string> = {
  অ: "a", আ: "a", ই: "i", ঈ: "i", উ: "u", ঊ: "u", ঋ: "ri", এ: "e", ঐ: "oi", ও: "o", ঔ: "ou",
  ক: "k", খ: "kh", গ: "g", ঘ: "gh", ঙ: "ng", চ: "ch", ছ: "chh", জ: "j", ঝ: "jh", ঞ: "n",
  ট: "t", ঠ: "th", ড: "d", ঢ: "dh", ণ: "n", ত: "t", থ: "th", দ: "d", ধ: "dh", ন: "n",
  প: "p", ফ: "f", ব: "b", ভ: "bh", ম: "m", য: "y", র: "r", ল: "l", শ: "sh", ষ: "sh", স: "s", হ: "h",
  ড়: "r", ঢ়: "rh", য়: "y", ৎ: "t",
  া: "a", ি: "i", ী: "i", ু: "u", ূ: "u", ৃ: "ri", ে: "e", ৈ: "oi", ো: "o", ৌ: "ou",
  ং: "ng", ঃ: "h", ঁ: "n", "্": "",
};

/**
 * Conservative cross-script key used only to match DLRMS Bangla Mouza names
 * against RAJUK's English JSON labels. Vowels/punctuation are removed so
 * common spelling variants do not create a false mismatch (পাতিরা -> ptr,
 * Patira -> ptr). This never participates in area calculation.
 */
function mouzaPhoneticKey(value: string): string {
  const normalized = normalizeToken(value);
  let roman = "";
  for (const char of normalized) roman += BN_ROMAN[char] ?? char;
  return roman
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/[aeiou]/g, "");
}

function normalizeJl(value: string): string {
  const digits = value.replace(/[^0-9০-৯]/g, "");
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

function areaFromAttributes(attributes: Record<string, unknown>): { acre: number; label: string } | undefined {
  const result = acreFromJsonAttributes(attributes);
  if (!result) return undefined;
  return {
    acre: result.acre,
    label: formatAcre(result.acre),
  };
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
  const address = String(attrs.address_search ?? "");
  const m = address.match(/JL\s*0*(\d+)/i);
  if (m && normalizeJl(m[1]) === want) return true;
  return false;
}

function mouzaMatches(attrs: Record<string, unknown>, mouza: string): boolean {
  if (!mouza.trim()) return true;
  const want = normalizeToken(mouza);
  const wantPhonetic = mouzaPhoneticKey(mouza);
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
    const gotPhonetic = mouzaPhoneticKey(String(c));
    if (wantPhonetic.length >= 3 && gotPhonetic === wantPhonetic) return true;
  }
  const address = normalizeToken(String(attrs.address_search ?? ""));
  if (address.includes(want)) return true;
  const addressMouza = address.split("-jl")[0]?.replace(/^\s*\d+\s*,\s*/, "").trim() ?? "";
  return wantPhonetic.length >= 3 && mouzaPhoneticKey(addressMouza) === wantPhonetic;
}

async function fetchPlotFeatures(params: URLSearchParams, signal?: AbortSignal): Promise<PlotFeature[]> {
  const res = await fetch(`/api/rajuk/query?${params.toString()}`, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PlotFeature[] };
  return Array.isArray(data.features) ? data.features : [];
}

function selectUniqueRsFallback(
  features: PlotFeature[],
  input: DagMapLookupInput,
): { feature?: PlotFeature; note?: string } {
  const jlCandidates = features.filter((feature) => {
    const attrs = feature.attributes ?? {};
    return isRsFeature(attrs) && jlMatches(attrs, input.jlNumber) && Boolean(areaFromAttributes(attrs));
  });

  if (!jlCandidates.length) return {};

  // Mouza evidence is required before accepting one of several identical Dag/JL
  // records. Exact same-script names are preferred; the conservative phonetic
  // key handles Bangla DLRMS vs English RAJUK labels without changing area data.
  const mouzaCandidates = jlCandidates.filter((feature) =>
    mouzaMatches(feature.attributes ?? {}, input.mouzaName),
  );
  if (mouzaCandidates.length === 1) {
    return { feature: mouzaCandidates[0], note: "RS match: plot + JL + mouza" };
  }
  if (mouzaCandidates.length > 1) {
    return { note: "RS area unavailable: multiple plot/JL/mouza matches" };
  }

  if (jlCandidates.length === 1) {
    return { feature: jlCandidates[0], note: "RS match: unique plot + JL" };
  }
  return { note: "RS area unavailable: multiple plot/JL matches" };
}

async function queryPlotsForDag(
  dagNo: string,
  input: DagMapLookupInput,
): Promise<{
  rs?: number;
  ms?: number;
  rsLabel?: string;
  msLabel?: string;
  rsId?: string;
  msId?: string;
  note?: string;
}> {
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

  const features = await fetchPlotFeatures(params, input.signal);

  let rsAcre: number | undefined;
  let msAcre: number | undefined;
  let rsLabel: string | undefined;
  let msLabel: string | undefined;
  let rsId: string | undefined;
  let msId: string | undefined;
  let note: string | undefined;

  for (const feature of features) {
    const attrs = feature.attributes ?? {};
    if (!jlMatches(attrs, input.jlNumber)) continue;
    if (!mouzaMatches(attrs, input.mouzaName)) continue;

    const area = areaFromAttributes(attrs);
    if (!area) continue;

    const objectId = attrs.objectid != null ? String(attrs.objectid) : undefined;

    if (isMsFeature(attrs) && msAcre === undefined) {
      msAcre = area.acre;
      msLabel = area.label;
      msId = objectId;
    } else if (isRsFeature(attrs) && rsAcre === undefined) {
      rsAcre = area.acre;
      rsLabel = area.label;
      rsId = objectId;
    }
  }

  // DLRMS commonly supplies Bangla Mouza/Upazila names while RAJUK publishes
  // English address_search values. The fallback stays JSON-only for area and
  // uses exact numeric JL plus Mouza identity to select the correct RS parcel.
  if (rsAcre === undefined && input.jlNumber.trim()) {
    const fallbackParams = new URLSearchParams({
      action: "plots",
      plot_no: String(Math.trunc(plotNo)),
      kind: "rs",
      jl: input.jlNumber.trim(),
      limit: "100",
    });
    const fallback = selectUniqueRsFallback(
      await fetchPlotFeatures(fallbackParams, input.signal),
      input,
    );
    note = fallback.note;
    if (fallback.feature) {
      const attrs = fallback.feature.attributes ?? {};
      const area = areaFromAttributes(attrs);
      if (area) {
        rsAcre = area.acre;
        rsLabel = area.label;
        rsId = attrs.objectid != null ? String(attrs.objectid) : undefined;
      }
    }
  }

  return { rs: rsAcre, ms: msAcre, rsLabel, msLabel, rsId, msId, note };
}

/**
 * Resolve JSON-derived Acre values for a list of dags.
 * Fault-tolerant: failures return the dag number without an area.
 */
export async function resolveDagMapAreas(input: DagMapLookupInput): Promise<DagMapAreaRow[]> {
  const unique = [...new Set(input.dags.map((d) => d.trim()).filter(Boolean))];
  if (!unique.length) return [];

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
            rsAreaAcre: hit.rs,
            msAreaAcre: hit.ms,
            rsAreaLabel: hit.rsLabel,
            msAreaLabel: hit.msLabel,
            rsFeatureId: hit.rsId,
            msFeatureId: hit.msId,
            matchNote: hit.note,
          } satisfies DagMapAreaRow;
        } catch {
          return { dagNo } satisfies DagMapAreaRow;
        }
      }),
    );
    results.push(...settled);
  }

  const byDag = new Map(results.map((r) => [r.dagNo, r]));
  return input.dags.map((dagNo) => byDag.get(dagNo) ?? { dagNo });
}
