"use client";

import { FormEvent, useCallback, useState } from "react";
import { Search, AlertCircle, Loader2, MapPin, Layers } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import dynamic from "next/dynamic";

const RajukMap = dynamic(() => import("./RajukMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
      <Loader2 className="animate-spin" />
    </div>
  ),
});

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString("bn-BD");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function firstValue(attributes: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = attributes[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function featureKey(feature: RajukPlotFeature, index: number) {
  const a = (feature.attributes ?? {}) as Record<string, unknown>;
  return String(a.p_guid || a.objectid || a.OBJECTID || index);
}

const DETAIL_FIELDS = [
  { label: "প্লট নম্বর", keys: ["rs_plot_no", "ms_plot_no", "plot_no"] },
  { label: "সার্ভে (RS/MS)", keys: ["plot_kind", "source", "_source"] },
  { label: "জেএল নম্বর", keys: ["rs_jl_no", "ms_jl_no", "jl_no", "jl"] },
  { label: "প্লট ধরন", keys: ["rs_plot_type", "plot_type", "type"] },
  { label: "আয়তন (কাঠা অনুমান)", keys: ["rs_plot_area", "plot_area_katha", "area_katha", "katha"] },
  { label: "মৌজা", keys: ["rs_mauza_name", "ms_mauza_name", "mauza", "mouza", "mauza_name"] },
  { label: "থানা/উপজেলা", keys: ["thana_upazila", "upazila_ps", "upazila", "thana"] },
  { label: "জেলা", keys: ["m_district", "district", "district_name"] },
];

type PlotKindFilter = "all" | "rs" | "ms";

export default function DapMapPage() {
  const [plotNo, setPlotNo] = useState("");
  const [mouza, setMouza] = useState("");
  const [jl, setJl] = useState("");
  const [upazila, setUpazila] = useState("");
  const [kind, setKind] = useState<PlotKindFilter>("all");
  const [results, setResults] = useState<RajukPlotFeature[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState("");
  const [statusNote, setStatusNote] = useState("দাগ দিয়ে খুঁজুন অথবা ম্যাপে ক্লিক করে প্লট শনাক্ত করুন।");

  const selected =
    selectedIndex !== null && results[selectedIndex] ? results[selectedIndex] : results.length === 1 ? results[0] : null;
  const selectedAttributes = (selected?.attributes ?? {}) as Record<string, unknown>;

  const applyFeatures = useCallback((features: RajukPlotFeature[], note: string) => {
    setResults(features);
    setSelectedIndex(features.length === 1 ? 0 : features.length > 0 ? 0 : null);
    setStatusNote(note);
    if (!features.length) setError("কোনো RAJUK প্লট পাওয়া যায়নি।");
    else setError("");
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!plotNo.trim()) {
      setError("দাগ/প্লট নম্বর দিন।");
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({
        action: "plots",
        plot_no: plotNo.trim(),
        limit: "50",
      });
      if (mouza.trim()) q.set("mouza", mouza.trim());
      if (jl.trim()) q.set("jl", jl.trim());
      if (upazila.trim()) q.set("upazila", upazila.trim());
      if (kind !== "all") q.set("kind", kind);

      const response = await fetch(`/api/rajuk/query?${q.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "RAJUK query failed");
      const features = (data.features ?? []) as RajukPlotFeature[];
      applyFeatures(features, `${features.length}টি প্লট পাওয়া গেছে (সার্চ)।`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "অনুসন্ধান ব্যর্থ হয়েছে।");
      setResults([]);
      setSelectedIndex(null);
    } finally {
      setLoading(false);
    }
  }

  const identifyAt = useCallback(
    async (lat: number, lng: number) => {
      setIdentifying(true);
      setError("");
      try {
        const q = new URLSearchParams({
          action: "identify",
          lat: String(lat),
          lng: String(lng),
        });
        const response = await fetch(`/api/rajuk/query?${q.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Identify failed");
        const features = (data.features ?? []) as RajukPlotFeature[];
        applyFeatures(
          features,
          features.length
            ? `ম্যাপ ক্লিক: ${features.length}টি প্লট (${lat.toFixed(5)}, ${lng.toFixed(5)})`
            : `এই স্থানে প্লট পাওয়া যায়নি (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Identify ব্যর্থ হয়েছে।");
      } finally {
        setIdentifying(false);
      }
    },
    [applyFeatures],
  );

  return (
    <main className="flex h-[calc(100vh-75px)] flex-col md:flex-row">
      <div className="flex w-full flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 md:w-[450px] md:shrink-0 lg:w-[500px]">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Search className="text-[#006a4e]" size={20} /> RAJUK প্লট ম্যাপ
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            দাগ নম্বর দিয়ে RS/MS প্লট খুঁজুন, অথবা ম্যাপে ক্লিক করে identify করুন। লেয়ার কন্ট্রোলে DAP/বন্যা/সীমানা টগল করুন।
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-emerald-800">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span>{statusNote}</span>
          </p>
        </header>

        <section className="mb-4 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <form onSubmit={search} className="grid gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-800">দাগ / Plot No *</label>
              <input
                value={plotNo}
                onChange={(e) => setPlotNo(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#006a4e]"
                placeholder="যেমন 450"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-800">মৌজা</label>
                <input
                  value={mouza}
                  onChange={(e) => setMouza(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#006a4e]"
                  placeholder="ঐচ্ছিক"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-800">JL</label>
                <input
                  value={jl}
                  onChange={(e) => setJl(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#006a4e]"
                  placeholder="ঐচ্ছিক"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-800">উপজেলা / থানা</label>
                <input
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#006a4e]"
                  placeholder="ঐচ্ছিক"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                  <Layers size={12} /> সার্ভে
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as PlotKindFilter)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#006a4e]"
                >
                  <option value="all">সব (RS + MS)</option>
                  <option value="rs">শুধু RS</option>
                  <option value="ms">শুধু MS</option>
                </select>
              </div>
            </div>
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005a42] disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "অনুসন্ধান হচ্ছে…" : "প্লট খুঁজুন"}
            </button>
          </form>
          {error && (
            <div className="mt-3 flex gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
        </section>

        {selected && (
          <section className="mb-4 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b bg-slate-50 px-4 py-2.5">
              <h2 className="text-sm font-bold text-slate-900">প্লটের বিস্তারিত তথ্য</h2>
              <p className="text-[10px] text-slate-500">
                Plot {formatValue(firstValue(selectedAttributes, ["rs_plot_no", "ms_plot_no", "plot_no"]))}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {DETAIL_FIELDS.map((field) => (
                    <tr key={field.label}>
                      <th className="w-1/2 border-b px-3 py-2 text-left font-semibold text-slate-700">{field.label}</th>
                      <td className="border-b px-3 py-2 text-slate-900">
                        {formatValue(firstValue(selectedAttributes, field.keys))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2.5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">ফলাফল তালিকা</h2>
                <p className="text-[10px] text-slate-500">{results.length}টি — সারিতে ক্লিক করে ম্যাপে দেখুন</p>
              </div>
            </div>
            <div className="max-h-[320px] overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 text-left font-semibold text-slate-700">
                  <tr>
                    <th className="border-b px-3 py-2">Plot</th>
                    <th className="border-b px-3 py-2">JL</th>
                    <th className="border-b px-3 py-2">Mauza</th>
                    <th className="border-b px-3 py-2">Area</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((feature, index) => {
                    const a = feature.attributes as Record<string, unknown>;
                    const active = selectedIndex === index || (results.length === 1 && index === 0);
                    return (
                      <tr
                        key={featureKey(feature, index)}
                        onClick={() => setSelectedIndex(index)}
                        className={`cursor-pointer transition-colors ${active ? "bg-emerald-100/80" : "hover:bg-emerald-50/60"}`}
                      >
                        <td className="border-b px-3 py-2 font-semibold">
                          {formatValue(firstValue(a, ["rs_plot_no", "ms_plot_no", "plot_no"]))}
                        </td>
                        <td className="border-b px-3 py-2">
                          {formatValue(firstValue(a, ["rs_jl_no", "ms_jl_no", "jl_no", "jl"]))}
                        </td>
                        <td className="border-b px-3 py-2">
                          {formatValue(firstValue(a, ["rs_mauza_name", "ms_mauza_name", "mauza", "mouza", "mauza_name"]))}
                        </td>
                        <td className="border-b px-3 py-2">
                          {formatValue(
                            firstValue(a, ["rs_plot_area", "plot_area_katha", "area_katha", "katha", "Shape__Area"]),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <div className="relative min-h-[400px] flex-1 bg-slate-100">
        <RajukMap
          selected={selected}
          results={results}
          identifying={identifying}
          onIdentify={identifyAt}
        />
      </div>
    </main>
  );
}
