"use client";

import { useEffect, useMemo, useState } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Input } from "@/src/shared/ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/shared/ui/dialog";
import { Loader2, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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
  const [page, setPage] = useState(1);
  const [khatianNo, setKhatianNo] = useState("");
  const [owner, setOwner] = useState("");
  const [dagNumber, setDagNumber] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectedDistrict = districts.find((d) => d.BBS_CODE === district);
  const selectedUpazila = upazilas.find((u) => u.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((s) => String(s.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((m) => String(m.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;
  const searchFilters = { khatianNo: khatianNo.trim() || undefined, owner: owner.trim() || undefined, dagNumber: dagNumber.trim() || undefined };

  // Step 1: divisions are loaded once by useSurveyKhatian on mount.

  // Step 2: Division -> Districts.
  useEffect(() => {
    if (!division) return;
    void loadDistricts(division);
  }, [division, loadDistricts]);

  // Step 3: District -> Upazilas.
  useEffect(() => {
    if (!district) return;
    void loadUpazilas(district);
  }, [district, loadUpazilas]);

  // Step 4: District + Upazila -> Surveys.
  useEffect(() => {
    if (!district || !upazila) return;
    void loadSurveys(district, upazila);
  }, [district, upazila, loadSurveys]);

  // Step 5: Survey -> Mouza/JL.
  // LOCAL_NAME is display-only; the provider resolves SURVEY_ID to SURVEY_KEY.
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
    setSelectedKhatian(null);
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
    setSelectedKhatian(null);
    setPage(1);
  };

  const handleUpazilaChange = (value: string) => {
    setUpazila(value);
    setSurveyId("");
    setMouzaId("");
    setSurveys([]);
    setMouzas([]);
    setKhatians(null);
    setSelectedKhatian(null);
    setPage(1);
  };

  const handleSurveyChange = (value: string) => {
    setSurveyId(value);
    setMouzaId("");
    setMouzas([]);
    setKhatians(null);
    setSelectedKhatian(null);
    setPage(1);
  };

  const handleMouzaChange = (value: string) => {
    setMouzaId(value);
    setKhatians(null);
    setSelectedKhatian(null);
    setPage(1);
  };

  const search = () => {
    if (!selectedMouza || !surveyKey) return;
    setPage(1);
    void loadKhatians({ surveyKey, jlNumberId: selectedMouza.ID, page: 1, pageSize: 20, ...searchFilters });
  };

  const goPage = (next: number) => {
    if (!selectedMouza || !surveyKey || next < 1 || (next > page && !khatians?.hasNextPage)) return;
    setPage(next);
    void loadKhatians({ surveyKey, jlNumberId: selectedMouza.ID, page: next, pageSize: 20, ...searchFilters });
  };

  const showDetails = (id: number) => {
    if (!surveyKey) return;
    setSelectedKhatian(null);
    setDetailsOpen(true);
    void loadKhatian(surveyKey, id);
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
        description="ধাপে ধাপে এলাকা, সার্ভে ও মৌজা নির্বাচন করে খতিয়ানের সূচি দেখুন।"
        pattern="grid"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>অনুসন্ধানের তথ্য</CardTitle>
            <CardDescription>
              প্রতিটি তালিকা সম্পূর্ণ লোড হলে তার পূর্ণ ডেটা দেখানো হবে।
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                options={[{ value: "", label: empty }, ...districts.map((d) => ({ value: d.BBS_CODE, label: d.NAME }))]}
                loading={loading.districts}
                disabled={!division}
              />

              <Select
                label="৩. উপজেলা"
                value={upazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                options={[{ value: "", label: empty }, ...upazilas.map((u) => ({ value: u.BBS_CODE, label: u.NAME }))]}
                loading={loading.upazilas}
                disabled={!district}
              />

              <Select
                label="৪. সার্ভে"
                value={surveyId}
                onChange={(e) => handleSurveyChange(e.target.value)}
                options={[{ value: "", label: empty }, ...surveyOptions]}
                loading={loading.surveys}
                disabled={!upazila}
              />

              <Select
                label="৫. মৌজা / JL"
                value={mouzaId}
                onChange={(e) => handleMouzaChange(e.target.value)}
                options={[{ value: "", label: empty }, ...mouzas.map((m) => ({ value: m.ID, label: `${m.MOUZA_NAME} — JL ${m.JL_NUMBER}` }))]}
                loading={loading.mouzas}
                disabled={!surveyId}
              />
            </div>

            <div className="mt-5 border-t border-[var(--border-color)] pt-5">
              <p className="mb-3 text-sm font-semibold">অধিকতর অনুসন্ধান (ঐচ্ছিক)</p>
              <div className="grid gap-4 md:grid-cols-3">
                <Input label="খতিয়ান নম্বর" value={khatianNo} onChange={(event) => setKhatianNo(event.target.value)} placeholder="যেমন: ১২" />
                <Input label="মালিকের নাম" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="নামের অংশ লিখুন" />
                <Input label="দাগ নম্বর" value={dagNumber} onChange={(event) => setDagNumber(event.target.value)} placeholder="যেমন: ১১৭" />
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={search}
              disabled={!selectedMouza || !surveyKey || loading.khatians}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#006a4e] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading.khatians ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              {loading.khatians ? "খোঁজা হচ্ছে…" : "খতিয়ান খুঁজুন"}
            </button>
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
                <Loader2 className="animate-spin" size={18} />লোড হচ্ছে…
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
                        <th className="px-5 py-3 text-right">বিস্তারিত</th>
                      </tr>
                    </thead>
                    <tbody>
                      {khatians.items.map((k) => (
                        <tr key={k.ID} className="border-t border-[var(--border-color)] transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="px-5 py-3 font-medium">{k.KHATIAN_NO}</td>
                          <td className="px-5 py-3">{k.OWNERS || "—"}</td>
                          <td className="px-5 py-3">{k.DAGS || "—"}</td>
                          <td className="px-5 py-3">{k.GUARDIANS || "—"}</td>
                          <td className="px-5 py-3 text-right">
                            <button type="button" onClick={() => showDetails(k.ID)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-medium text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                              <Eye size={15} /> দেখুন
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4">
                  <button type="button" onClick={() => goPage(page - 1)} disabled={page === 1 || loading.khatians} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40">
                    <ChevronLeft size={16} />আগের
                  </button>
                  <span className="text-sm text-slate-500">পৃষ্ঠা {page}</span>
                  <button type="button" onClick={() => goPage(page + 1)} disabled={!khatians.hasNextPage || loading.khatians} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40">
                    পরের<ChevronRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">কোনো ফলাফল এখনো নেই।</div>
            )}
          </CardBody>
        </Card>
      </main>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>খতিয়ানের বিস্তারিত তথ্য</DialogTitle>
            <DialogDescription>DLRMS-এর প্রকাশিত রেকর্ড সারাংশ</DialogDescription>
          </DialogHeader>
          {loading.khatian ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />তথ্য লোড হচ্ছে…</div>
          ) : selectedKhatian ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["খতিয়ান নম্বর", selectedKhatian.KHATIAN_NO], ["বিভাগ", selectedKhatian.DIVISION_NAME],
                ["জেলা", selectedKhatian.DISTRICT_NAME], ["উপজেলা/থানা", selectedKhatian.UPAZILA_NAME],
                ["সার্ভে", selectedKhatian.SURVEY_NAME || surveyKey || "—"], ["মৌজা", selectedKhatian.MOUZA_NAME],
                ["JL নম্বর", selectedKhatian.JL_NUMBER], ["জমির পরিমাণ (একর)", selectedKhatian.TOTAL_LAND],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--border-color)] p-3">
                  <p className="text-xs text-[var(--muted-foreground)]">{label}</p><p className="mt-1 font-medium">{value || "—"}</p>
                </div>
              ))}
              <div className="rounded-lg border border-[var(--border-color)] p-3 sm:col-span-2"><p className="text-xs text-[var(--muted-foreground)]">মালিকের নাম</p><p className="mt-1 whitespace-pre-wrap font-medium">{selectedKhatian.OWNERS || "—"}</p></div>
              <div className="rounded-lg border border-[var(--border-color)] p-3 sm:col-span-2"><p className="text-xs text-[var(--muted-foreground)]">দাগ নম্বর</p><p className="mt-1 whitespace-pre-wrap font-medium">{selectedKhatian.DAGS || "—"}</p></div>
              {selectedKhatian.GUARDIANS && <div className="rounded-lg border border-[var(--border-color)] p-3 sm:col-span-2"><p className="text-xs text-[var(--muted-foreground)]">অভিভাবক</p><p className="mt-1 whitespace-pre-wrap font-medium">{selectedKhatian.GUARDIANS}</p></div>}
            </div>
          ) : (
            <div className="min-h-32 py-8 text-center text-sm text-slate-500">বিস্তারিত তথ্য পাওয়া যায়নি।</div>
          )}
          <p className="text-xs leading-5 text-[var(--muted-foreground)]">এটি সরকারি DLRMS-এর প্রকাশিত অনলাইন সারাংশ। দাপ্তরিক কাজে সার্টিফাইড কপি যাচাই করুন।</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
