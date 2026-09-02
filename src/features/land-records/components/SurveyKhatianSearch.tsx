"use client";

import { useEffect, useMemo, useState } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID } from "../types";

const empty = "-- নির্বাচন করুন --";
const PAGE_SIZE = 100;

export default function SurveyKhatianSearch() {
  const {
    divisions,
    districts,
    upazilas,
    surveys,
    mouzas,
    khatians,
    loading,
    error,
    loadDistricts,
    loadUpazilas,
    loadSurveys,
    loadMouzas,
    loadKhatians,
    setDistricts,
    setUpazilas,
    setSurveys,
    setMouzas,
    setKhatians,
  } = useSurveyKhatian();

  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [mouzaId, setMouzaId] = useState("");
  const [page, setPage] = useState(1);

  const selectedDistrict = districts.find((d) => d.BBS_CODE === district);
  const selectedUpazila = upazilas.find((u) => u.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((s) => String(s.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((m) => String(m.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;

  // Same sequential useEffect pattern as /rajuk-test.
  useEffect(() => {
    if (!division) return;
    void loadDistricts(division);
  }, [division, loadDistricts]);

  useEffect(() => {
    if (!district) return;
    void loadUpazilas(district);
  }, [district, loadUpazilas]);

  useEffect(() => {
    if (!district || !upazila) return;
    void loadSurveys(district, upazila);
  }, [district, upazila, loadSurveys]);

  useEffect(() => {
    if (!selectedSurvey || !selectedDistrict || !selectedUpazila) return;
    void loadMouzas({
      districtBbsCode: district,
      upazilaBbsCode: upazila,
      surveyId: selectedSurvey.SURVEY_ID,
      districtName: selectedDistrict.NAME_EN,
      upazilaName: selectedUpazila.NAME_EN,
    });
  }, [district, upazila, selectedDistrict, selectedUpazila, selectedSurvey, loadMouzas]);

  // Mouza selection automatically loads the first 100 index khatians.
  useEffect(() => {
    if (!selectedMouza || !surveyKey) return;
    setPage(1);
    void loadKhatians({
      surveyKey,
      jlNumberId: selectedMouza.ID,
      page: 1,
      pageSize: PAGE_SIZE,
    });
  }, [selectedMouza, surveyKey, loadKhatians]);

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
    setKhatians(null);
    setPage(1);
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setUpazila("");
    setSurveyId("");
    setMouzaId("");
    setUpazilas([]);
    setSurveys([]);
    setMouzas([]);
    setKhatians(null);
    setPage(1);
  };

  const handleUpazilaChange = (value: string) => {
    setUpazila(value);
    setSurveyId("");
    setMouzaId("");
    setSurveys([]);
    setMouzas([]);
    setKhatians(null);
    setPage(1);
  };

  const handleSurveyChange = (value: string) => {
    setSurveyId(value);
    setMouzaId("");
    setMouzas([]);
    setKhatians(null);
    setPage(1);
  };

  const handleMouzaChange = (value: string) => {
    setMouzaId(value);
    setKhatians(null);
    setPage(1);
  };

  const goPage = (next: number) => {
    if (!selectedMouza || !surveyKey || next < 1 || (next > page && !khatians?.hasNextPage)) return;
    setPage(next);
    void loadKhatians({
      surveyKey,
      jlNumberId: selectedMouza.ID,
      page: next,
      pageSize: PAGE_SIZE,
    });
  };

  const surveyOptions = useMemo(
    () => surveys.map((s) => ({ value: s.SURVEY_ID, label: s.LOCAL_NAME })),
    [surveys],
  );

  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="সার্ভে খতিয়ান অনুসন্ধান"
        description="ধাপে ধাপে বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা নির্বাচন করে খতিয়ানের সূচি দেখুন।"
        pattern="grid"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>অনুসন্ধানের তথ্য</CardTitle>
            <CardDescription>
              একটি ধাপ পরিবর্তন করলে তার পরের সব ধাপের নির্বাচন ও ফলাফল স্বয়ংক্রিয়ভাবে পরিষ্কার হবে।
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Select
                label="১. বিভাগ"
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                options={[{ value: "", label: empty }, ...divisions.map((d) => ({ value: d.BBS_CODE, label: d.NAME }))]}
                loading={loading.divisions}
              />

              <Select
                label="২. জেলা"
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                options={[{ value: "", label: division ? empty : "প্রথমে বিভাগ নির্বাচন করুন" }, ...districts.map((d) => ({ value: d.BBS_CODE, label: d.NAME }))]}
                loading={loading.districts}
                disabled={!division}
              />

              <Select
                label="৩. উপজেলা / থানা"
                value={upazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                options={[{ value: "", label: district ? empty : "প্রথমে জেলা নির্বাচন করুন" }, ...upazilas.map((u) => ({ value: u.BBS_CODE, label: u.NAME }))]}
                loading={loading.upazilas}
                disabled={!district}
              />

              <Select
                label="৪. খতিয়ানের ধরন"
                value={surveyId}
                onChange={(e) => handleSurveyChange(e.target.value)}
                options={[{ value: "", label: upazila ? empty : "প্রথমে উপজেলা নির্বাচন করুন" }, ...surveyOptions]}
                loading={loading.surveys}
                disabled={!upazila}
              />

              <Select
                label="৫. মৌজা / JL"
                value={mouzaId}
                onChange={(e) => handleMouzaChange(e.target.value)}
                options={[{ value: "", label: surveyId ? empty : "প্রথমে সার্ভে নির্বাচন করুন" }, ...mouzas.map((m) => ({ value: m.ID, label: `${m.MOUZA_NAME} — JL ${m.JL_NUMBER}` }))]}
                loading={loading.mouzas}
                disabled={!surveyId}
              />
            </div>

            {error && (
              <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>খতিয়ান তালিকা</CardTitle>
            <CardDescription>
              {khatians
                ? `পৃষ্ঠা ${khatians.page}${khatians.total !== undefined ? ` · মোট ${khatians.total.toLocaleString("bn-BD")}` : ""}`
                : "মৌজা নির্বাচন করলে প্রথম ১০০টি খতিয়ান স্বয়ংক্রিয়ভাবে লোড হবে।"}
            </CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {loading.khatians ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={18} />
                খতিয়ান লোড হচ্ছে…
              </div>
            ) : khatians ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/70">
                      <tr>
                        <th className="px-5 py-3">খতিয়ান নং</th>
                        <th className="px-5 py-3">মালিক/দলিলধারী</th>
                        <th className="px-5 py-3">দাগ নম্বর</th>
                        <th className="px-5 py-3">মোট জমি (একর)</th>
                        <th className="px-5 py-3">ঝলক</th>
                      </tr>
                    </thead>
                    <tbody>
                      {khatians.items.map((k) => (
                        <tr key={k.ID} className="border-t border-[var(--border-color)]">
                          <td className="px-5 py-3 font-medium">{k.KHATIAN_NO}</td>
                          <td className="max-w-md px-5 py-3">{k.OWNERS || "—"}</td>
                          <td className="px-5 py-3">{k.DAGS || "—"}</td>
                          <td className="px-5 py-3">{k.TOTAL_LAND ?? "—"}</td>
                          <td className="px-5 py-3">
                            <button type="button" className="rounded-md px-3 py-1.5 text-xs font-semibold text-[#006a4e] hover:bg-[#006a4e]/10">
                              • প্রিভিউ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4">
                  <button type="button" onClick={() => goPage(page - 1)} disabled={page === 1 || loading.khatians} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40">
                    <ChevronLeft size={16} />
                    আগের
                  </button>
                  <span className="text-sm text-slate-500">পৃষ্ঠা {page}</span>
                  <button type="button" onClick={() => goPage(page + 1)} disabled={!khatians.hasNextPage || loading.khatians} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40">
                    পরের
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
                খতিয়ান দেখতে মৌজা নির্বাচন করুন।
              </div>
            )}
          </CardBody>
        </Card>
      </main>
    </>
  );
}
