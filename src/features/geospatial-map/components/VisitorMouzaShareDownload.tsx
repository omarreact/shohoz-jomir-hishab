"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, Eye, Loader2, MapPinned } from "lucide-react";

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

type SurveyKind = "rs" | "ms";

const CLIENT_TIMEOUT_MS = 240_000;
const PREVIEW_MAX_DIM = 2048;
const DOWNLOAD_MAX_DIM = 6144;

export default function VisitorMouzaShareDownload() {
  const [surveyKind, setSurveyKind] = useState<SurveyKind>("rs");
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [mouzas, setMouzas] = useState<Mouza[]>([]);

  const [districtGuid, setDistrictGuid] = useState("");
  const [upazilaGuid, setUpazilaGuid] = useState("");
  const [mouzaKey, setMouzaKey] = useState("");

  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  const [loadingMouzas, setLoadingMouzas] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setDistrictGuid("");
    setUpazilaGuid("");
    setMouzaKey("");
    setDistricts([]);
    setUpazilas([]);
    setMouzas([]);
    setPreviewUrl("");

    (async () => {
      setLoadingDistricts(true);
      setError("");
      try {
        const params = new URLSearchParams({ action: "districts", kind: surveyKind });
        const res = await fetch("/api/rajuk/query?" + params.toString(), { cache: "no-store" });
        const data = (await res.json()) as { features?: District[]; error?: string };
        if (!res.ok) throw new Error(data.error || "জেলা লোড করা যায়নি");
        if (!cancelled) setDistricts(Array.isArray(data.features) ? data.features : []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "জেলা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoadingDistricts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [surveyKind]);

  useEffect(() => {
    setUpazilaGuid("");
    setMouzaKey("");
    setUpazilas([]);
    setMouzas([]);
    setPreviewUrl("");
    if (!districtGuid) return;

    let cancelled = false;
    (async () => {
      setLoadingUpazilas(true);
      setError("");
      try {
        const params = new URLSearchParams({
          action: "upazilas",
          d_guid: districtGuid,
          kind: surveyKind,
        });
        const res = await fetch("/api/rajuk/query?" + params.toString(), { cache: "no-store" });
        const data = (await res.json()) as { features?: Upazila[]; error?: string };
        if (!res.ok) throw new Error(data.error || "উপজেলা লোড করা যায়নি");
        if (!cancelled) setUpazilas(Array.isArray(data.features) ? data.features : []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "উপজেলা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoadingUpazilas(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [districtGuid, surveyKind]);

  useEffect(() => {
    setMouzaKey("");
    setMouzas([]);
    setPreviewUrl("");
    if (!upazilaGuid) return;

    let cancelled = false;
    (async () => {
      setLoadingMouzas(true);
      setError("");
      try {
        const params = new URLSearchParams({
          action: "mouzas",
          t_guid: upazilaGuid,
          kind: surveyKind,
        });
        const res = await fetch("/api/rajuk/query?" + params.toString(), { cache: "no-store" });
        const data = (await res.json()) as { features?: Mouza[]; error?: string };
        if (!res.ok) throw new Error(data.error || "মৌজা লোড করা যায়নি");
        if (!cancelled) setMouzas(Array.isArray(data.features) ? data.features : []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "মৌজা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoadingMouzas(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [upazilaGuid, surveyKind]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    setPreviewUrl("");
  }, [mouzaKey]);

  useEffect(() => {
    if (!downloading && !previewing) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [downloading, previewing]);

  const selectedMouza = mouzas.find((m) => m.mauza + "|" + m.jl_no === mouzaKey) ?? null;
  const selectedDistrict = districts.find((d) => d.d_guid === districtGuid) ?? null;
  const selectedUpazila = upazilas.find((u) => u.t_guid === upazilaGuid) ?? null;

  const requestRaster = useCallback(async (maxDim: number) => {
    if (!selectedMouza) throw new Error("প্রথমে একটি মৌজা নির্বাচন করুন।");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({
        mouza: selectedMouza.mauza,
        jl: String(selectedMouza.jl_no ?? ""),
        format: "png",
        layers: "combined",
        satellite: "true",
        maxDim: String(maxDim),
      });
      const res = await fetch("/api/mouza-map/download?" + params.toString(), {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) throw new Error("ডাউনলোড সীমা পূর্ণ। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        if (res.status === 403) throw new Error(body.error || "এই এক্সপোর্টের অনুমতি নেই।");
        if (res.status === 504) throw new Error("ম্যাপ তৈরি করতে বেশি সময় লেগেছে। আবার চেষ্টা করুন।");
        throw new Error(body.error || "ম্যাপ তৈরি ব্যর্থ (" + res.status + ")");
      }

      return await res.blob();
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        throw new Error("ম্যাপ তৈরির সময় শেষ। আবার চেষ্টা করুন।");
      }
      throw cause;
    } finally {
      window.clearTimeout(timeout);
    }
  }, [selectedMouza]);

  const preview = useCallback(async () => {
    if (!selectedMouza || previewing || downloading) return;
    setPreviewing(true);
    setElapsed(0);
    setError("");

    try {
      const blob = await requestRaster(PREVIEW_MAX_DIM);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "প্রিভিউ তৈরি ব্যর্থ");
    } finally {
      setPreviewing(false);
    }
  }, [selectedMouza, previewing, downloading, requestRaster]);

  const download = useCallback(async () => {
    if (!selectedMouza || downloading || previewing) return;
    setDownloading(true);
    setElapsed(0);
    setError("");

    try {
      const blob = await requestRaster(DOWNLOAD_MAX_DIM);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = selectedMouza.mauza.replace(/[^\p{L}\p{N}]+/gu, "-");
      a.href = url;
      a.download = safe + "_RS_MS_SAT_share.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ডাউনলোড ব্যর্থ");
    } finally {
      setDownloading(false);
    }
  }, [selectedMouza, downloading, previewing, requestRaster]);

  const fieldClass =
    "mt-1.5 min-h-12 w-full rounded-2xl border border-[#d5ded4] bg-white px-3.5 text-sm font-bold text-[#263e3f] outline-none transition focus:border-[#ca7c53] focus:ring-2 focus:ring-[#eacbb0] disabled:bg-[#edf0e9] disabled:text-[#8d9b94]";

  return (
    <section aria-label="মৌজা ম্যাপ ডাউনলোড" className="w-full rounded-[26px] border border-[#e0e4d9] bg-white p-5 shadow-[0_12px_40px_rgba(31,60,53,.06)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dfede5] text-[#1f6570]">
          <MapPinned size={22} />
        </span>
        <div>
          <h2 className="text-xl font-black text-[#1f3e42]">মৌজা ম্যাপ ব্রাউজ ও প্রিভিউ</h2>
          <p className="mt-1 text-xs leading-5 text-[#6d807b]">
            কভারেজ → সার্ভে → জেলা → উপজেলা → ম্যাপ তালিকা থেকে মৌজা নির্বাচন করুন। বর্তমান লাইভ GIS উৎস RAJUK coverage-এ সীমাবদ্ধ।
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="atlas-mouza-division" className="text-xs font-black text-[#466462]">০১ · বিভাগ / কভারেজ</label>
              <select id="atlas-mouza-division" value="dhaka" disabled className={fieldClass}>
                <option value="dhaka">ঢাকা বিভাগ · RAJUK coverage</option>
              </select>
            </div>

            <div>
              <label htmlFor="atlas-mouza-survey" className="text-xs font-black text-[#466462]">০২ · সার্ভে ধরন</label>
              <select
                id="atlas-mouza-survey"
                value={surveyKind}
                disabled={downloading || previewing}
                onChange={(event) => setSurveyKind(event.target.value as SurveyKind)}
                className={fieldClass}
              >
                <option value="rs">আরএস (RS)</option>
                <option value="ms">এমএস (MS)</option>
              </select>
            </div>

            <div>
              <label htmlFor="atlas-mouza-district" className="text-xs font-black text-[#466462]">০৩ · জেলা</label>
              <select
                id="atlas-mouza-district"
                value={districtGuid}
                disabled={loadingDistricts || downloading || previewing}
                onChange={(event) => setDistrictGuid(event.target.value)}
                className={fieldClass}
              >
                <option value="">{loadingDistricts ? "জেলা লোড হচ্ছে…" : "জেলা নির্বাচন করুন"}</option>
                {districts.map((district) => (
                  <option key={district.d_guid} value={district.d_guid}>{district.m_district}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="atlas-mouza-upazila" className="text-xs font-black text-[#466462]">০৪ · উপজেলা / থানা</label>
              <select
                id="atlas-mouza-upazila"
                value={upazilaGuid}
                disabled={!districtGuid || loadingUpazilas || downloading || previewing}
                onChange={(event) => setUpazilaGuid(event.target.value)}
                className={fieldClass}
              >
                <option value="">{loadingUpazilas ? "উপজেলা লোড হচ্ছে…" : "উপজেলা নির্বাচন করুন"}</option>
                {upazilas.map((upazila) => (
                  <option key={upazila.t_guid} value={upazila.t_guid}>{upazila.upazila_ps}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="atlas-mouza-name" className="text-xs font-black text-[#466462]">০৫ · ম্যাপ তালিকা / মৌজা</label>
                <span className="text-[11px] font-bold text-[#80908a]">{mouzas.length} আইটেম</span>
              </div>
              <select
                id="atlas-mouza-name"
                value={mouzaKey}
                disabled={!upazilaGuid || loadingMouzas || downloading || previewing}
                onChange={(event) => setMouzaKey(event.target.value)}
                className={fieldClass}
              >
                <option value="">{loadingMouzas ? "ম্যাপ তালিকা লোড হচ্ছে…" : "মৌজা ম্যাপ নির্বাচন করুন"}</option>
                {mouzas.map((mouza) => (
                  <option key={mouza.m_guid} value={mouza.mauza + "|" + mouza.jl_no}>
                    {mouza.mauza} · JL {mouza.jl_no}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#e0e7dd] bg-[#f3f7f1] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#507b72]">LIVE SELECTION</p>
            <p className="mt-1 text-sm font-black text-[#274447]">
              {selectedMouza ? selectedMouza.mauza + " · JL " + selectedMouza.jl_no : "এখনও কোনো মৌজা নির্বাচন করা হয়নি"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6b7e78]">
              {selectedDistrict?.m_district || "—"} · {selectedUpazila?.upazila_ps || "—"} · {surveyKind.toUpperCase()} catalogue
            </p>
            <p className="mt-2 text-[11px] leading-5 text-[#77857f]">
              Visitor preview/download policy বর্তমানে RS + MS combined geometry ও satellite backdrop ব্যবহার করে। নির্বাচিত survey ধরন catalogue filtering-এর জন্য।
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-[#f0cbc1] bg-[#fff1ed] px-4 py-3 text-xs font-bold text-[#a34b36]">
              {error}
            </div>
          )}

          {(previewing || downloading) && (
            <p role="status" className="mt-3 text-xs font-bold text-[#1e7177]">
              {previewing ? "প্রিভিউ তৈরি হচ্ছে…" : "হাই-রেজোলিউশন ম্যাপ তৈরি হচ্ছে…"} {elapsed} সেকেন্ড
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!selectedMouza || previewing || downloading}
              onClick={() => void preview()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#bcd1c5] bg-[#eef5f0] px-4 text-sm font-black text-[#245b60] hover:bg-[#e3eee7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {previewing ? <Loader2 size={19} className="animate-spin" /> : <Eye size={19} />}
              {previewing ? "প্রিভিউ তৈরি হচ্ছে…" : "ম্যাপ প্রিভিউ"}
            </button>

            <button
              type="button"
              disabled={!selectedMouza || downloading || previewing}
              onClick={() => void download()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1d5a61] px-4 text-sm font-black text-white shadow-[0_6px_18px_rgba(26,91,94,.16)] hover:bg-[#184850] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {downloading ? <Loader2 size={19} className="animate-spin" /> : <Download size={19} />}
              {downloading ? "ম্যাপ তৈরি হচ্ছে…" : "হাই-রেজ PNG ডাউনলোড"}
            </button>
          </div>

          <a
            href="https://map.settlement.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#d9c9aa] bg-[#fff8e8] px-4 text-xs font-black text-[#805e2d]"
          >
            সরকারি মৌজা ম্যাপ / PDF উৎস খুলুন <ExternalLink size={15} />
          </a>

          <p className="mt-3 text-[11px] leading-5 text-[#73827d]">
            এই GIS প্রিভিউ সরকারি প্রত্যয়িত মৌজা নকশা নয়। LandBD-এর Vector PDF admin-only থাকে; সরকারি বা আইনি কাজে মূল DLRS/Settlement উৎস যাচাই করুন।
          </p>
        </div>

        <div className="min-h-[360px] overflow-hidden rounded-[24px] border border-[#dce5dc] bg-[#eef3ed]">
          {previewUrl ? (
            <div className="flex h-full min-h-[360px] items-center justify-center bg-[#e9eee8] p-3">
              <img src={previewUrl} alt={selectedMouza ? selectedMouza.mauza + " মৌজা ম্যাপ প্রিভিউ" : "মৌজা ম্যাপ প্রিভিউ"} className="max-h-[620px] w-full rounded-2xl bg-white object-contain shadow-sm" />
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#2b6870] shadow-sm">
                  <MapPinned size={27} />
                </span>
                <h3 className="mt-4 text-base font-black text-[#29484b]">ম্যাপ প্রিভিউ</h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#73827c]">
                  তালিকা থেকে একটি মৌজা নির্বাচন করে “ম্যাপ প্রিভিউ” চাপুন। প্রিভিউ অন-ডিমান্ড তৈরি হয়, তাই অপ্রয়োজনে export request করা হয় না।
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
