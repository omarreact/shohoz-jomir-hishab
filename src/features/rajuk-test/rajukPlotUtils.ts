import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

export type PlotMode = "rs" | "ms";

export function toAsciiDigits(value: string): string {
  const banglaDigits: Record<string, string> = {
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
  return value.replace(/[০-৯]/g, (digit) => banglaDigits[digit] ?? digit);
}

export function normalizePlotInput(raw: string, mode: PlotMode): string {
  const prefix =
    mode === "rs"
      ? /^(?:RS|আর\s*এস)[\s\-_]*/i
      : /^(?:MS|এম\s*এস)[\s\-_]*/i;
  return (
    toAsciiDigits(raw)
      .trim()
      .replace(prefix, "")
      .replace(/\s+/g, "")
      .replace(/^0+/, "") || "0"
  );
}

export function plotNo(feature: RajukPlotFeature, mode: PlotMode): string {
  const attributes = feature.attributes as Record<string, unknown>;
  return String(
    mode === "rs"
      ? attributes.rs_plot_no ?? attributes.plot_no ?? ""
      : attributes.ms_plot_no ?? attributes.plot_no ?? "",
  ).trim();
}

export function attrStr(
  attributes: Record<string, unknown>,
  keys: string[],
  fallback = "—",
): string {
  for (const key of keys) {
    const value = attributes[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return fallback;
}

export async function rajukJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const data = await response.json().catch(() => null) as T & { error?: string } | null;
  if (!response.ok) {
    throw new Error(data?.error || `অনুরোধ ব্যর্থ হয়েছে (${response.status})`);
  }
  if (!data) throw new Error("রাজউক সার্ভার থেকে খালি উত্তর এসেছে।");
  return data;
}
