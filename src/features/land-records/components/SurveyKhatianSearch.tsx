"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
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

  const downloadKhatianJpg = async () => {
    if (!selectedKhatian || !khatianCaptureRef.current) return;
    setDownloadingImage(true);
    try {
      const node = khatianCaptureRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor:
          getComputedStyle(document.documentElement).colorScheme === "dark" ? "#0f172a" : "#ffffff",
        scale: Math.min(2, window.devicePixelRatio || 2),
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const link = document.createElement("a");
      const safeNo = String(selectedKhatian.KHATIAN_NO || "khatian").replace(/[^\w\u0980-\u09FF-]+/g, "_");
      link.download = `khatian-${safeNo}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Khatian JPG export failed", error);
      setLocalError("ছবি ডাউনলোড করা যায়নি। আবার চেষ্টা করুন।");
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {viewMode === "search" ? (
          <>
            <div className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#006a4e]" size={20} />
                  <div>
                    <h2 className="font-bold text-emerald-950 dark:text-emerald-100">
                      Targeted search — bulk database export নয়
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-200/80">
                      সরকারি DLRMS-এর public flow নির্দিষ্ট খতিয়ান, দাগ বা মালিক অনুসন্ধানের জন্য। একটি মৌজার সব দাগ
                      ও সব মালিক একবারে সংগ্রহ বা export করার public API নেই।
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://dlrms.land.gov.bd/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-950 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-100 dark:hover:bg-blue-950/35"
              >
                <div>
                  <p className="font-bold">সরকারি DLRMS</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">
                    Certified / QR কপির জন্য সরকারি পোর্টাল ব্যবহার করুন।
                  </p>
                </div>
                <ExternalLink size={18} className="shrink-0" />
              </a>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>১. এলাকা ও সার্ভে নির্বাচন</CardTitle>
                <CardDescription>সঠিক ক্রমে বিভাগ, জেলা, উপজেলা, সার্ভে এবং মৌজা নির্বাচন করুন।</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select
                    label="বিভাগ"
                    value={division}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    options={[{ value: "", label: empty }, ...divisions.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                    loading={loading.divisions}
                  />
                  <Select
                    label="জেলা"
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    options={[{ value: "", label: empty }, ...districts.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                    loading={loading.districts}
                    disabled={!division}
                  />
                  <Select
                    label="উপজেলা"
                    value={upazila}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    options={[{ value: "", label: empty }, ...upazilas.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
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
              </CardBody>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>২. অনুসন্ধানের ধরন</CardTitle>
                <CardDescription>
                  খতিয়ান নম্বর দিয়ে সরাসরি খুঁজুন, অথবা “অধিকতর অনুসন্ধান”-এ দাগ নম্বর/মালিকের নাম ব্যবহার করুন।
                </CardDescription>
              </CardHeader>
              <CardBody>
                <div className="mb-5 inline-flex rounded-lg border border-[var(--border-color)] bg-slate-50 p-1 dark:bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => handleModeChange("khatian")}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                      mode === "khatian"
                        ? "bg-white text-[#006a4e] shadow-sm dark:bg-slate-800"
                        : "text-slate-500"
                    }`}
                  >
                    খতিয়ান নম্বর
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("advanced")}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                      mode === "advanced"
                        ? "bg-white text-[#006a4e] shadow-sm dark:bg-slate-800"
                        : "text-slate-500"
                    }`}
                  >
                    অধিকতর অনুসন্ধান
                  </button>
                </div>

                {mode === "khatian" ? (
                  <div className="max-w-md">
                    <Input
                      label="খতিয়ান নম্বর"
                      value={khatianNo}
                      onChange={(event) => {
                        setKhatianNo(event.target.value);
                        setLocalError(null);
                      }}
                      placeholder="যেমন: ১২"
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="দাগ নম্বর"
                      value={dagNumber}
                      onChange={(event) => {
                        setDagNumber(event.target.value);
                        setLocalError(null);
                      }}
                      placeholder="যেমন: ১১৭"
                    />
                    <Input
                      label="মালিকের নাম"
                      value={owner}
                      onChange={(event) => {
                        setOwner(event.target.value);
                        setLocalError(null);
                      }}
                      placeholder="নামের অংশ লিখুন"
                    />
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  <Info size={15} className="mt-0.5 shrink-0" />
                  <span>
                    অধিকতর অনুসন্ধানে দাগ নম্বর অথবা মালিকের নাম—একটি দিলেই matching খতিয়ান খোঁজা হবে। LandBD খালি
                    query দিয়ে পুরো মৌজার রেকর্ড তালিকা করে না।
                  </span>
                </div>

                {displayedError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {displayedError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => runSearch(1)}
                  disabled={!selectedMouza || !surveyKey || !hasSearchTerm || loading.khatians}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#006a4e] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading.khatians ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  {loading.khatians
                    ? "খোঁজা হচ্ছে…"
                    : mode === "khatian"
                      ? "খতিয়ান খুঁজুন"
                      : "অধিকতর অনুসন্ধান করুন"}
                </button>
              </CardBody>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>৩. Matching খতিয়ান</CardTitle>
                <CardDescription>
                  {khatians
                    ? `পৃষ্ঠা ${khatians.page}${khatians.total ? ` · মোট matching ${khatians.total}` : ""}`
                    : "Targeted search-এর ফলাফল এখানে দেখা যাবে।"}
                </CardDescription>
              </CardHeader>
              <CardBody className="p-0">
                {loading.khatians ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="animate-spin" size={18} />
                    লোড হচ্ছে…
                  </div>
                ) : khatians ? (
                  khatians.items.length ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-900/70">
                            <tr>
                              <th className="px-5 py-3">খতিয়ান</th>
                              <th className="px-5 py-3">মালিক</th>
                              <th className="px-5 py-3">দাগ</th>
                              <th className="px-5 py-3">মোট জমি</th>
                              <th className="px-5 py-3 text-right">বিস্তারিত</th>
                            </tr>
                          </thead>
                          <tbody>
                            {khatians.items.map((item) => (
                              <tr
                                key={item.ID}
                                className="border-t border-[var(--border-color)] transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                              >
                                <td className="px-5 py-3 font-semibold">{item.KHATIAN_NO}</td>
                                <td className="px-5 py-3">{item.OWNERS || "—"}</td>
                                <td className="px-5 py-3">{item.DAGS || "—"}</td>
                                <td className="px-5 py-3">{item.TOTAL_LAND || "—"}</td>
                                <td className="px-5 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => showDetails(item.ID)}
                                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-medium text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  >
                                    <Eye size={15} /> বিস্তারিত দেখুন
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4">
                        <button
                          type="button"
                          onClick={() => goPage(page - 1)}
                          disabled={page === 1 || loading.khatians}
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
                        >
                          <ChevronLeft size={16} />
                          আগের
                        </button>
                        <span className="text-sm text-slate-500">পৃষ্ঠা {page}</span>
                        <button
                          type="button"
                          onClick={() => goPage(page + 1)}
                          disabled={!khatians.hasNextPage || loading.khatians}
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
                        >
                          পরের
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-slate-500">
                      এই targeted search-এ কোনো matching খতিয়ান পাওয়া যায়নি।
                    </div>
                  )
                ) : (
                  <div className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-slate-500">
                    অনুসন্ধান শুরু করলে matching খতিয়ান এখানে দেখাবে।
                  </div>
                )}
              </CardBody>
            </Card>

            <p className="mt-6 text-center text-xs leading-6 text-slate-500">
              <strong>গুরুত্বপূর্ণ:</strong> একটি মৌজার সব দাগ + সব মালিক একবারে export করার public DLRMS API নেই।
              আইনগত, QR বা certified কপির জন্য সরকারি DLRMS-এর নির্ধারিত আবেদন/পেইড সেবা ব্যবহার করুন।
            </p>
          </>
        ) : null}

        {viewMode === "details" ? (
          <section id="khatian-details-panel" className="space-y-4 print:mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={backToSearch}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 text-sm font-semibold hover:bg-[var(--secondary)]"
              >
                <ArrowLeft size={16} />
                অনুসন্ধানের ফলে ফিরে যান
              </button>
              {selectedKhatian ? (
                <button
                  type="button"
                  onClick={() => void downloadKhatianJpg()}
                  disabled={downloadingImage || loading.khatian}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold hover:bg-[var(--secondary)] disabled:opacity-50"
                >
                  {downloadingImage ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {downloadingImage ? "প্রস্তুত হচ্ছে…" : "ছবি ডাউনলোড"}
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
        ) : null}
      </main>
    </>
  );
}
