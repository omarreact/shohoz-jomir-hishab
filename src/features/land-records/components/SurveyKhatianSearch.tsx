"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Input } from "@/src/shared/ui/Input";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID } from "../types";
import KhatianDetailsView from "./KhatianDetailsView";
import { exportKhatianImage } from "../lib/khatian-png-export";

const empty = "-- নির্বাচন করুন --";
type SearchMode = "khatian" | "advanced";

export default function SurveyKhatianSearch() {
  const {
    divisions,
    districts,
    upazilas,
    surveys,
    mouzas,
    khatians,
    selectedKhatian,
    loading,
    error,
    loadDistricts,
    loadUpazilas,
    loadSurveys,
    loadMouzas,
    loadKhatians,
    loadKhatian,
    setDistricts,
    setUpazilas,
    setSurveys,
    setMouzas,
    setKhatians,
    setSelectedKhatian,
  } = useSurveyKhatian();

  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [mouzaId, setMouzaId] = useState("");
  const [mode, setMode] = useState<SearchMode>("khatian");
  const [khatianNo, setKhatianNo] = useState("");
  const [owner, setOwner] = useState("");
  const [dagNumber, setDagNumber] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"search" | "details">("search");
  const [localError, setLocalError] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const khatianCaptureRef = useRef<HTMLDivElement>(null);

  const selectedDistrict = districts.find((item) => item.BBS_CODE === district);
  const selectedUpazila = upazilas.find((item) => item.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((item) => String(item.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((item) => String(item.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;

  const searchFilters = useMemo(
    () =>
      mode === "khatian"
        ? { khatianNo: khatianNo.trim() || undefined }
        : { owner: owner.trim() || undefined, dagNumber: dagNumber.trim() || undefined },
    [mode, khatianNo, owner, dagNumber],
  );

  const hasSearchTerm =
    mode === "khatian" ? Boolean(khatianNo.trim()) : Boolean(owner.trim() || dagNumber.trim());

  const surveyOptions = useMemo(
    () => surveys.map((item) => ({ value: item.SURVEY_ID, label: item.LOCAL_NAME })),
    [surveys],
  );

  useEffect(() => {
    if (division) void loadDistricts(division);
  }, [division, loadDistricts]);

  useEffect(() => {
    if (district) void loadUpazilas(district);
  }, [district, loadUpazilas]);

  useEffect(() => {
    if (district && upazila) void loadSurveys(district, upazila);
  }, [district, upazila, loadSurveys]);

  useEffect(() => {
    if (!selectedSurvey || !selectedDistrict || !selectedUpazila) return;
    void loadMouzas({
      districtBbsCode: district,
      upazilaBbsCode: upazila,
      surveyId: selectedSurvey.SURVEY_ID,
      districtName: selectedDistrict.NAME,
      upazilaName: selectedUpazila.NAME,
    });
  }, [district, upazila, selectedDistrict, selectedUpazila, selectedSurvey, loadMouzas]);

  const resetResults = () => {
    setKhatians(null);
    setSelectedKhatian(null);
    setPage(1);
    setLocalError(null);
    setViewMode("search");
  };

  const handleDivisionChange = (value: string) => {
    setDivision(value);
    setDistrict("");
    setUpazila("");
    setSurveyId("");
    setMouzaId("");
    setDistricts([]);
    setUpazilas([]);
    setSurveys([]);
    setMouzas([]);
    resetResults();
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setUpazila("");
    setSurveyId("");
    setMouzaId("");
    setUpazilas([]);
    setSurveys([]);
    setMouzas([]);
    resetResults();
  };

  const handleUpazilaChange = (value: string) => {
    setUpazila(value);
    setSurveyId("");
    setMouzaId("");
    setSurveys([]);
    setMouzas([]);
    resetResults();
  };

  const handleSurveyChange = (value: string) => {
    setSurveyId(value);
    setMouzaId("");
    setMouzas([]);
    resetResults();
  };

  const handleModeChange = (nextMode: SearchMode) => {
    setMode(nextMode);
    setKhatianNo("");
    setOwner("");
    setDagNumber("");
    resetResults();
  };

  const runSearch = (targetPage = 1) => {
    if (!selectedMouza || !surveyKey) {
      setLocalError("প্রথমে বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা নির্বাচন করুন।");
      return;
    }
    if (!hasSearchTerm) {
      setLocalError(
        mode === "khatian"
          ? "নির্দিষ্ট খতিয়ান নম্বর লিখুন। পুরো মৌজার খতিয়ান তালিকা bulk আকারে দেখানো হয় না।"
          : "দাগ নম্বর অথবা মালিকের নাম—অন্তত একটি লিখুন। পুরো মৌজার সব দাগ/মালিক bulk আকারে দেখানো হয় না।",
      );
      return;
    }

    setLocalError(null);
    setPage(targetPage);
    setViewMode("search");
    void loadKhatians({
      surveyKey,
      jlNumberId: selectedMouza.ID,
      page: targetPage,
      pageSize: 20,
      ...searchFilters,
    });
  };

  const goPage = (next: number) => {
    if (next < 1 || (next > page && !khatians?.hasNextPage)) return;
    runSearch(next);
  };

  const showDetails = (id: number) => {
    if (!surveyKey) return;
    setSelectedKhatian(null);
    setViewMode("details");
    void loadKhatian(surveyKey, id);
    requestAnimationFrame(() => {
      document.getElementById("khatian-details-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const backToSearch = () => {
    setViewMode("search");
    setSelectedKhatian(null);
  };

  const downloadKhatianImage = async () => {
    if (!selectedKhatian || !khatianCaptureRef.current) return;
    setDownloadingImage(true);
    setLocalError(null);
    try {
      const surveyTag =
        selectedSurvey?.LOCAL_NAME?.replace(/\s+/g, "") ||
        surveyKey ||
        "Khatian";
      const safeNo = String(selectedKhatian.KHATIAN_NO || "khatian").replace(
        /[^\w\u0980-\u09FF-]+/g,
        "_",
      );
      const mouza = String(selectedKhatian.MOUZA_NAME || "")
        .replace(/[^\w\u0980-\u09FF-]+/g, "_")
        .slice(0, 40);
      const fileName = mouza
        ? `LandBD-${surveyTag}-Khatian-${safeNo}-${mouza}`
        : `LandBD-${surveyTag}-Khatian-${safeNo}`;

      const result = await exportKhatianImage({
        source: khatianCaptureRef.current,
        exportWidthPx: 1200,
        scales: [2, 1.5, 1.25],
        jpegQuality: 0.95,
        fileName,
      });

      if (!result.ok) {
        setLocalError(result.error);
      }
    } catch (error) {
      console.error("Khatian image export failed", error);
      setLocalError("খতিয়ানের ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDownloadingImage(false);
    }
  };

  const displayedError = localError || error;

  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="DLRMS খতিয়ান অনুসন্ধান"
        description="বিভাগ → জেলা → উপজেলা → সার্ভে → মৌজা নির্বাচন করে নির্দিষ্ট খতিয়ান, দাগ বা মালিকের তথ্য অনুসন্ধান করুন।"
        pattern="grid"
      />

      <main className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
        {viewMode === "search" ? (
          <>
            <div className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#006a4e]" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      নির্দিষ্ট খতিয়ান / দাগ / মালিক অনুসন্ধান
                    </p>
                    <p className="mt-1 text-xs leading-6 text-emerald-800/90 dark:text-emerald-200/90">
                      পুরো মৌজার সব খতিয়ান একসাথে bulk দেখানো হয় না। বিভাগ → জেলা → উপজেলা → সার্ভে → মৌজা
                      নির্বাচন করে নির্দিষ্ট খতিয়ান নম্বর, দাগ বা মালিকের নাম দিয়ে খুঁজুন।
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <p className="text-xs font-semibold text-[var(--muted-foreground)]">অনুসন্ধান মোড</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("khatian")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      mode === "khatian"
                        ? "bg-[#006a4e] text-white"
                        : "bg-[var(--secondary)] text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    খতিয়ান নম্বর
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("advanced")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      mode === "advanced"
                        ? "bg-[#006a4e] text-white"
                        : "bg-[var(--secondary)] text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    দাগ / মালিক
                  </button>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>এলাকা ও সার্ভে নির্বাচন</CardTitle>
                <CardDescription>
                  সঠিক ক্রমে বিভাগ, জেলা, উপজেলা, সার্ভে এবং মৌজা নির্বাচন করুন।
                </CardDescription>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select
                    label="বিভাগ"
                    value={division}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    options={[
                      { value: "", label: empty },
                      ...divisions.map((item) => ({ value: item.BBS_CODE, label: item.NAME })),
                    ]}
                    loading={loading.divisions}
                  />
                  <Select
                    label="জেলা"
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    options={[
                      { value: "", label: empty },
                      ...districts.map((item) => ({ value: item.BBS_CODE, label: item.NAME })),
                    ]}
                    loading={loading.districts}
                    disabled={!division}
                  />
                  <Select
                    label="উপজেলা"
                    value={upazila}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    options={[
                      { value: "", label: empty },
                      ...upazilas.map((item) => ({ value: item.BBS_CODE, label: item.NAME })),
                    ]}
                    loading={loading.upazilas}
                    disabled={!district}
                  />
                  <Select
                    label="সার্ভে"
                    value={surveyId}
                    onChange={(e) => handleSurveyChange(e.target.value)}
                    options={[{ value: "", label: empty }, ...surveyOptions]}
                    loading={loading.surveys}
                    disabled={!upazila}
                  />
                  <Select
                    label="মৌজা / JL"
                    value={mouzaId}
                    onChange={(e) => {
                      setMouzaId(e.target.value);
                      resetResults();
                    }}
                    options={[
                      { value: "", label: empty },
                      ...mouzas.map((item) => ({
                        value: item.ID,
                        label: `${item.MOUZA_NAME} — JL ${item.JL_NUMBER}`,
                      })),
                    ]}
                    loading={loading.mouzas}
                    disabled={!surveyId}
                  />
                </div>

                <div className="mt-6 grid gap-4 border-t border-[var(--border-color)] pt-6 md:grid-cols-2 lg:grid-cols-3">
                  {mode === "khatian" ? (
                    <Input
                      label="খতিয়ান নম্বর"
                      value={khatianNo}
                      onChange={(e) => setKhatianNo(e.target.value)}
                      placeholder="যেমন: ১২৩"
                      disabled={!mouzaId}
                    />
                  ) : (
                    <>
                      <Input
                        label="দাগ নম্বর"
                        value={dagNumber}
                        onChange={(e) => setDagNumber(e.target.value)}
                        placeholder="যেমন: ৪৫৬"
                        disabled={!mouzaId}
                      />
                      <Input
                        label="মালিকের নাম"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        placeholder="আংশিক নামও চলবে"
                        disabled={!mouzaId}
                      />
                    </>
                  )}
                </div>

                {displayedError ? (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                  >
                    {displayedError}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => runSearch(1)}
                    disabled={loading.khatians || !mouzaId}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#006a4e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading.khatians ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Search size={16} />
                    )}
                    অনুসন্ধান
                  </button>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    ফলাফল পেজ অনুসারে দেখানো হয় (প্রতি পেজ ২০টি)।
                  </p>
                </div>
              </CardBody>
            </Card>

            {khatians ? (
              <section className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">অনুসন্ধান ফলাফল</h2>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <button
                      type="button"
                      onClick={() => goPage(page - 1)}
                      disabled={page <= 1 || loading.khatians}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-color)] disabled:opacity-40"
                      aria-label="আগের পেজ"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="tabular-nums">পেজ {page}</span>
                    <button
                      type="button"
                      onClick={() => goPage(page + 1)}
                      disabled={!khatians.hasNextPage || loading.khatians}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-color)] disabled:opacity-40"
                      aria-label="পরের পেজ"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {khatians.items.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border-color)] py-10 text-center text-sm text-slate-500">
                    কোনো খতিয়ান পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                    <table className="w-full min-w-[36rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] bg-[var(--secondary)]/40 text-left text-xs text-[var(--muted-foreground)]">
                          <th className="px-3 py-2.5 font-semibold">খতিয়ান নং</th>
                          <th className="px-3 py-2.5 font-semibold">মালিক</th>
                          <th className="px-3 py-2.5 font-semibold">দাগ</th>
                          <th className="px-3 py-2.5 font-semibold">মোট জমি</th>
                          <th className="px-3 py-2.5 font-semibold text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {khatians.items.map((item) => (
                          <tr
                            key={item.ID}
                            className="border-b border-[var(--border-color)]/70 last:border-0"
                          >
                            <td className="px-3 py-2.5 font-semibold tabular-nums">
                              {item.KHATIAN_NO || "—"}
                            </td>
                            <td className="max-w-[14rem] break-words px-3 py-2.5 text-sm">
                              {item.OWNERS || "—"}
                            </td>
                            <td className="max-w-[10rem] break-words px-3 py-2.5 text-sm tabular-nums">
                              {item.DAGS || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-sm tabular-nums">
                              {item.TOTAL_LAND || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => showDetails(item.ID)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs font-semibold text-[#006a4e] transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              >
                                <Eye size={14} />
                                বিস্তারিত
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}
          </>
        ) : (
          <section id="khatian-details-panel" className="space-y-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={backToSearch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-semibold transition hover:bg-[var(--secondary)]"
              >
                <ArrowLeft size={16} />
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-semibold transition hover:bg-[var(--secondary)]"
              >
                প্রিন্ট
              </button>
              {selectedKhatian ? (
                <button
                  type="button"
                  onClick={() => void downloadKhatianImage()}
                  disabled={downloadingImage}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#006a4e] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingImage ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloadingImage ? "ছবি তৈরি হচ্ছে…" : "উচ্চ রেজোলিউশন ছবি ডাউনলোড"}
                </button>
              ) : null}
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white print:hidden">
              খতিয়ানের বিস্তারিত তথ্য
            </h2>

            {loading.khatian ? (
              <div className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] py-12 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={18} /> বিস্তারিত লোড হচ্ছে…
              </div>
            ) : selectedKhatian ? (
              <KhatianDetailsView
                khatian={selectedKhatian}
                surveyKey={surveyKey}
                captureRef={khatianCaptureRef}
              />
            ) : (
              <div className="rounded-xl border border-[var(--border-color)] py-10 text-center text-sm text-slate-500">
                বিস্তারিত তথ্য পাওয়া যায়নি।
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
