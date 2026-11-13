"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, Loader2, RefreshCcw, ShieldCheck, Square } from "lucide-react";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";
import PdfPreviewDialog, { type PdfPreviewDocument } from "@/src/shared/components/PdfPreviewDialog";
import { generatePagedReportPdf } from "@/src/shared/lib/pdf/generate-paged-report-pdf";
import { logger } from "@/src/shared/utils/logger";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID, type KhatianIndex, type KhatianPage } from "../types";
import LandRecordSelectionColumn from "./LandRecordSelectionColumn";
import MouzaPorchaDocument, {
  type MouzaKhatianBookVariant,
  type MouzaPorchaReportMeta,
} from "./MouzaPorchaDocument";
import {
  buildMouzaReportRows,
  stableReportPayload,
  summarizeNumericKhatianGaps,
  type HalSabekReportEntry,
  type HalSabekReportState,
  type MouzaReportOrientation,
} from "../reports/mouza-porcha-report";

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
  const pageOrientation: MouzaReportOrientation = "portrait";
  const [pdfVariant, setPdfVariant] = useState<MouzaKhatianBookVariant>("book");
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
  const [pdfBusy, setPdfBusy] = useState<"preview" | "download" | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewDocument | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoDownloadRef = useRef(false);
  const handlePdfRef = useRef<(action: "preview" | "download") => Promise<void>>(async () => {});

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
    if (district && upazila) void loadSurveys(district, upazila, true);
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
    setPdfPreview(null);
    autoDownloadRef.current = false;
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
    setPdfPreview(null);

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
        logger.warn("LandBD report verification registration unavailable", verificationError);
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
        autoDownloadRef.current = false;
        setPhase("idle");
        return;
      }
      autoDownloadRef.current = false;
      setLocalError(error instanceof Error ? error.message : "রিপোর্ট তৈরি করা যায়নি।");
      setPhase("idle");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setGenerating(false);
    }
  };

  const cancelGeneration = () => {
    autoDownloadRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setPhase("idle");
  };


  // Verify the actual rendered document contains every fetched index row.
  // This prevents a pagination regression from silently producing an
  // apparently complete report with missing or duplicated khatians.
  const verifyRenderedRows = (): boolean => {
    const source = document.getElementById("mouza-porcha-report");
    if (!source) return false;
    const ids = Array.from(source.querySelectorAll<HTMLTableRowElement>("tr[data-report-source-id]"))
      .map((node) => Number(node.dataset.reportSourceId));
    return ids.length === rows.length &&
      new Set(ids).size === rows.length &&
      ids.every((id, index) => id === rows[index].ID);
  };

  const handleBrowserPrint = () => {
    if (!verifyRenderedRows()) {
      setLocalError("প্রিন্টে খতিয়ানের সারি মেলেনি। তথ্য বাদ পড়ার ঝুঁকি থাকায় প্রিন্ট বন্ধ করা হয়েছে।");
      return;
    }
    window.print();
  };

  const handlePdf = async (action: "preview" | "download") => {
    if (!rows.length || phase !== "done" || generating || pdfBusy) return;
    const source = document.getElementById("mouza-porcha-report");
    if (!source) {
      setLocalError("রিপোর্টের প্রিভিউ পাওয়া যায়নি। আবার রিপোর্ট তৈরি করুন।");
      return;
    }
    if (!verifyRenderedRows()) {
      setLocalError("PDF-তে সব খতিয়ানের সারি পাওয়া যায়নি; তথ্য বাদ পড়ার ঝুঁকি থাকায় PDF তৈরি বন্ধ।");
      return;
    }

    setPdfBusy(action);
    setLocalError(null);
    try {
      const result = await generatePagedReportPdf({
        source,
        pageSelector: ".report-page",
        fileName: [
          "LandBD-Mouza-Khatian-Book",
          selectedMouza?.MOUZA_NAME,
          selectedSurvey?.LOCAL_NAME,
          pdfVariant,
          reportMeta?.reportId,
        ].filter(Boolean).join("-"),
        orientation: pageOrientation,
        scale: 1.3,
        delivery: action === "preview" ? "return" : "download",
      });

      if (!result.ok) {
        setLocalError(result.error);
      } else if (action === "preview") {
        setPdfPreview({ blob: result.blob, fileName: result.fileName, pages: result.pages });
      }
    } catch (cause) {
      logger.error("[MouzaPorchaReportBuilder] PDF export failed", cause);
      setLocalError("PDF তৈরি বা খুলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setPdfBusy(null);
    }
  };

  handlePdfRef.current = handlePdf;

  useEffect(() => {
    if (!autoDownloadRef.current) return;
    if (generating || phase !== "done" || pdfBusy !== null || rows.length === 0) return;
    autoDownloadRef.current = false;
    void handlePdfRef.current("download");
  }, [generating, phase, pdfBusy, rows.length]);

  const displayedError = localError || locationError;
  const progressTotal = expectedRecords ?? Math.max(loadedRecords, rows.length);
  const phaseLabel =
    phase === "hal-sabek"
      ? "সাবেক/হাল দাগ সংগ্রহ করা হচ্ছে"
      : phase === "verification"
        ? "Report ID ও verification প্রস্তুত করা হচ্ছে"
        : "খতিয়ান তালিকা সংগ্রহ করা হচ্ছে";

  return (
    <div className="min-h-screen bg-[#0a110d] text-[#edf3ef]">
      <section className="border-b border-[#1c2c24] bg-[#0c1510]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-[#123125] px-3 py-1 text-xs font-semibold text-[#2bc18a]">
            মৌজা ভিত্তিক খতিয়ান বই
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            বিনামূল্যে একটি মৌজার খতিয়ান বই PDF আকারে সংগ্রহ করুন
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9eada4] md:text-base">
            বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা বেছে ওই মৌজার সব খতিয়ান একটি PDF বই আকারে তৈরি করুন।
            নতুন, পুরনো রঙিন ও পুরনো সাদা-কালো—তিনটি PDF presentation রাখা হয়েছে।
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-2 py-8 md:px-6 lg:px-8">
        <section className="report-controls rounded-2xl border border-[#1d2d25] bg-[#111a15] p-3 shadow-[0_24px_80px_rgba(0,0,0,.18)] md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white md:text-2xl">অবস্থান নির্বাচন করে খতিয়ান বই তৈরি করুন</h2>
            <p className="mt-2 text-sm leading-6 text-[#91a198]">
              বিভাগ → জেলা → উপজেলা / থানা → খতিয়ানের ধরন → মৌজা (JL) নির্বাচন করুন। সব ধাপ পূর্ণ হলে PDF download সক্রিয় হবে।
            </p>
          </div>

          <div className="mb-5 rounded-xl border border-[#174333] bg-[#10271d] p-4 text-sm text-[#b8c8bf]">
            <p className="font-semibold text-[#eaf3ed]">কিভাবে খতিয়ান বই তৈরি করবেন?</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-5 md:text-sm">
              <li>বিভাগ → জেলা → উপজেলা / থানা ক্রমানুসারে নির্বাচন করুন।</li>
              <li>খতিয়ানের ধরন থেকে সার্ভে বেছে নিয়ে মৌজা নির্বাচন করুন।</li>
              <li>PDF-এর ধরন বেছে “পূর্ণ মৌজা PDF ডাউনলোড” চাপুন।</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 items-stretch gap-2 md:gap-3 lg:grid-cols-5">
            <LandRecordSelectionColumn
              label="বিভাগ"
              placeholder="বিভাগের নাম লিখুন"
              value={division}
              onSelect={changeDivision}
              options={divisions.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))}
              loading={loading.divisions}
            />
            <LandRecordSelectionColumn
              label="জেলা"
              placeholder="জেলার নাম লিখুন"
              value={district}
              onSelect={changeDistrict}
              options={districts.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))}
              loading={loading.districts}
              disabledMessage={!division ? "প্রথমে বিভাগ নির্বাচন করুন।" : undefined}
            />
            <LandRecordSelectionColumn
              label="উপজেলা / থানা"
              placeholder="উপজেলার নাম লিখুন"
              value={upazila}
              onSelect={changeUpazila}
              options={upazilas.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))}
              loading={loading.upazilas}
              disabledMessage={!district ? "প্রথমে জেলা নির্বাচন করুন।" : undefined}
            />
            <LandRecordSelectionColumn
              label="খতিয়ানের ধরন"
              placeholder="খতিয়ানের ধরন লিখুন"
              value={surveyId}
              onSelect={changeSurvey}
              options={surveyOptions.map((item) => ({ value: String(item.value), label: item.label }))}
              loading={loading.surveys}
              disabledMessage={!upazila ? "প্রথমে উপজেলা নির্বাচন করুন।" : undefined}
            />
            <LandRecordSelectionColumn
              label="মৌজা (JL নম্বর)"
              placeholder="মৌজা বা জে.এল. নং লিখুন"
              value={mouzaId}
              onSelect={(value) => {
                clearReport();
                setMouzaId(value);
              }}
              options={mouzas.map((item) => ({ value: String(item.ID), label: `${item.JL_NUMBER} · ${item.MOUZA_NAME}` }))}
              loading={loading.mouzas}
              disabledMessage={!surveyId ? "প্রথমে সার্ভে নির্বাচন করুন।" : undefined}
              className="max-lg:col-span-2"
            />
          </div>

          <div className="mt-5 grid gap-4 border-t border-[#1f3027] pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h3 className="text-lg font-semibold text-white">সম্পূর্ণ মৌজার খতিয়ান বই</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#89998f]">
                নির্বাচিত মৌজার সব খতিয়ান একত্র করে PDF বই তৈরি হবে। PDF প্রস্তুত হলে সরাসরি ডাউনলোড হবে।
              </p>
              <p className="mt-2 text-xs text-[#6f8076]">
                {division && district && upazila && surveyId && mouzaId
                  ? `নির্বাচিত মৌজা: ${selectedMouza?.MOUZA_NAME || "—"} (JL ${selectedMouza?.JL_NUMBER || "—"}) · ${selectedSurvey?.LOCAL_NAME || "—"}`
                  : "PDF তৈরি করতে সব ধাপ নির্বাচন করুন।"}
              </p>

              <label className="mt-4 flex max-w-2xl cursor-pointer items-start gap-3 rounded-xl border border-[#214132] bg-[#102219] p-3">
                <input
                  type="checkbox"
                  checked={includeHalSabek}
                  onChange={(event) => {
                    clearReport();
                    setIncludeHalSabek(event.target.checked);
                  }}
                  className="mt-1 h-4 w-4 accent-[#1fa775]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#dce7e0]">সাবেক / হাল দাগ যাচাই করুন</span>
                  <span className="mt-1 block text-xs leading-5 text-[#809187]">
                    উৎসে mapping পাওয়া গেলে PDF-তে দেখানো হবে; কোনো দাগ অনুমান করা হবে না।
                  </span>
                </span>
              </label>
            </div>

            <div className="min-w-[15rem] space-y-3">
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-[#8fa097]">PDF-এর ধরন</legend>

                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${pdfVariant === "book" ? "border-[#1fa775] bg-[#143b2c] text-white" : "border-[#24382e] text-[#98a89f]"}`}>
                  <input type="radio" className="accent-[#1fa775]" name="pdf-variant" checked={pdfVariant === "book"} onChange={() => setPdfVariant("book")} value="book" />
                  <span aria-hidden="true" className="h-4 w-4 rounded border-2 border-[#1fa775] bg-[#1fa775]" />
                  নতুন
                </label>

                <div className="space-y-1.5 rounded-xl border border-[#24382e] bg-[#0d1611] p-2">
                  <p className="px-1 text-xs font-medium text-[#77887e]">পুরনো</p>
                  <div className="flex gap-2">
                    <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${pdfVariant === "legacy" ? "border-[#1fa775] bg-[#143b2c] text-white" : "border-[#24382e] text-[#98a89f]"}`}>
                      <input type="radio" className="accent-[#1fa775]" name="pdf-variant" checked={pdfVariant === "legacy"} onChange={() => setPdfVariant("legacy")} value="legacy" />
                      <span aria-hidden="true" className="h-4 w-4 rounded border-2 border-[#cbef77] bg-[#102632]" />
                      রঙিন
                    </label>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${pdfVariant === "monochrome" ? "border-[#1fa775] bg-[#143b2c] text-white" : "border-[#24382e] text-[#98a89f]"}`}>
                      <input type="radio" className="accent-[#1fa775]" name="pdf-variant" checked={pdfVariant === "monochrome"} onChange={() => setPdfVariant("monochrome")} value="monochrome" />
                      <span aria-hidden="true" className="h-4 w-4 rounded border-2 border-white bg-white" />
                      সাদা-কালো
                    </label>
                  </div>
                </div>
              </fieldset>

              <button
                type="button"
                onClick={() => {
                  if (rows.length > 0 && phase === "done" && !generating && pdfBusy === null) {
                    void handlePdfRef.current("download");
                    return;
                  }
                  autoDownloadRef.current = true;
                  void generateReport();
                }}
                disabled={!division || !district || !upazila || !surveyId || !mouzaId || generating || pdfBusy !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1fa775] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#23b984] disabled:cursor-not-allowed disabled:bg-[#66766d]"
              >
                {generating || pdfBusy === "download" ? <Loader2 className="animate-spin" size={16} /> : null}
                {generating ? "PDF তৈরি হচ্ছে…" : pdfBusy === "download" ? "PDF প্রস্তুত হচ্ছে…" : "পূর্ণ মৌজা PDF ডাউনলোড"}
              </button>

              {generating ? (
                <button
                  type="button"
                  onClick={cancelGeneration}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/60 px-3 py-2 text-xs font-semibold text-red-300"
                >
                  <Square size={14} /> বন্ধ করুন
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#20352a] bg-[#0d1812] px-4 py-3 text-xs text-[#82938a]">
            <ShieldCheck size={16} className="text-[#2bc18a]" />
            <span>Source wording ও NFC normalization সংরক্ষিত</span>
            <span className="text-[#42544a]">•</span>
            <span>অসম্পূর্ণ upstream record অনুমান করা হবে না</span>
          </div>

          {displayedError ? (
            <div role="alert" className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {displayedError}
            </div>
          ) : null}

          {verificationWarning ? (
            <div role="status" className="mt-4 rounded-lg border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
              {verificationWarning}
            </div>
          ) : null}

          {generating ? (
            <div className="mt-5 rounded-xl border border-[#214333] bg-[#10251b] p-4 text-sm text-[#b8c9c0]">
              <div className="flex items-center gap-2 font-semibold text-white">
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
        </section>

        {rows.length > 0 ? (
          <section id="mouza-porcha-report-preview" className="mt-7 scroll-mt-24">
            <div className="report-actions mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#21342a] bg-[#111a15] p-3">
              <div className="text-sm text-[#92a39a]">
                {rows.length}টি খতিয়ান {phase === "done" ? "A4 Portrait রিপোর্ট হিসেবে প্রস্তুত" : "লোড হয়েছে"}
                {reportMeta?.reportId ? <span className="ml-2 font-mono text-xs">· {reportMeta.reportId}</span> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handlePdf("preview")}
                  disabled={generating || phase !== "done" || pdfBusy !== null}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1fa775] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pdfBusy === "preview" ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                  {pdfBusy === "preview" ? "PDF প্রস্তুত হচ্ছে…" : "PDF প্রিভিউ"}
                </button>
                <button
                  type="button"
                  onClick={() => void handlePdf("download")}
                  disabled={generating || phase !== "done" || pdfBusy !== null}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#2f4a3d] px-4 py-2 text-sm font-semibold text-[#c6d3cc] disabled:opacity-50"
                >
                  {pdfBusy === "download" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {pdfBusy === "download" ? "ডাউনলোড তৈরি হচ্ছে…" : "PDF ডাউনলোড"}
                </button>
                <ResultPrintButton onClick={handleBrowserPrint} disabled={generating || phase !== "done" || pdfBusy !== null} className="rounded-full border-[#2f4a3d] bg-transparent text-[#c6d3cc]" />
              </div>
            </div>

            <div className="mb-3 print:hidden">
              <h2 className="text-lg font-semibold text-white">রিপোর্ট প্রিভিউ</h2>
              <p className="mt-1 text-xs leading-5 text-[#83948a]">
                A4 Portrait খতিয়ান বইটি নিচে দেখুন। PDF design uploaded reference-এর cover + compact record-table pattern অনুসরণ করে।
              </p>
            </div>

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
              variant={pdfVariant}
            />
          </section>
        ) : null}
      </main>

      {pdfPreview ? <PdfPreviewDialog document={pdfPreview} onClose={() => setPdfPreview(null)} /> : null}
    </div>
  );
}
