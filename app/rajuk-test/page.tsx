"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Database, Loader2, Search, AlertCircle } from "lucide-react";
import type { RajukDistrict, RajukMauza, RajukPlotFeature, RajukUpazila } from "@/src/types/rajuk-runtime";
import { areaFromPlotAttributes, formatAreaValue } from "@/src/modules/land/plotArea";

const PlotMap = dynamic(() => import("@/src/shared/components/PlotMap"), { ssr: false });
type PlotTab = "rs" | "ms";

async function apiJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}

function plotNo(f: RajukPlotFeature, tab: PlotTab) {
  const a = f.attributes as Record<string, unknown>;
  return String(tab === "ms" ? a.ms_plot_no ?? a.plot_no ?? "" : a.rs_plot_no ?? a.plot_no ?? "").trim();
}

function useAddressCascade(kind: PlotTab) {
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [dGuid, setDGuid] = useState("");
  const [tGuid, setTGuid] = useState("");
  const [mauzaId, setMauzaId] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading("district");
    apiJson("/api/rajuk/query?action=districts")
      .then(d => setDistricts(d.features ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "District load failed"))
      .finally(() => setLoading(""));
  }, []);

  useEffect(() => {
    setUpazilas([]); setMouzas([]); setTGuid(""); setMauzaId("");
    if (!dGuid) return;
    setLoading("upazila"); setError("");
    apiJson(`/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}`)
      .then(d => setUpazilas(d.features ?? []))
      .catch(e => setError(e instanceof Error ? e.message : "Upazila load failed"))
      .finally(() => setLoading(""));
  }, [dGuid]);

  useEffect(() => {
    setMouzas([]); setMauzaId("");
    if (!tGuid) return;
    setLoading("mouza"); setError("");
    apiJson(`/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}&kind=${kind}`)
      .then(d => setMouzas(d.features ?? []))
      .catch(e => setError(e instanceof Error ? e.message : `${kind.toUpperCase()} Mouza load failed`))
      .finally(() => setLoading(""));
  }, [tGuid, kind]);

  return {
    districts, upazilas, mouzas, dGuid, setDGuid, tGuid, setTGuid,
    mauzaId, setMauzaId, loading, error, setError,
    selectedDistrict: districts.find(x => x.d_guid === dGuid),
    selectedUpazila: upazilas.find(x => x.t_guid === tGuid),
    selectedMouza: mouzas.find(x => x.m_guid === mauzaId),
  };
}

