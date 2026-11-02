"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, MapPinned } from "lucide-react";

type District = { m_district: string; d_guid: string };
type Upazila = { upazila_ps: string; t_guid: string; d_guid: string; m_district: string };
type Mouza = {
  mauza: string;
  jl_no: string | number;
  m_guid: string;
  t_guid: string;
  d_guid: string;
  upazila_ps: string;
  m_district: string;
};

const CLIENT_TIMEOUT_MS = 240_000;

export default function VisitorMouzaShareDownload() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [mouzas, setMouzas] = useState<Mouza[]>([]);

  const [districtGuid, setDistrictGuid] = useState("");
  const [upazilaGuid, setUpazilaGuid] = useState("");
  const [mouzaKey, setMouzaKey] = useState("");

  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  const [loadingMouzas, setLoadingMouzas] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDistricts(true);
      setError("");
      try {
        const res = await fetch("/api/rajuk/query?action=districts&kind=rs", { cache: "no-store" });
        const data = (await res.json()) as { features?: District[]; error?: string };
        if (!res.ok) throw new Error(data.error || "জেলা লোড করা যায়নি");
        if (!cancelled) setDistricts(Array.isArray(data.features) ? data.features : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "জেলা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoadingDistricts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUpazilaGuid("");
    setMouzaKey("");
    setUpazilas([]);
    setMouzas([]);
    if (!districtGuid) return;
    let cancelled = false;
    (async () => {
      setLoadingUpazilas(true);
      setError("");
      try {
        const params = new URLSearchParams({ action: "upazilas", d_guid: districtGuid, kind: "rs" });
        const res = await fetch(`/api/rajuk/query?${params}`, { cache: "no-store" });
        const data = (await res.json()) as { features?: Upazila[]; error?: string };
        if (!res.ok) throw new Error(data.error || "উপজেলা লোড করা যায়নি");
        if (!cancelled) setUpazilas(Array.isArray(data.features) ? data.features : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "উপজেলা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoadingUpazilas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [districtGuid]);

  useEffect(() => {
    setMouzaKey("");
    setMouzas([]);
    if (!upazilaGuid) return;
    let cancelled = false;
    (async () => {
      setLoadingMouzas(true);
      setError("");
      try {
        const params = new URLSearchParams({ action: "mouzas", t_guid: upazilaGuid, kind: "rs" });
        const res = await fetch(`/api/rajuk/query?${params}`, { cache: "no-store" });
        const data = (await res.json()) as { features?: Mouza[]; error?: string };
        if (!res.ok) throw new Error(data.error || "মৌজা লোড করা যায়নি");
        if (!cancelled) setMouzas(Array.isArray(data.features) ? data.features : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "মৌজা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoadingMouzas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [upazilaGuid]);

  useEffect(() => {
    if (!downloading) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [downloading]);

  const selectedMouza = mouzas.find((m) => `${m.mauza}|${m.jl_no}` === mouzaKey) ?? null;

  const download = useCallback(async () => {
    if (!selectedMouza || downloading) return;
    setDownloading(true);
    setElapsed(0);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const params = new URLSearchParams({
        mouza: selectedMouza.mauza,
        jl: String(selectedMouza.jl_no ?? ""),
        format: "png",
        layers: "combined",
        satellite: "true",
        maxDim: "6144",
      });
      const res = await fetch(`/api/mouza-map/download?${params}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) throw new Error("ডাউনলোড সীমা পূর্ণ। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        if (res.status === 403) throw new Error(body.error || "এই ফরম্যাট শুধু অ্যাডমিনের জন্য।");
        if (res.status === 504) throw new Error("ম্যাপ তৈরি করতে বেশি সময় লেগেছে। আবার চেষ্টা করুন।");
        throw new Error(body.error || `ডাউনলোড ব্যর্থ (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = selectedMouza.mauza.replace(/[^\p{L}\p{N}]+/gu, "-");
      a.href = url;
      a.download = `${safe}_RS_MS_SAT_share.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("ম্যাপ তৈরির সময় শেষ। আবার চেষ্টা করুন।");
      } else {
        setError(e instanceof Error ? e.message : "ডাউনলোড ব্যর্থ");
      }
    } finally {
      window.clearTimeout(timeout);
      setDownloading(false);
    }
  }, [selectedMouza, downloading]);


  const fieldClass = "mt-1.5 min-h-12 w-full rounded-2xl border border-[#d5ded4] bg-white px-3.5 text-sm font-bold text-[#263e3f] outline-none transition focus:border-[#ca7c53] focus:ring-2 focus:ring-[#eacbb0] disabled:bg-[#edf0e9] disabled:text-[#8d9b94]";
  return (
    <section aria-label="মৌজা ম্যাপ ডাউনলোড" className="w-full rounded-[26px] border border-[#e0e4d9] bg-white p-5 shadow-[0_12px_40px_rgba(31,60,53,.06)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dfede5] text-[#1f6570]"><MapPinned size={22}/></span>
        <div><h2 className="text-xl font-black text-[#1f3e42]">মৌজা ম্যাপ প্রস্তুত করুন</h2><p className="mt-1 text-xs leading-5 text-[#6d807b]">RAJUK ডেটা থেকে নির্বাচিত মৌজার RS ও MS লেয়ার এবং স্যাটেলাইট ব্যাকড্রপ সহ PNG প্রস্তুত হয়।</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="atlas-mouza-district" className="text-xs font-black text-[#466462]">০১ · জেলা</label>
          <select id="atlas-mouza-district" value={districtGuid} disabled={loadingDistricts || downloading} onChange={(e)=>setDistrictGuid(e.target.value)} className={fieldClass}>
            <option value="">{loadingDistricts?"জেলা লোড হচ্ছে…":"জেলা নির্বাচন করুন"}</option>
            {districts.map((d)=><option key={d.d_guid} value={d.d_guid}>{d.m_district}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="atlas-mouza-upazila" className="text-xs font-black text-[#466462]">০২ · উপজেলা / থানা</label>
          <select id="atlas-mouza-upazila" value={upazilaGuid} disabled={!districtGuid || loadingUpazilas || downloading} onChange={(e)=>setUpazilaGuid(e.target.value)} className={fieldClass}>
            <option value="">{loadingUpazilas?"উপজেলা লোড হচ্ছে…":"উপজেলা নির্বাচন করুন"}</option>
            {upazilas.map((u)=><option key={u.t_guid} value={u.t_guid}>{u.upazila_ps}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="atlas-mouza-name" className="text-xs font-black text-[#466462]">০৩ · মৌজা / জে.এল.</label>
          <select id="atlas-mouza-name" value={mouzaKey} disabled={!upazilaGuid || loadingMouzas || downloading} onChange={(e)=>setMouzaKey(e.target.value)} className={fieldClass}>
            <option value="">{loadingMouzas?"মৌজা লোড হচ্ছে…":"মৌজা নির্বাচন করুন"}</option>
            {mouzas.map((m)=><option key={m.m_guid} value={m.mauza+"|"+m.jl_no}>{m.mauza} · JL {m.jl_no}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-[#e0e7dd] bg-[#f3f7f1] p-4">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#507b72]">LIVE SELECTION</p>
        <p className="mt-1 text-sm font-black text-[#274447]">{selectedMouza ? selectedMouza.mauza+" · JL "+selectedMouza.jl_no : "এখনও কোনো মৌজা নির্বাচন করা হয়নি"}</p>
        <p className="mt-2 text-xs leading-5 text-[#6b7e78]">উৎস: RAJUK RS/MS · স্যাটেলাইট ব্যাকড্রপ · PNG আউটপুট। GIS ডেটার প্রাপ্যতা ও লাইসেন্স নির্ভরশীল।</p>
      </div>
      {error && <div role="alert" className="mt-4 rounded-xl border border-[#f0cbc1] bg-[#fff1ed] px-4 py-3 text-xs font-bold text-[#a34b36]">{error}</div>}
      {downloading && <p role="status" className="mt-3 text-xs font-bold text-[#1e7177]">নকশা তৈরি হচ্ছে… {elapsed} সেকেন্ড</p>}
      <button type="button" disabled={!selectedMouza || downloading} onClick={()=>void download()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1d5a61] px-4 text-sm font-black text-white shadow-[0_6px_18px_rgba(26,91,94,.16)] hover:bg-[#184850] disabled:cursor-not-allowed disabled:opacity-40">
        {downloading?<Loader2 size={19} className="animate-spin"/>:<Download size={19}/>}
        {downloading?"ম্যাপ তৈরি হচ্ছে…":"মৌজা ম্যাপ PNG ডাউনলোড"}
      </button>
      <p className="mt-3 text-[11px] leading-5 text-[#73827d]">এই GIS প্রিভিউ সরকারি প্রত্যয়িত মৌজা নকশা নয়। মূল সরকারি ম্যাপ ও জরিপ নথি যাচাই করুন।</p>
    </section>
  );
}
