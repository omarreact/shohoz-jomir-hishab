"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AtlasWorkspaceHeader from "@/src/features/geospatial-map/components/AtlasWorkspaceHeader";
import OfficialLandSourceDock from "@/src/features/geospatial-map/components/OfficialLandSourceDock";
import { GIS_COVERAGE_NOTE, LEGAL_SURVEY_NOTE, LAND_SURVEY_LABELS } from "@/src/features/geospatial-map/lib/officialLandSources";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Loader2,
  MapPin,
  Printer,
  Search,
} from "lucide-react";
import type {
  RajukDistrict,
  RajukMauza,
  RajukPlotFeature,
  RajukUpazila,
} from "@/src/types/rajuk-runtime";
import { acreFromJsonAttributes, formatAcre } from "@/src/modules/land/jsonArea";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { generateResultPdf } from "@/src/shared/lib/pdf/generate-result-pdf";

const PlotMap = dynamic(() => import("@/src/shared/components/PlotMap"), { ssr: false });
const MsAwarePlotMap = dynamic(() => import("@/src/shared/components/MsAwarePlotMap"), { ssr: false });

type PlotMode = "rs" | "ms";

async function apiJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function toAsciiDigits(value: string): string {
  const banglaDigits: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  return value.replace(/[০-৯]/g, (digit) => banglaDigits[digit] ?? digit);
}

function normalizePlotInput(raw: string, mode: PlotMode): string {
  const prefix = mode === "rs" ? /^(?:RS|আর\s*এস)[\s\-_]*/i : /^(?:MS|এম\s*এস)[\s\-_]*/i;
  return toAsciiDigits(raw).trim().replace(prefix, "").replace(/\s+/g, "").replace(/^0+/, "") || "0";
}

function plotNo(feature: RajukPlotFeature, mode: PlotMode): string {
  const attributes = feature.attributes as Record<string, unknown>;
  return String(
    mode === "rs"
      ? attributes.rs_plot_no ?? attributes.plot_no ?? ""
      : attributes.ms_plot_no ?? attributes.plot_no ?? "",
  ).trim();
}

