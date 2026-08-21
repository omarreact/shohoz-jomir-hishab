"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Database, Loader2, Search, AlertCircle, ChevronDown } from "lucide-react";
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

type PlotTab = "rs" | "ms";

const DETAIL_ROWS_RS: { label: string; keys: string[] }[] = [
  { label: "Plot No", keys: ["plot_no"] },
  { label: "RS Plot Number", keys: ["rs_plot_no"] },
  { label: "JL No", keys: ["rs_jl_no", "jl_no"] },
  { label: "Survey type", keys: ["plot_kind"] },
  { label: "Plot Area (Katha Approx.)", keys: ["rs_plot_area", "area_katha"] },
  { label: "Mauza Name", keys: ["rs_mauza_name", "mauza"] },
  { label: "Thana/Upazila", keys: ["thana_upazila", "upazila_ps"] },
  { label: "District", keys: ["m_district", "district"] },
  { label: "Address", keys: ["address_search"] },
  { label: "Area (sq m)", keys: ["area_sq_m", "Shape__Area"] },
  { label: "Area (sq ft)", keys: ["area_sq_ft"] },
  { label: "Object ID", keys: ["objectid"] },
];

const DETAIL_ROWS_MS: { label: string; keys: string[] }[] = [
  { label: "Plot No", keys: ["plot_no"] },
  { label: "MS Plot Number", keys: ["ms_plot_no"] },
  { label: "JL No", keys: ["jl_no", "rs_jl_no"] },
  { label: "Survey type", keys: ["plot_kind"] },
  { label: "Plot Area (Katha Approx.)", keys: ["ms_plot_area", "area_katha"] },
  { label: "Mauza Name", keys: ["mauza", "rs_mauza_name"] },
  { label: "Thana/Upazila", keys: ["thana_upazila", "upazila_ps"] },
  { label: "District", keys: ["m_district", "district"] },
  { label: "Address", keys: ["address_search"] },
  { label: "Area (sq m)", keys: ["area_sq_m", "Shape__Area"] },
  { label: "Area (sq ft)", keys: ["area_sq_ft"] },
  { label: "Object ID", keys: ["objectid"] },
];

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function firstValue(attributes: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = attributes[key];
    if (present(value)) {
      if (typeof value === "number") {
        return Number.isInteger(value)
          ? value.toLocaleString("en-US")
          : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
      }
      return String(value);
    }
  }
  return "—";
}

function plotLabel(f: RajukPlotFeature, tab: PlotTab): string {
  const a = f.attributes;
  if (tab === "ms") return String(a.ms_plot_no ?? a.plot_no ?? a.objectid);
  return String(a.rs_plot_no ?? a.plot_no ?? a.objectid);
}

function plotValue(f: RajukPlotFeature, tab: PlotTab): string {
  const a = f.attributes;
  if (tab === "ms") return String(a.ms_plot_no ?? a.plot_no ?? "").trim();
  return String(a.rs_plot_no ?? a.plot_no ?? "").trim();
}

async function apiJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}

