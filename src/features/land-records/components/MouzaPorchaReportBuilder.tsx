"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Loader2, RefreshCcw, ShieldCheck, Square } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID, type KhatianIndex, type KhatianPage } from "../types";
import MouzaPorchaDocument, { type MouzaPorchaReportMeta } from "./MouzaPorchaDocument";
import {
  buildMouzaReportRows,
  stableReportPayload,
  summarizeNumericKhatianGaps,
  type HalSabekReportEntry,
  type HalSabekReportState,
  type MouzaReportOrientation,
} from "../reports/mouza-porcha-report";

const empty = "-- নির্বাচন করুন --";
const PAGE_SIZE = 100;
const REPORT_PAGE_CONCURRENCY = 4;
const HAL_SABEK_BATCH_SIZE = 12;
const HAL_SABEK_BATCH_CONCURRENCY = 2;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

async function responseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || "রিপোর্টের তথ্য লোড করা যায়নি।");
  return payload;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function retryDelay(attempt: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  await new Promise((resolve) => setTimeout(resolve, 180 * attempt));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

async function fetchJsonWithRetry<T>(
  input: string,
  init: RequestInit,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (
        !response.ok &&
        RETRYABLE_STATUS.has(response.status) &&
        attempt < attempts
      ) {
        await retryDelay(attempt, init.signal ?? undefined);
        continue;
      }
      return await responseJson<T>(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      lastError = error;
      if (attempt >= attempts) break;
      await retryDelay(attempt, init.signal ?? undefined);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("রিপোর্টের তথ্য লোড করা যায়নি।");
}

async function sha256Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto unavailable");
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function MouzaPorchaReportBuilder() {
  const {
    divisions,
    districts,
    upazilas,
    surveys,
    mouzas,
    loading,
    error: locationError,
    loadDistricts,
    loadUpazilas,
    loadSurveys,
    loadMouzas,
    setDistricts,
    setUpazilas,
    setSurveys,
    setMouzas,
  } = useSurveyKhatian();

  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [mouzaId, setMouzaId] = useState("");
  const [includeHalSabek, setIncludeHalSabek] = useState(false);
  const [pageOrientation, setPageOrientation] = useState<MouzaReportOrientation>("portrait");
  const [rows, setRows] = useState<KhatianIndex[]>([]);
  const [halSabek, setHalSabek] = useState<HalSabekReportState>({});
  const [reportMeta, setReportMeta] = useState<MouzaPorchaReportMeta | null>(null);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "records" | "hal-sabek" | "verification" | "done">("idle");
  const [loadedRecords, setLoadedRecords] = useState(0);
  const [expectedRecords, setExpectedRecords] = useState<number | null>(null);
  const [mappedRecords, setMappedRecords] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [verificationWarning, setVerificationWarning] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedDistrict = districts.find((item) => item.BBS_CODE === district);
  const selectedUpazila = upazilas.find((item) => item.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((item) => String(item.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((item) => String(item.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;

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

  const clearReport = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRows([]);
    setHalSabek({});
    setReportMeta(null);
    setGenerating(false);
    setPhase("idle");
    setLoadedRecords(0);
    setExpectedRecords(null);
    setMappedRecords(0);
    setLocalError(null);
    setVerificationWarning(null);
  };

  const changeDivision = (value: string) => {
    clearReport();
    setDivision(value);
    setDistrict("");
    setUpazila("");
    setSurveyId("");
    setMouzaId("");
    setDistricts([]);
    setUpazilas([]);
    setSurveys([]);
    setMouzas([]);
  };

  const changeDistrict = (value: string) => {
    clearReport();
    setDistrict(value);
    setUpazila("");
    setSurveyId("");
    setMouzaId("");
    setUpazilas([]);
    setSurveys([]);
    setMouzas([]);
  };

  const changeUpazila = (value: string) => {
    clearReport();
    setUpazila(value);
    setSurveyId("");
    setMouzaId("");
    setSurveys([]);
    setMouzas([]);
  };

  const changeSurvey = (value: string) => {
    clearReport();
    setSurveyId(value);
    setMouzaId("");
    setMouzas([]);
  };

  const generateReport = async () => {
    if (!selectedMouza || !selectedDistrict || !selectedUpazila || !selectedSurvey || !surveyKey) {
      setLocalError("প্রথমে বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা নির্বাচন করুন।");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setPhase("records");
    setRows([]);
    setHalSabek({});
    setReportMeta(null);
    setLoadedRecords(0);
    setExpectedRecords(null);
    setMappedRecords(0);
    setLocalError(null);
    setVerificationWarning(null);

    try {
      const collectedById = new Map<number, KhatianIndex>();
      let total: number | undefined;

      const appendPage = (data: KhatianPage) => {
        for (const item of data.items) {
          // DLRMS can occasionally overlap rows between adjacent pages while
          // its index is updating. ID de-duplication prevents duplicate khatians.
          if (!collectedById.has(item.ID)) collectedById.set(item.ID, item);
        }
        total = data.total ?? total;
        setExpectedRecords(total ?? null);
        setLoadedRecords(collectedById.size);
      };

      const loadPage = async (page: number): Promise<KhatianPage> => {
        const params = new URLSearchParams({
          surveyKey,
          jlNumberId: String(selectedMouza.ID),
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        return fetchJsonWithRetry<KhatianPage>(
          `/api/land-records/mouza-porcha-report?${params}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
      };

      // Fetch page 1 first so we know the authoritative total, then fan out
      // subsequent pages in a small bounded pool instead of waiting serially.
      const firstPage = await loadPage(1);
      appendPage(firstPage);

      if (firstPage.total != null && firstPage.total >= 0) {
        const totalPages = Math.max(1, Math.ceil(firstPage.total / PAGE_SIZE));
        if (totalPages > 1000) throw new Error("রিপোর্টের পেজ সীমা অতিক্রম করেছে।");

        const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);
        for (const pageGroup of chunk(remainingPages, REPORT_PAGE_CONCURRENCY)) {
          const pageResults = await Promise.all(pageGroup.map((page) => loadPage(page)));
          for (const data of pageResults) appendPage(data);
        }
      } else {
        let page = 2;
        let hasNextPage = firstPage.hasNextPage;
        while (hasNextPage) {
          const data = await loadPage(page);
          appendPage(data);
          hasNextPage = data.hasNextPage;
          page += 1;
          if (page > 1000) throw new Error("রিপোর্টের পেজ সীমা অতিক্রম করেছে।");
        }
      }

      const collected = [...collectedById.values()];
      if (collected.length === 0) {
        throw new Error("নির্বাচিত মৌজায় কোনো খতিয়ান পাওয়া যায়নি।");
      }

      setRows(collected);

      const resolved: HalSabekReportState = {};
      if (includeHalSabek) {
        setPhase("hal-sabek");
        const batches = chunk(collected.map((item) => item.KHATIAN_NO), HAL_SABEK_BATCH_SIZE);
        let completed = 0;

        for (const batchGroup of chunk(batches, HAL_SABEK_BATCH_CONCURRENCY)) {
          const results = await Promise.all(
            batchGroup.map((khatianNos) =>
              fetchJsonWithRetry<{ entries: HalSabekReportEntry[] }>(
                "/api/land-records/mouza-porcha-report/hal-sabek",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Accept: "application/json" },
                  body: JSON.stringify({
                    surveyKey,
                    divisionBbsCode: division,
                    districtBbsCode: district,
                    upazilaBbsCode: upazila,
                    jlNumberId: selectedMouza.ID,
                    khatianNos,
                  }),
                  signal: controller.signal,
                },
              ),
            ),
          );

          for (const data of results) {
            for (const entry of data.entries) resolved[entry.khatianNo] = entry;
          }
          completed += batchGroup.reduce((sum, item) => sum + item.length, 0);
          setMappedRecords(Math.min(completed, collected.length));
        }

        setHalSabek(resolved);
      }

      setPhase("verification");
      const normalizedRows = buildMouzaReportRows(collected, resolved);
      const gapSummary = summarizeNumericKhatianGaps(normalizedRows.map((row) => row.khatianNo));
      const mappedKhatianCount = includeHalSabek
        ? normalizedRows.filter((row) => row.history.length > 0).length
        : 0;
      const generatedAt = new Date().toISOString();
      const fallbackReportId = `LANDBD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      let nextMeta: MouzaPorchaReportMeta = {
        reportId: fallbackReportId,
        generatedAt,
        verificationRegistered: false,
      };

      try {
        const payloadHash = await sha256Hex(stableReportPayload(normalizedRows));
        const verificationResponse = await fetch("/api/reports/mouza-porcha/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            district: selectedDistrict.NAME,
            upazila: selectedUpazila.NAME,
            survey: selectedSurvey.LOCAL_NAME,
            mouza: selectedMouza.MOUZA_NAME,
            jlNumber: selectedMouza.JL_NUMBER,
            totalKhatians: collected.length,
            expectedKhatians: total ?? null,
            halSabekRequested: includeHalSabek ? collected.length : 0,
            halSabekMapped: mappedKhatianCount,
            khatianGapCount: gapSummary.count,
            payloadHash,
          }),
          signal: controller.signal,
        });
        const verification = await responseJson<{
          reportId: string;
          generatedAt: string;
          verificationUrl: string;
        }>(verificationResponse);
        nextMeta = {
          reportId: verification.reportId,
          generatedAt: verification.generatedAt,
          verificationUrl: verification.verificationUrl,
          payloadHash,
          verificationRegistered: true,
        };
      } catch (verificationError) {
        if (verificationError instanceof DOMException && verificationError.name === "AbortError") throw verificationError;
        console.warn("LandBD report verification registration unavailable", verificationError);
        setVerificationWarning(
          "রিপোর্ট তৈরি হয়েছে, তবে QR verification record সংরক্ষণ করা যায়নি। PDF-তে Report ID থাকবে, QR যাচাই দেখানো হবে না।",
        );
      }

      setReportMeta(nextMeta);
      setPhase("done");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById("mouza-porcha-report-preview")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setPhase("idle");
        return;
      }
      setLocalError(error instanceof Error ? error.message : "রিপোর্ট তৈরি করা যায়নি।");
      setPhase("idle");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setGenerating(false);
    }
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setPhase("idle");
  };


  const displayedError = localError || locationError;
  const progressTotal = expectedRecords ?? Math.max(loadedRecords, rows.length);
  const phaseLabel =
    phase === "hal-sabek"
      ? "সাবেক/হাল দাগ সংগ্রহ করা হচ্ছে"
      : phase === "verification"
        ? "Report ID ও verification প্রস্তুত করা হচ্ছে"
        : "খতিয়ান তালিকা সংগ্রহ করা হচ্ছে";

  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="মৌজা পর্চা রিপোর্ট"
        description="একটি মৌজার খতিয়ান, মালিক, অভিভাবক, দাগ ও উৎসে প্রকাশিত জমির পরিমাণ একত্র করে Kalpurush ফন্টে সরকারি খতিয়ান-ধাঁচের A4 রিপোর্ট তৈরি করুন। Portrait বা Landscape বেছে নেওয়া যাবে; প্রতিটি পৃষ্ঠায় Bangla LandBD watermark ও footer ribbon থাকবে।"
        pattern="grid"
      />

      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <section className="report-controls">
          <Card>
            <CardHeader>
              <CardTitle>রিপোর্টের এলাকা নির্বাচন</CardTitle>
              <CardDescription>
                বিভাগ → জেলা → উপজেলা → সার্ভে → মৌজা/JL নির্বাচন করুন। Portrait বা Landscape layout বেছে নিন; preview এবং Print একই orientation ব্যবহার করবে।
              </CardDescription>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="বিভাগ"
                  value={division}
                  onChange={(event) => changeDivision(event.target.value)}
                  options={[{ value: "", label: empty }, ...divisions.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                  loading={loading.divisions}
                />
                <Select
                  label="জেলা"
                  value={district}
                  onChange={(event) => changeDistrict(event.target.value)}
                  options={[{ value: "", label: empty }, ...districts.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                  loading={loading.districts}
                  disabled={!division}
                />
                <Select
                  label="উপজেলা"
                  value={upazila}
                  onChange={(event) => changeUpazila(event.target.value)}
                  options={[{ value: "", label: empty }, ...upazilas.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                  loading={loading.upazilas}
                  disabled={!district}
                />
                <Select
                  label="সার্ভে"
                  value={surveyId}
                  onChange={(event) => changeSurvey(event.target.value)}
                  options={[{ value: "", label: empty }, ...surveyOptions]}
                  loading={loading.surveys}
                  disabled={!upazila}
                />
                <Select
                  label="মৌজা / JL"
                  value={mouzaId}
                  onChange={(event) => {
                    clearReport();
                    setMouzaId(event.target.value);
                  }}
                  options={[
                    { value: "", label: empty },
                    ...mouzas.map((item) => ({ value: item.ID, label: `${item.MOUZA_NAME} — JL ${item.JL_NUMBER}` })),
                  ]}
                  loading={loading.mouzas}
                  disabled={!surveyId}
                />
                <Select
                  label="প্রিন্ট পেজ"
                  value={pageOrientation}
                  onChange={(event) => setPageOrientation(event.target.value as MouzaReportOrientation)}
                  options={[
                    { value: "portrait", label: "A4 Portrait" },
                    { value: "landscape", label: "A4 Landscape" },
                  ]}
                />
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <input
                  type="checkbox"
                  checked={includeHalSabek}
                  onChange={(event) => {
                    clearReport();
                    setIncludeHalSabek(event.target.checked);
                  }}
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-emerald-950">সাবেক / হাল দাগ যাচাই করুন</span>
                  <span className="mt-1 block text-xs leading-5 text-emerald-800">
                    DLRMS mapping পাওয়া গেলে PDF-তে “দাগ পরিবর্তন (সাবেক → হাল)” কলাম দেখানো হবে। পুরো রিপোর্টে mapping না থাকলে কলামটি স্বয়ংক্রিয়ভাবে লুকানো হবে। কোনো দাগ অনুমান করা হবে না।
                  </span>
                </span>
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <ShieldCheck size={16} className="text-[var(--primary)]" />
                <span>Print font: <strong>Kalpurush</strong></span>
                <span className="text-slate-300">•</span>
                <span>রেকর্ড টেক্সট NFC normalization সহ source wording সংরক্ষণ করবে।</span>
              </div>

              {displayedError ? (
                <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {displayedError}
                </div>
              ) : null}

              {verificationWarning ? (
                <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {verificationWarning}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void generateReport()}
                  disabled={generating || !mouzaId}
                  className="landbd-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? <Loader2 className="animate-spin" size={17} /> : <FileText size={17} />}
                  রিপোর্ট তৈরি করুন
                </button>
                {generating ? (
                  <button
                    type="button"
                    onClick={cancelGeneration}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
                  >
                    <Square size={15} /> বন্ধ করুন
                  </button>
                ) : null}
                {rows.length > 0 && !generating ? (
                  <button
                    type="button"
                    onClick={() => void generateReport()}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <RefreshCcw size={16} /> আবার তৈরি
                  </button>
                ) : null}
              </div>

              {generating ? (
                <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <Loader2 className="animate-spin" size={16} /> {phaseLabel}
                  </div>
                  <p className="mt-2 tabular-nums">
                    {phase === "hal-sabek"
                      ? `${mappedRecords} / ${rows.length} খতিয়ান mapping পরীক্ষা হয়েছে`
                      : phase === "verification"
                        ? `${rows.length}টি খতিয়ানের রিপোর্ট fingerprint ও QR metadata প্রস্তুত হচ্ছে`
                        : `${loadedRecords}${progressTotal ? ` / ${progressTotal}` : ""} খতিয়ান লোড হয়েছে`}
                  </p>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </section>

        {rows.length > 0 ? (
          <section id="mouza-porcha-report-preview" className="mt-7 scroll-mt-24">
            <div className="report-actions mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
              <div className="text-sm text-[var(--muted-foreground)]">
                {rows.length}টি খতিয়ান {phase === "done" ? `A4 ${pageOrientation === "landscape" ? "Landscape" : "Portrait"} রিপোর্ট হিসেবে প্রস্তুত` : "লোড হয়েছে"}
                {reportMeta?.reportId ? <span className="ml-2 font-mono text-xs">· {reportMeta.reportId}</span> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ResultPrintButton disabled={generating || phase !== "done"} className="rounded-[12px]" />
              </div>
            </div>

            <div className="mb-3 print:hidden">
              <h2 className="text-lg font-black text-[var(--foreground)]">রিপোর্ট প্রিভিউ</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                নিচের preview-টাই A4 {pageOrientation === "landscape" ? "Landscape" : "Portrait"} Print layout হিসেবে ব্যবহার হবে।
              </p>
            </div>

            <div>
              <MouzaPorchaDocument
                rows={rows}
                halSabek={halSabek}
                includeHalSabek={includeHalSabek}
                expectedRecords={expectedRecords}
                districtName={selectedDistrict?.NAME ?? ""}
                upazilaName={selectedUpazila?.NAME ?? ""}
                surveyName={selectedSurvey?.LOCAL_NAME ?? ""}
                mouzaName={selectedMouza?.MOUZA_NAME ?? ""}
                jlNumber={selectedMouza?.JL_NUMBER ?? ""}
                reportMeta={reportMeta}
                pageOrientation={pageOrientation}
              />
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
