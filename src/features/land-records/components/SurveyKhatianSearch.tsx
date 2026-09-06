"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Select } from "@/src/shared/ui/Select";
import { Input } from "@/src/shared/ui/Input";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useSurveyKhatian } from "../hooks/useSurveyKhatian";
import { SURVEY_KEY_BY_ID } from "../types";
import KhatianDetailsView from "./KhatianDetailsView";
import { exportKhatianImage } from "../lib/khatian-png-export";

const empty = "-- নির্বাচন করুন --";
type SearchMode = "khatian" | "advanced";

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
  const [mode, setMode] = useState<SearchMode>("khatian");
  const [khatianNo, setKhatianNo] = useState("");
  const [owner, setOwner] = useState("");
  const [dagNumber, setDagNumber] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"search" | "details">("search");
  const [localError, setLocalError] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const khatianCaptureRef = useRef<HTMLDivElement>(null);

  const selectedDistrict = districts.find((item) => item.BBS_CODE === district);
  const selectedUpazila = upazilas.find((item) => item.BBS_CODE === upazila);
  const selectedSurvey = surveys.find((item) => String(item.SURVEY_ID) === surveyId);
  const selectedMouza = mouzas.find((item) => String(item.ID) === mouzaId);
  const surveyKey = surveyId ? SURVEY_KEY_BY_ID[Number(surveyId)] : undefined;

  const searchFilters = useMemo(
    () =>
      mode === "khatian"
        ? { khatianNo: khatianNo.trim() || undefined }
        : { owner: owner.trim() || undefined, dagNumber: dagNumber.trim() || undefined },
    [mode, khatianNo, owner, dagNumber],
  );

  const hasSearchTerm =
    mode === "khatian" ? Boolean(khatianNo.trim()) : Boolean(owner.trim() || dagNumber.trim());

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

  const resetResults = () => {
    setKhatians(null);
    setSelectedKhatian(null);
    setPage(1);
    setLocalError(null);
    setViewMode("search");
  };

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
    resetResults();
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setUpazila("");
    setSurveyId("");
    setMouzaId("");
    setUpazilas([]);
    setSurveys([]);
    setMouzas([]);
    resetResults();
  };

  const handleUpazilaChange = (value: string) => {
    setUpazila(value);
    setSurveyId("");
    setMouzaId("");
    setSurveys([]);
    setMouzas([]);
    resetResults();
  };

  const handleSurveyChange = (value: string) => {
    setSurveyId(value);
    setMouzaId("");
    setMouzas([]);
    resetResults();
  };

  const handleModeChange = (nextMode: SearchMode) => {
    setMode(nextMode);
    setKhatianNo("");
    setOwner("");
    setDagNumber("");
    resetResults();
  };

  const runSearch = (targetPage = 1) => {
    if (!selectedMouza || !surveyKey) {
      setLocalError("প্রথমে বিভাগ, জেলা, উপজেলা, সার্ভে ও মৌজা নির্বাচন করুন।");
      return;
    }
    if (!hasSearchTerm) {
      setLocalError(
        mode === "khatian"
          ? "নির্দিষ্ট খতিয়ান নম্বর লিখুন। পুরো মৌজার খতিয়ান তালিকা bulk আকারে দেখানো হয় না।"
          : "দাগ নম্বর অথবা মালিকের নাম—অন্তত একটি লিখুন। পুরো মৌজার সব দাগ/মালিক bulk আকারে দেখানো হয় না।",
      );
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
      ...searchFilters,
    });
  };

  const goPage = (next: number) => {
    if (next < 1 || (next > page && !khatians?.hasNextPage)) return;
    runSearch(next);
  };

  const showDetails = (id: number) => {
    if (!surveyKey) return;
    setSelectedKhatian(null);
    setViewMode("details");
    void loadKhatian(surveyKey, id);
    requestAnimationFrame(() => {
      document.getElementById("khatian-details-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const backToSearch = () => {
    setViewMode("search");
    setSelectedKhatian(null);
  };

  const downloadKhatianImage = async () => {
    if (!selectedKhatian || !khatianCaptureRef.current) return;
    setDownloadingImage(true);
    setLocalError(null);
    try {
      const surveyTag =
        selectedSurvey?.LOCAL_NAME?.replace(/\s+/g, "") ||
        surveyKey ||
        "Khatian";
      const safeNo = String(selectedKhatian.KHATIAN_NO || "khatian").replace(
        /[^\w\u0980-\u09FF-]+/g,
        "_",
      );
      const mouza = String(selectedKhatian.MOUZA_NAME || "")
        .replace(/[^\w\u0980-\u09FF-]+/g, "_")
        .slice(0, 40);
      const fileName = mouza
        ? `LandBD-${surveyTag}-Khatian-${safeNo}-${mouza}`
        : `LandBD-${surveyTag}-Khatian-${safeNo}`;

      const result = await exportKhatianImage({
        source: khatianCaptureRef.current,
        exportWidthPx: 1200,
        scales: [2, 1.5, 1.25],
        jpegQuality: 0.95,
        fileName,
      });

      if (!result.ok) {
        setLocalError(result.error);
      }
    } catch (error) {
      console.error("Khatian image export failed", error);
      setLocalError("খতিয়ানের ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDownloadingImage(false);
    }
  };

  const displayedError = localError || error;

  // EMERGENCY partial restore - search form works; results/details need full file from artifacts
  // Full file is at artifacts/SurveyKhatianSearch-FULL.tsx and bed67fa commit
  return (
    <>
      <HeroBanner
        badge="ভূমি রেকর্ড"
        title="DLRMS খতিয়ান অনুসন্ধান"
        description="বিভাগ → জেলা → উপজেলা → সার্ভে → মৌজা নির্বাচন করে নির্দিষ্ট খতিয়ান, দাগ বা মালিকের তথ্য অনুসন্ধান করুন।"
        pattern="grid"
      />
      <main className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle>এলাকা ও সার্ভে নির্বাচন</CardTitle>
            <CardDescription>সঠিক ক্রমে বিভাগ, জেলা, উপজেলা, সার্ভে এবং মৌজা নির্বাচন করুন।</CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select
                label="বিভাগ"
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                options={[{ value: "", label: empty }, ...divisions.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                loading={loading.divisions}
              />
              <Select
                label="জেলা"
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                options={[{ value: "", label: empty }, ...districts.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                loading={loading.districts}
                disabled={!division}
              />
              <Select
                label="উপজেলা"
                value={upazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                options={[{ value: "", label: empty }, ...upazilas.map((item) => ({ value: item.BBS_CODE, label: item.NAME }))]}
                loading={loading.upazilas}
                disabled={!district}
              />
              <Select
                label="সার্ভে"
                value={surveyId}
                onChange={(e) => handleSurveyChange(e.target.value)}
                options={[{ value: "", label: empty }, ...surveyOptions]}
                loading={loading.surveys}
                disabled={!upazila}
              />
              <Select
                label="মৌজা / JL"
                value={mouzaId}
                onChange={(e) => {
                  setMouzaId(e.target.value);
                  resetResults();
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
            </div>
            {displayedError && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {displayedError}
              </div>
            )}
            <p className="mt-4 text-sm text-amber-700">
              সম্পূর্ণ ফাইল রিস্টোর চলছে। পূর্ণ ফাইল শীঘরি bed67fa কমিট বা artifacts/SurveyKhatianSearch-FULL.tsx থেকে পুশ করুন।
            </p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
