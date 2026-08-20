"use client";

import { FormEvent, useState } from "react";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString("en-US");
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

const DETAIL_FIELDS = [
  { label: "RS Plot Number", keys: ["rs_plot_no", "plot_no"] },
  { label: "RS JL No", keys: ["rs_jl_no", "jl_no", "jl"] },
  { label: "RS Plot Type", keys: ["rs_plot_type", "plot_type", "type"] },
  { label: "RS Plot Area (Katha Approx.)", keys: ["rs_plot_area", "plot_area_katha", "area_katha", "katha"] },
  { label: "RS Mauza Name", keys: ["rs_mauza_name", "mauza", "mouza", "mauza_name"] },
  { label: "Thana/Upazila", keys: ["thana_upazila", "upazila_ps", "upazila", "thana"] },
  { label: "District", keys: ["m_district", "district", "district_name"] },
];

export default function DapMapPage() {
  const [plotNo, setPlotNo] = useState("");
  const [mouza, setMouza] = useState("");
  const [jl, setJl] = useState("");
  const [upazila, setUpazila] = useState("");
  const [results, setResults] = useState<RajukPlotFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResults([]);
    if (!plotNo.trim()) {
      setError("দাগ/প্লট নম্বর দিন।");
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({ action: "plots", plot_no: plotNo.trim(), limit: "50" });
      if (mouza.trim()) q.set("mouza", mouza.trim());
      if (jl.trim()) q.set("jl", jl.trim());
      if (upazila.trim()) q.set("upazila", upazila.trim());

      const response = await fetch(`/api/rajuk/query?${q}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "RAJUK query failed");
      const features = data.features ?? [];
      if (!features.length) setError("কোনো RAJUK RS প্লট পাওয়া যায়নি।");
      setResults(features);
    } catch (e) {
      setError(e instanceof Error ? e.message : "অনুসন্ধান ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  const selected = results.length === 1 ? results[0] : null;
  const selectedAttributes = (selected?.attributes ?? {}) as Record<string, unknown>;

  return (
    <main className="min-h-[calc(100vh-75px)] bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Search className="text-[#006a4e]" size={22} /> RAJUK প্লট অনুসন্ধান
          </h1>
          <p className="mt-1 text-sm text-slate-500">দাগ নম্বর দিয়ে RAJUK RS প্লটের তথ্য খুঁজুন।</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <form onSubmit={search} className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <label className="text-sm font-semibold text-slate-800">দাগ / Plot No *</label>
              <input value={plotNo} onChange={e => setPlotNo(e.target.value)} inputMode="numeric" className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e]" placeholder="যেমন 450" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">মৌজা</label>
              <input value={mouza} onChange={e => setMouza(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e]" placeholder="ঐচ্ছিক" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">JL</label>
              <input value={jl} onChange={e => setJl(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e]" placeholder="ঐচ্ছিক" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">উপজেলা</label>
              <input value={upazila} onChange={e => setUpazila(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#006a4e]" placeholder="ঐচ্ছিক" />
            </div>
            <div className="flex items-end">
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-60">
                {loading && <Loader2 size={17} className="animate-spin" />}
                {loading ? "অনুসন্ধান হচ্ছে…" : "প্লট খুঁজুন"}
              </button>
            </div>
          </form>
          {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
        </section>

        {selected && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b bg-slate-50 px-4 py-3">
              <h2 className="font-bold text-slate-900">General Plot Information</h2>
              <p className="text-xs text-slate-500">Plot No {formatValue(selectedAttributes.plot_no)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {DETAIL_FIELDS.map(field => (
                    <tr key={field.label}>
                      <th className="w-1/2 border-b px-4 py-3 text-left font-semibold text-slate-700">{field.label}</th>
                      <td className="border-b px-4 py-3 text-slate-900">{formatValue(firstValue(selectedAttributes, field.keys))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
              <div><h2 className="font-bold text-slate-900">প্লটের তথ্য</h2><p className="text-xs text-slate-500">{results.length}টি ফলাফল পাওয়া গেছে</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-700">
                  <tr><th className="border-b px-4 py-3">#</th><th className="border-b px-4 py-3">Plot No</th><th className="border-b px-4 py-3">RS JL</th><th className="border-b px-4 py-3">Mauza</th><th className="border-b px-4 py-3">Upazila</th><th className="border-b px-4 py-3">District</th><th className="border-b px-4 py-3">Area</th><th className="border-b px-4 py-3">Object ID</th></tr>
                </thead>
                <tbody>
                  {results.map((feature, index) => {
                    const a = feature.attributes as Record<string, unknown>;
                    return <tr key={String(a.p_guid || a.objectid || index)} className="hover:bg-emerald-50/50">
                      <td className="border-b px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="border-b px-4 py-3 font-semibold">{formatValue(firstValue(a, ["rs_plot_no", "plot_no"]))}</td>
                      <td className="border-b px-4 py-3">{formatValue(firstValue(a, ["rs_jl_no", "jl_no", "jl"]))}</td>
                      <td className="border-b px-4 py-3">{formatValue(firstValue(a, ["rs_mauza_name", "mauza", "mouza", "mauza_name"]))}</td>
                      <td className="border-b px-4 py-3">{formatValue(firstValue(a, ["thana_upazila", "upazila_ps", "upazila", "thana"]))}</td>
                      <td className="border-b px-4 py-3">{formatValue(firstValue(a, ["m_district", "district", "district_name"]))}</td>
                      <td className="border-b px-4 py-3">{formatValue(firstValue(a, ["rs_plot_area", "plot_area_katha", "area_katha", "katha", "Shape__Area"]))}</td>
                      <td className="border-b px-4 py-3">{formatValue(a.objectid)}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
