"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Loader2, Search, Crosshair, AlertCircle } from "lucide-react";
import type { RajukDistrict, RajukMauza, RajukPlotFeature, RajukUpazila } from "@/src/types/rajuk-runtime";
import { areaFromPlotAttributes, formatAreaValue } from "@/src/modules/land/plotArea";

/** RS | MS | parcels that carry both survey numbers */
type PlotType = "rs" | "ms" | "mixed";

const fields = [
  "objectid",
  "plot_no",
  "p_guid",
  "rs_plot_no",
  "ms_plot_no",
  "plot_kind",
  "address_search",
  "Shape__Area",
  "Shape__Length",
] as const;

const wkt = (rings: number[][][]) =>
  `POLYGON(${rings.map((r) => `(${r.map(([x, y]) => `${x} ${y}`).join(", ")})`).join(", ")})`;

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function isMixedFeature(f: RajukPlotFeature): boolean {
  const a = f.attributes;
  return present(a.rs_plot_no) && present(a.ms_plot_no);
}

function plotNumberForType(f: RajukPlotFeature, type: PlotType): string {
  const a = f.attributes;
  if (type === "ms") return String(a.ms_plot_no ?? a.plot_no ?? "").trim();
  if (type === "mixed") {
    // Prefer RS as primary key in the list; MS shown in label
    return String(a.rs_plot_no ?? a.plot_no ?? a.ms_plot_no ?? "").trim();
  }
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

/** Manual plot number rules for the active survey type. */
function validateManualPlotNumber(
  raw: string,
  plotType: PlotType,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) {
    return { ok: false, error: "প্লট / দাগ নম্বর লিখুন।" };
  }
  if (value.length > 20) {
    return { ok: false, error: "প্লট নম্বর খুব বড় (সর্বোচ্চ ২০ অক্ষর)।" };
  }
  // Allow digits, optional single slash or hyphen (e.g. 120/1)
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
  if (main > 999999) {
    return { ok: false, error: "প্লট নম্বর সীমার বাইরে।" };
  }
  if (plotType === "mixed") {
    // Mixed search accepts either RS or MS style numbers — same format rules
    return { ok: true, value };
  }
  return { ok: true, value };
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
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [identify, setIdentify] = useState<RajukPlotFeature[]>([]);
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
    setResult(null);
    setMatches([]);
    setError("");
    if (!value) return;
    const selected = filteredPlots.find((f) => plotNumberForType(f, plotType) === value);
    if (selected) setResult(selected);
  }

  function onManualPlotChange(value: string) {
    setManualPlot(value);
    setPlot(value);
    setResult(null);
    setMatches([]);
    setError("");
    if (!value.trim()) {
      setValidationError("");
      return;
    }
    const check = validateManualPlotNumber(value, plotType);
    setValidationError(check.ok ? "" : check.error);
    if (check.ok) {
      const selected = filteredPlots.find((f) => plotNumberForType(f, plotType) === check.value);
      if (selected) setResult(selected);
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
        // Search both fields; API ORs plot_no with rs/ms when plot_no is set
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

      // Mixed: prefer features that actually have both numbers; if empty, keep all hits
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

  async function runIdentify() {
    setError("");
    setLoading(true);
    setIdentify([]);
    try {
      const r = await fetch(
        `/api/rajuk/query?action=identify&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setIdentify(d.features ?? []);
      if (!d.features?.length) setError("No plot contains this coordinate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Identify failed");
    } finally {
      setLoading(false);
    }
  }

  const active = result || identify[0];
  const activeArea = useMemo(
    () => (active ? areaFromPlotAttributes(active.attributes as Record<string, unknown>) : null),
    [active],
  );

  const geojson = useMemo(
    () =>
      active
        ? JSON.stringify(
            {
              type: "Feature",
              id: active.attributes.objectid,
              geometry: { type: "Polygon", coordinates: active.geometry.rings },
              properties: active.attributes,
            },
            null,
            2,
          )
        : "",
    [active],
  );

  const typeHint =
    plots.length === 0
      ? "Mouza নির্বাচন করুন — তারপর plot type দেখাবে"
      : hasMixedData
        ? "এই Mouza-তে RS, MS এবং Mixed (উভয় নম্বর) আছে"
        : hasMsData && hasRsData
          ? "এই Mouza-তে RS ও MS আছে (mixed parcel নাও থাকতে পারে)"
          : hasMsData
            ? "এই Mouza-তে শুধু MS plot আছে"
            : "এই Mouza-তে MS নেই — RS plot দেখানো হচ্ছে";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Database className="text-[#006a4e]" /> RAJUK Runtime Test
          </div>
          <p className="mt-1 text-sm text-slate-500">
            District → Upazila → Mouza → Plot type (RS / MS / Mixed) → Plot • area + geometry
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold">Plot Search</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium">Select District</label>
              <div className="relative">
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

              <label className="block text-sm font-medium">Select Upazila</label>
              <div className="relative">
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

              <label className="block text-sm font-medium">Select Mouza</label>
              <div className="relative">
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

              <label className="block text-sm font-medium">Plot type</label>
              <div className="relative">
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
              <p className="text-xs text-slate-500">{typeHint}</p>
              {plotType === "mixed" && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Mixed = একই পার্সেলে RS ও MS নম্বর দুটোই আছে। তালিকায় দুই নম্বরই দেখাবে; সার্চ RS
                  নম্বর দিয়ে চালানো হয়, ফলাফলে MS-ও মিলিয়ে দেখানো হয়।
                </p>
              )}

              <label className="block text-sm font-medium">Select Plot</label>
              <div className="relative">
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

              <label className="block text-sm font-medium">
                Or enter plot number manually
              </label>
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
                className={`w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e] ${
                  validationError ? "border-red-400 bg-red-50" : ""
                }`}
              />
              {validationError && (
                <p className="flex items-start gap-1.5 text-xs text-red-600">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {validationError}
                </p>
              )}

              <button
                onClick={runPlotSearch}
                disabled={loading || Boolean(validationError) || !(manualPlot || plot).trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
                Query{" "}
                {plotType === "mixed" ? "Mixed" : plotType.toUpperCase()} Plot
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold">Coordinate Identify</h2>
            <div className="space-y-3">
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude, e.g. 23.5795"
                className="w-full rounded-xl border px-3 py-2.5"
              />
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude, e.g. 90.5443"
                className="w-full rounded-xl border px-3 py-2.5"
              />
              <button
                onClick={runIdentify}
                disabled={loading || !lat || !lng}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                <Crosshair size={17} /> Identify Plot
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Uses esriSpatialRelIntersects with inSR/outSR 4326.
            </p>
          </div>
        </section>

        {error && (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {matches.length > 1 && (
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="mb-3 font-bold">{matches.length} matching plots</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {matches.map((f) => (
                <button
                  key={String(f.attributes.p_guid || f.attributes.objectid)}
                  onClick={() => setResult(f)}
                  className="rounded-xl border p-3 text-left hover:border-[#006a4e]"
                >
                  <b>{optionLabel(f, plotType)}</b>
                  <span className="ml-2 text-xs uppercase text-slate-400">
                    {f.attributes.plot_kind || plotType}
                  </span>
                  <div className="text-xs text-slate-500">{f.attributes.address_search}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {active && (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold">Selected RAJUK Plot</h2>

            {/* Mixed summary */}
            {(isMixedFeature(active) || active.attributes.plot_kind === "mixed") && (
              <div className="mb-4 grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-amber-800">RS Plot</div>
                  <div className="text-lg font-bold">{String(active.attributes.rs_plot_no ?? "—")}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-800">MS Plot</div>
                  <div className="text-lg font-bold">{String(active.attributes.ms_plot_no ?? "—")}</div>
                </div>
              </div>
            )}

            {/* Area calculation */}
            {activeArea?.isValid && (
              <div className="mb-4">
                <h3 className="mb-2 font-semibold">Plot area (calculated)</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(
                    [
                      ["বর্গফুট", activeArea.sqFt],
                      ["শতাংশ", activeArea.shotok],
                      ["কাঠা", activeArea.katha],
                      ["বিঘা", activeArea.bigha],
                      ["একর", activeArea.acre],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-800">{label}</div>
                      <div className="mt-1 text-lg font-bold text-emerald-950">
                        {formatAreaValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Shape__Area কে m² ধরে বর্গফুট / শতাংশ / কাঠায় রূপান্তর (ভূমি পরিমাপ মডিউলের একই
                  মান)। সরকারি খতিয়ানের সাথে সামান্য পার্থক্য থাকতে পারে।
                </p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((key) => (
                <div key={key} className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500">{key}</div>
                  <div className="mt-1 break-all font-mono text-sm">
                    {String(active.attributes[key] ?? "—")}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">GeoJSON</h3>
                <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
                  {geojson}
                </pre>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">WKT</h3>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
                  {wkt(active.geometry.rings)}
                </pre>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
