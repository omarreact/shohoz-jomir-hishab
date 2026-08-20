"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Loader2, Search, Crosshair, AlertCircle } from "lucide-react";
import type { RajukDistrict, RajukMauza, RajukPlotFeature, RajukUpazila } from "@/src/types/rajuk-runtime";

type PlotType = "rs" | "ms";

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

function plotNumberForType(f: RajukPlotFeature, type: PlotType): string {
  const a = f.attributes;
  if (type === "ms") {
    return String(a.ms_plot_no ?? a.plot_no ?? "").trim();
  }
  return String(a.rs_plot_no ?? a.plot_no ?? "").trim();
}

function optionLabel(f: RajukPlotFeature, type: PlotType): string {
  const a = f.attributes;
  const primary = plotNumberForType(f, type);
  const kind = a.plot_kind;
  const extra =
    type === "rs" && present(a.ms_plot_no)
      ? ` · MS ${a.ms_plot_no}`
      : type === "ms" && present(a.rs_plot_no)
        ? ` · RS ${a.rs_plot_no}`
        : "";
  const badge = kind === "mixed" ? " [mixed]" : "";
  return `${primary || a.objectid}${extra}${badge}`;
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

  /** Plot types available for this mouza. */
  const availableTypes = useMemo(() => {
    const types: PlotType[] = [];
    if (hasRsData || (!hasRsData && !hasMsData && plots.length > 0)) types.push("rs");
    if (hasMsData) types.push("ms");
    if (!types.length) types.push("rs");
    return types;
  }, [hasRsData, hasMsData, plots.length]);

  // When mouza plots load: auto-pick RS if no MS; keep both when both exist.
  useEffect(() => {
    if (!plots.length) return;
    if (hasMsData && hasRsData) {
      // both available — keep current if still valid, else RS
      setPlotType((prev) => (availableTypes.includes(prev) ? prev : "rs"));
    } else if (hasMsData && !hasRsData) {
      setPlotType("ms");
    } else {
      setPlotType("rs");
    }
    setPlot("");
    setManualPlot("");
  }, [plots, hasMsData, hasRsData, availableTypes]);

  const filteredPlots = useMemo(() => {
    return plots.filter((f) => {
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
    setResult(null);
    setMatches([]);
    setError("");
  }

  function selectPlot(value: string) {
    setPlot(value);
    setManualPlot(value);
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
    if (!value.trim()) return;
    const selected = filteredPlots.find((f) => plotNumberForType(f, plotType) === value.trim());
    if (selected) setResult(selected);
  }

  async function runPlotSearch() {
    const number = (manualPlot || plot).trim();
    if (!number) return;
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
      } else {
        q.set("rs_plot_no", number);
        // Also try generic plot_no when numeric
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
      const fs = (d.features ?? []) as RajukPlotFeature[];
      setMatches(fs);
      if (fs.length === 1) setResult(fs[0]);
      if (!fs.length) setError(`No ${plotType.toUpperCase()} plot found for number ${number}`);
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
      : hasMsData && hasRsData
        ? "এই Mouza-তে RS ও MS উভয়ই আছে"
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
            District → Upazila → Mouza → Plot type (RS/MS) → Plot • real RAJUK attributes + polygon
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
                </select>
                {loadingLevel === "plot" && (
                  <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />
                )}
              </div>
              <p className="text-xs text-slate-500">{typeHint}</p>

              <label className="block text-sm font-medium">Select Plot</label>
              <div className="relative">
                <select
                  value={plot}
                  onChange={(e) => selectPlot(e.target.value)}
                  disabled={!mauza || loadingLevel === "plot" || !filteredPlots.length}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  <option value="">
                    {plotType === "ms" ? "MS Plot নির্বাচন করুন" : "RS Plot নির্বাচন করুন"}
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
                Or enter {plotType.toUpperCase()} plot number manually
              </label>
              <input
                value={manualPlot}
                onChange={(e) => onManualPlotChange(e.target.value)}
                inputMode="numeric"
                placeholder={plotType === "ms" ? "MS দাগ নম্বর লিখুন" : "RS দাগ নম্বর লিখুন"}
                disabled={!mauza || loadingLevel === "plot"}
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e]"
              />

              <button
                onClick={runPlotSearch}
                disabled={loading || !(manualPlot || plot).trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
                Query {plotType.toUpperCase()} Plot
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
                  <b>
                    {plotType === "ms"
                      ? f.attributes.ms_plot_no || f.attributes.plot_no
                      : f.attributes.rs_plot_no || f.attributes.plot_no}
                  </b>
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
