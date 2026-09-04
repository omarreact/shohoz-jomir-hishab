"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Input } from "@/src/shared/ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/shared/ui/dialog";
import { Check, ChevronLeft, ChevronRight, ClipboardCopy, Database, ExternalLink, Eye, Loader2, Search } from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID } from "../types";

const empty = "-- নির্বাচন করুন --";

const PUBLIC_FIELD_LABELS: Record<string, string> = {
  ID: "রেকর্ড আইডি",
  KHATIAN_ENTRY_ID: "খতিয়ান এন্ট্রি আইডি",
  KHATIAN_NO: "খতিয়ান নম্বর",
  OWNERS: "মালিক / দখলদার",
  OWNER: "মালিক",
  OWNER_NAME: "মালিকের নাম",
  DAGS: "দাগ নম্বর",
  DAG_NUMBER: "দাগ নম্বর",
  GUARDIANS: "অভিভাবক / পিতা / স্বামী",
  GUARDIAN: "অভিভাবক",
  JL_NUMBER_ID: "JL রেকর্ড আইডি",
  JL_NUMBER: "JL নম্বর",
  MOUZA_ID: "মৌজা আইডি",
  MOUZA_NAME: "মৌজা",
  DIVISION_NAME: "বিভাগ",
  DISTRICT_NAME: "জেলা",
  UPAZILA_NAME: "উপজেলা / থানা",
  SURVEY_ID: "সার্ভে আইডি",
  SURVEY_NAME: "সার্ভে",
  TOTAL_LAND: "মোট জমি",
  LAND_AMOUNT: "জমির পরিমাণ",
  LAND_CLASS: "জমির শ্রেণি",
  LAND_TYPE: "জমির ধরন",
  SHARE: "হিস্যা / অংশ",
  IS_LOCKED: "লক অবস্থা",
  ROW_STATUS: "রেকর্ড অবস্থা",
  CREATED_AT: "তৈরির সময়",
  UPDATED_AT: "হালনাগাদের সময়",
};

const PRIMARY_RECORD_KEYS = new Set([
  "ID",
  "KHATIAN_ENTRY_ID",
  "KHATIAN_NO",
  "OWNERS",
  "DAGS",
  "GUARDIANS",
  "JL_NUMBER_ID",
  "JL_NUMBER",
  "MOUZA_ID",
  "MOUZA_NAME",
  "DIVISION_NAME",
  "DISTRICT_NAME",
  "UPAZILA_NAME",
  "SURVEY_ID",
  "SURVEY_NAME",
  "TOTAL_LAND",
  "IS_LOCKED",
]);

function publicFieldLabel(key: string): string {
  return PUBLIC_FIELD_LABELS[key] || key.replaceAll("_", " ");
}

function hasDisplayValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function PublicValue({ value, depth = 0 }: { value: unknown; depth?: number }): ReactNode {
  if (!hasDisplayValue(value)) return <span className="text-slate-400">—</span>;
  if (typeof value === "boolean") return <span>{value ? "হ্যাঁ" : "না"}</span>;
  if (typeof value === "string" || typeof value === "number") {
    return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-md border border-[var(--border-color)] bg-slate-50/60 p-2.5 dark:bg-slate-900/40">
            <PublicValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object" && depth < 6) {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => hasDisplayValue(item));
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, item]) => (
          <div key={key} className="rounded-md border border-[var(--border-color)] bg-white p-2.5 dark:bg-slate-950/40">
            <p className="mb-1 text-[11px] font-medium text-[var(--muted-foreground)]">{publicFieldLabel(key)}</p>
            <div className="text-sm font-medium"><PublicValue value={item} depth={depth + 1} /></div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="whitespace-pre-wrap break-all">{JSON.stringify(value)}</span>;
}

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
  const [copied, setCopied] = useState(false);

  const selectedDistrict = districts.find((d) => d.BBS_CODE === district);
  const selectedUpazila = upazilas.find((u) => u.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((s) => String(s.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((m) => String(m.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;
  const searchFilters = { khatianNo: khatianNo.trim() || undefined, owner: owner.trim() || undefined, dagNumber: dagNumber.trim() || undefined };

  const additionalRecordEntries = useMemo(
    () => Object.entries(selectedKhatian?.PUBLIC_RECORD ?? {})
      .filter(([key, value]) => !PRIMARY_RECORD_KEYS.has(key) && hasDisplayValue(value))
      .sort(([a], [b]) => a.localeCompare(b)),
    [selectedKhatian],
  );

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
    setCopied(false);
    setSelectedKhatian(null);
    setDetailsOpen(true);
    void loadKhatian(surveyKey, id);
  };

  const copyCompleteRecord = async () => {
    if (!selectedKhatian) return;
    const record = selectedKhatian.PUBLIC_RECORD ?? selectedKhatian;
    try {
      await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
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
        description="বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা নির্বাচন করে সরকারি DLRMS-এর প্রকাশিত খতিয়ান তথ্য দেখুন।"
        pattern="grid"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>অনুসন্ধানের তথ্য</CardTitle>
            <CardDescription>
              খতিয়ান নম্বরের পাশাপাশি মালিকের নাম বা দাগ নম্বর দিয়েও অধিকতর অনুসন্ধান করতে পারবেন।
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select label="১. বিভাগ" value={division} onChange={(e) => handleDivisionChange(e.target.value)} options={[{ value: "", label: empty }, ...divisions.map((d) => ({ value: d.BBS_CODE, label: d.NAME }))]} loading={loading.divisions} />
              <Select label="২. জেলা" value={district} onChange={(e) => handleDistrictChange(e.target.value)} options={[{ value: "", label: empty }, ...districts.map((d) => ({ value: d.BBS_CODE, label: d.NAME }))]} loading={loading.districts} disabled={!division} />
              <Select label="৩. উপজেলা" value={upazila} onChange={(e) => handleUpazilaChange(e.target.value)} options={[{ value: "", label: empty }, ...upazilas.map((u) => ({ value: u.BBS_CODE, label: u.NAME }))]} loading={loading.upazilas} disabled={!district} />
              <Select label="৪. সার্ভে" value={surveyId} onChange={(e) => handleSurveyChange(e.target.value)} options={[{ value: "", label: empty }, ...surveyOptions]} loading={loading.surveys} disabled={!upazila} />
              <Select label="৫. মৌজা / JL" value={mouzaId} onChange={(e) => handleMouzaChange(e.target.value)} options={[{ value: "", label: empty }, ...mouzas.map((m) => ({ value: m.ID, label: `${m.MOUZA_NAME} — JL ${m.JL_NUMBER}` }))]} loading={loading.mouzas} disabled={!surveyId} />
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
              <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <button type="button" onClick={search} disabled={!selectedMouza || !surveyKey || loading.khatians} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#006a4e] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {loading.khatians ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              {loading.khatians ? "খোঁজা হচ্ছে…" : "খতিয়ান খুঁজুন"}
            </button>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>খতিয়ান সূচি</CardTitle>
            <CardDescription>{khatians ? `পৃষ্ঠা ${khatians.page}${khatians.total ? ` · মোট ${khatians.total}` : ""}` : "অনুসন্ধানের ফলাফল এখানে দেখা যাবে।"}</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {loading.khatians ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />লোড হচ্ছে…</div>
            ) : khatians ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/70">
                      <tr>
                        <th className="px-5 py-3">খতিয়ান</th>
                        <th className="px-5 py-3">মালিক</th>
                        <th className="px-5 py-3">দাগ</th>
                        <th className="px-5 py-3">মোট জমি (একর)</th>
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
                          <td className="px-5 py-3">{k.TOTAL_LAND || "—"}</td>
                          <td className="px-5 py-3">{k.GUARDIANS || "—"}</td>
                          <td className="px-5 py-3 text-right">
                            <button type="button" onClick={() => showDetails(k.ID)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-medium text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/30"><Eye size={15} /> সম্পূর্ণ তথ্য</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4">
                  <button type="button" onClick={() => goPage(page - 1)} disabled={page === 1 || loading.khatians} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"><ChevronLeft size={16} />আগের</button>
                  <span className="text-sm text-slate-500">পৃষ্ঠা {page}</span>
                  <button type="button" onClick={() => goPage(page + 1)} disabled={!khatians.hasNextPage || loading.khatians} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40">পরের<ChevronRight size={16} /></button>
                </div>
              </>
            ) : (
              <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">কোনো ফলাফল এখনো নেই।</div>
            )}
          </CardBody>
        </Card>
      </main>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
              <div>
                <DialogTitle>খতিয়ানের সম্পূর্ণ প্রকাশিত তথ্য</DialogTitle>
                <DialogDescription>সরকারি DLRMS public record থেকে সরাসরি প্রাপ্ত তথ্য</DialogDescription>
              </div>
              {selectedKhatian && (
                <button type="button" onClick={() => void copyCompleteRecord()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border-color)] px-3 text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900">
                  {copied ? <Check size={15} /> : <ClipboardCopy size={15} />}{copied ? "কপি হয়েছে" : "রেকর্ড কপি"}
                </button>
              )}
            </div>
          </DialogHeader>

          {loading.khatian ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />তথ্য লোড হচ্ছে…</div>
          ) : selectedKhatian ? (
            <div className="space-y-5">
              <section>
                <div className="mb-3 flex items-center gap-2"><Database size={17} className="text-[#006a4e]" /><h3 className="text-sm font-bold">রেকর্ড পরিচিতি ও অবস্থান</h3></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["খতিয়ান নম্বর", selectedKhatian.KHATIAN_NO], ["রেকর্ড আইডি", selectedKhatian.ID], ["খতিয়ান এন্ট্রি আইডি", selectedKhatian.KHATIAN_ENTRY_ID],
                    ["বিভাগ", selectedKhatian.DIVISION_NAME], ["জেলা", selectedKhatian.DISTRICT_NAME], ["উপজেলা/থানা", selectedKhatian.UPAZILA_NAME],
                    ["সার্ভে", selectedKhatian.SURVEY_NAME || surveyKey || "—"], ["সার্ভে আইডি", selectedKhatian.SURVEY_ID], ["মৌজা", selectedKhatian.MOUZA_NAME],
                    ["মৌজা আইডি", selectedKhatian.MOUZA_ID], ["JL নম্বর", selectedKhatian.JL_NUMBER], ["JL রেকর্ড আইডি", selectedKhatian.JL_NUMBER_ID],
                    ["মোট জমি (একর)", selectedKhatian.TOTAL_LAND], ["লক অবস্থা", selectedKhatian.IS_LOCKED ? "লক করা" : "উন্মুক্ত"],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-[var(--border-color)] p-3"><p className="text-xs text-[var(--muted-foreground)]">{label}</p><p className="mt-1 break-words font-medium">{value === 0 ? "0" : value || "—"}</p></div>
                  ))}
                </div>
              </section>

              <section className="grid gap-3">
                <div className="rounded-lg border border-[var(--border-color)] p-4"><p className="text-xs font-semibold text-[var(--muted-foreground)]">মালিক / দলিলধারী</p><p className="mt-2 whitespace-pre-wrap break-words font-medium leading-7">{selectedKhatian.OWNERS || "—"}</p></div>
                <div className="rounded-lg border border-[var(--border-color)] p-4"><p className="text-xs font-semibold text-[var(--muted-foreground)]">অভিভাবক / পিতা / স্বামী</p><p className="mt-2 whitespace-pre-wrap break-words font-medium leading-7">{selectedKhatian.GUARDIANS || "—"}</p></div>
                <div className="rounded-lg border border-[var(--border-color)] p-4"><p className="text-xs font-semibold text-[var(--muted-foreground)]">দাগ নম্বর</p><p className="mt-2 whitespace-pre-wrap break-words font-medium leading-7">{selectedKhatian.DAGS || "—"}</p></div>
              </section>

              <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="mb-3"><h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">DLRMS-এর অন্যান্য প্রকাশিত তথ্য</h3><p className="mt-1 text-xs leading-5 text-emerald-800/80 dark:text-emerald-300/80">DLRMS detail API এই রেকর্ডের জন্য অতিরিক্ত যে field বা nested data পাঠায়, সেগুলো নিচে স্বয়ংক্রিয়ভাবে দেখানো হয়।</p></div>
                {additionalRecordEntries.length ? (
                  <div className="grid gap-3">
                    {additionalRecordEntries.map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-emerald-200/80 bg-white p-3 dark:border-emerald-900/60 dark:bg-slate-950/50"><p className="mb-1.5 text-xs font-semibold text-[var(--muted-foreground)]">{publicFieldLabel(key)}</p><div className="text-sm"><PublicValue value={value} /></div></div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-white/80 px-3 py-3 text-sm text-slate-600 dark:bg-slate-950/40 dark:text-slate-300">এই রেকর্ডের public DLRMS response-এ উপরের সারাংশের বাইরে অতিরিক্ত তথ্য নেই।</p>
                )}
              </section>

              <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">পূর্ণ/সার্টিফাইড খতিয়ান কপি প্রয়োজন?</h3>
                <p className="mt-1 text-xs leading-5 text-blue-900/80 dark:text-blue-300/80">DLRMS public API কোনো field প্রকাশ না করলে LandBD সেটি অনুমান করে দেখায় না। আইনগত বা পূর্ণ অফিসিয়াল কপির জন্য সরকারি DLRMS-এ আবেদন করুন।</p>
                <a href="https://dlrms.land.gov.bd/" target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800">
                  সরকারি DLRMS-এ খুলুন <ExternalLink size={14} />
                </a>
              </section>
            </div>
          ) : (
            <div className="min-h-32 py-8 text-center text-sm text-slate-500">বিস্তারিত তথ্য পাওয়া যায়নি।</div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">LandBD এখানে DLRMS-এর public endpoint থেকে পাওয়া সম্পূর্ণ প্রকাশিত record দেখায়। এটি সার্টিফাইড/আইনগত পর্চার বিকল্প নয়; দাপ্তরিক কাজে DLRMS থেকে সার্টিফাইড কপি সংগ্রহ ও যাচাই করুন।</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
