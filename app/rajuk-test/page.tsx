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

function normalizePlotInput(raw: string, mode: PlotMode): string {
  const prefix = mode === "rs" ? /^RS[\s\-_]*/i : /^MS[\s\-_]*/i;
  return raw.trim().replace(prefix, "").replace(/\s+/g, "").replace(/^0+/, "") || "0";
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
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
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
          <Loader2
            size={17}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#17663A]"
          />
        ) : null}
      </div>
    </div>
  );
}

function usePlotAddressCascade(mode: PlotMode) {
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
    void fetch(`/api/rajuk/query?action=districts&kind=${mode}`, {
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
  }, [mode]);

  useEffect(() => {
    setUpazilas([]);
    setMouzas([]);
    setTGuid("");
    setMauzaId("");
    if (!dGuid) return;
    setLoading("upazila");
    setError("");
    const controller = new AbortController();
    void fetch(`/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}&kind=${mode}`, {
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
  }, [dGuid, mode]);

  useEffect(() => {
    setMouzas([]);
    setMauzaId("");
    if (!tGuid) return;
    setLoading("mouza");
    setError("");
    const controller = new AbortController();
    void fetch(`/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}&kind=${mode}`, {
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
  }, [tGuid, mode]);

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
  const loc = usePlotAddressCascade(mode);
  const { isLoggedIn } = useAuth();
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [plotsLoaded, setPlotsLoaded] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [plotInput, setPlotInput] = useState("");
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [msInside, setMsInside] = useState<RajukPlotFeature[]>([]);
  const [loadingMsInside, setLoadingMsInside] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [lastRequestUrl, setLastRequestUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlots([]);
    setPlotsLoaded(false);
    setSelected(null);
    setMsInside([]);
    setPlotInput("");
    setSearchError("");
    setLastRequestUrl("");
  }, [mode, loc.dGuid, loc.tGuid, loc.mauzaId]);

  const loadPlots = useCallback(async () => {
    if (!loc.selectedMouza || !loc.selectedUpazila) return;
    setLoadingPlots(true);
    setSearchError("");
    setSelected(null);
    setMsInside([]);
    loc.setError("");
    const query = new URLSearchParams({
      action: "plots",
      kind: mode,
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
      loc.setError(reason instanceof Error ? reason.message : `${mode.toUpperCase()} প্লট লোড করা যায়নি`);
      setPlots([]);
      setPlotsLoaded(false);
    } finally {
      setLoadingPlots(false);
    }
  }, [loc.selectedMouza, loc.selectedUpazila, loc.setError, mode]);

  const runSearch = useCallback(() => {
    setSearchError("");
    setSelected(null);
    setMsInside([]);
    const bare = normalizePlotInput(plotInput, mode);
    const label = mode === "rs" ? "RS" : "MS";
    if (!bare || bare === "0") {
      setSearchError(`একটি ${label} প্লট নম্বর লিখুন।`);
      return;
    }
    if (!plotsLoaded || plots.length === 0) {
      setSearchError(`আগে ${label} প্লট লোড করুন।`);
      return;
    }

    const match = plots.find((feature) => {
      const normalized = normalizePlotInput(plotNo(feature, mode), mode);
      const plain = String((feature.attributes as Record<string, unknown>).plot_no ?? "").trim();
      return normalized === bare || plain === bare || plain.replace(/^0+/, "") === bare;
    });

    if (!match) {
      setSearchError(`${label} প্লট ${bare} পাওয়া যায়নি।`);
      return;
    }

    setSelected(match);
    if (loc.selectedMouza && loc.selectedUpazila) {
      const query = new URLSearchParams({
        action: "plots",
        kind: mode,
        mouza: loc.selectedMouza.mauza,
        jl: String(loc.selectedMouza.jl_no),
        upazila: loc.selectedUpazila.upazila_ps,
        [mode === "rs" ? "rs_plot_no" : "ms_plot_no"]: plotNo(match, mode) || bare,
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
    const prefix = mode.toUpperCase();
    return [
      { label: `${prefix} প্লট নম্বর`, value: rawNo.toUpperCase().startsWith(prefix) ? rawNo : `${prefix}-${bare}` },
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
    () =>
      msInside.map((feature, index) => {
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

  const error = loc.error || searchError;
  const prefix = mode === "rs" ? "আর এস" : "এম এস";

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-6 text-[var(--foreground)] sm:px-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Database className="text-[#17663A]" size={28} />
            RAJUK প্লট অনুসন্ধান
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            জেলা → উপজেলা → মৌজা / জে.এল. নির্বাচন করে আর এস অথবা এম এস প্লট খুঁজুন।
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
          <h2 className="mb-4 text-base font-bold">ঠিকানা নির্বাচন</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
            </div>
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
              label={`মৌজা + জে.এল. / ${prefix}`}
              value={loc.mauzaId}
              onChange={(event) => loc.setMauzaId(event.target.value)}
              disabled={!loc.tGuid || loc.loading === "mouza"}
              loading={loc.loading === "mouza"}
            >
              <option value="">{loc.loading === "mouza" ? "লোড হচ্ছে…" : "মৌজা নির্বাচন করুন"}</option>
              {loc.mouzas.map((mouza) => (
                <option key={mouza.m_guid} value={mouza.m_guid}>{mouza.mauza} — JL {mouza.jl_no}</option>
              ))}
            </SelectField>
          </div>
          <button
            type="button"
            onClick={() => void loadPlots()}
            disabled={!loc.selectedMouza || loadingPlots}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17663A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10552f] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loadingPlots ? <Loader2 size={17} className="animate-spin" /> : <Database size={17} />}
            {loadingPlots ? `${prefix} প্লট লোড হচ্ছে…` : `${prefix} প্লট লোড করুন`}
          </button>
        </section>

        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5 md:p-6">
          <h2 className="text-base font-bold">{prefix} প্লট নম্বর</h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {plotsLoaded
              ? `${plots.length.toLocaleString("bn-BD")}টি ${prefix} প্লট লোড হয়েছে।`
              : `আগে নির্বাচিত মৌজার ${prefix} প্লট লোড করুন।`}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="text"
              value={plotInput}
              onChange={(event) => setPlotInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runSearch();
                }
              }}
              placeholder={mode === "rs" ? "যেমন: 467 বা RS-467" : "যেমন: 12 বা MS-12"}
              disabled={!plotsLoaded || loadingPlots}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/20 disabled:bg-[var(--secondary)]"
              aria-label={`${prefix} প্লট নম্বর`}
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={!plotsLoaded || loadingPlots || !plotInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              <Search size={16} /> প্লট খুঁজুন
            </button>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {selected ? (
          <section className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm sm:p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">প্লটের তথ্য</h2>
                <p className="text-xs text-[var(--muted-foreground)]">১টি {prefix} প্লট পাওয়া গেছে</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#17663A] dark:bg-emerald-950/30 dark:text-emerald-300">
                  <MapPin size={13} /> {prefix}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#17663A] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {downloading ? "তৈরি হচ্ছে…" : "PNG ডাউনলোড"}
                </button>
              </div>
            </div>

            <div ref={exportRef} className="rounded-xl border border-[var(--border-color)] bg-white p-4 text-slate-900 sm:p-5">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <p className="text-lg font-bold text-[#17663A]">সহজ জমির হিসাব · LandBD</p>
                <p className="text-sm font-semibold">RAJUK {prefix} প্লট ফলাফল</p>
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
                            <th className="px-3 py-2">MS প্লট নম্বর</th>
                            <th className="px-3 py-2">পরিমাণ (শতাংশ)</th>
                            <th className="px-3 py-2">পরিমাণ (কাঠা)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msRows.map((row, index) => (
                            <tr key={`${row.no}-${index}`} className="border-t border-violet-100">
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2 font-medium">{row.no.toUpperCase().startsWith("MS") ? row.no : `MS-${row.no}`}</td>
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
                তথ্য RAJUK-এর উপলব্ধ সার্ভে ডেটা থেকে নেওয়া হয়েছে। আনুষ্ঠানিক কাজে সংশ্লিষ্ট সরকারি রেকর্ড যাচাই করুন।
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
