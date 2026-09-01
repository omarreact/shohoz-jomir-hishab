"use client";

import { useEffect, useMemo, useState } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID } from "../types";

const empty = "-- নির্বাচন করুন --";

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

  // Step 1: load the first dropdown once, exactly like the RAJUK cascade.
  useEffect(() => {
    void loadDistricts("");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: Division -> Districts.
  // Downstream values are cleared in handleDivisionChange before this effect runs.
  useEffect(() => {
    if (!division) return;
    void loadDistricts(division);
  }, [division, loadDistricts]);

  // Step 3: District -> Upazilas.
  useEffect(() => {
    if (!district) return;
    void loadUpazilas(district);
  }, [district, loadUpazilas]);

  // Step 4: District + Upazila -> available surveys.
  useEffect(() => {
    if (!district || !upazila) return;
    void loadSurveys(district, upazila);
  }, [district, upazila, loadSurveys]);

  // Step 5: Survey -> Mouza/JL list.
  // The server route resolves SURVEY_ID -> English SURVEY_KEY, so LOCAL_NAME
  // (e.g. "সি এস") is never used as the upstream API key.
  useEffect(() => {
    if (!selectedSurvey || !selectedDistrict || !selectedUpazila) return;

    void loadMouzas({
      districtBbsCode: district,
      upazilaBbsCode: upazila,
      surveyId: selectedSurvey.SURVEY_ID,
      districtName: selectedDistrict.NAME,
      upazilaName: selectedUpazila.NAME,
    });
  }, [
    district,
    upazila,
    selectedDistrict,
    selectedUpazila,
    selectedSurvey,
    loadMouzas,
  ]);

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

  const search = () => {
    if (!selectedMouza || !surveyKey) return;
    setPage(1);
    void loadKhatians({
      surveyKey,
      jlNumberId: selectedMouza.ID,
      page: 1,
      pageSize: 20,
    });
  };

  const goPage = (next: number) => {
    if (
      !selectedMouza ||
      !surveyKey ||
      next < 1 ||
      (next > page && !khatians?.hasNextPage)
    ) {
      return;
    }

    setPage(next);
    void loadKhatians({
      surveyKey,
      jlNumberId: selectedMouza.ID,
      page: next,
      pageSize: 20,
    });
  };

  const surveyOptions = useMemo(
    () => surveys.map((s) => ({ value: s.SURVEY_ID, label: s.LOCAL_NAME })),
    [surveys],
  );
  const busy = Object.values(loading).some(Boolean);

  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="সার্ভে খতিয়ান অনুসন্ধান"
        description="ধাপে ধাপে এলাকা, সার্ভে ও মৌজা নির্বাচন করে খতিয়ানের সূচি দেখুন।"
        pattern="grid"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>অনুসন্ধানের তথ্য</CardTitle>
            <CardDescription>
              পাঁচটি নির্বাচন সম্পন্ন হলে খতিয়ান খোঁজা যাবে।
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select
                label="১. বিভাগ"
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                options={[
                  { value: "", label: empty },
                  ...divisions.map((d) => ({ value: d.BBS_CODE, label: d.NAME })),
                ]}
                disabled={loading.divisions}
              />

              <Select
                label="২. জেলা"
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                options={[
                  { value: "", label: empty },
                  ...districts.map((d) => ({ value: d.BBS_CODE, label: d.NAME })),
                ]}
                disabled={!division || loading.districts}
              />

              <Select
                label="৩. উপজেলা"
                value={upazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                options={[
                  { value: "", label: empty },
                  ...upazilas.map((u) => ({ value: u.BBS_CODE, label: u.NAME })),
                ]}
                disabled={!district || loading.upazilas}
              />

              <Select
                label="৪. সার্ভে"
                value={surveyId}
                onChange={(e) => handleSurveyChange(e.target.value)}
                options={[{ value: "", label: empty }, ...surveyOptions]}
                disabled={!upazila || loading.surveys}
              />

              <Select
                label="৫. মৌজা / JL"
                value={mouzaId}
                onChange={(e) => handleMouzaChange(e.target.value)}
                options={[
                  { value: "", label: empty },
                  ...mouzas.map((m) => ({
                    value: m.ID,
                    label: `${m.MOUZA_NAME} — JL ${m.JL_NUMBER}`,
                  })),
                ]}
                disabled={!surveyId || loading.mouzas}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={search}
              disabled={!selectedMouza || !surveyKey || loading.khatians}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#006a4e] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={16} />
              {loading.khatians ? "খোঁজা হচ্ছে…" : "খতিয়ান খুঁজুন"}
            </button>

            {busy && !loading.khatians && (
              <span className="ml-3 text-xs text-slate-500">ডেটা লোড হচ্ছে…</span>
            )}
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>খতিয়ান সূচি</CardTitle>
            <CardDescription>
              {khatians
                ? `পৃষ্ঠা ${khatians.page}${khatians.total ? ` · মোট ${khatians.total}` : ""}`
                : "অনুসন্ধানের ফলাফল এখানে দেখা যাবে।"}
            </CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {loading.khatians ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={18} />
                লোড হচ্ছে…
              </div>
            ) : khatians ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/70">
                      <tr>
                        <th className="px-5 py-3">খতিয়ান</th>
                        <th className="px-5 py-3">মালিক</th>
                        <th className="px-5 py-3">দাগ</th>
                        <th className="px-5 py-3">অভিভাবক</th>
                        <th className="px-5 py-3">মৌজা ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {khatians.items.map((k) => (
                        <tr
                          key={k.ID}
                          className="border-t border-[var(--border-color)]"
                        >
                          <td className="px-5 py-3 font-medium">{k.KHATIAN_NO}</td>
                          <td className="px-5 py-3">{k.OWNERS}</td>
                          <td className="px-5 py-3">{k.DAGS}</td>
                          <td className="px-5 py-3">{k.GUARDIANS}</td>
                          <td className="px-5 py-3">{k.MOUZA_ID}</td>
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
              <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
                কোনো ফলাফল এখনো নেই।
              </div>
            )}
          </CardBody>
        </Card>
      </main>
    </>
  );
}
