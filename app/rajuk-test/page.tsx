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

const PlotMap = dynamic(() => import("@/src/shared/components/MsAwarePlotMap"), {
  ssr: false,
});

async function apiJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}

function normalizePlotInput(raw: string): string {
  return (
    raw
      .trim()
      .replace(/^RS[\s\-_]*/i, "")
      .replace(/\s+/g, "")
      .replace(/^0+/, "") || "0"
  );
}

function rsPlotNo(f: RajukPlotFeature): string {
  const a = f.attributes as Record<string, unknown>;
  return String(a.rs_plot_no ?? a.plot_no ?? "").trim();
}

function msPlotNo(f: RajukPlotFeature): string {
  const a = f.attributes as Record<string, unknown>;
  return String(a.ms_plot_no ?? a.plot_no ?? "").trim();
}

function attrStr(
  a: Record<string, unknown>,
  keys: string[],
  fallback = "—",
): string {
  for (const k of keys) {
    const v = a[k];
    if (v !== null && v !== undefined && String(v).trim() !== "")
      return String(v).trim();
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
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative mt-1">
        <select
          {...props}
          className={`w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm focus:border-[#006a4e] focus:outline-none focus:ring-2 focus:ring-[#006a4e]/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${props.className ?? ""}`}
        >
          {children}
        </select>
        {loading && (
          <Loader2
            size={17}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#006a4e]"
          />
        )}
      </div>
    </div>
  );
}

function useRsAddressCascade() {
  const [districts, setDistricts] = useState<RajukDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<RajukUpazila[]>([]);
  const [mouzas, setMouzas] = useState<RajukMauza[]>([]);
  const [dGuid, setDGuid] = useState("");
  const [tGuid, setTGuid] = useState("");
  const [mauzaId, setMauzaId] = useState("");
  const [loading, setLoading] = useState<
    "" | "district" | "upazila" | "mouza"
  >("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading("district");
    setError("");
    apiJson(`/api/rajuk/query?action=districts`)
      .then((d) => setDistricts(d.features ?? []))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "District load failed"),
      )
      .finally(() => setLoading(""));
  }, []);

  useEffect(() => {
    setUpazilas([]);
    setMouzas([]);
    setTGuid("");
    setMauzaId("");
    if (!dGuid) return;
    setLoading("upazila");
    setError("");
    apiJson(
      `/api/rajuk/query?action=upazilas&d_guid=${encodeURIComponent(dGuid)}`,
    )
      .then((d) => setUpazilas(d.features ?? []))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Upazila load failed"),
      )
      .finally(() => setLoading(""));
  }, [dGuid]);

  useEffect(() => {
    setMouzas([]);
    setMauzaId("");
    if (!tGuid) return;
    setLoading("mouza");
    setError("");
    apiJson(
      `/api/rajuk/query?action=mouzas&t_guid=${encodeURIComponent(tGuid)}&kind=rs`,
    )
      .then((d) => setMouzas(d.features ?? []))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "RS Mouza load failed"),
      )
      .finally(() => setLoading(""));
  }, [tGuid]);

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
    selectedDistrict: districts.find((x) => x.d_guid === dGuid),
    selectedUpazila: upazilas.find((x) => x.t_guid === tGuid),
    selectedMouza: mouzas.find((x) => x.m_guid === mauzaId),
  };
}

