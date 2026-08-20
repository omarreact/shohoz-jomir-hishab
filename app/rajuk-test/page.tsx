"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Loader2, Search, Crosshair, AlertCircle } from "lucide-react";
import type { RajukDistrict, RajukMauza, RajukPlotFeature, RajukUpazila } from "@/src/types/rajuk-runtime";

const fields = ["objectid", "plot_no", "p_guid", "rs_plot_no", "address_search", "Shape__Area", "Shape__Length"] as const;
const wkt = (rings: number[][][]) => `POLYGON(${rings.map(r => `(${r.map(([x,y]) => `${x} ${y}`).join(", ")})`).join(", ")})`;

export default function RajukTestPage() {
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [dGuid, setDGuid] = useState("");
  const [tGuid, setTGuid] = useState("");
  const [mauza, setMauza] = useState("");
  const [plot, setPlot] = useState("");
  const [result, setResult] = useState<RajukPlotFeature | null>(null);
  const [matches, setMatches] = useState<RajukPlotFeature[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [identify, setIdentify] = useState<RajukPlotFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLevel, setLoadingLevel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingLevel("district");
    fetch("/api/rajuk/query?action=districts")
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
      .then(d => setDistricts(d.features ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "District load failed"))
      .finally(() => setLoadingLevel(""));
  }, []);

  useEffect(() => {
    setUpazilas([]); setMouzas([]); setPlots([]); setTGuid(""); setMauza(""); setPlot(""); setResult(null);
    if (!dGuid) return;
    setLoadingLevel("upazila"); setError("");
    fetch(`/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
      .then(d => setUpazilas(d.features ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "Upazila load failed"))
      .finally(() => setLoadingLevel(""));
  }, [dGuid]);

  useEffect(() => {
    setMouzas([]); setPlots([]); setMauza(""); setPlot(""); setResult(null);
    if (!tGuid) return;
    setLoadingLevel("mouza"); setError("");
    fetch(`/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
      .then(d => setMouzas(d.features ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "Mouza load failed"))
      .finally(() => setLoadingLevel(""));
  }, [tGuid]);

  useEffect(() => {
    setPlots([]); setPlot(""); setResult(null); setMatches([]);
    if (!mauza) return;
    const selectedMouza = mouzas.find(x => x.m_guid === mauza);
    const selectedUpazila = upazilas.find(x => x.t_guid === tGuid);
    if (!selectedMouza) return;
    setLoadingLevel("plot"); setError("");
    const q = new URLSearchParams({
      action: "plots",
      mouza: selectedMouza.mauza,
      jl: String(selectedMouza.jl_no),
      upazila: selectedUpazila?.upazila_ps ?? "",
      limit: "2000",
    });
    fetch(`/api/rajuk/query?${q.toString()}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
      .then(d => {
        const features = d.features ?? [];
        setPlots(features);
        if (!features.length) setError("এই Mouza-তে কোনো Plot পাওয়া যায়নি।");
      })
      .catch(e => setError(e instanceof Error ? e.message : "Plot load failed"))
      .finally(() => setLoadingLevel(""));
  }, [mauza, mouzas, tGuid, upazilas]);

  function selectPlot(value: string) {
    setPlot(value); setResult(null); setMatches([]); setError("");
    if (!value) return;
    const selected = plots.find(f => String(f.attributes.plot_no) === value || String(f.attributes.rs_plot_no) === value);
    if (selected) setResult(selected);
  }

  async function runPlotSearch() {
    if (!plot) return;
    setError(""); setLoading(true); setResult(null); setMatches([]);
    try {
      const selectedMouza = mouzas.find(x => x.m_guid === mauza);
      const selectedUpazila = upazilas.find(x => x.t_guid === tGuid);
      const q = new URLSearchParams({ action: "plots", plot_no: plot, limit: "50" });
      if (selectedMouza) { q.set("mouza", selectedMouza.mauza); q.set("jl", String(selectedMouza.jl_no)); }
      if (selectedUpazila) q.set("upazila", selectedUpazila.upazila_ps);
      const r = await fetch(`/api/rajuk/query?${q}`); const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const fs = d.features ?? []; setMatches(fs); if (fs.length === 1) setResult(fs[0]); if (!fs.length) setError("No plot found");
    } catch(e) { setError(e instanceof Error ? e.message : "Query failed"); } finally { setLoading(false); }
  }

  async function runIdentify() {
    setError(""); setLoading(true); setIdentify([]);
    try {
      const r = await fetch(`/api/rajuk/query?action=identify&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`); const d = await r.json();
      if (!r.ok) throw new Error(d.error); setIdentify(d.features ?? []); if (!d.features?.length) setError("No plot contains this coordinate");
    } catch(e) { setError(e instanceof Error ? e.message : "Identify failed"); } finally { setLoading(false); }
  }

  const active = result || identify[0];
  const geojson = useMemo(() => active ? JSON.stringify({ type: "Feature", id: active.attributes.objectid, geometry: { type: "Polygon", coordinates: active.geometry.rings }, properties: active.attributes }, null, 2) : "", [active]);
  const optionLabel = (f: RajukPlotFeature) => String(f.attributes.rs_plot_no ?? f.attributes.plot_no ?? f.attributes.objectid);

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header><div className="flex items-center gap-2 text-2xl font-bold"><Database className="text-[#006a4e]" /> RAJUK Runtime Test</div><p className="mt-1 text-sm text-slate-500">District → Upazila → Mouza → Plot • real RAJUK attributes + polygon geometry</p></header>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Plot Search</h2><div className="space-y-3">
        <label className="block text-sm font-medium">Select District</label>
        <div className="relative"><select value={dGuid} onChange={e=>setDGuid(e.target.value)} className="w-full rounded-xl border px-3 py-2.5" disabled={loadingLevel === "district"}><option value="">District নির্বাচন করুন</option>{districts.map(d=><option key={d.d_guid} value={d.d_guid}>{d.m_district}</option>)}</select>{loadingLevel === "district" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17}/>}</div>
        <label className="block text-sm font-medium">Select Upazila</label>
        <div className="relative"><select value={tGuid} onChange={e=>setTGuid(e.target.value)} disabled={!dGuid || loadingLevel === "upazila"} className="w-full rounded-xl border px-3 py-2.5"><option value="">Upazila নির্বাচন করুন</option>{upazilas.map(u=><option key={u.t_guid} value={u.t_guid}>{u.upazila_ps}</option>)}</select>{loadingLevel === "upazila" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17}/>}</div>
        <label className="block text-sm font-medium">Select Mouza</label>
        <div className="relative"><select value={mauza} onChange={e=>setMauza(e.target.value)} disabled={!tGuid || loadingLevel === "mouza"} className="w-full rounded-xl border px-3 py-2.5"><option value="">Mouza নির্বাচন করুন</option>{mouzas.map(m=><option key={m.m_guid} value={m.m_guid}>{m.mauza} — JL {m.jl_no}</option>)}</select>{loadingLevel === "mouza" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17}/>}</div>
        <label className="block text-sm font-medium">Select Plot</label>
        <div className="relative"><select value={plot} onChange={e=>selectPlot(e.target.value)} disabled={!mauza || loadingLevel === "plot" || !plots.length} className="w-full rounded-xl border px-3 py-2.5"><option value="">Plot নির্বাচন করুন</option>{plots.map(f=><option key={f.attributes.p_guid || f.attributes.objectid} value={String(f.attributes.plot_no ?? f.attributes.rs_plot_no)}>{optionLabel(f)}</option>)}</select>{loadingLevel === "plot" && <Loader2 className="absolute right-3 top-3 animate-spin" size={17}/>}</div>
        <button onClick={runPlotSearch} disabled={loading || !plot} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{loading?<Loader2 className="animate-spin" size={17}/>:<Search size={17}/>} Query Selected Plot</button>
      </div></div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Coordinate Identify</h2><div className="space-y-3"><input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude, e.g. 23.5795" className="w-full rounded-xl border px-3 py-2.5" /><input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude, e.g. 90.5443" className="w-full rounded-xl border px-3 py-2.5" /><button onClick={runIdentify} disabled={loading || !lat || !lng} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50"><Crosshair size={17}/> Identify Plot</button></div><p className="mt-3 text-xs text-slate-500">Uses esriSpatialRelIntersects with inSR/outSR 4326.</p></div>
    </section>

    {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18}/>{error}</div>}
    {matches.length > 1 && <section className="rounded-2xl border bg-white p-5"><h2 className="mb-3 font-bold">{matches.length} matching plots</h2><div className="grid gap-2 md:grid-cols-2">{matches.map(f=><button key={f.attributes.p_guid || f.attributes.objectid} onClick={()=>setResult(f)} className="rounded-xl border p-3 text-left hover:border-[#006a4e]"><b>{f.attributes.rs_plot_no || f.attributes.plot_no}</b><div className="text-xs text-slate-500">{f.attributes.address_search}</div></button>)}</div></section>}
    {active && <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Selected RAJUK Plot</h2><div className="grid gap-3 md:grid-cols-2">{fields.map(key=><div key={key} className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-semibold text-slate-500">{key}</div><div className="mt-1 break-all font-mono text-sm">{String(active.attributes[key] ?? "—")}</div></div>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div><h3 className="mb-2 font-semibold">GeoJSON</h3><pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200">{geojson}</pre></div><div><h3 className="mb-2 font-semibold">WKT</h3><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-slate-200">{wkt(active.geometry.rings)}</pre></div></div></section>}
  </div></main>;
}
