import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export type PlotMode = "rs" | "ms";

export type MsPlotLocationFilter = {
  district?: string;
  upazila?: string;
  mouza?: string;
  jl?: string | number;
};

const BANGLA_TO_ASCII: Record<string, string> = {
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

function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => BANGLA_TO_ASCII[digit] ?? digit);
}

export function normalizePlotInput(raw: string, mode: PlotMode): string {
  const ascii = toAsciiDigits(raw.trim());
  const prefix = mode === "rs"
    ? /^(?:RS|আর\s*এস)[\s\-_]*/i
    : /^(?:MS|এম\s*এস)[\s\-_]*/i;
  return ascii.replace(prefix, "").replace(/\s+/g, "").replace(/^0+/, "") || "0";
}

export function plotNo(feature: RajukPlotFeature, mode: PlotMode): string {
  const attributes = feature.attributes as Record<string, unknown>;
  return String(
    mode === "rs"
      ? attributes.rs_plot_no ?? attributes.plot_no ?? ""
      : attributes.ms_plot_no ?? attributes.plot_no ?? "",
  ).trim();
}

export function buildMsPlotSearchParams(
  rawPlotNo: string,
  location: MsPlotLocationFilter = {},
  limit = 100,
): URLSearchParams {
  const bare = normalizePlotInput(rawPlotNo, "ms");
  const params = new URLSearchParams({
    action: "plots",
    kind: "ms",
    ms_plot_no: bare,
    limit: String(Math.min(Math.max(Math.trunc(limit), 1), 2000)),
  });

  const upazila = location.upazila?.trim();
  const mouza = location.mouza?.trim();
  const jl = location.jl == null ? "" : String(location.jl).trim();

  // MS FeatureServer/5 has no dedicated administrative GUID columns. The
  // existing RAJUK query service intentionally applies these human-readable
  // terms against MS address_search, while the shared hierarchy resolves the
  // district -> upazila -> mouza/JL choices. District remains a UI scoping
  // field; once an upazila or mouza is selected it is already district-bound.
  if (upazila) params.set("upazila", upazila);
  if (mouza) params.set("mouza", mouza);
  if (jl) params.set("jl", jl);

  return params;
}

export function filterExactPlotMatches(
  features: RajukPlotFeature[],
  rawPlotNo: string,
  mode: PlotMode,
): RajukPlotFeature[] {
  const bare = normalizePlotInput(rawPlotNo, mode);
  return features.filter((feature) => normalizePlotInput(plotNo(feature, mode), mode) === bare);
}