function AddressFields({ loc, tab }: { loc: ReturnType<typeof useAddressCascade>; tab: PlotTab }) {
  return <>
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium">Select District</label>
      <select value={loc.dGuid} onChange={e => loc.setDGuid(e.target.value)} disabled={loc.loading === "district"} className="mt-1 w-full rounded-xl border px-3 py-2.5">
        <option value="">District নির্বাচন করুন</option>
        {loc.districts.map(d => <option key={d.d_guid} value={d.d_guid}>{d.m_district}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium">Select Upazila</label>
      <select value={loc.tGuid} onChange={e => loc.setTGuid(e.target.value)} disabled={!loc.dGuid || loc.loading === "upazila"} className="mt-1 w-full rounded-xl border px-3 py-2.5">
        <option value="">Upazila নির্বাচন করুন</option>
        {loc.upazilas.map(u => <option key={u.t_guid} value={u.t_guid}>{u.upazila_ps}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium">Select {tab.toUpperCase()} Mouza + JL</label>
      <select value={loc.mauzaId} onChange={e => loc.setMauzaId(e.target.value)} disabled={!loc.tGuid || loc.loading === "mouza"} className="mt-1 w-full rounded-xl border px-3 py-2.5">
        <option value="">{loc.loading === "mouza" ? "Loading…" : `${tab.toUpperCase()} Mouza নির্বাচন করুন`}</option>
        {loc.mouzas.map(m => <option key={m.m_guid} value={m.m_guid}>{m.mauza} — JL {m.jl_no}</option>)}
      </select>
    </div>
  </>;
}

function PlotSearch({ tab }: { tab: PlotTab }) {
  const loc = useAddressCascade(tab);
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [plot, setPlot] = useState("");
  const [loading, setPlotLoading] = useState(false);

  useEffect(() => {
    setPlots([]); setSelected(null); setPlot("");
    if (!loc.selectedMouza || !loc.selectedUpazila) return;
    setPlotLoading(true); loc.setError("");
    const q = new URLSearchParams({ action: "plots", kind: tab, mouza: loc.selectedMouza.mauza, upazila: loc.selectedUpazila.upazila_ps, limit: "2000" });
    if (tab === "rs") q.set("jl", String(loc.selectedMouza.jl_no));
    apiJson(`/api/rajuk/query?${q}`)
      .then(d => setPlots((d.features ?? []) as RajukPlotFeature[]))
      .catch(e => loc.setError(e instanceof Error ? e.message : `${tab.toUpperCase()} plot load failed`))
      .finally(() => setPlotLoading(false));
  }, [tab, loc.selectedMouza, loc.selectedUpazila]);

  const options = useMemo(() => plots.map(f => ({ f, n: plotNo(f, tab) })).filter(x => x.n), [plots, tab]);
  const error = loc.error;
  return <>
    <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
      <h2 className="mb-1 font-bold">{tab.toUpperCase()} plot search</h2>
      <p className="mb-4 text-xs text-slate-500">{tab === "rs" ? "RS address + FeatureServer/0" : "MS address + FeatureServer/5 — MS JL comes directly from the MS layer"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <AddressFields loc={loc} tab={tab} />
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Select {tab.toUpperCase()} Plot</label>
          <select value={plot} onChange={e => { setPlot(e.target.value); setSelected(options.find(x => x.n === e.target.value)?.f ?? null); }} disabled={!loc.selectedMouza || loading} className="mt-1 w-full rounded-xl border px-3 py-2.5">
            <option value="">{loading ? "Loading plots…" : `Select ${tab.toUpperCase()} plot`}</option>
            {options.map(x => <option key={String(x.f.attributes.objectid)} value={x.n}>{x.n}</option>)}
          </select>
        </div>
      </div>
    </section>
    {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18}/>{error}</div>}
    {selected && <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div><h2 className="font-bold">{tab.toUpperCase()} Plot {plotNo(selected, tab)}</h2><p className="text-xs text-slate-500">{String(selected.attributes.address_search ?? "")}</p></div>
      <PlotMap feature={selected} />
      <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><tbody>
        {[["Plot No", plotNo(selected, tab)], ["JL No", String(selected.attributes.jl_no ?? selected.attributes.rs_jl_no ?? "—")], ["Mouza", String(selected.attributes.mauza ?? selected.attributes.rs_mauza_name ?? "—")], ["Upazila", String(selected.attributes.upazila_ps ?? selected.attributes.thana_upazila ?? "—")], ["District", String(selected.attributes.m_district ?? selected.attributes.district ?? "—")]].map(([k,v]) => <tr key={k}><th className="w-1/3 border-b bg-slate-50 px-4 py-2.5 text-left">{k}</th><td className="border-b px-4 py-2.5">{v}</td></tr>)}
      </tbody></table></div>
      {(() => { const a = areaFromPlotAttributes(selected.attributes as Record<string, unknown>); return a.isValid ? <div className="rounded-xl border border-emerald-200 p-4"><h3 className="mb-2 font-semibold">Calculated area</h3><div className="grid grid-cols-2 gap-2 text-sm">{[["sq ft",a.sqFt],["shotok",a.shotok],["katha",a.katha],["bigha",a.bigha],["acre",a.acre]].map(([k,v]) => <div key={String(k)}><span className="text-slate-500">{k}: </span><b>{formatAreaValue(v as number)}</b></div>)}</div></div> : null; })()}
    </section>}
  </>;
}

export default function RajukTestPage() {
  const [tab, setTab] = useState<PlotTab>("rs");
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8"><div className="mx-auto max-w-5xl space-y-6">
    <header><div className="flex items-center gap-2 text-2xl font-bold"><Database className="text-[#006a4e]"/> RAJUK Runtime Test</div><p className="mt-1 text-sm text-slate-500">RS → FeatureServer/0 · MS → FeatureServer/5 · independent address cascades</p></header>
    <div className="flex gap-1 rounded-xl border bg-slate-100 p-1"><button onClick={() => setTab("rs")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${tab === "rs" ? "bg-white text-[#006a4e] shadow-sm" : "text-slate-600"}`}>RS plot search</button><button onClick={() => setTab("ms")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${tab === "ms" ? "bg-white text-[#006a4e] shadow-sm" : "text-slate-600"}`}>MS plot search</button></div>
    {tab === "rs" ? <PlotSearch tab="rs"/> : <PlotSearch tab="ms"/>}
  </div></main>;
}
