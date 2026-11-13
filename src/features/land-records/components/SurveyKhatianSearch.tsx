"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Eye, Loader2, Search, X } from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { MUTATION_SURVEY_ID, SURVEY_KEY_BY_ID, type KhatianDetails, type KhatianIndex } from "../types";
import KhatianDetailsView from "./KhatianDetailsView";
import LandRecordSelectionColumn from "./LandRecordSelectionColumn";

export type SurveyKhatianSearchVariant = "survey" | "mutation";

export default function SurveyKhatianSearch({ variant = "survey" }: { variant?: SurveyKhatianSearchVariant }) {
  const isMutation = variant === "mutation";
  const {
    divisions, districts, upazilas, surveys, mouzas, khatians,
    selectedKhatian, selectedFullKhatian, loading, error,
    loadDistricts, loadUpazilas, loadSurveys, loadMouzas, loadKhatians, loadKhatian,
    setDistricts, setUpazilas, setSurveys, setMouzas, setKhatians, setSelectedKhatian,
  } = useSurveyKhatian();

  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [mouzaId, setMouzaId] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"search" | "details">("search");
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedDivision = divisions.find((item) => item.BBS_CODE === division);
  const selectedDistrict = districts.find((item) => item.BBS_CODE === district);
  const selectedUpazila = upazilas.find((item) => item.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((item) => String(item.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((item) => String(item.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;

  const visibleSurveys = useMemo(
    () => surveys.filter((item) => isMutation ? item.SURVEY_ID === MUTATION_SURVEY_ID : item.SURVEY_ID !== MUTATION_SURVEY_ID),
    [surveys, isMutation],
  );

  useEffect(() => { if (division) void loadDistricts(division); }, [division, loadDistricts]);
  useEffect(() => { if (district) void loadUpazilas(district); }, [district, loadUpazilas]);
  useEffect(() => { if (district && upazila) void loadSurveys(district, upazila, isMutation); }, [district, upazila, isMutation, loadSurveys]);
  useEffect(() => {
    if (!isMutation || surveyId || !visibleSurveys.length) return;
    setSurveyId(String(visibleSurveys[0].SURVEY_ID));
  }, [isMutation, surveyId, visibleSurveys]);
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

  useEffect(() => {
    if (!selectedMouza || !surveyKey) return;
    setPage(1);
    setQuery("");
    setViewMode("search");
    setLocalError(null);
    void loadKhatians({ surveyKey, jlNumberId: selectedMouza.ID, page: 1, pageSize: 20 });
  }, [selectedMouza, surveyKey, loadKhatians]);

  const resetResults = () => {
    setKhatians(null);
    setSelectedKhatian(null);
    setPage(1);
    setQuery("");
    setLocalError(null);
    setViewMode("search");
  };

  const changeDivision = (value: string) => {
    setDivision(value); setDistrict(""); setUpazila(""); setSurveyId(""); setMouzaId("");
    setDistricts([]); setUpazilas([]); setSurveys([]); setMouzas([]); resetResults();
  };
  const changeDistrict = (value: string) => {
    setDistrict(value); setUpazila(""); setSurveyId(""); setMouzaId("");
    setUpazilas([]); setSurveys([]); setMouzas([]); resetResults();
  };
  const changeUpazila = (value: string) => {
    setUpazila(value); setSurveyId(""); setMouzaId(""); setSurveys([]); setMouzas([]); resetResults();
  };
  const changeSurvey = (value: string) => {
    setSurveyId(value); setMouzaId(""); setMouzas([]); resetResults();
  };

  const runSearch = (targetPage = 1) => {
    if (!selectedMouza || !surveyKey) {
      setLocalError("প্রথমে বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা নির্বাচন করুন।");
      return;
    }
    setLocalError(null);
    setPage(targetPage);
    void loadKhatians({
      surveyKey,
      jlNumberId: selectedMouza.ID,
      page: targetPage,
      pageSize: 20,
      query: query.trim() || undefined,
    });
  };

  const goPage = (next: number) => {
    if (next < 1 || (next > page && !khatians?.hasNextPage)) return;
    runSearch(next);
  };

  const showDetails = (item: KhatianIndex) => {
    if (!surveyKey || !selectedMouza || !selectedSurvey) return;
    const fastRecord: KhatianDetails = {
      ...item,
      KHATIAN_ENTRY_ID: undefined,
      IS_LOCKED: 0,
      DIVISION_NAME: selectedDivision?.NAME || "",
      DISTRICT_NAME: selectedDistrict?.NAME || selectedMouza.DISTRICT_NAME || "",
      UPAZILA_NAME: selectedUpazila?.NAME || selectedMouza.UPAZILA_NAME || "",
      JL_NUMBER: selectedMouza.JL_NUMBER || "",
      MOUZA_NAME: selectedMouza.MOUZA_NAME || "",
      SURVEY_ID: selectedSurvey.SURVEY_ID,
      SURVEY_NAME: selectedSurvey.LOCAL_NAME || surveyKey,
      TOTAL_LAND: item.TOTAL_LAND || "",
      PUBLIC_RECORD: { LANDBD_FAST_PREVIEW: true },
    };
    setSelectedKhatian(fastRecord);
    setViewMode("details");
    void loadKhatian(surveyKey, item.ID, {
      jlNumberId: selectedMouza.ID,
      mouzaId: selectedMouza.MOUZA_ID,
      divisionBbsCode: selectedDistrict?.DIVISION_BBS_CODE,
      districtBbsCode: selectedDistrict?.BBS_CODE,
      upazilaBbsCode: selectedUpazila?.BBS_CODE,
    });
  };

  const displayedError = localError || error;
  const locationReady = Boolean(division && district && upazila && surveyId && mouzaId);

  return (
    <div className="min-h-screen bg-[#0a110d] text-[#edf3ef]">
      <section className="border-b border-[#1c2c24] bg-[#0c1510]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-[#123125] px-3 py-1 text-xs font-semibold text-[#2bc18a]">
            {isMutation ? "নামজারি খতিয়ান" : "সার্ভে খতিয়ান সেবা"}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {isMutation ? "বিনামূল্যে নামজারি খতিয়ান অনুসন্ধান করুন" : "বিনামূল্যে অনলাইনে খতিয়ান অনুসন্ধান করুন"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9eada4] md:text-base">
            বিভাগ, জেলা, উপজেলা, {isMutation ? "নামজারি" : "সার্ভে"} ও মৌজা বেছে উপলভ্য খতিয়ান ব্রাউজ করুন।
            একটি search box থেকেই খতিয়ান, দাগ, মালিক বা অভিভাবক খুঁজে পাওয়া যাবে।
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-2 py-8 md:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#1d2d25] bg-[#111a15] p-3 shadow-[0_24px_80px_rgba(0,0,0,.18)] md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white md:text-2xl">অনলাইনে সার্ভে খতিয়ান অনুসন্ধান ও ডাউনলোড করুন</h2>
            <p className="mt-2 text-sm leading-6 text-[#91a198]">
              নিচের ধাপগুলো নির্বাচন করুন। মৌজা নির্বাচনের সঙ্গে সঙ্গে খতিয়ান তালিকা লোড হবে।
            </p>
          </div>

          <div className="mb-5 rounded-xl border border-[#174333] bg-[#10271d] p-4 text-sm text-[#b8c8bf]">
            <p className="font-semibold text-[#eaf3ed]">কিভাবে তথ্য ব্রাউজ করবেন?</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-5 md:text-sm">
              <li>বিভাগ → জেলা → উপজেলা / থানা ক্রমানুসারে নির্বাচন করুন।</li>
              <li>খতিয়ানের ধরন নির্বাচন করে মৌজা / JL নম্বর বাছাই করুন।</li>
              <li>মৌজা নির্বাচন করলে তালিকা স্বয়ংক্রিয়ভাবে লোড হবে; search দিলে পুরো মৌজার ওপর filter হবে।</li>
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
              options={visibleSurveys.map((item) => ({ value: String(item.SURVEY_ID), label: item.LOCAL_NAME }))}
              loading={loading.surveys}
              disabledMessage={!upazila ? "প্রথমে উপজেলা নির্বাচন করুন।" : undefined}
            />
            <LandRecordSelectionColumn
              label="মৌজা (JL নম্বর)"
              placeholder="মৌজা বা জে.এল. নং লিখুন"
              value={mouzaId}
              onSelect={(value) => { resetResults(); setMouzaId(value); }}
              options={mouzas.map((item) => ({ value: String(item.ID), label: `${item.JL_NUMBER} · ${item.MOUZA_NAME}` }))}
              loading={loading.mouzas}
              disabledMessage={!surveyId ? "প্রথমে সার্ভে নির্বাচন করুন।" : undefined}
              className="max-lg:col-span-2"
            />
          </div>

          {khatians ? (
            <section className="mt-5 rounded-xl border border-[#214033] bg-[#0e1712] p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">খতিয়ান তালিকা</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#88988f]">
                    <span className="rounded-full bg-[#153326] px-2 py-1 text-[#2bc18a]">{selectedMouza?.MOUZA_NAME || "—"}</span>
                    <span>JL {selectedMouza?.JL_NUMBER || "—"}</span>
                    <span>·</span>
                    <span>{selectedSurvey?.LOCAL_NAME || "—"}</span>
                    {typeof khatians.total === "number" ? <><span>·</span><span>মোট ফলাফল: {khatians.total}</span></> : null}
                  </div>
                </div>

                <div className="w-full md:max-w-md">
                  <label className="mb-1 block text-xs font-medium text-[#91a198]">খতিয়ান, দাগ, মালিক বা অভিভাবক</label>
                  <div className="flex gap-2">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") runSearch(1); }}
                      placeholder="খতিয়ান / দাগ / মালিক / অভিভাবক"
                      className="min-w-0 flex-1 rounded-lg border border-[#25382e] bg-[#0a110d] px-3 py-2 text-sm text-white outline-none placeholder:text-[#617168] focus:border-[#1fa775]"
                    />
                    <button
                      type="button"
                      onClick={() => runSearch(1)}
                      disabled={loading.khatians || !mouzaId}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1fa775] px-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {loading.khatians ? <Loader2 className="animate-spin" size={15} /> : <Search size={15} />}
                      খুঁজুন
                    </button>
                  </div>
                </div>
              </div>

              {displayedError ? (
                <div role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {displayedError}
                </div>
              ) : null}

              {khatians.items.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#76867d]">কোনো খতিয়ান পাওয়া যায়নি।</div>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-lg border border-[#203129]">
                  <table className="w-full min-w-[48rem] border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#0a110d] text-left text-xs text-[#8ea097]">
                        <th className="px-3 py-3">খতিয়ান নম্বর</th>
                        <th className="px-3 py-3">মালিক/দলিলধারী</th>
                        <th className="px-3 py-3">দাগ নম্বর</th>
                        <th className="px-3 py-3">মোট জমি (একর)</th>
                        <th className="px-3 py-3 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {khatians.items.map((item) => (
                        <tr key={item.ID} className="border-t border-[#1e2d25] text-[#c2cec6] transition-colors hover:bg-[#132019]">
                          <td className="px-3 py-3 font-semibold text-[#2bc18a]">{item.KHATIAN_NO || "—"}</td>
                          <td className="max-w-[18rem] break-words px-3 py-3">{item.OWNERS || "—"}</td>
                          <td className="max-w-[20rem] break-words px-3 py-3">{item.DAGS || "—"}</td>
                          <td className="px-3 py-3">{item.TOTAL_LAND || "—"}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => showDetails(item)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#315044] px-3 py-1.5 text-xs font-semibold text-[#c9d6cf] hover:border-[#1fa775] hover:text-[#2bc18a]"
                            >
                              <Eye size={13} /> প্রিভিউ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-[#84948b]">
                <button type="button" onClick={() => goPage(page - 1)} disabled={page <= 1 || loading.khatians}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#273a30] disabled:opacity-30">
                  <ChevronLeft size={15} />
                </button>
                <span>পৃষ্ঠা {page}</span>
                <button type="button" onClick={() => goPage(page + 1)} disabled={!khatians.hasNextPage || loading.khatians}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#273a30] disabled:opacity-30">
                  <ChevronRight size={15} />
                </button>
              </div>
            </section>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[#263a30] bg-[#0d1611] px-4 py-10 text-center text-sm text-[#718178]">
              {locationReady ? "খতিয়ান তালিকা লোড হচ্ছে…" : "মৌজা নির্বাচন করলে খতিয়ান তালিকা এখানে দেখা যাবে।"}
            </div>
          )}

          <section className="mt-5 rounded-xl border border-[#203129] bg-[#0b120e] p-4">
            <h3 className="text-base font-semibold text-white">মৌজা ম্যাপ (PDF) প্রয়োজন?</h3>
            <p className="mt-1 text-sm text-[#829188]">ম্যাপের উপজেলা, সার্ভে ও মৌজা নির্বাচন করে প্রিভিউ এবং PDF সংগ্রহ করুন।</p>
            <a href="/mouza-map" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1fa775] px-4 py-2 text-sm font-semibold text-white">
              মৌজা ম্যাপ ডাউনলোড <ExternalLink size={14} />
            </a>
          </section>
        </section>
      </main>

      {viewMode === "details" && selectedKhatian ? (
        <div id="khatian-details-panel" className="fixed inset-0 z-[120] overflow-y-auto bg-[#020906]/85 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="খতিয়ান বিস্তারিত">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[#21342a] bg-[#111a15] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#21342a] px-4 py-3">
              <div>
                <p className="text-xs text-[#7f9086]">খতিয়ান নং</p>
                <p className="text-2xl font-semibold text-white">{selectedKhatian.KHATIAN_NO}</p>
              </div>
              <button
                type="button"
                onClick={() => { setViewMode("search"); setSelectedKhatian(null); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2a4035] text-[#92a299] hover:bg-[#17231d] hover:text-white"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-3 md:p-5">
              <KhatianDetailsView
                khatian={selectedKhatian}
                fullKhatian={selectedFullKhatian ?? undefined}
                fullKhatianLoading={Boolean(loading.khatian)}
                fullKhatianFailed={!loading.khatian && Boolean(error)}
                surveyKey={surveyKey}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