export default function RajukTestPage() {
  const loc = useRsAddressCascade();
  const { isLoggedIn } = useAuth();
  const [plots, setPlots] = useState<RajukPlotFeature[]>([]);
  const [plotsLoaded, setPlotsLoaded] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [plotInput, setPlotInput] = useState("");
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [msInside, setMsInside] = useState<RajukPlotFeature[]>([]);
  const [loadingMs, setLoadingMs] = useState(false);
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
  }, [loc.dGuid, loc.tGuid, loc.mauzaId]);

  const loadRsPlots = useCallback(async () => {
    if (!loc.selectedMouza || !loc.selectedUpazila) return;
    setLoadingPlots(true);
    setSearchError("");
    setSelected(null);
    setMsInside([]);
    loc.setError("");
    const q = new URLSearchParams({
      action: "plots",
      kind: "rs",
      mouza: loc.selectedMouza.mauza,
      jl: String(loc.selectedMouza.jl_no),
      upazila: loc.selectedUpazila.upazila_ps,
      limit: "2000",
    });
    const url = `/api/rajuk/query?${q}`;
    setLastRequestUrl(url);
    try {
      const d = await apiJson(url);
      setPlots((d.features ?? []) as RajukPlotFeature[]);
      setPlotsLoaded(true);
    } catch (e) {
      loc.setError(e instanceof Error ? e.message : "RS plot load failed");
      setPlots([]);
      setPlotsLoaded(false);
    } finally {
      setLoadingPlots(false);
    }
  }, [loc]);

  const runSearch = useCallback(() => {
    setSearchError("");
    setSelected(null);
    setMsInside([]);
    const bare = normalizePlotInput(plotInput);
    if (!bare || bare === "0") {
      setSearchError("দয়া করে একটি RS Plot Number লিখুন।");
      return;
    }
    if (!plotsLoaded || plots.length === 0) {
      setSearchError("আগে RS plots লোড করুন।");
      return;
    }
    const match = plots.find((f) => {
      const n = normalizePlotInput(rsPlotNo(f));
      const plotNo = String(
        (f.attributes as Record<string, unknown>).plot_no ?? "",
      ).trim();
      return n === bare || plotNo === bare || plotNo.replace(/^0+/, "") === bare;
    });
    if (match) {
      setSelected(match);
      if (loc.selectedMouza && loc.selectedUpazila) {
        const q = new URLSearchParams({
          action: "plots",
          kind: "rs",
          mouza: loc.selectedMouza.mauza,
          jl: String(loc.selectedMouza.jl_no),
          upazila: loc.selectedUpazila.upazila_ps,
          rs_plot_no: rsPlotNo(match) || bare,
          limit: "1",
        });
        setLastRequestUrl(`/api/rajuk/query?${q}`);
      }
    } else {
      setSearchError(`RS Plot ${bare} was not found in the loaded RS data.`);
    }
  }, [plotInput, plots, plotsLoaded, loc.selectedMouza, loc.selectedUpazila]);

  const handleCopy = async () => {
    if (!lastRequestUrl) return;
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined"
          ? `${window.location.origin}${lastRequestUrl}`
          : lastRequestUrl,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDownloadPng = async () => {
    if (!exportRef.current || !selected) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(exportRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const plotLabel = normalizePlotInput(rsPlotNo(selected)) || "plot";
      const link = document.createElement("a");
      link.download = `RS-${plotLabel}-LandBD.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      setSearchError("ছবি ডাউনলোডে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setDownloading(false);
    }
  };

  const resultRows = useMemo(() => {
    if (!selected) return [];
    const a = selected.attributes as Record<string, unknown>;
    const area = areaFromPlotAttributes(a);
    const plotDisplay = rsPlotNo(selected);
    const bare = normalizePlotInput(plotDisplay);
    return [
      {
        label: "আরএস প্লট নম্বর",
        value: plotDisplay.startsWith("RS") ? plotDisplay : `RS-${bare}`,
      },
      { label: "প্লট নং", value: bare },
      { label: "জেএল নং", value: attrStr(a, ["jl_no", "rs_jl_no"]) },
      {
        label: "পরিমাণ (শতাংশ)",
        value: area.isValid ? `${formatAreaValue(area.shotok, 4)} শতাংশ` : "—",
      },
      {
        label: "পরিমাণ (কাঠা)",
        value: area.isValid ? formatAreaValue(area.katha) : "—",
      },
      {
        label: "মৌজা",
        value: attrStr(a, ["mauza", "rs_mauza_name", "mauza_name"]),
      },
      {
        label: "থানা / উপজেলা",
        value: attrStr(a, ["upazila_ps", "thana_upazila", "upazila"]),
      },
      {
        label: "জেলা",
        value: attrStr(a, ["m_district", "district", "district_name"]),
      },
      {
        label: "ঠিকানা",
        value: attrStr(a, ["address_search", "address"]),
      },
    ];
  }, [selected]);

  const msRows = useMemo(() => {
    return msInside.map((f, i) => {
      const a = f.attributes as Record<string, unknown>;
      const area = areaFromPlotAttributes(a);
      const no = msPlotNo(f) || String(i + 1);
      return {
        no,
        shotok: area.isValid ? formatAreaValue(area.shotok, 4) : "—",
        katha: area.isValid ? formatAreaValue(area.katha) : "—",
      };
    });
  }, [msInside]);

  const error = loc.error || searchError;
  const rsArea = selected
    ? areaFromPlotAttributes(selected.attributes as Record<string, unknown>)
    : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Database className="text-[#006a4e]" size={28} />
            RAJUK RS Plot Search
          </div>
          <p className="mt-1 text-sm text-slate-500">
            RS Survey · FeatureServer/0 · District → Upazila → Mouza/JL → manual
            plot search
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-base font-bold text-slate-800">
            ঠিকানা নির্বাচন
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <SelectField
                label="জেলা / District"
                value={loc.dGuid}
                onChange={(e) => loc.setDGuid(e.target.value)}
                disabled={loc.loading === "district"}
                loading={loc.loading === "district"}
              >
                <option value="">District নির্বাচন করুন</option>
                {loc.districts.map((d) => (
                  <option key={d.d_guid} value={d.d_guid}>
                    {d.m_district}
                  </option>
                ))}
              </SelectField>
            </div>
            <SelectField
              label="থানা / উপজেলা"
              value={loc.tGuid}
              onChange={(e) => loc.setTGuid(e.target.value)}
              disabled={!loc.dGuid || loc.loading === "upazila"}
              loading={loc.loading === "upazila"}
            >
              <option value="">Upazila নির্বাচন করুন</option>
              {loc.upazilas.map((u) => (
                <option key={u.t_guid} value={u.t_guid}>
                  {u.upazila_ps}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="মৌজা + JL / RS Mouza"
              value={loc.mauzaId}
              onChange={(e) => loc.setMauzaId(e.target.value)}
              disabled={!loc.tGuid || loc.loading === "mouza"}
              loading={loc.loading === "mouza"}
            >
              <option value="">
                {loc.loading === "mouza"
                  ? "Loading…"
                  : "RS Mouza নির্বাচন করুন"}
              </option>
              {loc.mouzas.map((m) => (
                <option key={m.m_guid} value={m.m_guid}>
                  {m.mauza} — JL {m.jl_no}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={loadRsPlots}
              disabled={!loc.selectedMouza || loadingPlots}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loadingPlots ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Loading RS plots…
                </>
              ) : (
                <>
                  <Database size={17} />
                  Load RS plots
                </>
              )}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-1 text-base font-bold text-slate-800">
            RS Plot Number
          </h2>
          {plotsLoaded && (
            <p className="mb-3 text-xs font-medium text-[#006a4e]">
              {plots.length.toLocaleString("en-US")}টি RS plot loaded
            </p>
          )}
          {!plotsLoaded && (
            <p className="mb-3 text-xs text-slate-500">
              মৌজা নির্বাচন করে আগে RS plots লোড করুন, তারপর প্লট নম্বর লিখে
              Search করুন।
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <label className="sr-only" htmlFor="rs-plot-input">
                RS Plot Number
              </label>
              <input
                id="rs-plot-input"
                type="text"
                inputMode="text"
                value={plotInput}
                onChange={(e) => setPlotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                placeholder="যেমন: 467 বা RS-467"
                disabled={!plotsLoaded || loadingPlots}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-[#006a4e] focus:outline-none focus:ring-2 focus:ring-[#006a4e]/30 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              disabled={!plotsLoaded || loadingPlots || !plotInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={16} />
              Search Plot
            </button>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selected && (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">ফলাফল</h2>
                <p className="text-xs text-slate-500">1টি RS প্লট পাওয়া গেছে</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#006a4e]">
                  <MapPin size={13} />
                  RS · FeatureServer/0
                </span>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={downloading || loadingMs}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#006a4e] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      তৈরি হচ্ছে…
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      PNG ডাউনলোড
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Exportable card — high-res PNG source */}
            <div
              ref={exportRef}
              className="rounded-xl border border-slate-200 bg-white p-5"
              style={{ fontFamily: "Hind Siliguri, Noto Sans Bengali, sans-serif" }}
            >
              <div className="mb-4 border-b border-slate-200 pb-3">
                <div className="text-lg font-bold text-[#006a4e]">সহজ জমির হিসাব · LandBD</div>
                <div className="text-sm font-semibold text-slate-800">RAJUK RS প্লট ফলাফল</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date().toLocaleString("bn-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {resultRows.map(({ label, value }) => (
                      <tr key={label}>
                        <th className="w-[40%] border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-left font-medium text-slate-600">
                          {label}
                        </th>
                        <td className="border-b border-slate-100 px-4 py-2.5 text-slate-900">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-sm font-bold text-slate-800">
                  এই RS এর অন্তর্ভুক্ত MS প্লট
                  {loadingMs
                    ? " (লোড হচ্ছে…)"
                    : msRows.length > 0
                      ? ` — ${msRows.length}টি`
                      : " — পাওয়া যায়নি"}
                </h3>
                {msRows.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-violet-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-violet-50 text-left text-xs font-semibold text-violet-800">
                          <th className="px-3 py-2">ক্রম</th>
                          <th className="px-3 py-2">MS প্লট নম্বর</th>
                          <th className="px-3 py-2">পরিমাণ (শতাংশ)</th>
                          <th className="px-3 py-2">পরিমাণ (কাঠা)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {msRows.map((row, i) => (
                          <tr key={`${row.no}-${i}`} className="border-t border-violet-100">
                            <td className="px-3 py-2 text-slate-600">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {row.no.startsWith("MS") ? row.no : `MS-${row.no}`}
                            </td>
                            <td className="px-3 py-2 text-slate-900">{row.shotok}</td>
                            <td className="px-3 py-2 text-slate-900">{row.katha}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !loadingMs ? (
                  <p className="text-xs text-slate-500">
                    এই RS প্লটের সীমানার ভিতরে কোনো MS প্লট পাওয়া যায়নি।
                  </p>
                ) : null}
              </div>

              {rsArea?.isValid && (
                <p className="mt-3 text-xs text-slate-500">
                  RS মোট আনুমানিক পরিমাণ: {formatAreaValue(rsArea.shotok, 4)} শতাংশ
                  {" · "}
                  {formatAreaValue(rsArea.katha)} কাঠা
                </p>
              )}

              <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
                এই তথ্য RAJUK সার্ভে ডেটা থেকে নেওয়া হয়েছে এবং শুধুমাত্র সহায়ক উদ্দেশ্যে।
                আনুষ্ঠানিক কাজে সংশ্লিষ্ট অফিস থেকে যাচাই করুন। — landbd.pincodeit.com
              </p>
            </div>

            {isLoggedIn && lastRequestUrl && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">
                    HTTP Request
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <code className="block break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-700 ring-1 ring-slate-200">
                  GET {lastRequestUrl}
                </code>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                প্লট সীমানা (মানচিত্র)
              </h3>
              <PlotMap
                feature={selected}
                onMsFeaturesChange={(ms, loading) => {
                  setMsInside(ms);
                  setLoadingMs(loading);
                }}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
