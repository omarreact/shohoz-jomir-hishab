"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileDown, FileText, Loader2, Printer, RefreshCcw, Square } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID, type KhatianIndex, type KhatianPage } from "../types";
import type { HalSabekEntry } from "../full-khatian";

const empty = "-- নির্বাচন করুন --";
const PAGE_SIZE = 100;
const HAL_SABEK_BATCH_SIZE = 12;

type HalSabekBatchEntry = {
  khatianNo: string;
  mappings: HalSabekEntry[];
  unavailable?: boolean;
};

type HalSabekState = Record<string, HalSabekBatchEntry>;

type ReportMeta = {
  generatedAt: string;
  reportId: string;
};

function uniqueJoin(values: string[]): string {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(", ");
}

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
  const [includeHalSabek, setIncludeHalSabek] = useState(true);
  const [rows, setRows] = useState<KhatianIndex[]>([]);
  const [halSabek, setHalSabek] = useState<HalSabekState>({});
  const [reportMeta, setReportMeta] = useState<ReportMeta | null>(null);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "records" | "hal-sabek" | "done">("idle");
  const [loadedRecords, setLoadedRecords] = useState(0);
  const [expectedRecords, setExpectedRecords] = useState<number | null>(null);
  const [mappedRecords, setMappedRecords] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
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
    if (!selectedMouza || !selectedDistrict || !selectedUpazila || !surveyKey) {
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

    try {
      const collected: KhatianIndex[] = [];
      let page = 1;
      let hasNextPage = true;
      let total: number | undefined;

      while (hasNextPage) {
        const params = new URLSearchParams({
          surveyKey,
          jlNumberId: String(selectedMouza.ID),
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        const response = await fetch(`/api/land-records/mouza-porcha-report?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await responseJson<KhatianPage>(response);
        collected.push(...data.items);
        total = data.total ?? total;
        setExpectedRecords(total ?? null);
        setLoadedRecords(collected.length);
        hasNextPage = data.hasNextPage;
        page += 1;

        if (page > 1000) throw new Error("রিপোর্টের পেজ সীমা অতিক্রম করেছে।");
      }

      if (collected.length === 0) {
        throw new Error("নির্বাচিত মৌজায় কোনো খতিয়ান পাওয়া যায়নি।");
      }

      setRows(collected);

      if (includeHalSabek) {
        setPhase("hal-sabek");
        const batches = chunk(collected.map((item) => item.KHATIAN_NO), HAL_SABEK_BATCH_SIZE);
        const resolved: HalSabekState = {};
        let completed = 0;

        for (const khatianNos of batches) {
          const response = await fetch("/api/land-records/mouza-porcha-report/hal-sabek", {
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
          });
          const data = await responseJson<{ entries: HalSabekBatchEntry[] }>(response);
          for (const entry of data.entries) resolved[entry.khatianNo] = entry;
          completed += khatianNos.length;
          setMappedRecords(Math.min(completed, collected.length));
        }

        setHalSabek(resolved);
      }

      setReportMeta({
        generatedAt: new Date().toISOString(),
        reportId: `LANDBD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      });
      setPhase("done");
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
  const generatedLabel = reportMeta
    ? new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(reportMeta.generatedAt),
      )
    : "";
  const progressTotal = expectedRecords ?? Math.max(loadedRecords, rows.length);

  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="মৌজা পর্চা রিপোর্ট"
        description="একটি মৌজার খতিয়ান, মালিক, অভিভাবক, দাগ ও JSON-এ প্রকাশিত জমির পরিমাণ একত্র করে প্রিন্টযোগ্য রিপোর্ট তৈরি করুন। চাইলে সরকারি DLRMS উৎসে পাওয়া সাবেক/হাল দাগও যুক্ত করুন।"
        pattern="grid"
      />

      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <section className="report-controls">
          <Card>
            <CardHeader>
              <CardTitle>রিপোর্টের এলাকা নির্বাচন</CardTitle>
              <CardDescription>
                বিভাগ → জেলা → উপজেলা → সার্ভে → মৌজা/JL নির্বাচন করুন। বড় মৌজার রিপোর্ট ধাপে ধাপে লোড হবে।
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
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <input
                  type="checkbox"
                  checked={includeHalSabek}
                  onChange={(event) => {
                    clearReport();
                    setIncludeHalSabek(event.target.checked);
                  }}
                  className="mt-1 h-4 w-4 accent-[#006a4e]"
                />
                <span>
                  <span className="block text-sm font-semibold text-emerald-950">সাবেক / হাল দাগ যুক্ত করুন</span>
                  <span className="mt-1 block text-xs leading-5 text-emerald-800">
                    সরকারি DLRMS hal-sabek উৎসে mapping পাওয়া গেলে রিপোর্টে আলাদা সাবেক দাগ ও হাল দাগ কলাম দেখাবে। তথ্য না থাকলে “—” থাকবে; কোনো দাগ অনুমান করা হবে না।
                  </span>
                </span>
              </label>

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
                  className="inline-flex items-center gap-2 rounded-lg bg-[#006a4e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <Loader2 className="animate-spin" size={16} />
                    {phase === "hal-sabek" ? "সাবেক/হাল দাগ সংগ্রহ করা হচ্ছে" : "খতিয়ান তালিকা সংগ্রহ করা হচ্ছে"}
                  </div>
                  <p className="mt-2 tabular-nums">
                    {phase === "hal-sabek"
                      ? `${mappedRecords} / ${rows.length} খতিয়ান mapping পরীক্ষা হয়েছে`
                      : `${loadedRecords}${progressTotal ? ` / ${progressTotal}` : ""} খতিয়ান লোড হয়েছে`}
                  </p>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </section>

        {rows.length > 0 ? (
          <section id="mouza-porcha-report" className="mt-7 bg-white text-slate-950">
            <div className="report-actions mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
              <div className="text-sm text-[var(--muted-foreground)]">
                {rows.length}টি খতিয়ান {phase === "done" ? "রিপোর্টে প্রস্তুত" : "লোড হয়েছে"}
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={generating || phase !== "done"}
                className="inline-flex items-center gap-2 rounded-lg bg-[#006a4e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Printer size={16} /> PDF / প্রিন্ট
              </button>
            </div>

            <div className="report-sheet rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
              <header className="report-header border-b-2 border-slate-800 pb-4 text-center">
                <div className="flex items-center justify-center gap-2 text-[#006a4e]">
                  <FileDown size={20} />
                  <span className="text-sm font-bold uppercase tracking-[0.18em]">LandBD</span>
                </div>
                <h1 className="mt-2 text-xl font-bold sm:text-2xl">
                  {selectedMouza?.JL_NUMBER ? `${selectedMouza.JL_NUMBER} নং ` : ""}{selectedMouza?.MOUZA_NAME ?? ""} মৌজা — {selectedSurvey?.LOCAL_NAME ?? ""} পর্চা রিপোর্ট
                </h1>
                <p className="mt-1 text-sm text-slate-600">মোট খতিয়ান: {rows.length}টি</p>
              </header>

              <div className="report-meta grid grid-cols-2 gap-x-6 gap-y-2 border-b border-slate-300 py-4 text-sm md:grid-cols-5">
                <p><strong>জেলা:</strong> {selectedDistrict?.NAME ?? "—"}</p>
                <p><strong>উপজেলা:</strong> {selectedUpazila?.NAME ?? "—"}</p>
                <p><strong>সার্ভে:</strong> {selectedSurvey?.LOCAL_NAME ?? "—"}</p>
                <p><strong>মৌজা:</strong> {selectedMouza?.MOUZA_NAME ?? "—"}</p>
                <p><strong>JL নং:</strong> {selectedMouza?.JL_NUMBER ?? "—"}</p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className={`report-table w-full border-collapse text-xs ${includeHalSabek ? "min-w-[72rem]" : "min-w-[54rem]"}`}>
                  <thead>
                    <tr>
                      <th>খতিয়ান নং</th>
                      <th>মালিকের নাম</th>
                      <th>অভিভাবক / সম্পর্ক</th>
                      <th>দাগ নং</th>
                      {includeHalSabek ? <th>সাবেক দাগ</th> : null}
                      {includeHalSabek ? <th>হাল দাগ</th> : null}
                      <th>জমির পরিমাণ (একর)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const mapping = halSabek[row.KHATIAN_NO];
                      const previousDags = mapping ? uniqueJoin(mapping.mappings.map((item) => item.previousDag)) : "";
                      const currentDags = mapping ? uniqueJoin(mapping.mappings.map((item) => item.currentDag)) : "";
                      return (
                        <tr key={`${row.ID}-${row.KHATIAN_NO}`}>
                          <td className="font-semibold tabular-nums">{row.KHATIAN_NO || "—"}</td>
                          <td>{row.OWNERS || "—"}</td>
                          <td>{row.GUARDIANS || "—"}</td>
                          <td className="tabular-nums">{row.DAGS || "—"}</td>
                          {includeHalSabek ? <td className="tabular-nums">{previousDags || "—"}</td> : null}
                          {includeHalSabek ? <td className="tabular-nums">{currentDags || "—"}</td> : null}
                          <td className="whitespace-nowrap tabular-nums">{row.TOTAL_LAND ? `${row.TOTAL_LAND} একর` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <footer className="report-footer mt-5 border-t border-slate-300 pt-3 text-xs leading-5 text-slate-600">
                <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
                  <p><strong>রিপোর্ট ID:</strong> {reportMeta?.reportId ?? "প্রস্তুত হচ্ছে…"}</p>
                  <p><strong>তৈরির সময়:</strong> {generatedLabel || "প্রস্তুত হচ্ছে…"}</p>
                </div>
                <p className="mt-2">
                  LandBD তথ্যভিত্তিক প্রতিবেদন — সরকারি প্রত্যয়িত পর্চার বিকল্প নয়। জমির পরিমাণ কেবল উৎস JSON/API-তে প্রকাশিত মান থেকে দেখানো হয়েছে; মানচিত্রের polygon/geometry থেকে কোনো জমির পরিমাণ গণনা করা হয়নি। সাবেক/হাল দাগ কেবল DLRMS mapping পাওয়া গেলে দেখানো হয়।
                </p>
              </footer>
            </div>
          </section>
        ) : null}
      </main>

      <style jsx global>{`
        .report-table th,
        .report-table td {
          border: 1px solid #cbd5e1;
          padding: 7px 8px;
          vertical-align: top;
          text-align: left;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .report-table th {
          background: #f1f5f9;
          font-weight: 700;
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: #fff !important;
          }
          body > * {
            visibility: hidden !important;
          }
          #mouza-porcha-report,
          #mouza-porcha-report * {
            visibility: visible !important;
          }
          #mouza-porcha-report {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .report-actions,
          .report-controls,
          nav,
          footer:not(.report-footer) {
            display: none !important;
          }
          .report-sheet {
            border: 0 !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          .report-table {
            min-width: 0 !important;
            width: 100% !important;
            font-size: 8.5pt !important;
          }
          .report-table thead {
            display: table-header-group;
          }
          .report-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .report-table th,
          .report-table td {
            padding: 4px 5px !important;
          }
          .report-header,
          .report-meta {
            break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
