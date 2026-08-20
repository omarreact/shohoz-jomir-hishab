"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Database, Loader2, Search, AlertCircle } from "lucide-react";
import type { RajukDistrict, RajukMauza, RajukPlotFeature, RajukUpazila } from "@/src/types/rajuk-runtime";
import { areaFromPlotAttributes, formatAreaValue } from "@/src/modules/land/plotArea";

const PlotMap = dynamic(() => import("@/src/shared/components/PlotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-xl border bg-slate-50 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

type PlotType = "rs" | "ms" | "mixed";

const DETAIL_ROWS: { label: string; keys: string[] }[] = [
  { label: "Object ID", keys: ["objectid"] },
  { label: "Plot No", keys: ["plot_no"] },
  { label: "RS Plot No", keys: ["rs_plot_no"] },
  { label: "MS Plot No", keys: ["ms_plot_no"] },
  { label: "Plot type", keys: ["plot_kind"] },
  { label: "RS JL No", keys: ["rs_jl_no", "jl_no", "jl"] },
  { label: "Mauza", keys: ["rs_mauza_name", "mauza", "mouza", "mauza_name"] },
  { label: "Upazila / Thana", keys: ["thana_upazila", "upazila_ps", "upazila", "thana"] },
  { label: "District", keys: ["m_district", "district", "district_name"] },
  { label: "Address", keys: ["address_search"] },
  { label: "P GUID", keys: ["p_guid"] },
  { label: "Shape area (raw)", keys: ["Shape__Area", "shape__area"] },
  { label: "Shape length (raw)", keys: ["Shape__Length", "shape__length"] },
];

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function firstValue(attributes: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = attributes[key];
    if (present(value)) {
      if (typeof value === "number") return value.toLocaleString("en-US");
      return String(value);
    }
  }
  return "—";
}

function isMixedFeature(f: RajukPlotFeature): boolean {
  const a = f.attributes;
  return present(a.rs_plot_no) && present(a.ms_plot_no);
}

function plotNumberForType(f: RajukPlotFeature, type: PlotType): string {
  const a = f.attributes;
  if (type === "ms") return String(a.ms_plot_no ?? a.plot_no ?? "").trim();
  if (type === "mixed") return String(a.rs_plot_no ?? a.plot_no ?? a.ms_plot_no ?? "").trim();
  return String(a.rs_plot_no ?? a.plot_no ?? "").trim();
}

function optionLabel(f: RajukPlotFeature, type: PlotType): string {
  const a = f.attributes;
  if (type === "mixed" || isMixedFeature(f)) {
    const rs = present(a.rs_plot_no) ? `RS ${a.rs_plot_no}` : "";
    const ms = present(a.ms_plot_no) ? `MS ${a.ms_plot_no}` : "";
    return [rs, ms].filter(Boolean).join(" · ") || String(a.objectid);
  }
  if (type === "ms") return String(a.ms_plot_no ?? a.plot_no ?? a.objectid);
  return String(a.rs_plot_no ?? a.plot_no ?? a.objectid);
}

function validateManualPlotNumber(
  raw: string,
  _plotType: PlotType,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "প্লট / দাগ নম্বর লিখুন।" };
  if (value.length > 20) return { ok: false, error: "প্লট নম্বর খুব বড় (সর্বোচ্চ ২০ অক্ষর)।" };
  if (!/^\d{1,12}([\/-]\d{1,6})?$/.test(value)) {
    return {
      ok: false,
      error: "শুধু সংখ্যা দিন (ঐচ্ছিক: 120/1 বা 45-2)। অক্ষর বা স্পেস দেওয়া যাবে না।",
    };
  }
  const main = Number(value.split(/[\/-]/)[0]);
  if (!Number.isFinite(main) || main <= 0) {
    return { ok: false, error: "প্লট নম্বর ০ বা ঋণাত্মক হতে পারে না।" };
  }
  if (main > 999999) return { ok: false, error: "প্লট নম্বর সীমার বাইরে।" };
  return { ok: true, value };
}

