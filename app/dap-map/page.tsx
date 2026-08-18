"use client";

import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";
import { Search, MapPinned, Layers3, AlertCircle, Loader2 } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const RajukMap = dynamic(() => import("./RajukMap"), { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-slate-100 text-slate-600"><Loader2 className="mr-2 animate-spin" /> RAJUK map loading…</div> });

export default function DapMapPage() {
  const [plotNo, setPlotNo] = useState("");
  const [mouza, setMouza] = useState("");
  const [jl, setJl] = useState("");
  const [upazila, setUpazila] = useState("");
  const [results, setResults] = useState<RajukPlotFeature[]>([]);
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault(); setError(""); setResults([]); setSelected(null);
    if (!plotNo.trim()) { setError("দাগ/প্লট নম্বর দিন।"); return; }
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
      if (features.length === 1) setSelected(features[0]);
    } catch (e) { setError(e instanceof Error ? e.message : "অনুসন্ধান ব্যর্থ হয়েছে।"); }
    finally { setLoading(false); }
  }

  return <main className="flex h-[calc(100vh-75px)] min-h-[640px] flex-col bg-slate-100">
    <header className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-3 shadow-sm md:px-6">
      <div><div className="flex items-center gap-2 text-lg font-bold text-slate-900"><MapPinned className="text-[#006a4e]" /> RAJUK DAP Map</div><p className="text-xs text-slate-500">Verified RAJUK runtime services • RS Plot / Dag search</p></div>
      <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 md:flex"><Layers3 size={14} /> 6 live layers</div>
    </header>
    <section className="relative min-h-0 flex-1">
      <RajukMap selected={selected} />
      <div className="absolute left-4 top-4 z-30 w-[min(420px,calc(100%-2rem))] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
        <form onSubmit={search} className="space-y-3">
          <div><label className="text-sm font-semibold text-slate-800">দাগ / Plot No *</label><div className="relative mt-1"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={plotNo} onChange={e => setPlotNo(e.target.value)} inputMode="numeric" className="w-full rounded-xl border px-10 py-2.5 outline-none focus:border-[#006a4e]" placeholder="যেমন 450" /></div></div>
          <div className="grid grid-cols-2 gap-2"><input value={mouza} onChange={e => setMouza(e.target.value)} className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#006a4e]" placeholder="মৌজা (ঐচ্ছিক)" /><input value={jl} onChange={e => setJl(e.target.value)} className="rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#006a4e]" placeholder="JL (ঐচ্ছিক)" /></div>
          <input value={upazila} onChange={e => setUpazila(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#006a4e]" placeholder="উপজেলা (ঐচ্ছিক)" />
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-60">{loading && <Loader2 size={17} className="animate-spin" />} {loading ? "অনুসন্ধান হচ্ছে…" : "RAJUK প্লট খুঁজুন"}</button>
        </form>
        {error && <div className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
        {results.length > 1 && <div className="mt-3 max-h-52 space-y-2 overflow-auto border-t pt-3"><p className="text-xs font-semibold text-slate-500">একই দাগের {results.length}টি ফলাফল — একটি নির্বাচন করুন</p>{results.map(f => <button key={f.attributes.p_guid || f.attributes.objectid} onClick={() => setSelected(f)} className={`w-full rounded-xl border p-3 text-left text-sm hover:border-[#006a4e] ${selected?.attributes.objectid === f.attributes.objectid ? "border-[#006a4e] bg-emerald-50" : "bg-white"}`}><b>RS-{f.attributes.plot_no}</b><div className="text-xs text-slate-500">{f.attributes.address_search}</div></button>)}</div>}
        {selected && <div className="mt-3 rounded-xl bg-slate-900 p-3 text-xs text-white"><div className="font-bold">Selected Plot: {selected.attributes.plot_no}</div><div className="mt-1 text-slate-300">{selected.attributes.address_search}</div><div className="mt-1 text-slate-400">Area: {selected.attributes.Shape__Area?.toLocaleString()} m² • PID: {selected.attributes.p_guid}</div></div>}
      </div>
    </section>
  </main>;
}