function attrStr(attributes: Record<string, unknown>, keys: string[], fallback = "—"): string {
  for (const key of keys) {
    const value = attributes[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return fallback;
}

function SelectField({
  label,
  loading,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      <label className="block text-xs font-black text-[#496761]">{label}</label>
      <div className="relative mt-1">
        <select
          {...props}
          className={["min-h-12 w-full min-w-0 appearance-none rounded-2xl border border-[#d4ded3] bg-white px-4 py-3 pr-10 text-sm font-bold text-[#223f42] shadow-sm outline-none transition focus:border-[#c57b4c] focus:ring-2 focus:ring-[#ecd1b7] disabled:cursor-not-allowed disabled:bg-[#edf0e9] disabled:text-[#82938c]",props.className ?? ""].join(" ")}
        >
          {children}
        </select>
        {loading ? (
          <Loader2 size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#17663A]" />
        ) : null}
      </div>
    </div>
  );
}

function useAddressCascade(kind: PlotMode) {
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [dGuid, setDGuid] = useState("");
  const [tGuid, setTGuid] = useState("");
  const [mauzaId, setMauzaId] = useState("");
  const [loading, setLoading] = useState<"" | "district" | "upazila" | "mouza">("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDistricts([]);
    setUpazilas([]);
    setMouzas([]);
    setDGuid("");
    setTGuid("");
    setMauzaId("");
    setLoading("district");
    setError("");

    const controller = new AbortController();
    void fetch(`/api/rajuk/query?action=districts&kind=${kind}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "জেলা লোড করা যায়নি");
        return data;
      })
      .then((data) => setDistricts(data.features ?? []))
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "জেলা লোড করা যায়নি");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading("");
      });

    return () => controller.abort();
  }, [kind]);

  useEffect(() => {
    setUpazilas([]);
    setMouzas([]);
    setTGuid("");
    setMauzaId("");
    if (!dGuid) return;
    setLoading("upazila");
    setError("");

    const controller = new AbortController();
    void fetch(`/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}&kind=${kind}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "উপজেলা লোড করা যায়নি");
        return data;
      })
      .then((data) => setUpazilas(data.features ?? []))
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "উপজেলা লোড করা যায়নি");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading("");
      });

    return () => controller.abort();
  }, [dGuid, kind]);

  useEffect(() => {
    setMouzas([]);
    setMauzaId("");
    if (!tGuid) return;
    setLoading("mouza");
    setError("");

    const controller = new AbortController();
    void fetch(`/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}&kind=${kind}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "মৌজা লোড করা যায়নি");
        return data;
      })
      .then((data) => setMouzas(data.features ?? []))
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "মৌজা লোড করা যায়নি");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading("");
      });

    return () => controller.abort();
  }, [tGuid, kind]);

  return {
    districts,
    upazilas,
    mouzas,
    dGuid,
    setDGuid,
    tGuid,
    setTGuid,
    mauzaId,
    setMauzaId,
    loading,
    error,
    setError,
    selectedDistrict: districts.find((item) => item.d_guid === dGuid),
    selectedUpazila: upazilas.find((item) => item.t_guid === tGuid),
    selectedMouza: mouzas.find((item) => item.m_guid === mauzaId),
  };
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }, "image/png");
}

export default function RajukTestPage() {
  const [mode, setMode] = useState<PlotMode>("rs");
  const loc = useAddressCascade(mode);
  const { isLoggedIn } = useAuth();
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [plotsLoaded, setPlotsLoaded] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [plotInput, setPlotInput] = useState("");
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [msMatches, setMsMatches] = useState<RajukPlotFeature[]>([]);
  const [msInside, setMsInside] = useState<RajukPlotFeature[]>([]);
  const [loadingMsInside, setLoadingMsInside] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [lastRequestUrl, setLastRequestUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlots([]);
    setPlotsLoaded(false);
    setSelected(null);
    setMsMatches([]);
    setMsInside([]);
    setPlotInput("");
    setSearchError("");
    setLastRequestUrl("");
  }, [mode, loc.dGuid, loc.tGuid, loc.mauzaId]);

  const loadRsPlots = useCallback(async () => {
    if (!loc.selectedMouza || !loc.selectedUpazila) return;
    setLoadingPlots(true);
    setSearchError("");
    setSelected(null);
    setMsInside([]);
    loc.setError("");
    const query = new URLSearchParams({
      action: "plots",
      kind: "rs",
      mouza: loc.selectedMouza.mauza,
      jl: String(loc.selectedMouza.jl_no),
      upazila: loc.selectedUpazila.upazila_ps,
      limit: "2000",
    });
    const url = `/api/rajuk/query?${query}`;
    setLastRequestUrl(url);
    try {
      const data = await apiJson(url);
      setPlots((data.features ?? []) as RajukPlotFeature[]);
      setPlotsLoaded(true);
    } catch (reason) {
      loc.setError(reason instanceof Error ? reason.message : "আর এস প্লট লোড করা যায়নি");
      setPlots([]);
      setPlotsLoaded(false);
    } finally {
      setLoadingPlots(false);
    }
  }, [loc.selectedMouza, loc.selectedUpazila, loc.setError]);

  const runSearch = useCallback(async () => {
    setSearchError("");
    setSelected(null);
    setMsMatches([]);
    setMsInside([]);
    const bare = normalizePlotInput(plotInput, mode);
    const label = mode === "rs" ? "আর এস" : "এম এস";
    if (!bare || bare === "0") {
      setSearchError(`একটি ${label} প্লট নম্বর লিখুন।`);
      return;
    }

    if (mode === "ms") {
      if (!loc.selectedMouza || !loc.selectedUpazila) {
        setSearchError("এম এস প্লট খুঁজতে আগে জেলা, উপজেলা ও মৌজা নির্বাচন করুন।");
        return;
      }

      const query = new URLSearchParams({
        action: "plots",
        kind: "ms",
        mouza: loc.selectedMouza.mauza,
        jl: String(loc.selectedMouza.jl_no),
        upazila: loc.selectedUpazila.upazila_ps,
        ms_plot_no: bare,
        limit: "50",
      });
      const url = `/api/rajuk/query?${query}`;
      setLastRequestUrl(url);
      setLoadingPlots(true);
      try {
        const data = await apiJson(url);
        const features = ((data.features ?? []) as RajukPlotFeature[]).filter(
          (feature) => normalizePlotInput(plotNo(feature, "ms"), "ms") === bare,
        );
        if (!features.length) {
          setSearchError(`নির্বাচিত এলাকায় এম এস প্লট ${bare} পাওয়া যায়নি।`);
          return;
        }
        setMsMatches(features);
        setSelected(features[0]);
      } catch (reason) {
        setSearchError(reason instanceof Error ? reason.message : "এম এস প্লট অনুসন্ধান করা যায়নি।");
      } finally {
        setLoadingPlots(false);
      }
      return;
    }

    if (!loc.selectedMouza || !loc.selectedUpazila) {
      setSearchError("আর এস প্লট খুঁজতে আগে জেলা, উপজেলা ও মৌজা নির্বাচন করুন।");
      return;
    }

    const matchesPlot = (feature: RajukPlotFeature) => {
      const normalized = normalizePlotInput(plotNo(feature, "rs"), "rs");
      const plain = String((feature.attributes as Record<string, unknown>).plot_no ?? "").trim();
      return normalized === bare || plain === bare || plain.replace(/^0+/, "") === bare;
    };
    const query = new URLSearchParams({
      action: "plots",
      kind: "rs",
      mouza: loc.selectedMouza.mauza,
      jl: String(loc.selectedMouza.jl_no),
      upazila: loc.selectedUpazila.upazila_ps,
      rs_plot_no: bare,
      limit: "50",
    });
    const url = `/api/rajuk/query?${query}`;
    setLastRequestUrl(url);

    // The optional bulk list is capped at 2,000 rows. Never report "not found"
    // merely because a matching plot lies outside that first page.
    const cached = plots.find(matchesPlot);
    if (cached) {
      setSelected(cached);
      return;
    }
    setLoadingPlots(true);
    try {
      const data = await apiJson(url);
      const found = ((data.features ?? []) as RajukPlotFeature[]).find(matchesPlot);
      if (!found) {
        setSearchError(`নির্বাচিত এলাকায় আর এস প্লট ${bare} পাওয়া যায়নি।`);
        return;
      }
      setSelected(found);
    } catch (reason) {
      setSearchError(reason instanceof Error ? reason.message : "আর এস প্লট অনুসন্ধান করা যায়নি।");
    } finally {
      setLoadingPlots(false);
    }
  }, [plotInput, mode, plotsLoaded, plots, loc.selectedMouza, loc.selectedUpazila]);

  const resultRows = useMemo(() => {
    if (!selected) return [];
    const attributes = selected.attributes as Record<string, unknown>;
    const area = acreFromJsonAttributes(attributes);
    const rawNo = plotNo(selected, mode);
    const bare = normalizePlotInput(rawNo, mode);
    const prefix = mode === "rs" ? "আর এস" : "এম এস";
    return [
      { label: `${prefix} প্লট নম্বর`, value: `${prefix}-${bare}` },
      { label: "প্লট নং", value: bare },
      { label: "জে.এল. নং", value: attrStr(attributes, ["jl_no", "rs_jl_no", "ms_jl_no"]) },
      { label: "পরিমাণ (একর)", value: formatAcre(area?.acre) },
      { label: "মৌজা", value: attrStr(attributes, ["mauza", `${mode}_mauza_name`, "mauza_name"]) },
      { label: "থানা / উপজেলা", value: attrStr(attributes, ["upazila_ps", "thana_upazila", "upazila"]) },
      { label: "জেলা", value: attrStr(attributes, ["m_district", "district", "district_name"]) },
      { label: "ঠিকানা", value: attrStr(attributes, ["address_search", "address"]) },
    ];
  }, [selected, mode]);

  const msRows = useMemo(
    () => msInside.map((feature, index) => {
      const attributes = feature.attributes as Record<string, unknown>;
      const area = acreFromJsonAttributes(attributes);
      const no = plotNo(feature, "ms") || String(index + 1);
      return {
        no,
        acre: formatAcre(area?.acre),
      };
    }),
    [msInside],
  );

  const handleCopy = async () => {
    if (!lastRequestUrl) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${lastRequestUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is optional.
    }
  };

  const handleDownload = async () => {
    if (!exportRef.current || !selected) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const number = normalizePlotInput(plotNo(selected, mode), mode) || "plot";
      downloadCanvas(canvas, `${mode.toUpperCase()}-${number}-LandBD.png`);
    } catch (reason) {
      console.error("Plot image export failed", reason);
      setSearchError("ছবি ডাউনলোডে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setDownloading(false);
    }
  };

  const handlePdfPrint = async () => {
    if (!exportRef.current || !selected) return;
    setPrintingPdf(true);
    setSearchError("");

    try {
      const number = normalizePlotInput(plotNo(selected, mode), mode) || "plot";
      const result = await generateResultPdf({
        source: exportRef.current,
        fileName: `LandBD-${mode.toUpperCase()}-${number}-Plot-Report-A4-Portrait`,
      });

      if (!result.ok) {
        setSearchError(result.error);
      }
    } catch (reason) {
      console.error("Plot PDF export failed", reason);
      setSearchError("পিডিএফ তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setPrintingPdf(false);
    }
  };

  const error = loc.error || searchError;
  const prefix = mode === "rs" ? "আর এস" : "এম এস";
  const searchDisabled =
    loadingPlots ||
    !plotInput.trim() ||
    !loc.selectedMouza || !loc.selectedUpazila;


  return (
    <main className="min-h-screen bg-[#f5f3ec] font-sans text-[#244346]">
      <AtlasWorkspaceHeader active="rajuk" />
      <section className="relative overflow-hidden border-b border-[#dfe4db] bg-[#e9f0e9]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.19]" style={{backgroundImage:"linear-gradient(#98afa4 1px,transparent 1px),linear-gradient(90deg,#98afa4 1px,transparent 1px)",backgroundSize:"32px 32px"}} />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-7 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_320px] lg:py-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c2d4c7] bg-[#fffdf7] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[#28636c]"><Database size={14}/> RAJUK GIS · Parcel Explorer</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.16] tracking-[-.055em] text-[#183c41] sm:text-5xl">দাগ নম্বর থেকে <span className="text-[#bd754c]">জমির পরিচয়।</span></h1>
            <p className="mt-4 max-w-[750px] text-sm leading-7 text-[#5d756e]">জেলা, উপজেলা ও মৌজা বেছে সরাসরি RAJUK ফিচার সার্ভিস থেকে RS/MS দাগের বৈশিষ্ট্য, আনুমানিক ক্ষেত্রফল এবং সীমারেখা যাচাই করুন।</p>
            <div className="mt-5 flex flex-wrap gap-2"><Link href="/geospatial-map" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1e5960] px-5 text-sm font-bold text-white"><MapPin size={16}/> মানচিত্রে যান</Link><Link href="/dlrms-khatian" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#b8cdbd] bg-white px-5 text-sm font-bold text-[#2d6063]">জাতীয় খতিয়ান অনুসন্ধান</Link></div>
          </div>
          <div className="rounded-[25px] border border-[#c9d7cd] bg-white/90 p-5 shadow-[0_12px_30px_rgba(30,65,53,.06)]">
            <span className="text-[10px] font-black tracking-[.16em] text-[#b16b4c]">DATA ORIGIN · RAJUK</span>
            <p className="mt-2 text-sm font-black">প্রকৃত ফিচার সার্ভিসের তথ্য</p>
            <p className="mt-2 text-xs leading-6 text-[#6b7b73]">{GIS_COVERAGE_NOTE}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1440px] items-start gap-6 px-3 pb-14 pt-7 sm:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-[27px] border border-[#dfe5da] bg-white shadow-[0_12px_35px_rgba(32,59,52,.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9ede5] px-5 py-5 sm:px-7">
              <div>
                <span className="text-[10px] font-black tracking-[.16em] text-[#bc7550]">01 / SELECT A SURVEY</span>
                <h2 className="mt-1 text-xl font-black">কোন জরিপের দাগ খুঁজবেন?</h2>
              </div>
              <div className="inline-flex gap-1 rounded-full border border-[#dfe5dc] bg-[#f4f7f2] p-1" role="group" aria-label="জরিপের ধরন">
                {(["rs","ms"] as const).map((id)=>(
                  <button key={id} type="button" onClick={()=>setMode(id)} aria-pressed={mode===id}
                    className={["min-h-10 rounded-full px-5 text-sm font-black transition",mode===id?"bg-[#1e5960] text-white shadow":"text-[#658078] hover:bg-white"].join(" ")}>{id==="rs"?"আরএস (RS)":"এমএস (MS)"}</button>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#f2f5ef] p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2eae3] text-[#2b6770]"><MapPin size={18}/></span><p className="text-xs leading-6 text-[#5a736b]">নির্ভুল অনুসন্ধানের জন্য জেলা → থানা/উপজেলা → মৌজা নির্বাচন করুন। জে.এল. নম্বর সরকারি উৎস থেকে স্বয়ংক্রিয়ভাবে আসবে।</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="০১ · জেলা" value={loc.dGuid} onChange={(e)=>loc.setDGuid(e.target.value)} loading={loc.loading==="district"} disabled={loc.loading==="district"}>
                  <option value="">জেলা নির্বাচন করুন</option>{loc.districts.map((d)=><option key={d.d_guid} value={d.d_guid}>{d.m_district}</option>)}
                </SelectField>
                <SelectField label="০২ · থানা / উপজেলা" value={loc.tGuid} onChange={(e)=>loc.setTGuid(e.target.value)} loading={loc.loading==="upazila"} disabled={!loc.dGuid || loc.loading==="upazila"}>
                  <option value="">উপজেলা নির্বাচন করুন</option>{loc.upazilas.map((u)=><option key={u.t_guid} value={u.t_guid}>{u.upazila_ps}</option>)}
                </SelectField>
                <SelectField label="০৩ · মৌজা" value={loc.mauzaId} onChange={(e)=>loc.setMauzaId(e.target.value)} loading={loc.loading==="mouza"} disabled={!loc.tGuid || loc.loading==="mouza"}>
                  <option value="">{loc.loading==="mouza"?"লোড হচ্ছে…":"মৌজা নির্বাচন করুন"}</option>{loc.mouzas.map((m)=><option key={m.m_guid} value={m.m_guid}>{m.mauza} · JL {m.jl_no}</option>)}
                </SelectField>
                <div>
                  <label htmlFor="atlas-rajuk-jl" className="block text-xs font-black text-[#496761]">০৪ · জে.এল. নম্বর</label>
                  <input id="atlas-rajuk-jl" readOnly value={loc.selectedMouza ? String(loc.selectedMouza.jl_no) : ""} placeholder="মৌজা নির্বাচনের পরে দেখাবে" className="mt-1.5 min-h-12 w-full rounded-2xl border border-[#e0e5dc] bg-[#f2f5f0] px-4 text-sm font-extrabold text-[#4d6e68]" />
                </div>
              </div>
              {mode==="rs" && <button type="button" disabled={!loc.selectedMouza || loadingPlots} onClick={()=>void loadRsPlots()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#b6d6ce] bg-[#e5f0e9] px-5 text-sm font-black text-[#1c626c] hover:bg-[#d6e8dc] disabled:opacity-40 sm:w-auto">
                {loadingPlots?<Loader2 size={17} className="animate-spin"/>:<Database size={17}/>} {loadingPlots?"RS দাগ লোড হচ্ছে…":plotsLoaded? "RS দাগ আবার লোড করুন":"এই মৌজার RS দাগ লোড করুন"}
              </button>}
            </div>
          </section>

          <section className="rounded-[27px] border border-[#dfe5da] bg-white p-5 shadow-[0_12px_35px_rgba(32,59,52,.05)] sm:p-7">
            <div className="mb-4">
              <span className="text-[10px] font-black tracking-[.16em] text-[#bc7550]">02 / IDENTIFY A PARCEL</span>
              <h2 className="mt-1 text-xl font-black">{prefix} দাগ অনুসন্ধান</h2>
              <p className="mt-2 text-xs leading-6 text-[#708079]">{mode==="rs" ? (plotsLoaded ? "প্রাথমিক তালিকায় "+plots.length.toLocaleString("bn-BD")+"টি দাগ লোড হয়েছে। তালিকার বাইরের দাগও সরাসরি নম্বর দিয়ে খুঁজতে পারবেন।" : "মৌজা নির্বাচন করে সরাসরি দাগ নম্বর লিখুন। প্রাথমিক (সর্বোচ্চ ২,০০০) তালিকা দেখতে উপরের ঐচ্ছিক বোতাম ব্যবহার করুন।") : "মৌজা ও JL অনুযায়ী সুনির্দিষ্ট MS দাগ খোঁজা হবে।"}</p>
            </div>
            <form onSubmit={(e)=>{e.preventDefault();void runSearch();}} className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#d5ded5] bg-[#fcfdf9] px-3 focus-within:border-[#c57b51] focus-within:ring-2 focus-within:ring-[#ead7c2]"><Search size={20} className="text-[#72938d]"/><input inputMode="numeric" aria-label={prefix+" দাগ নম্বর"} value={plotInput} onChange={(e)=>setPlotInput(e.target.value)} placeholder="দাগ নং · যেমন ৬১৮৪" className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-bold outline-none placeholder:font-normal"/></div>
              <button type="submit" disabled={searchDisabled} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1d5b62] px-6 text-sm font-black text-white hover:bg-[#184b52] disabled:opacity-40">
                {loadingPlots?<Loader2 size={18} className="animate-spin"/>:<Search size={18}/>} দাগ খুঁজুন
              </button>
            </form>
            {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-[#f3c8bd] bg-[#fff1eb] p-4 text-xs font-bold leading-6 text-[#a34f38]"><AlertCircle size={18} className="shrink-0"/>{error}</div>}
            {!error && plotsLoaded && mode==="rs" && !selected && <p className="mt-4 text-xs font-bold text-[#4b7b6d]"><CheckCircle2 size={15} className="mr-1 inline"/> RS জরিপ ডেটা প্রস্তুত · নম্বর দিয়ে খুঁজুন</p>}
          </section>

          {selected ? (
            <section ref={exportRef} className="rounded-[27px] border border-[#dfe5da] bg-white p-5 shadow-[0_12px_35px_rgba(32,59,52,.05)] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><span className="text-[10px] font-black tracking-[.16em] text-[#bc7550]">03 / LIVE GIS RECORD</span><h2 className="mt-1 text-2xl font-black">দাগের বিস্তারিত</h2><p className="mt-1 text-xs text-[#667e75]">উৎস RAJUK · {prefix} · {loc.selectedMouza?.mauza || "নির্বাচিত মৌজা"}</p></div>
                <div className="flex gap-2 print:hidden">
                  <button type="button" disabled={downloading} onClick={()=>void handleDownload()} aria-label="দাগের তথ্য ছবি ডাউনলোড" className="grid h-11 w-11 place-items-center rounded-xl border border-[#dfe5dd] bg-[#f5f8f2] text-[#296b71] disabled:opacity-40">{downloading?<Loader2 size={18} className="animate-spin"/>:<Download size={18}/>}</button>
                  <button type="button" disabled={printingPdf} onClick={()=>void handlePdfPrint()} aria-label="দাগের PDF ডাউনলোড" className="grid h-11 w-11 place-items-center rounded-xl border border-[#dfe5dd] bg-[#f5f8f2] text-[#296b71] disabled:opacity-40">{printingPdf?<Loader2 size={18} className="animate-spin"/>:<Printer size={18}/>}</button>
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {resultRows.map((row)=><div key={row.label} className="rounded-2xl border border-[#e5e9e1] bg-[#fbfcf9] p-3.5"><dt className="text-[11px] font-bold text-[#7b8d83]">{row.label}</dt><dd className="mt-1 break-words text-sm font-black text-[#25474b]">{row.value}</dd></div>)}
              </div>
              {msMatches.length>1 && <p className="mt-3 text-xs font-semibold text-[#8c623f]">এই দাগ নম্বরের একাধিক MS ফিচার আছে ({msMatches.length})। বর্তমান প্রথম ফিচার দেখানো হয়েছে।</p>}
              {mode==="rs" && (loadingMsInside || msInside.length>0) && <div className="mt-5 rounded-2xl border border-[#e7e2d8] bg-[#f7f4ed] p-4">
                <h3 className="text-sm font-black">RS এলাকার মধ্যে MS দাগ {loadingMsInside ? "লোড হচ্ছে…" : "· "+msRows.length.toLocaleString("bn-BD")}</h3>
                {msRows.length>0?<div className="mt-3 max-h-56 overflow-y-auto"><table className="w-full text-left text-xs"><thead><tr className="text-[#74827b]"><th className="p-2">MS দাগ</th><th className="p-2">ক্ষেত্রফল (একর)</th></tr></thead><tbody>{msRows.map((row,index)=><tr key={row.no+"-"+index} className="border-t border-[#e4e7df]"><td className="p-2 font-bold">{row.no}</td><td className="p-2">{row.acre}</td></tr>)}</tbody></table></div>:null}
              </div>}

              {isLoggedIn && lastRequestUrl && <div className="mt-5 rounded-xl border border-[#e3e8e1] bg-[#f6f8f3] p-3">
                <div className="flex items-center justify-between"><p className="text-[11px] font-black">কারিগরি API URL</p><button type="button" onClick={()=>void handleCopy()} className="inline-flex items-center gap-1 text-xs font-bold text-[#24666b]">{copied?<CheckCircle2 size={14}/>:<Copy size={14}/>} {copied?"কপি হয়েছে":"কপি"}</button></div>
                <code className="mt-2 block break-all text-[10px] text-[#74817b]">GET {lastRequestUrl}</code>
              </div>}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-black">জরিপ দাগের সীমারেখা</h3>
                <div className="min-h-[380px] overflow-hidden rounded-[24px] border border-[#dce5da] bg-[#e9efea]">
                  {mode==="rs"?<MsAwarePlotMap feature={selected} onMsFeaturesChange={(features,loading)=>{setMsInside(features);setLoadingMsInside(loading);}}/>:<PlotMap feature={selected}/>}
                </div>
              </div>
              <p className="mt-4 rounded-xl bg-[#fff2e8] p-3 text-[11px] leading-5 text-[#935a3f]">{LEGAL_SURVEY_NOTE} ক্ষেত্রফল RAJUK JSON attributes থেকে; মালিকানার হিস্যা নয়।</p>
            </section>
          ) : (
            <section className="grid min-h-[250px] place-items-center rounded-[27px] border border-dashed border-[#cadad0] bg-[#ecf1e9] p-6 text-center">
              <div><MapPin size={28} className="mx-auto text-[#5a9288]"/><h3 className="mt-3 text-lg font-black">দাগ নির্বাচন করলে তথ্য এখানে দেখা যাবে</h3><p className="mt-2 text-xs leading-6 text-[#698078]">কোনো নমুনা ফলাফল দেখানো হয় না। অনুসন্ধান সম্পূর্ণ হলে প্রকৃত RAJUK ডেটা প্রদর্শিত হবে।</p></div>
            </section>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <OfficialLandSourceDock detailed />
          <section className="rounded-[24px] border border-[#e1e5dc] bg-white p-5">
            <h3 className="text-sm font-black">জরিপের উৎস বুঝুন</h3>
            <p className="mt-2 text-xs leading-6 text-[#73847a]">একই জমির RS ও MS দাগ নম্বর আলাদা হতে পারে। কেবল দাগ নম্বর মিলিয়ে মালিকানা নির্ধারণ করা যায় না।</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{LAND_SURVEY_LABELS.map((s)=><span key={s.code} title={s.name} className="rounded-full bg-[#eef2eb] px-3 py-1.5 text-[10px] font-black text-[#4d746f]">{s.code}</span>)}</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
