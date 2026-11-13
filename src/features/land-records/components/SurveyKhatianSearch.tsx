"use client";

import { useEffect, useMemo, useState } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Input } from "@/src/shared/ui/Input";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Eye, Info, Loader2, Search, ShieldCheck } from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { MUTATION_SURVEY_ID, SURVEY_KEY_BY_ID, type KhatianDetails, type KhatianIndex } from "../types";
import KhatianDetailsView from "./KhatianDetailsView";

const empty = "-- নির্বাচন করুন --";
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
  const surveyOptions = useMemo(
    () => visibleSurveys.map((item) => ({ value: item.SURVEY_ID, label: item.LOCAL_NAME })),
    [visibleSurveys],
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
    setViewMode("search");
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
    requestAnimationFrame(() => document.getElementById("khatian-details-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const displayedError = localError || error;
  const locationReady = Boolean(division && district && upazila && surveyId && mouzaId);

  return (
    <>
      <HeroBanner
        badge={isMutation ? "নামজারি রেকর্ড" : "ভূমি রেকর্ড"}
        title={isMutation ? "নামজারি খতিয়ান ব্রাউজ" : "DLRMS খতিয়ান ব্রাউজ"}
        description={isMutation
          ? "মৌজা নির্বাচন করলেই নামজারি খতিয়ান তালিকা লোড হবে; একটি ঘর থেকেই খতিয়ান, দাগ, মালিক বা অভিভাবক খুঁজুন।"
          : "বিভাগ → জেলা → উপজেলা → সার্ভে → মৌজা নির্বাচন করলেই পেজভিত্তিক পূর্ণ তালিকা; একটি ঘর থেকেই খতিয়ান, দাগ, মালিক বা অভিভাবক খুঁজুন।"}
        pattern="grid"
      />
      <main className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
        {viewMode === "search" ? (
          <>
            <div className="mb-5 rounded-[14px] border border-[color-mix(in_srgb,var(--primary)_18%,var(--border-color))] bg-[var(--brand-green-faint)] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--primary)]" size={20} />
                <div>
                  <p className="text-sm font-black">Mouza Browse Mode</p>
                  <p className="mt-1 text-xs leading-6 text-[var(--muted-foreground)]">
                    কোনো search term বাধ্যতামূলক নয়। মৌজা select করলেই প্রতি পেজে ২০টি করে রেকর্ড আসে। Search দিলে পুরো মৌজার khatian, dag, owner ও guardian field একসাথে filter হয়।
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>এলাকা নির্বাচন</CardTitle>
                <CardDescription>বিভাগ, জেলা, উপজেলা, {isMutation ? "নামজারি ধরন" : "সার্ভে"} এবং মৌজা নির্বাচন করুন।</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Select label="বিভাগ" value={division} onChange={(e) => changeDivision(e.target.value)}
                    options={[{ value: "", label: empty }, ...divisions.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]} loading={loading.divisions} />
                  <Select label="জেলা" value={district} onChange={(e) => changeDistrict(e.target.value)}
                    options={[{ value: "", label: empty }, ...districts.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]} loading={loading.districts} disabled={!division} />
                  <Select label="উপজেলা" value={upazila} onChange={(e) => changeUpazila(e.target.value)}
                    options={[{ value: "", label: empty }, ...upazilas.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]} loading={loading.upazilas} disabled={!district} />
                  <Select label={isMutation ? "খতিয়ানের ধরন" : "সার্ভে"} value={surveyId} onChange={(e) => changeSurvey(e.target.value)}
                    options={[{ value: "", label: empty }, ...surveyOptions]} loading={loading.surveys} disabled={!upazila || (isMutation && surveyOptions.length === 1)} />
                  <Select label="মৌজা / JL" value={mouzaId} onChange={(e) => { resetResults(); setMouzaId(e.target.value); }}
                    options={[{ value: "", label: empty }, ...mouzas.map((item) => ({ value: item.ID, label: `${item.MOUZA_NAME} — JL ${item.JL_NUMBER}` }))]}
                    loading={loading.mouzas} disabled={!surveyId} />
                </div>

                <div className="mt-6 border-t border-[var(--border-color)] pt-6">
                  <Input label="একসাথে খুঁজুন" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="খতিয়ান / দাগ / মালিক / অভিভাবক" disabled={!mouzaId}
                    onKeyDown={(e) => { if (e.key === "Enter") runSearch(1); }} />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => runSearch(1)} disabled={loading.khatians || !mouzaId}
                      className="landbd-primary-button inline-flex min-h-11 items-center gap-2 px-5 py-2.5 text-sm font-black disabled:opacity-60">
                      {loading.khatians ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                      {query.trim() ? "ফিল্টার করুন" : "পুরো মৌজা দেখুন"}
                    </button>
                    {query.trim() ? (
                      <button type="button" onClick={() => { setQuery(""); setPage(1); if (selectedMouza && surveyKey) void loadKhatians({ surveyKey, jlNumberId: selectedMouza.ID, page: 1, pageSize: 20 }); }}
                        className="landbd-secondary-button min-h-11 px-4 text-sm font-bold">ফিল্টার মুছুন</button>
                    ) : null}
                  </div>
                </div>
                {displayedError ? <div role="alert" className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{displayedError}</div> : null}
              </CardBody>
            </Card>

            {khatians ? (
              <section className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black">{query.trim() ? "মৌজা ফিল্টার ফলাফল" : "মৌজার খতিয়ান তালিকা"}</h2>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    {typeof khatians.total === "number" ? <span>{khatians.total}টি রেকর্ড ·</span> : null}
                    <button type="button" onClick={() => goPage(page - 1)} disabled={page <= 1 || loading.khatians}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border disabled:opacity-40"><ChevronLeft size={16} /></button>
                    <span>পেজ {page}</span>
                    <button type="button" onClick={() => goPage(page + 1)} disabled={!khatians.hasNextPage || loading.khatians}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border disabled:opacity-40"><ChevronRight size={16} /></button>
                  </div>
                </div>
                {khatians.items.length === 0 ? <div className="rounded-[14px] border border-dashed py-10 text-center text-sm text-[var(--muted-foreground)]">কোনো খতিয়ান পাওয়া যায়নি।</div> : (
                  <div className="landbd-table-wrap">
                    <table className="w-full min-w-[48rem] border-collapse text-sm">
                      <thead><tr className="border-b bg-[var(--secondary)]/40 text-left text-xs text-[var(--muted-foreground)]">
                        <th className="px-3 py-2.5">খতিয়ান নং</th><th className="px-3 py-2.5">মালিক</th><th className="px-3 py-2.5">অভিভাবক</th>
                        <th className="px-3 py-2.5">দাগ</th><th className="px-3 py-2.5">মোট জমি</th><th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                      </tr></thead>
                      <tbody>{khatians.items.map((item) => (
                        <tr key={item.ID} className="border-b last:border-0">
                          <td className="px-3 py-2.5 font-semibold">{item.KHATIAN_NO || "—"}</td>
                          <td className="max-w-[14rem] break-words px-3 py-2.5">{item.OWNERS || "—"}</td>
                          <td className="max-w-[14rem] break-words px-3 py-2.5">{item.GUARDIANS || "—"}</td>
                          <td className="max-w-[10rem] break-words px-3 py-2.5">{item.DAGS || "—"}</td>
                          <td className="px-3 py-2.5">{item.TOTAL_LAND || "—"}</td>
                          <td className="px-3 py-2.5 text-right"><button type="button" onClick={() => showDetails(item)}
                            className="inline-flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs font-bold text-[var(--primary)]"><Eye size={14} /> বিস্তারিত</button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <div className="rounded-[12px] border px-4 py-3 text-xs leading-5 text-[var(--muted-foreground)]"><div className="flex items-start gap-2"><Info className="mt-0.5 shrink-0" size={15} />
                  <span>Browse mode paginated। Unified search পুরো selected Mouza index সংগ্রহ করে khatian/dag/owner/guardian field-এর ওপর filter করে।</span></div></div>
              </section>
            ) : null}
          </>
        ) : (
          <section id="khatian-details-panel" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button type="button" onClick={() => { setViewMode("search"); setSelectedKhatian(null); }}
                className="landbd-secondary-button inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold"><ArrowLeft size={16} /> ফিরে যান</button>
              <a href={isMutation ? "/mouza-khatian-book?mode=mutation" : "/mouza-khatian-book"}
                className="landbd-secondary-button inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[var(--primary)]"><ExternalLink size={15} /> মৌজা খতিয়ান বই</a>
            </div>
            {selectedKhatian ? <KhatianDetailsView khatian={selectedKhatian} fullKhatian={selectedFullKhatian ?? undefined}
              fullKhatianLoading={Boolean(loading.khatian)} fullKhatianFailed={!loading.khatian && Boolean(error)} surveyKey={surveyKey} /> : null}
          </section>
        )}
      </main>
    </>
  );
}