function AttrTable({ attributes }: { attributes: Record<string, unknown> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="w-[40%] border-b px-4 py-3">Field</th>
            <th className="border-b px-4 py-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {DETAIL_ROWS.map((row) => (
            <tr key={row.label} className="odd:bg-white even:bg-slate-50/80">
              <th className="border-b border-slate-100 px-4 py-2.5 text-left font-medium text-slate-600">
                {row.label}
              </th>
              <td className="border-b border-slate-100 px-4 py-2.5 text-slate-900">
                {firstValue(attributes, row.keys)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AreaTable({ feature }: { feature: RajukPlotFeature }) {
  const area = areaFromPlotAttributes(feature.attributes as Record<string, unknown>);
  if (!area.isValid) return null;
  const rows = [
    ["বর্গফুট (sq ft)", area.sqFt],
    ["শতাংশ (shotok)", area.shotok],
    ["কাঠা (katha)", area.katha],
    ["বিঘা (bigha)", area.bigha],
    ["একর (acre)", area.acre],
  ] as const;
  return (
    <div className="overflow-x-auto rounded-xl border border-emerald-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-emerald-50 text-left text-xs font-semibold uppercase tracking-wide text-emerald-800">
            <th className="border-b border-emerald-100 px-4 py-3">Unit</th>
            <th className="border-b border-emerald-100 px-4 py-3">Area</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="odd:bg-white even:bg-emerald-50/40">
              <td className="border-b border-emerald-50 px-4 py-2.5 text-slate-700">{label}</td>
              <td className="border-b border-emerald-50 px-4 py-2.5 font-semibold text-emerald-950">
                {formatAreaValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-slate-500">
        Shape__Area কে m² ধরে রূপান্তর; খতিয়ানের সাথে সামান্য পার্থক্য থাকতে পারে।
      </p>
    </div>
  );
}

function MatchesTable({
  features,
  plotType,
  selectedId,
  onSelect,
}: {
  features: RajukPlotFeature[];
  plotType: PlotType;
  selectedId: number | null;
  onSelect: (f: RajukPlotFeature) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="border-b px-3 py-3">#</th>
            <th className="border-b px-3 py-3">RS</th>
            <th className="border-b px-3 py-3">MS</th>
            <th className="border-b px-3 py-3">Type</th>
            <th className="border-b px-3 py-3">Address</th>
            <th className="border-b px-3 py-3">Area (katha)</th>
            <th className="border-b px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {features.map((f, index) => {
            const a = f.attributes as Record<string, unknown>;
            const area = areaFromPlotAttributes(a);
            const id = Number(a.objectid);
            const active = selectedId !== null && id === selectedId;
            return (
              <tr
                key={String(a.p_guid || a.objectid || index)}
                className={
                  active
                    ? "bg-emerald-50"
                    : "odd:bg-white even:bg-slate-50/80 hover:bg-emerald-50/50"
                }
              >
                <td className="border-b border-slate-100 px-3 py-2.5 text-slate-500">{index + 1}</td>
                <td className="border-b border-slate-100 px-3 py-2.5 font-semibold">
                  {firstValue(a, ["rs_plot_no", "plot_no"])}
                </td>
                <td className="border-b border-slate-100 px-3 py-2.5 font-semibold">
                  {firstValue(a, ["ms_plot_no"])}
                </td>
                <td className="border-b border-slate-100 px-3 py-2.5 text-xs uppercase">
                  {firstValue(a, ["plot_kind"]) === "—" ? plotType : firstValue(a, ["plot_kind"])}
                </td>
                <td className="max-w-xs truncate border-b border-slate-100 px-3 py-2.5 text-slate-600">
                  {firstValue(a, ["address_search"])}
                </td>
                <td className="border-b border-slate-100 px-3 py-2.5">
                  {area.isValid ? formatAreaValue(area.katha) : "—"}
                </td>
                <td className="border-b border-slate-100 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onSelect(f)}
                    className="rounded-lg bg-[#006a4e] px-3 py-1 text-xs font-semibold text-white"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RajukTestPage() {
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [dGuid, setDGuid] = useState("");
  const [tGuid, setTGuid] = useState("");
  const [mauza, setMauza] = useState("");
  const [plotType, setPlotType] = useState<PlotType>("rs");
  const [plot, setPlot] = useState("");
  const [manualPlot, setManualPlot] = useState("");
  const [validationError, setValidationError] = useState("");
  const [result, setResult] = useState<RajukPlotFeature | null>(null);
  const [matches, setMatches] = useState<RajukPlotFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLevel, setLoadingLevel] = useState("");
  const [error, setError] = useState("");

  const hasRsData = useMemo(
    () => plots.some((f) => present(f.attributes.rs_plot_no) || present(f.attributes.plot_no)),
    [plots],
  );
  const hasMsData = useMemo(
    () => plots.some((f) => present(f.attributes.ms_plot_no)),
    [plots],
  );
  const hasMixedData = useMemo(() => plots.some(isMixedFeature), [plots]);

  const availableTypes = useMemo(() => {
    const types: PlotType[] = [];
    if (hasRsData || (!hasRsData && !hasMsData && plots.length > 0)) types.push("rs");
    if (hasMsData) types.push("ms");
    if (hasMixedData) types.push("mixed");
    if (!types.length) types.push("rs");
    return types;
  }, [hasRsData, hasMsData, hasMixedData, plots.length]);

  useEffect(() => {
    if (!plots.length) return;
    setPlotType((prev) => (availableTypes.includes(prev) ? prev : availableTypes[0]));
    setPlot("");
    setManualPlot("");
    setValidationError("");
  }, [plots, availableTypes]);

  const filteredPlots = useMemo(() => {
    return plots.filter((f) => {
      if (plotType === "mixed") return isMixedFeature(f);
      if (plotType === "ms") return present(f.attributes.ms_plot_no);
      return present(f.attributes.rs_plot_no) || present(f.attributes.plot_no);
    });
  }, [plots, plotType]);

  useEffect(() => {
    setLoadingLevel("district");
    fetch("/api/rajuk/query?action=districts")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => setDistricts(d.features ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "District load failed"))
      .finally(() => setLoadingLevel(""));
  }, []);

  useEffect(() => {
    setUpazilas([]);
    setMouzas([]);
    setPlots([]);
    setTGuid("");
    setMauza("");
    setPlot("");
    setManualPlot("");
    setValidationError("");
    setResult(null);
    setMatches([]);
    if (!dGuid) return;
    setLoadingLevel("upazila");
    setError("");
    fetch(`/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => setUpazilas(d.features ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Upazila load failed"))
      .finally(() => setLoadingLevel(""));
  }, [dGuid]);

  useEffect(() => {
    setMouzas([]);
    setPlots([]);
    setMauza("");
    setPlot("");
    setManualPlot("");
    setValidationError("");
    setResult(null);
    setMatches([]);
    if (!tGuid) return;
    setLoadingLevel("mouza");
    setError("");
    fetch(`/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => setMouzas(d.features ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Mouza load failed"))
      .finally(() => setLoadingLevel(""));
  }, [tGuid]);

  useEffect(() => {
    setPlots([]);
    setPlot("");
    setManualPlot("");
    setValidationError("");
    setResult(null);
    setMatches([]);
    if (!mauza) return;
    const selectedMouza = mouzas.find((x) => x.m_guid === mauza);
    const selectedUpazila = upazilas.find((x) => x.t_guid === tGuid);
    if (!selectedMouza) return;
    setLoadingLevel("plot");
    setError("");
    const q = new URLSearchParams({
      action: "plots",
      mouza: selectedMouza.mauza,
      jl: String(selectedMouza.jl_no),
      upazila: selectedUpazila?.upazila_ps ?? "",
      limit: "2000",
    });
    fetch(`/api/rajuk/query?${q.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        const features = d.features ?? [];
        setPlots(features);
        if (!features.length) setError("এই Mouza-তে কোনো Plot পাওয়া যায়নি।");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Plot load failed"))
      .finally(() => setLoadingLevel(""));
  }, [mauza, mouzas, tGuid, upazilas]);

  function onPlotTypeChange(next: PlotType) {
    setPlotType(next);
    setPlot("");
    setManualPlot("");
    setValidationError("");
    setResult(null);
    setMatches([]);
    setError("");
  }

  function selectPlot(value: string) {
    setPlot(value);
    setManualPlot(value);
    setValidationError("");
    setMatches([]);
    setError("");
    if (!value) {
      setResult(null);
      return;
    }
    const selected = filteredPlots.find((f) => plotNumberForType(f, plotType) === value);
    setResult(selected ?? null);
  }

  function onManualPlotChange(value: string) {
    setManualPlot(value);
    setPlot(value);
    setMatches([]);
    setError("");
    if (!value.trim()) {
      setValidationError("");
      setResult(null);
      return;
    }
    const check = validateManualPlotNumber(value, plotType);
    setValidationError(check.ok ? "" : check.error);
    if (check.ok) {
      const selected = filteredPlots.find((f) => plotNumberForType(f, plotType) === check.value);
      setResult(selected ?? null);
    } else {
      setResult(null);
    }
  }

  async function runPlotSearch() {
    const check = validateManualPlotNumber(manualPlot || plot, plotType);
    if (!check.ok) {
      setValidationError(check.error);
      return;
    }
    const number = check.value;
    setValidationError("");
    setError("");
    setLoading(true);
    setResult(null);
    setMatches([]);
    try {
      const selectedMouza = mouzas.find((x) => x.m_guid === mauza);
      const selectedUpazila = upazilas.find((x) => x.t_guid === tGuid);
      const q = new URLSearchParams({ action: "plots", limit: "50" });

      if (plotType === "ms") {
        q.set("ms_plot_no", number);
      } else if (plotType === "mixed") {
        q.set("rs_plot_no", number);
        if (/^\d+$/.test(number)) q.set("plot_no", number);
      } else {
        q.set("rs_plot_no", number);
        if (/^\d+$/.test(number)) q.set("plot_no", number);
      }

      if (selectedMouza) {
        q.set("mouza", selectedMouza.mauza);
        q.set("jl", String(selectedMouza.jl_no));
      }
      if (selectedUpazila) q.set("upazila", selectedUpazila.upazila_ps);

      const r = await fetch(`/api/rajuk/query?${q}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      let fs = (d.features ?? []) as RajukPlotFeature[];

      if (plotType === "mixed") {
        const dual = fs.filter(isMixedFeature);
        if (dual.length) fs = dual;
      }

      setMatches(fs);
      if (fs.length === 1) setResult(fs[0]);
      if (!fs.length) {
        setError(
          plotType === "mixed"
            ? `No mixed (RS+MS) plot found for ${number}`
            : `No ${plotType.toUpperCase()} plot found for number ${number}`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  const typeHint =
    plots.length === 0
      ? "Mouza নির্বাচন করুন — তারপর plot type দেখাবে"
      : hasMixedData
        ? "এই Mouza-তে RS ও MS (এবং Mixed) ডেটা আছে — ম্যাপে দুই লেয়ারই চালু করা যায়"
        : hasMsData && hasRsData
          ? "এই Mouza-তে RS ও MS আছে"
          : hasMsData
            ? "এই Mouza-তে শুধু MS plot আছে"
            : "এই Mouza-তে MS নেই — RS plot দেখানো হচ্ছে";

  const selectedId =
    result?.attributes?.objectid != null ? Number(result.attributes.objectid) : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Database className="text-[#006a4e]" /> RAJUK Runtime Test
          </div>
          <p className="mt-1 text-sm text-slate-500">
            District → Upazila → Mouza → Plot type (RS / MS / Mixed) → Plot · map (RS + MS layers) · tables
          </p>
        </header>

        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 font-bold">Plot Search</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Select District</label>
              <div className="relative mt-1">
                <select
                  value={dGuid}
                  onChange={(e) => setDGuid(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5"
                  disabled={loadingLevel === "district"}
                >
                  <option value="">District নির্বাচন করুন</option>
                  {districts.map((d) => (
                    <option key={d.d_guid} value={d.d_guid}>
                      {d.m_district}
                    </option>
                  ))}
                </select>
                {loadingLevel === "district" && (
                  <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Select Upazila</label>
              <div className="relative mt-1">
                <select
                  value={tGuid}
                  onChange={(e) => setTGuid(e.target.value)}
                  disabled={!dGuid || loadingLevel === "upazila"}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  <option value="">Upazila নির্বাচন করুন</option>
                  {upazilas.map((u) => (
                    <option key={u.t_guid} value={u.t_guid}>
                      {u.upazila_ps}
                    </option>
                  ))}
                </select>
                {loadingLevel === "upazila" && (
                  <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Select Mouza</label>
              <div className="relative mt-1">
                <select
                  value={mauza}
                  onChange={(e) => setMauza(e.target.value)}
                  disabled={!tGuid || loadingLevel === "mouza"}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  <option value="">Mouza নির্বাচন করুন</option>
                  {mouzas.map((m) => (
                    <option key={m.m_guid} value={m.m_guid}>
                      {m.mauza} — JL {m.jl_no}
                    </option>
                  ))}
                </select>
                {loadingLevel === "mouza" && (
                  <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Plot type</label>
              <div className="relative mt-1">
                <select
                  value={plotType}
                  onChange={(e) => onPlotTypeChange(e.target.value as PlotType)}
                  disabled={!mauza || loadingLevel === "plot" || !plots.length}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  {availableTypes.includes("rs") && <option value="rs">RS plot</option>}
                  {availableTypes.includes("ms") && <option value="ms">MS plot</option>}
                  {availableTypes.includes("mixed") && (
                    <option value="mixed">Mixed (RS + MS)</option>
                  )}
                </select>
                {loadingLevel === "plot" && (
                  <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{typeHint}</p>
            </div>

            <div>
              <label className="block text-sm font-medium">Select Plot</label>
              <div className="relative mt-1">
                <select
                  value={plot}
                  onChange={(e) => selectPlot(e.target.value)}
                  disabled={!mauza || loadingLevel === "plot" || !filteredPlots.length}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  <option value="">
                    {plotType === "ms"
                      ? "MS Plot নির্বাচন করুন"
                      : plotType === "mixed"
                        ? "Mixed Plot নির্বাচন করুন"
                        : "RS Plot নির্বাচন করুন"}
                  </option>
                  {filteredPlots.map((f) => {
                    const value = plotNumberForType(f, plotType);
                    return (
                      <option
                        key={String(f.attributes.p_guid || f.attributes.objectid)}
                        value={value}
                      >
                        {optionLabel(f, plotType)}
                      </option>
                    );
                  })}
                </select>
                {loadingLevel === "plot" && (
                  <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Or enter plot number manually</label>
              <input
                value={manualPlot}
                onChange={(e) => onManualPlotChange(e.target.value)}
                inputMode="numeric"
                placeholder={
                  plotType === "ms"
                    ? "MS দাগ নম্বর"
                    : plotType === "mixed"
                      ? "RS বা MS দাগ নম্বর"
                      : "RS দাগ নম্বর"
                }
                disabled={!mauza || loadingLevel === "plot"}
                aria-invalid={Boolean(validationError)}
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e] ${
                  validationError ? "border-red-400 bg-red-50" : ""
                }`}
              />
              {validationError && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {validationError}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={runPlotSearch}
                disabled={loading || Boolean(validationError) || !(manualPlot || plot).trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
                Query {plotType === "mixed" ? "Mixed" : plotType.toUpperCase()} Plot
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {matches.length > 0 && (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold">Search results</h2>
            <p className="mb-4 text-xs text-slate-500">{matches.length} plot(s) matched</p>
            <MatchesTable
              features={matches}
              plotType={plotType}
              selectedId={selectedId}
              onSelect={setResult}
            />
          </section>
        )}

        {result && (
          <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-bold">Plot details</h2>
              <p className="text-xs text-slate-500">
                {optionLabel(result, plotType)}
                {present(result.attributes.plot_kind)
                  ? ` · ${String(result.attributes.plot_kind)}`
                  : ""}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Map — RS &amp; MS layers + Google Maps
              </h3>
              <PlotMap feature={result} />
            </div>

            {(isMixedFeature(result) || result.attributes.plot_kind === "mixed") && (
              <div className="overflow-x-auto rounded-xl border border-amber-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-50 text-left text-xs font-semibold uppercase text-amber-900">
                      <th className="border-b border-amber-100 px-4 py-3">Survey</th>
                      <th className="border-b border-amber-100 px-4 py-3">Plot number</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-b border-amber-50 px-4 py-2.5">RS</td>
                      <td className="border-b border-amber-50 px-4 py-2.5 font-bold">
                        {String(result.attributes.rs_plot_no ?? "—")}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">MS</td>
                      <td className="px-4 py-2.5 font-bold">
                        {String(result.attributes.ms_plot_no ?? "—")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Calculated area</h3>
              <AreaTable feature={result} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Attributes</h3>
              <AttrTable attributes={result.attributes as Record<string, unknown>} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
