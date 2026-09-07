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

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/90 p-5 shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
          <MapPinned className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-base font-bold text-white">মৌজা ম্যাপ ডাউনলোড</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            জেলা → উপজেলা → মৌজা নির্বাচন করুন। উচ্চ রেজোলিউশন PNG (স্যাটেলাইট + RS + MS) ডাউনলোড করুন।
          </p>
        </div>
      </div>

      <label className="mb-1 block text-[11px] font-semibold text-slate-300">জেলা</label>
      <select
        value={districtGuid}
        disabled={loadingDistricts || downloading}
        onChange={(e) => setDistrictGuid(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white disabled:opacity-50"
      >
        <option value="">{loadingDistricts ? "লোড হচ্ছে…" : "জেলা বাছুন"}</option>
        {districts.map((d) => (
          <option key={d.d_guid} value={d.d_guid}>
            {d.m_district}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-[11px] font-semibold text-slate-300">উপজেলা / থানা</label>
      <select
        value={upazilaGuid}
        disabled={!districtGuid || loadingUpazilas || downloading}
        onChange={(e) => setUpazilaGuid(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white disabled:opacity-50"
      >
        <option value="">{loadingUpazilas ? "লোড হচ্ছে…" : "উপজেলা বাছুন"}</option>
        {upazilas.map((u) => (
          <option key={u.t_guid} value={u.t_guid}>
            {u.upazila_ps}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-[11px] font-semibold text-slate-300">মৌজা</label>
      <select
        value={mouzaKey}
        disabled={!upazilaGuid || loadingMouzas || downloading}
        onChange={(e) => setMouzaKey(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white disabled:opacity-50"
      >
        <option value="">{loadingMouzas ? "লোড হচ্ছে…" : "মৌজা বাছুন"}</option>
        {mouzas.map((m) => (
          <option key={`${m.mauza}|${m.jl_no}`} value={`${m.mauza}|${m.jl_no}`}>
            {m.mauza}
            {m.jl_no !== undefined && m.jl_no !== "" ? ` (JL ${m.jl_no})` : ""}
          </option>
        ))}
      </select>

      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        আউটপুট: উচ্চ রেজোলিউশন PNG — স্যাটেলাইট + RS/MS, শুধু নির্বাচিত মৌজা। GeoTIFF / RAW / Vector PDF শুধু অ্যাডমিনের জন্য।
      </p>

      {downloading && (
        <p className="mb-2 text-[11px] font-medium text-emerald-400">ম্যাপ তৈরি হচ্ছে… ({elapsed}s)</p>
      )}

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={!selectedMouza || downloading}
        onClick={() => void download()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {downloading ? "ডাউনলোড হচ্ছে…" : "উচ্চ রেজোলিউশন PNG ডাউনলোড"}
      </button>
    </div>
  );
}
