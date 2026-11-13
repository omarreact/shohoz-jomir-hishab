"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FileText, Loader2, RefreshCcw, Square } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";
import PdfPreviewDialog, { type PdfPreviewDocument } from "@/src/shared/components/PdfPreviewDialog";
import { generatePagedReportPdf } from "@/src/shared/lib/pdf/generate-paged-report-pdf";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { fetchMouzaKhatianIndex } from "../lib/fetch-mouza-khatian-index";
import { buildMouzaDagRows } from "../reports/mouza-dag-report";
import { SURVEY_KEY_BY_ID, type KhatianIndex } from "../types";
import MouzaDagDocument from "./MouzaDagDocument";

const empty = "-- নির্বাচন করুন --";

export default function MouzaDagReportBuilder() {
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
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [rows, setRows] = useState<KhatianIndex[]>([]);
  const [expected, setExpected] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [generatedAt, setGeneratedAt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<"preview" | "download" | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewDocument | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedDistrict = districts.find((item) => item.BBS_CODE === district);
  const selectedUpazila = upazilas.find((item) => item.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((item) => String(item.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((item) => String(item.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;
  const dagRows = useMemo(() => buildMouzaDagRows(rows), [rows]);

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
    setExpected(null);
    setLoaded(0);
    setGeneratedAt("");
    setGenerating(false);
    setLocalError(null);
    setPdfPreview(null);
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
    if (!selectedMouza || !selectedSurvey || !surveyKey || !selectedDistrict || !selectedUpazila) {
      setLocalError("প্রথমে বিভাগ, জেলা, উপজেলা, সার্ভে এবং মৌজা নির্বাচন করুন।");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setLocalError(null);
    setRows([]);
    setLoaded(0);
    setExpected(null);
    setPdfPreview(null);

    try {
      const result = await fetchMouzaKhatianIndex({
        surveyKey,
        jlNumberId: selectedMouza.ID,
        endpoint: "/api/land-records/mouza-dag-report",
        signal: controller.signal,
        onProgress: (count, total) => {
          setLoaded(count);
          setExpected(total);
        },
      });

      if (!result.rows.length) {
        throw new Error("নির্বাচিত মৌজায় কোনো খতিয়ান পাওয়া যায়নি।");
      }

      const built = buildMouzaDagRows(result.rows);
      if (!built.length) {
        throw new Error(
          "নির্বাচিত মৌজার public khatian index-এ কোনো দাগ নম্বর প্রকাশিত নেই। পূর্ণ দাগ তথ্যের authorized source প্রয়োজন হতে পারে।",
        );
      }

      setRows(result.rows);
      setExpected(result.expected);
      setGeneratedAt(new Date().toISOString());
      requestAnimationFrame(() => {
        document.getElementById("mouza-dag-report-preview")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLocalError(error instanceof Error ? error.message : "দাগ বই তৈরি করা যায়নি।");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setGenerating(false);
    }
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
  };

  const verifyRenderedRows = (): boolean => {
    const source = document.getElementById("mouza-dag-report");
    if (!source) return false;
    const rendered = source.querySelectorAll("tr[data-report-dag]");
    return rendered.length === dagRows.length;
  };

  const handlePrint = () => {
    if (!verifyRenderedRows()) {
      setLocalError("প্রিন্টে সব দাগের সারি পাওয়া যায়নি; তথ্য বাদ পড়ার ঝুঁকি থাকায় প্রিন্ট বন্ধ করা হয়েছে।");
      return;
    }
    window.print();
  };

  const handlePdf = async (action: "preview" | "download") => {
    if (!rows.length || !generatedAt || pdfBusy) return;
    const source = document.getElementById("mouza-dag-report");
    if (!source) {
      setLocalError("দাগ বইয়ের প্রিভিউ পাওয়া যায়নি।");
      return;
    }
    if (!verifyRenderedRows()) {
      setLocalError("PDF-তে সব দাগের সারি পাওয়া যায়নি; তথ্য বাদ পড়ার ঝুঁকি থাকায় PDF তৈরি বন্ধ।");
      return;
    }

    setPdfBusy(action);
    setLocalError(null);
    try {
      const result = await generatePagedReportPdf({
        source,
        pageSelector: ".report-page",
        fileName: [
          "LandBD-Mouza-Dag-Book",
          selectedMouza?.MOUZA_NAME,
          selectedSurvey?.LOCAL_NAME,
        ].filter(Boolean).join("-"),
        orientation,
        scale: 1.3,
        delivery: action === "preview" ? "return" : "download",
      });
      if (!result.ok) setLocalError(result.error);
      else if (action === "preview") {
        setPdfPreview({ blob: result.blob, fileName: result.fileName, pages: result.pages });
      }
    } finally {
      setPdfBusy(null);
    }
  };

  const displayedError = localError || locationError;

  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="মৌজা ভিত্তিক দাগ বই"
        description="একটি মৌজার উপলভ্য খতিয়ান সূচি থেকে দাগ নম্বর অনুযায়ী সংশ্লিষ্ট খতিয়ানগুলো group করে A4 দাগ বই তৈরি করুন। Survey ও নামজারি—উভয় ধরন নির্বাচন করা যাবে।"
        pattern="grid"
      />

      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle>দাগ বইয়ের এলাকা নির্বাচন</CardTitle>
            <CardDescription>
              বিভাগ → জেলা → উপজেলা → সার্ভে/নামজারি → মৌজা নির্বাচন করুন।
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
                label="সার্ভে / খতিয়ানের ধরন"
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
                  ...mouzas.map((item) => ({
                    value: item.ID,
                    label: `${item.MOUZA_NAME} — JL ${item.JL_NUMBER}`,
                  })),
                ]}
                loading={loading.mouzas}
                disabled={!surveyId}
              />
              <Select
                label="প্রিন্ট পেজ"
                value={orientation}
                onChange={(event) => setOrientation(event.target.value as "portrait" | "landscape")}
                options={[
                  { value: "portrait", label: "A4 Portrait" },
                  { value: "landscape", label: "A4 Landscape" },
                ]}
              />
            </div>

            {displayedError ? (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {displayedError}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void generateReport()}
                disabled={generating || !mouzaId}
                className="landbd-primary-button inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? <Loader2 className="animate-spin" size={17} /> : <FileText size={17} />}
                দাগ বই তৈরি করুন
              </button>
              {generating ? (
                <button
                  type="button"
                  onClick={cancelGeneration}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
                >
                  <Square size={15} /> বন্ধ করুন
                </button>
              ) : null}
              {rows.length && !generating ? (
                <button
                  type="button"
                  onClick={() => void generateReport()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold"
                >
                  <RefreshCcw size={16} /> আবার তৈরি
                </button>
              ) : null}
            </div>

            {generating ? (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <div className="flex items-center gap-2 font-semibold">
                  <Loader2 className="animate-spin" size={16} />
                  খতিয়ান সূচি সংগ্রহ ও দাগ index তৈরি হচ্ছে
                </div>
                <p className="mt-2 tabular-nums">
                  {loaded}{expected != null ? ` / ${expected}` : ""} খতিয়ান লোড হয়েছে
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        {rows.length && generatedAt ? (
          <section id="mouza-dag-report-preview" className="mt-7 scroll-mt-24">
            <div className="report-actions mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
              <div className="text-sm text-[var(--muted-foreground)]">
                {dagRows.length}টি স্বতন্ত্র দাগ · {rows.length}টি খতিয়ান সূচি
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handlePdf("preview")}
                  disabled={pdfBusy !== null}
                  className="landbd-primary-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  {pdfBusy === "preview" ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />}
                  PDF প্রিভিউ
                </button>
                <button
                  type="button"
                  onClick={() => void handlePdf("download")}
                  disabled={pdfBusy !== null}
                  className="landbd-secondary-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  {pdfBusy === "download" ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  PDF ডাউনলোড
                </button>
                <ResultPrintButton onClick={handlePrint} className="rounded-[12px]" />
              </div>
            </div>

            <MouzaDagDocument
              rows={rows}
              expectedKhatians={expected}
              districtName={selectedDistrict?.NAME ?? ""}
              upazilaName={selectedUpazila?.NAME ?? ""}
              surveyName={selectedSurvey?.LOCAL_NAME ?? ""}
              mouzaName={selectedMouza?.MOUZA_NAME ?? ""}
              jlNumber={selectedMouza?.JL_NUMBER ?? ""}
              generatedAt={generatedAt}
              orientation={orientation}
            />
          </section>
        ) : null}
      </main>

      {pdfPreview ? (
        <PdfPreviewDialog document={pdfPreview} onClose={() => setPdfPreview(null)} />
      ) : null}
    </>
  );
}
