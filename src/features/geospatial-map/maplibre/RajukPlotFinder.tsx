"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { RajukDistrict, RajukMauza, RajukUpazila } from "@/src/types/rajuk-runtime";

export type PlotSearchOptions = {
  kind: "all" | "rs" | "ms";
  mouza?: string;
  jl?: string;
  upazila?: string;
};

type Props = {
  plotNo: string;
  setPlotNo: (value: string) => void;
  searching: boolean;
  searchPlots: (options?: PlotSearchOptions) => void;
  vectorStatus: string;
};

async function getOptions<T>(params: URLSearchParams, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(`/api/rajuk/query?${params.toString()}`, { signal });
  const data = (await response.json().catch(() => null)) as { features?: T[]; error?: string } | null;
  if (!response.ok) throw new Error(data?.error || "উৎসের তালিকা আনা যায়নি");
  return Array.isArray(data?.features) ? data.features : [];
}

/**
 * RAJUK-like district > upazila > mouza finder, backed only by LandBD's
 * existing server-side RAJUK proxy. No ArcGIS token or secret reaches the UI.
 * Location selection is optional so the plain plot-number search still works
 * if the upstream location service is unavailable.
 */
export default function RajukPlotFinder({ plotNo, setPlotNo, searching, searchPlots, vectorStatus }: Props) {
  const [kind, setKind] = useState<PlotSearchOptions["kind"]>("all");
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [districtGuid, setDistrictGuid] = useState("");
  const [upazilaGuid, setUpazilaGuid] = useState("");
  const [mouzaGuid, setMouzaGuid] = useState("");
  const [loadingLevel, setLoadingLevel] = useState<"district" | "upazila" | "mouza" | null>(null);
  const [lookupError, setLookupError] = useState("");
  const layerKind = kind === "ms" ? "ms" : "rs";
  const selectedUpazila = upazilas.find((item) => item.t_guid === upazilaGuid);
  const selectedMouza = mouzas.find((item) => item.m_guid === mouzaGuid);

  useEffect(() => {
    const controller = new AbortController();
    setDistrictGuid("");
    setUpazilaGuid("");
    setMouzaGuid("");
    setUpazilas([]);
    setMouzas([]);
    setDistricts([]);
    setLookupError("");
    setLoadingLevel("district");
    void getOptions<RajukDistrict>(new URLSearchParams({ action: "districts", kind: layerKind }), controller.signal)
      .then(setDistricts)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLookupError(error instanceof Error ? error.message : "জেলার তালিকা পাওয়া যায়নি");
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingLevel(null); });
    return () => controller.abort();
  }, [layerKind]);

  useEffect(() => {
    const controller = new AbortController();
    setUpazilas([]);
    setMouzas([]);
    setUpazilaGuid("");
    setMouzaGuid("");
    if (!districtGuid) return () => controller.abort();
    setLookupError("");
    setLoadingLevel("upazila");
    void getOptions<RajukUpazila>(
      new URLSearchParams({ action: "upazilas", kind: layerKind, d_guid: districtGuid }), controller.signal,
    ).then(setUpazilas).catch((error: unknown) => {
      if (!controller.signal.aborted) setLookupError(error instanceof Error ? error.message : "উপজেলার তালিকা পাওয়া যায়নি");
    }).finally(() => { if (!controller.signal.aborted) setLoadingLevel(null); });
    return () => controller.abort();
  }, [districtGuid, layerKind]);

  useEffect(() => {
    const controller = new AbortController();
    setMouzas([]);
    setMouzaGuid("");
    if (!upazilaGuid) return () => controller.abort();
    setLookupError("");
    setLoadingLevel("mouza");
    void getOptions<RajukMauza>(
      new URLSearchParams({ action: "mouzas", kind: layerKind, t_guid: upazilaGuid }), controller.signal,
    ).then(setMouzas).catch((error: unknown) => {
      if (!controller.signal.aborted) setLookupError(error instanceof Error ? error.message : "মৌজার তালিকা পাওয়া যায়নি");
    }).finally(() => { if (!controller.signal.aborted) setLoadingLevel(null); });
    return () => controller.abort();
  }, [upazilaGuid, layerKind]);

  const fieldClass = "min-h-10 w-full rounded-md border border-[#d3dae5] bg-white px-3 text-xs font-semibold text-[#253b56] outline-none focus-visible:border-[#1267ae] focus-visible:ring-2 focus-visible:ring-[#1267ae]/20 disabled:cursor-not-allowed disabled:bg-[#f0f3f7]";

  return (
    <form
      className="space-y-3 border-b border-[#e2e7ee] bg-white px-4 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        // A partially selected hierarchy should not silently broaden the query.
        if (districtGuid && !upazilaGuid) { setLookupError("জেলার পর উপজেলা নির্বাচন করুন"); return; }
        if (upazilaGuid && !mouzaGuid) { setLookupError("উপজেলার পর মৌজা নির্বাচন করুন"); return; }
        setLookupError("");
        searchPlots({
          kind,
          upazila: selectedUpazila?.upazila_ps,
          mouza: selectedMouza?.mauza,
          jl: selectedMouza ? String(selectedMouza.jl_no) : undefined,
        });
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-[#123e68]">দাগ / Plot অনুসন্ধান</h2>
        {loadingLevel && <Loader2 size={15} aria-label="তালিকা লোড হচ্ছে" className="animate-spin text-[#1267ae]" />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="rajuk-search-kind" className="mb-1 block text-[11px] font-bold text-[#52677f]">জরিপ স্তর</label>
          <select id="rajuk-search-kind" className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as PlotSearchOptions["kind"])}>
            <option value="rs">RS</option><option value="ms">MS</option><option value="all">RS + MS</option>
          </select>
        </div>
        <div>
          <label htmlFor="rajuk-search-district" className="mb-1 block text-[11px] font-bold text-[#52677f]">জেলা</label>
          <select id="rajuk-search-district" className={fieldClass} value={districtGuid} onChange={(event) => setDistrictGuid(event.target.value)}>
            <option value="">সব জেলা</option>
            {districts.map((item) => <option key={item.d_guid} value={item.d_guid}>{item.m_district}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="rajuk-search-upazila" className="mb-1 block text-[11px] font-bold text-[#52677f]">থানা / উপজেলা</label>
          <select id="rajuk-search-upazila" className={fieldClass} value={upazilaGuid} disabled={!districtGuid} onChange={(event) => setUpazilaGuid(event.target.value)}>
            <option value="">উপজেলা নির্বাচন</option>
            {upazilas.map((item) => <option key={item.t_guid} value={item.t_guid}>{item.upazila_ps}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="rajuk-search-mouza" className="mb-1 block text-[11px] font-bold text-[#52677f]">মৌজা</label>
          <select id="rajuk-search-mouza" className={fieldClass} value={mouzaGuid} disabled={!upazilaGuid} onChange={(event) => setMouzaGuid(event.target.value)}>
            <option value="">মৌজা নির্বাচন</option>
            {mouzas.map((item) => <option key={item.m_guid} value={item.m_guid}>{item.mauza} · JL {item.jl_no}</option>)}
          </select>
        </div>
      </div>
      <label htmlFor="atlas-dag-search" className="block text-[11px] font-bold text-[#52677f]">RS / MS দাগ নম্বর</label>
      <div className="flex gap-2">
        <input id="atlas-dag-search" inputMode="numeric" value={plotNo} onChange={(event) => setPlotNo(event.target.value)} placeholder="যেমন: 349 / ৩৪৯" className={fieldClass + " min-w-0 flex-1"} />
        <button type="submit" disabled={searching || !plotNo.trim()} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md bg-[#1261a6] px-3 text-xs font-bold text-white transition hover:bg-[#0a497f] disabled:opacity-50">
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} খুঁজুন
        </button>
      </div>
      {lookupError && <p role="alert" className="rounded-md bg-[#fff1ed] px-2.5 py-2 text-[11px] leading-5 text-[#a43a24]">{lookupError}। শুধু দাগ নম্বর দিয়েও খোঁজা যাবে।</p>}
      {vectorStatus && <p role="status" className="text-[11px] leading-5 text-[#586f83]">{vectorStatus}</p>}
      <p className="text-[10px] leading-4 text-[#718298]">উৎস: LandBD-এর বিদ্যমান RAJUK GIS সংযোগ। এলাকার বাইরে ফলাফল নাও থাকতে পারে।</p>
    </form>
  );
}
