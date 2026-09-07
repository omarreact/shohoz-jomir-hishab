"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
import { areaFromPlotAttributes, formatAreaValue } from "@/src/modules/land/plotArea";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

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
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div className="relative mt-1">
        <select
          {...props}
          className={`w-full min-w-0 appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/20 disabled:cursor-not-allowed disabled:bg-[var(--secondary)] disabled:text-[var(--muted-foreground)] ${props.className ?? ""}`}
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

    if (!plotsLoaded || plots.length === 0) {
      setSearchError("আগে আর এস প্লট লোড করুন।");
      return;
    }

    const match = plots.find((feature) => {
      const normalized = normalizePlotInput(plotNo(feature, "rs"), "rs");
      const plain = String((feature.attributes as Record<string, unknown>).plot_no ?? "").trim();
      return normalized === bare || plain === bare || plain.replace(/^0+/, "") === bare;
    });
    if (!match) {
      setSearchError(`আর এস প্লট ${bare} পাওয়া যায়নি।`);
      return;
    }
    setSelected(match);
    if (loc.selectedMouza && loc.selectedUpazila) {
      const query = new URLSearchParams({
        action: "plots",
        kind: "rs",
        mouza: loc.selectedMouza.mauza,
        jl: String(loc.selectedMouza.jl_no),
        upazila: loc.selectedUpazila.upazila_ps,
        rs_plot_no: plotNo(match, "rs") || bare,
        limit: "1",
      });
      setLastRequestUrl(`/api/rajuk/query?${query}`);
    }
  }, [plotInput, mode, plotsLoaded, plots, loc.selectedMouza, loc.selectedUpazila]);

  const resultRows = useMemo(() => {
    if (!selected) return [];
    const attributes = selected.attributes as Record<string, unknown>;
    const area = areaFromPlotAttributes(attributes);
    const rawNo = plotNo(selected, mode);
    const bare = normalizePlotInput(rawNo, mode);
    const prefix = mode === "rs" ? "আর এস" : "এম এস";
    return [
      { label: `${prefix} প্লট নম্বর`, value: `${prefix}-${bare}` },
      { label: "প্লট নং", value: bare },
      { label: "জে.এল. নং", value: attrStr(attributes, ["jl_no", "rs_jl_no", "ms_jl_no"]) },
      { label: "পরিমাণ (শতাংশ)", value: area.isValid ? `${formatAreaValue(area.shotok, 4)} শতাংশ` : "—" },
      { label: "পরিমাণ (কাঠা)", value: area.isValid ? `${formatAreaValue(area.katha)} কাঠা` : "—" },
      { label: "মৌজা", value: attrStr(attributes, ["mauza", `${mode}_mauza_name`, "mauza_name"]) },
      { label: "থানা / উপজেলা", value: attrStr(attributes, ["upazila_ps", "thana_upazila", "upazila"]) },
      { label: "জেলা", value: attrStr(attributes, ["m_district", "district", "district_name"]) },
      { label: "ঠিকানা", value: attrStr(attributes, ["address_search", "address"]) },
    ];
  }, [selected, mode]);

  const msRows = useMemo(
    () => msInside.map((feature, index) => {
      const attributes = feature.attributes as Record<string, unknown>;
      const area = areaFromPlotAttributes(attributes);
      const no = plotNo(feature, "ms") || String(index + 1);
      return {
        no,
        shotok: area.isValid ? formatAreaValue(area.shotok, 4) : "—",
        katha: area.isValid ? formatAreaValue(area.katha) : "—",
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
    const element = exportRef.current;
    const originalWidth = element.style.width;
    const originalOverflow = element.style.overflow;
    setPrintingPdf(true);
    setSearchError("");

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      element.style.width = "800px";
      element.style.overflow = "visible";

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: Math.max(800, element.scrollWidth),
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfWidth = pageWidth - margin * 2;
      const innerPageHeight = pageHeight - margin * 2;
      const imageHeight = (canvas.height * pdfWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/jpeg", 0.97);

      let heightLeft = imageHeight;
      let position = margin;
      pdf.addImage(imageData, "JPEG", margin, position, pdfWidth, imageHeight);
      heightLeft -= innerPageHeight;

      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imageData, "JPEG", margin, position, pdfWidth, imageHeight);
        heightLeft -= innerPageHeight;
      }

      const number = normalizePlotInput(plotNo(selected, mode), mode) || "plot";
      pdf.save(`${mode.toUpperCase()}-${number}-LandBD.pdf`);
    } catch (reason) {
      console.error("Plot PDF export failed", reason);
      setSearchError("পিডিএফ তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      element.style.width = originalWidth;
      element.style.overflow = originalOverflow;
      setPrintingPdf(false);
    }
  };

  const error = loc.error || searchError;
  const prefix = mode === "rs" ? "আর এস" : "এম এস";
  const searchDisabled =
    loadingPlots ||
    !plotInput.trim() ||
    (mode === "rs" ? !plotsLoaded : !loc.selectedMouza || !loc.selectedUpazila);

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-6 text-[var(--foreground)] sm:px-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Database className="text-[#17663A]" size={28} />
            রাজউক প্লট অনুসন্ধান
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            আর এস ও এম এস প্লট জেলা, উপজেলা, মৌজা, জে.এল. এবং সঠিক প্লট নম্বর দিয়ে নির্দিষ্টভাবে অনুসন্ধান করুন।
          </p>
          <div className="inline-flex rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] p-1">
            {(["rs", "ms"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === value
                    ? "bg-[var(--card-bg)] text-[#17663A] shadow-sm ring-1 ring-[var(--border-color)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {value === "rs" ? "আর এস প্লট" : "এম এস প্লট"}
              </button>
            ))}
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold">
              {mode === "rs" ? "আর এস প্লটের এলাকা নির্বাচন" : "নির্দিষ্ট এম এস প্লটের এলাকা নির্বাচন"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
              {mode === "rs"
                ? "জেলা → উপজেলা → মৌজা/জে.এল. নির্বাচন করে ওই এলাকার আর এস প্লট লোড করুন।"
                : "জেলা → উপজেলা → মৌজা → জে.এল. নির্বাচন করলে একই এম এস প্লট নম্বরের অপ্রাসঙ্গিক ফলাফল বাদ যাবে।"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="জেলা"
              value={loc.dGuid}
              onChange={(event) => loc.setDGuid(event.target.value)}
              disabled={loc.loading === "district"}
              loading={loc.loading === "district"}
            >
              <option value="">জেলা নির্বাচন করুন</option>
              {loc.districts.map((district) => (
                <option key={district.d_guid} value={district.d_guid}>{district.m_district}</option>
              ))}
            </SelectField>

            <SelectField
              label="থানা / উপজেলা"
              value={loc.tGuid}
              onChange={(event) => loc.setTGuid(event.target.value)}
              disabled={!loc.dGuid || loc.loading === "upazila"}
              loading={loc.loading === "upazila"}
            >
              <option value="">উপজেলা নির্বাচন করুন</option>
              {loc.upazilas.map((upazila) => (
                <option key={upazila.t_guid} value={upazila.t_guid}>{upazila.upazila_ps}</option>
              ))}
            </SelectField>

            <SelectField
              label="মৌজা"
              value={loc.mauzaId}
              onChange={(event) => loc.setMauzaId(event.target.value)}
              disabled={!loc.tGuid || loc.loading === "mouza"}
              loading={loc.loading === "mouza"}
            >
              <option value="">{loc.loading === "mouza" ? "লোড হচ্ছে…" : "মৌজা নির্বাচন করুন"}</option>
              {loc.mouzas.map((mouza) => (
                <option key={mouza.m_guid} value={mouza.m_guid}>{mouza.mauza} — জে.এল. {mouza.jl_no}</option>
              ))}
            </SelectField>

            <div className="min-w-0">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">জে.এল. নম্বর</label>
              <input
                type="text"
                readOnly
                value={loc.selectedMouza ? String(loc.selectedMouza.jl_no) : ""}
                placeholder="মৌজা নির্বাচন করলে জে.এল. নম্বর আসবে"
                className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] outline-none placeholder:font-normal placeholder:text-[var(--muted-foreground)]"
                aria-label="জে.এল. নম্বর"
              />
            </div>
          </div>

          {mode === "rs" ? (
            <button
              type="button"
              onClick={() => void loadRsPlots()}
              disabled={!loc.selectedMouza || loadingPlots}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17663A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10552f] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loadingPlots ? <Loader2 size={17} className="animate-spin" /> : <Database size={17} />}
              {loadingPlots ? "আর এস প্লট লোড হচ্ছে…" : "আর এস প্লট লোড করুন"}
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-xs leading-5 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
              এম এস-এর বিদ্যমান রাজউক ফিচারসার্ভার ঠিকানা-ধাপ ব্যবহার করেই অনুসন্ধান সংকুচিত করা হচ্ছে; মূল আর এস/এম এস ডেটা উৎস ও এপিআই অপরিবর্তিত।
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5 md:p-6">
          <h2 className="text-base font-bold">{prefix} প্লট নম্বর</h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {mode === "rs"
              ? plotsLoaded
                ? `${plots.length.toLocaleString("bn-BD")}টি আর এস প্লট লোড হয়েছে।`
                : "আগে নির্বাচিত মৌজার আর এস প্লট লোড করুন।"
              : loc.selectedMouza
                ? `${loc.selectedMouza.mauza} · জে.এল. ${String(loc.selectedMouza.jl_no).toLocaleString()} — এখন যেমন ৪৭১১ অথবা এম এস-৪৭১১ লিখুন।`
                : "আগে জেলা, উপজেলা ও মৌজা নির্বাচন করুন; তারপর যেমন ৪৭১১ অথবা এম এস-৪৭১১ লিখুন।"}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="text"
              value={plotInput}
              onChange={(event) => setPlotInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !searchDisabled) {
                  event.preventDefault();
                  void runSearch();
                }
              }}
              placeholder={mode === "rs" ? "যেমন: ৪৬৭ বা আর এস-৪৬৭" : "যেমন: ৪৭১১ বা এম এস-৪৭১১"}
              disabled={loadingPlots || (mode === "rs" && !plotsLoaded)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/20 disabled:bg-[var(--secondary)]"
              aria-label={`${prefix} প্লট নম্বর`}
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searchDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              {loadingPlots && mode === "ms" ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loadingPlots && mode === "ms" ? "খোঁজা হচ্ছে…" : "প্লট খুঁজুন"}
            </button>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {mode === "ms" && msMatches.length > 1 ? (
          <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold">নির্বাচিত এলাকায় একই নম্বরের এম এস ফলাফল — {msMatches.length.toLocaleString("bn-BD")}টি</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">ঠিকানা ও জমির পরিমাণ মিলিয়ে সঠিক প্লটটি নির্বাচন করুন।</p>
            <div className="mt-3 grid gap-2">
              {msMatches.map((feature, index) => {
                const attributes = feature.attributes as Record<string, unknown>;
                const address = attrStr(attributes, ["address_search", "address"]);
                const area = areaFromPlotAttributes(attributes);
                const active = feature === selected;
                return (
                  <button
                    key={String(attributes.p_guid ?? attributes.objectid ?? index)}
                    type="button"
                    onClick={() => setSelected(feature)}
                    className={`min-h-0 rounded-xl border p-3 text-left transition ${active ? "border-[#17663A] bg-emerald-50 dark:bg-emerald-950/20" : "border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--secondary)]"}`}
                  >
                    <span className="block text-sm font-semibold">{address}</span>
                    <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                      {area.isValid ? `${formatAreaValue(area.shotok, 4)} শতাংশ · ${formatAreaValue(area.katha)} কাঠা` : "জমির পরিমাণ পাওয়া যায়নি"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {selected ? (
          <section className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">প্লটের তথ্য</h2>
                <p className="text-xs text-[var(--muted-foreground)]">নির্বাচিত {prefix} প্লট</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#17663A] dark:bg-emerald-950/30 dark:text-emerald-300">
                  <MapPin size={13} /> {prefix}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading || printingPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#17663A] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {downloading ? "তৈরি হচ্ছে…" : "পিএনজি ডাউনলোড"}
                </button>
                <button
                  type="button"
                  onClick={() => void handlePdfPrint()}
                  disabled={printingPdf || downloading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                  title="A4 পিডিএফ তৈরি করুন"
                >
                  {printingPdf ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  {printingPdf ? "পিডিএফ তৈরি হচ্ছে…" : "পিডিএফ প্রিন্ট"}
                </button>
              </div>
            </div>

            <div ref={exportRef} className="rounded-xl border border-[var(--border-color)] bg-white p-4 text-slate-900 sm:p-5">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <p className="text-lg font-bold text-[#17663A]">সহজ জমির হিসাব · ল্যান্ডবিডি</p>
                <p className="text-sm font-semibold">রাজউক {prefix} প্লট ফলাফল</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {resultRows.map(({ label, value }) => (
                      <tr key={label} className="border-b border-slate-100 last:border-0">
                        <th className="w-[42%] bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-600">{label}</th>
                        <td className="break-words px-3 py-2.5">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {mode === "rs" ? (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-bold">
                    এই আর এস প্লটের ভিতরের এম এস প্লট
                    {loadingMsInside ? " (লোড হচ্ছে…)" : msRows.length ? ` — ${msRows.length}টি` : " — পাওয়া যায়নি"}
                  </h3>
                  {msRows.length ? (
                    <div className="overflow-x-auto rounded-xl border border-violet-200">
                      <table className="w-full min-w-[28rem] text-sm">
                        <thead className="bg-violet-50 text-left text-xs text-violet-800">
                          <tr>
                            <th className="px-3 py-2">ক্রম</th>
                            <th className="px-3 py-2">এম এস প্লট নম্বর</th>
                            <th className="px-3 py-2">পরিমাণ (শতাংশ)</th>
                            <th className="px-3 py-2">পরিমাণ (কাঠা)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msRows.map((row, index) => (
                            <tr key={`${row.no}-${index}`} className="border-t border-violet-100">
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2 font-medium">এম এস-{normalizePlotInput(row.no, "ms")}</td>
                              <td className="px-3 py-2">{row.shotok}</td>
                              <td className="px-3 py-2">{row.katha}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
                তথ্য রাজউকের উপলব্ধ সার্ভে ডেটা থেকে নেওয়া হয়েছে। আনুষ্ঠানিক কাজে সংশ্লিষ্ট সরকারি রেকর্ড যাচাই করুন।
              </p>
            </div>

            {isLoggedIn && lastRequestUrl ? (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">প্রযুক্তিগত HTTP অনুরোধ</h3>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-2.5 py-1 text-xs font-medium"
                  >
                    {copied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copied ? "কপি হয়েছে" : "কপি"}
                  </button>
                </div>
                <code className="block break-all rounded-lg bg-[var(--card-bg)] px-3 py-2 font-mono text-xs">GET {lastRequestUrl}</code>
              </div>
            ) : null}

            <div>
              <h3 className="mb-2 text-sm font-semibold">প্লট সীমানা (মানচিত্র)</h3>
              {mode === "rs" ? (
                <MsAwarePlotMap
                  feature={selected}
                  onMsFeaturesChange={(features, loading) => {
                    setMsInside(features);
                    setLoadingMsInside(loading);
                  }}
                />
              ) : (
                <PlotMap feature={selected} />
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