function SearchablePlotSelect({
  plots,
  tab,
  value,
  disabled,
  loading,
  onSelect,
}: {
  plots: RajukPlotFeature[];
  tab: PlotTab;
  value: string;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (value: string, feature: RajukPlotFeature | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plots
      .map((f) => ({ feature: f, value: plotValue(f, tab), label: plotLabel(f, tab) }))
      .filter((o) => o.value)
      .filter((o) => {
        if (!q) return true;
        const a = o.feature.attributes;
        if (tab === "ms") {
          return (
            o.value.toLowerCase().includes(q) ||
            String(a.ms_plot_no ?? "").toLowerCase().includes(q) ||
            String(a.plot_no ?? "").toLowerCase().includes(q) ||
            String(a.address_search ?? "").toLowerCase().includes(q)
          );
        }
        return (
          o.value.toLowerCase().includes(q) ||
          String(a.rs_plot_no ?? "").toLowerCase().includes(q) ||
          String(a.plot_no ?? "").toLowerCase().includes(q) ||
          String(a.address_search ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 200);
  }, [plots, tab, query]);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const hit = plots.find((f) => plotValue(f, tab) === value);
    return hit ? plotLabel(hit, tab) : value;
  }, [value, plots, tab]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={open ? query : selectedLabel || query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onSelect("", null);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          disabled={disabled}
          placeholder={tab === "ms" ? "Search MS plot number…" : "Search RS plot number…"}
          className="w-full rounded-xl border py-2.5 pl-9 pr-9 outline-none focus:border-[#006a4e] disabled:bg-slate-50"
          autoComplete="off"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        {loading && <Loader2 className="absolute right-9 top-3 animate-spin text-slate-400" size={17} />}
      </div>
      {open && !disabled && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-white py-1 shadow-lg">
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">কোনো প্লট পাওয়া যায়নি</li>
          ) : (
            options.map((o) => (
              <li key={String(o.feature.attributes.p_guid || o.feature.attributes.objectid)}>
                <button
                  type="button"
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                    o.value === value ? "bg-emerald-50 font-semibold text-[#006a4e]" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(o.value, o.feature);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span>{o.label}</span>
                  {present(o.feature.attributes.address_search) && (
                    <span className="text-xs font-normal text-slate-500">
                      {String(o.feature.attributes.address_search)}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function AttrTable({ attributes, tab }: { attributes: Record<string, unknown>; tab: PlotTab }) {
  const rows = tab === "ms" ? DETAIL_ROWS_MS : DETAIL_ROWS_RS;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="w-[48%] border-b px-4 py-3">Field</th>
            <th className="border-b px-4 py-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="odd:bg-white even:bg-slate-50/80">
              <th className="border-b border-slate-100 px-4 py-2.5 text-left font-medium text-slate-600">{row.label}</th>
              <td className="border-b border-slate-100 px-4 py-2.5 text-slate-900">{firstValue(attributes, row.keys)}</td>
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
              <td className="border-b border-emerald-50 px-4 py-2.5 font-semibold text-emerald-950">{formatAreaValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Shared location cascade helpers (admin layers) — plots load is kind-specific. */
function useLocationCascade() {
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [dGuid, setDGuid] = useState("");
  const [tGuid, setTGuid] = useState("");
  const [mauza, setMauza] = useState("");
  const [loadingLevel, setLoadingLevel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingLevel("district");
    apiJson("/api/rajuk/query?action=districts")
      .then((d) => setDistricts(d.features ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "District load failed"))
      .finally(() => setLoadingLevel(""));
  }, []);

  useEffect(() => {
    setUpazilas([]);
    setMouzas([]);
    setTGuid("");
    setMauza("");
    if (!dGuid) return;
    setLoadingLevel("upazila");
    setError("");
    apiJson(`/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}`)
      .then((d) => setUpazilas(d.features ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Upazila load failed"))
      .finally(() => setLoadingLevel(""));
  }, [dGuid]);

  useEffect(() => {
    setMouzas([]);
    setMauza("");
    if (!tGuid) return;
    setLoadingLevel("mouza");
    setError("");
    apiJson(`/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}`)
      .then((d) => setMouzas(d.features ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Mouza load failed"))
      .finally(() => setLoadingLevel(""));
  }, [tGuid]);

  const selectedMouza = mouzas.find((x) => x.m_guid === mauza);
  const selectedUpazila = upazilas.find((x) => x.t_guid === tGuid);
  const selectedDistrict = districts.find((x) => x.d_guid === dGuid);

  return {
    districts,
    upazilas,
    mouzas,
    dGuid,
    setDGuid,
    tGuid,
    setTGuid,
    mauza,
    setMauza,
    loadingLevel,
    setLoadingLevel,
    error,
    setError,
    selectedMouza,
    selectedUpazila,
    selectedDistrict,
  };
}

function LocationFields({
  loc,
}: {
  loc: ReturnType<typeof useLocationCascade>;
}) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">Select District</label>
        <div className="relative mt-1">
          <select
            value={loc.dGuid}
            onChange={(e) => loc.setDGuid(e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5"
            disabled={loc.loadingLevel === "district"}
          >
            <option value="">District নির্বাচন করুন</option>
            {loc.districts.map((d) => (
              <option key={d.d_guid} value={d.d_guid}>
                {d.m_district}
              </option>
            ))}
          </select>
          {loc.loadingLevel === "district" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Select Upazila</label>
        <div className="relative mt-1">
          <select
            value={loc.tGuid}
            onChange={(e) => loc.setTGuid(e.target.value)}
            disabled={!loc.dGuid || loc.loadingLevel === "upazila"}
            className="w-full rounded-xl border px-3 py-2.5"
          >
            <option value="">Upazila নির্বাচন করুন</option>
            {loc.upazilas.map((u) => (
              <option key={u.t_guid} value={u.t_guid}>
                {u.upazila_ps}
              </option>
            ))}
          </select>
          {loc.loadingLevel === "upazila" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Select Mouza</label>
        <div className="relative mt-1">
          <select
            value={loc.mauza}
            onChange={(e) => loc.setMauza(e.target.value)}
            disabled={!loc.tGuid || loc.loadingLevel === "mouza"}
            className="w-full rounded-xl border px-3 py-2.5"
          >
            <option value="">Mouza নির্বাচন করুন</option>
            {loc.mouzas.map((m) => (
              <option key={m.m_guid} value={m.m_guid}>
                {m.mauza} — JL {m.jl_no}
              </option>
            ))}
          </select>
          {loc.loadingLevel === "mouza" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17} />}
        </div>
      </div>
    </>
  );
}

function ResultPanel({
  tab,
  result,
  matches,
  onSelectMatch,
}: {
  tab: PlotTab;
  result: RajukPlotFeature | null;
  matches: RajukPlotFeature[];
  onSelectMatch: (f: RajukPlotFeature) => void;
}) {
  const selectedId = result?.attributes?.objectid != null ? Number(result.attributes.objectid) : null;
  return (
    <>
      {matches.length > 0 && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-bold">Search results ({tab.toUpperCase()})</h2>
          <p className="mb-4 text-xs text-slate-500">{matches.length} plot(s)</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="border-b px-3 py-3">#</th>
                  <th className="border-b px-3 py-3">{tab === "ms" ? "MS Plot" : "RS Plot"}</th>
                  <th className="border-b px-3 py-3">Mauza</th>
                  <th className="border-b px-3 py-3">Thana</th>
                  <th className="border-b px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {matches.map((f, i) => {
                  const a = f.attributes as Record<string, unknown>;
                  const id = Number(a.objectid);
                  return (
                    <tr key={String(a.p_guid || id || i)} className={id === selectedId ? "bg-emerald-50" : "odd:bg-white even:bg-slate-50/80"}>
                      <td className="border-b border-slate-100 px-3 py-2.5">{i + 1}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 font-semibold">
                        {tab === "ms" ? firstValue(a, ["ms_plot_no", "plot_no"]) : firstValue(a, ["rs_plot_no", "plot_no"])}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5">{firstValue(a, ["mauza", "rs_mauza_name"])}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5">{firstValue(a, ["thana_upazila", "upazila_ps"])}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5">
                        <button type="button" onClick={() => onSelectMatch(f)} className="rounded-lg bg-[#006a4e] px-3 py-1 text-xs font-semibold text-white">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {result && (
        <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-bold">General Plot Information ({tab.toUpperCase()})</h2>
            <p className="text-xs text-slate-500">
              {plotLabel(result, tab)}
              {present(result.attributes.address_search) ? ` · ${String(result.attributes.address_search)}` : ""}
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Map</h3>
            <PlotMap feature={result} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Plot details</h3>
            <AttrTable attributes={result.attributes as Record<string, unknown>} tab={tab} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Calculated area</h3>
            <AreaTable feature={result} />
          </div>
        </section>
      )}
    </>
  );
}

/** RS form — FeatureServer/0 only */
function RsPlotSearchForm() {
  const loc = useLocationCascade();
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [plot, setPlot] = useState("");
  const [result, setResult] = useState<RajukPlotFeature | null>(null);
  const [matches, setMatches] = useState<RajukPlotFeature[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPlots([]);
    setPlot("");
    setResult(null);
    setMatches([]);
    if (!loc.mauza || !loc.selectedMouza) return;
    loc.setLoadingLevel("plot");
    loc.setError("");
    const q = new URLSearchParams({
      action: "plots",
      kind: "rs",
      mouza: loc.selectedMouza.mauza,
      jl: String(loc.selectedMouza.jl_no),
      upazila: loc.selectedUpazila?.upazila_ps ?? "",
      limit: "2000",
    });
    apiJson(`/api/rajuk/query?${q}`)
      .then((d) => {
        let features = (d.features ?? []) as RajukPlotFeature[];
        if (loc.selectedDistrict?.m_district) {
          features = features.map((f) => ({
            ...f,
            attributes: {
              ...f.attributes,
              m_district: f.attributes.m_district || loc.selectedDistrict!.m_district,
              district: f.attributes.district || loc.selectedDistrict!.m_district,
            },
          }));
        }
        setPlots(features);
        if (!features.length) loc.setError("এই Mouza-তে কোনো RS Plot পাওয়া যায়নি।");
      })
      .catch((e) => loc.setError(e instanceof Error ? e.message : "RS plot load failed"))
      .finally(() => loc.setLoadingLevel(""));
  }, [loc.mauza, loc.selectedMouza, loc.selectedUpazila, loc.selectedDistrict]);

  async function runSearch() {
    if (!plot.trim()) {
      loc.setError("প্লট নম্বর সিলেক্ট করুন।");
      return;
    }
    setLoading(true);
    setResult(null);
    setMatches([]);
    loc.setError("");
    try {
      const q = new URLSearchParams({ action: "plots", kind: "rs", limit: "50", rs_plot_no: plot });
      if (/^\d+$/.test(plot)) q.set("plot_no", plot);
      if (loc.selectedMouza) {
        q.set("mouza", loc.selectedMouza.mauza);
        q.set("jl", String(loc.selectedMouza.jl_no));
      }
      if (loc.selectedUpazila) q.set("upazila", loc.selectedUpazila.upazila_ps);
      const d = await apiJson(`/api/rajuk/query?${q}`);
      let fs = (d.features ?? []) as RajukPlotFeature[];
      if (loc.selectedDistrict?.m_district) {
        fs = fs.map((f) => ({
          ...f,
          attributes: {
            ...f.attributes,
            m_district: f.attributes.m_district || loc.selectedDistrict!.m_district,
            district: f.attributes.district || loc.selectedDistrict!.m_district,
          },
        }));
      }
      setMatches(fs);
      if (fs.length === 1) setResult(fs[0]);
      if (!fs.length) loc.setError(`No RS plot found for ${plot}`);
    } catch (e) {
      loc.setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
        <h2 className="mb-1 font-bold">RS plot search</h2>
        <p className="mb-4 text-xs text-slate-500">FeatureServer/0 (RS_mauza) only</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <LocationFields loc={loc} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Select RS Plot</label>
            <div className="mt-1">
              <SearchablePlotSelect
                plots={plots}
                tab="rs"
                value={plot}
                disabled={!loc.mauza || loc.loadingLevel === "plot" || !plots.length}
                loading={loc.loadingLevel === "plot"}
                onSelect={(v, f) => {
                  setPlot(v);
                  setResult(f);
                  setMatches([]);
                }}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading || !plot.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
              Query RS Plot
            </button>
          </div>
        </div>
      </section>
      {loc.error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          {loc.error}
        </div>
      )}
      <ResultPanel tab="rs" result={result} matches={matches} onSelectMatch={setResult} />
    </>
  );
}

/** MS form — FeatureServer/5 only (independent state from RS) */
function MsPlotSearchForm() {
  const loc = useLocationCascade();
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [plot, setPlot] = useState("");
  const [result, setResult] = useState<RajukPlotFeature | null>(null);
  const [matches, setMatches] = useState<RajukPlotFeature[]>([]);
  const [loading, setLoading] = useState(false);

  // Load MS plots only from FeatureServer/5 when mouza is chosen
  useEffect(() => {
    setPlots([]);
    setPlot("");
    setResult(null);
    setMatches([]);
    if (!loc.mauza || !loc.selectedMouza) return;
    loc.setLoadingLevel("plot");
    loc.setError("");
    const q = new URLSearchParams({
      action: "plots",
      kind: "ms", // layer 5 only — never RS
      mouza: loc.selectedMouza.mauza,
      jl: String(loc.selectedMouza.jl_no),
      upazila: loc.selectedUpazila?.upazila_ps ?? "",
      limit: "2000",
    });
    apiJson(`/api/rajuk/query?${q}`)
      .then((d) => {
        let features = (d.features ?? []) as RajukPlotFeature[];
        if (loc.selectedDistrict?.m_district) {
          features = features.map((f) => ({
            ...f,
            attributes: {
              ...f.attributes,
              m_district: f.attributes.m_district || loc.selectedDistrict!.m_district,
              district: f.attributes.district || loc.selectedDistrict!.m_district,
            },
          }));
        }
        setPlots(features);
        if (!features.length) loc.setError("এই Mouza-তে কোনো MS Plot পাওয়া যায়নি (FeatureServer/5)।");
      })
      .catch((e) => loc.setError(e instanceof Error ? e.message : "MS plot load failed"))
      .finally(() => loc.setLoadingLevel(""));
  }, [loc.mauza, loc.selectedMouza, loc.selectedUpazila, loc.selectedDistrict]);

  async function runSearch() {
    if (!plot.trim()) {
      loc.setError("MS প্লট নম্বর সিলেক্ট করুন।");
      return;
    }
    setLoading(true);
    setResult(null);
    setMatches([]);
    loc.setError("");
    try {
      // Pure MS path — ms_plot_no + kind=ms only
      const q = new URLSearchParams({
        action: "plots",
        kind: "ms",
        limit: "50",
        ms_plot_no: plot,
      });
      if (loc.selectedMouza) {
        q.set("mouza", loc.selectedMouza.mauza);
        q.set("jl", String(loc.selectedMouza.jl_no));
      }
      if (loc.selectedUpazila) q.set("upazila", loc.selectedUpazila.upazila_ps);
      const d = await apiJson(`/api/rajuk/query?${q}`);
      let fs = (d.features ?? []) as RajukPlotFeature[];
      if (loc.selectedDistrict?.m_district) {
        fs = fs.map((f) => ({
          ...f,
          attributes: {
            ...f.attributes,
            m_district: f.attributes.m_district || loc.selectedDistrict!.m_district,
            district: f.attributes.district || loc.selectedDistrict!.m_district,
          },
        }));
      }
      setMatches(fs);
      if (fs.length === 1) setResult(fs[0]);
      if (!fs.length) loc.setError(`No MS plot found for ${plot} on FeatureServer/5`);
    } catch (e) {
      loc.setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
        <h2 className="mb-1 font-bold">MS plot search</h2>
        <p className="mb-4 text-xs text-slate-500">
          Independent form · plots from <strong>FeatureServer/5 (MS_mauza)</strong> only
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <LocationFields loc={loc} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Select MS Plot</label>
            <p className="mt-0.5 text-xs text-slate-500">List loaded from FeatureServer/5 for this mouza</p>
            <div className="mt-1">
              <SearchablePlotSelect
                plots={plots}
                tab="ms"
                value={plot}
                disabled={!loc.mauza || loc.loadingLevel === "plot" || !plots.length}
                loading={loc.loadingLevel === "plot"}
                onSelect={(v, f) => {
                  setPlot(v);
                  setResult(f);
                  setMatches([]);
                }}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading || !plot.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
              Query MS Plot
            </button>
          </div>
        </div>
      </section>
      {loc.error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          {loc.error}
        </div>
      )}
      <ResultPanel tab="ms" result={result} matches={matches} onSelectMatch={setResult} />
    </>
  );
}

export default function RajukTestPage() {
  const [tab, setTab] = useState<PlotTab>("rs");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Database className="text-[#006a4e]" /> RAJUK Runtime Test
          </div>
          <p className="mt-1 text-sm text-slate-500">
            RS → FeatureServer/0 · MS → FeatureServer/5 (separate forms)
          </p>
        </header>

        <div className="flex gap-1 rounded-xl border bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab("rs")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === "rs" ? "bg-white text-[#006a4e] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            RS plot search
          </button>
          <button
            type="button"
            onClick={() => setTab("ms")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === "ms" ? "bg-white text-[#006a4e] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            MS plot search
          </button>
        </div>

        {/* Unmount inactive form so RS state never leaks into MS */}
        {tab === "rs" ? <RsPlotSearchForm /> : <MsPlotSearchForm />}
      </div>
    </main>
  );
}
