"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Database,
  Info,
} from "lucide-react";
import RajukIntelligenceReport from "@/components/RajukIntelligenceReport";
import DapMiniMap from "@/components/DapMiniMap";
import { useRajukSearch, LAYER1_FIELDS } from "../hooks/useRajukSearch";
import { engToBdNum, formatKeyName, formatValue, IGNORED_KEYS } from "../utils/formatters";

interface SmartRajukSearchProps {
  onUseArea?: (decimalArea: number, dagNo: string, type: string) => void;
  compact?: boolean;
}

export default function SearchPanel({
  onUseArea,
  compact = false,
}: SmartRajukSearchProps) {
  const { fetchLocation, smartSearch } = useRajukSearch();

  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);

  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dagNo, setDagNo] = useState("");

  const [plotData, setPlotData] = useState<any | null>(null);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "found" | "not_found" | "error"
  >("idle");

  useEffect(() => {
    (async () => {
      const dists = await fetchLocation("1=1", LAYER1_FIELDS.DIST);
      setDistricts(dists);
    })();
  }, [fetchLocation]);

  const handleDistChange = async (val: string) => {
    setSelectedDist(val);
    setThanas([]);
    setMouzas([]);
    setSelectedThana("");
    setSelectedMouza("");
    setSelectedType("");
    setDagNo("");
    setPlotData(null);
    setSearchStatus("idle");
    if (!val) return;
    setSearchStatus("loading");
    setThanas(
      await fetchLocation(
        `${LAYER1_FIELDS.DIST}='${val}'`,
        LAYER1_FIELDS.THANA,
      ),
    );
    setSearchStatus("idle");
  };

  const handleThanaChange = async (val: string) => {
    setSelectedThana(val);
    setMouzas([]);
    setSelectedMouza("");
    setSelectedType("");
    setDagNo("");
    setPlotData(null);
    setSearchStatus("idle");
    if (!val) return;
    setSearchStatus("loading");
    setMouzas(
      await fetchLocation(
        `${LAYER1_FIELDS.DIST}='${selectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA,
      ),
    );
    setSearchStatus("idle");
  };

  const handleSearch = async () => {
    if (!dagNo.trim() || !selectedType || !selectedMouza) return;

    setSearchStatus("loading");
    setPlotData(null);

    const clean = (s: string) => s.trim().toUpperCase().replace(/'/g, "''");
    const coreMouza = clean(selectedMouza.split(" ")[0]);
    const safeDag = clean(dagNo.replace(/^RS[-\s]?/, ""));
    const isNum = /^\d+$/.test(safeDag);

    const queries: string[] = [];
    let targetLayer: "msPlots" | "plots" = "plots";

    if (selectedType === "ms_plot_no") {
      targetLayer = "msPlots";
      queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safeDag}'`);
      if (isNum) queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safeDag}`);
      queries.push(`plot_no='${safeDag}'`);
    } else {
      targetLayer = "plots";
      queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='${safeDag}'`);
      queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='RS-${safeDag}'`);
      if (isNum) queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no=${safeDag}`);
    }

    const result = await smartSearch(targetLayer, queries);

    if (result) {
      const {
        mDistrict,
        upazilaPs,
        mauza,
        district,
        distMs,
        thanaMs,
        thana,
        plotType,
        ...rest
      } = result.attributes;

      const enhanced = {
        mDistrict: selectedDist,
        upazilaPs: selectedThana,
        mauza: selectedMouza,
        plotTypeCustom:
          selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
        ...rest,
        geometry: result.geometry,
      };

      setPlotData(enhanced);
      setSearchStatus("found");
    } else {
      setSearchStatus("not_found");
    }
  };

  const handleUseArea = () => {
    if (!plotData || !onUseArea) return;

    let decimalArea = 0;
    if (selectedType === "ms_plot_no") {
      decimalArea = (plotData.areaKatha || 0) * 1.65;
    } else {
      decimalArea = (plotData.area || 0) * 0.0247105;
    }

    if (decimalArea === 0) {
      alert("দুঃখিত, রাজউক সার্ভারে এই দাগের কোনো পরিমাপ দেওয়া নেই।");
      return;
    }

    onUseArea(parseFloat(decimalArea.toFixed(2)), dagNo, selectedType);
  };

  const getAreaDisplay = (): string => {
    if (!plotData) return "-";
    if (selectedType === "ms_plot_no") {
      return engToBdNum((plotData.areaKatha || 0).toFixed(2)) + " কাঠা";
    }
    return (
      engToBdNum(((plotData.area || 0) * 0.0247105).toFixed(2)) + " শতাংশ"
    );
  };

  const isDropdownLoading = searchStatus === "loading" && !plotData;

  return (
    <div className="card-new overflow-hidden">
      <div className="bg-[var(--accent)] text-[var(--bg)] p-4 text-center">
        <h5 className="font-bold mb-1 flex items-center justify-center">
          <Database size={20} className="mr-2 text-yellow-300" />
          রাজউক মাস্টারপ্ল্যান (DAP) ডাটাবেস
        </h5>
        <small className="opacity-80">
          সরাসরি রাজউক সার্ভার থেকে রিয়েল-টাইম ডাটা
        </small>
      </div>

      <div className="p-6 md:p-8 bg-[var(--bg)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2">
              ১. জেলা
            </label>
            <select
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
              value={selectedDist}
              onChange={(e) => handleDistChange(e.target.value)}
              disabled={districts.length === 0}
            >
              <option value="">
                {districts.length === 0 ? "লোড হচ্ছে..." : "নির্বাচন করুন..."}
              </option>
              {districts.map((d) => (
               <option key={d} value={d}>
                  {engToBdNum(d)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2">
              ২. থানা
            </label>
            <select
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
              value={selectedThana}
              onChange={(e) => handleThanaChange(e.target.value)}
              disabled={thanas.length === 0 || isDropdownLoading}
            >
              <option value="">নির্বাচন করুন...</option>
              {thanas.map((t) => (
                <option key={t} value={t}>
                  {engToBdNum(t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2">
              ৩. মৌজা
            </label>
            <select
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
              value={selectedMouza}
              onChange={(e) => {
                setSelectedMouza(e.target.value);
                setSelectedType("");
                setDagNo("");
                setPlotData(null);
                setSearchStatus("idle");
              }}
              disabled={mouzas.length === 0 || isDropdownLoading}
            >
              <option value="">নির্বাচন করুন...</option>
              {mouzas.map((m) => (
                <option key={m} value={m}>
                  {engToBdNum(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-primary)] text-sm font-bold mb-2">
              ৪. দাগের ধরন
            </label>
            <select
              className="w-full bg-[var(--surface)] border-2 border-[var(--text-primary)] text-[var(--text-primary)] font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/30 transition-colors shadow-sm"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setDagNo("");
                setPlotData(null);
                setSearchStatus("idle");
              }}
              disabled={!selectedMouza || isDropdownLoading}
            >
              <option value="">ধরন নির্বাচন করুন...</option>
              <option value="rs_plot_no">RS / সাধারণ দাগ</option>
              <option value="ms_plot_no">MS দাগ</option>
            </select>
          </div>
        </div>

        {selectedType && (
          <div className="mt-6 fade-in visible">
            <label className="block text-[var(--text-primary)] font-bold mb-3">
              ৫. দাগ নম্বর লিখুন:
            </label>
            <div className="flex rounded-xl overflow-hidden shadow-sm border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
              <span className="bg-[var(--surface)] border-r border-[var(--border)] px-4 flex items-center justify-center">
                <Hash size={20} className="text-[var(--text-secondary)]" />
              </span>
              <input
                type="text"
                className="flex-1 bg-[var(--bg)] text-[var(--text-primary)] font-bold px-4 py-3 outline-none"
                placeholder="যেমন: ১২৩ বা 123"
                value={dagNo}
                onChange={(e) => {
                  setDagNo(e.target.value);
                  setPlotData(null);
                  setSearchStatus("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                disabled={searchStatus === "loading"}
              />
              <button
                className="bg-[var(--accent)] text-[var(--bg)] font-bold px-6 md:px-10 py-3 disabled:opacity-50 flex items-center justify-center"
                onClick={handleSearch}
                disabled={!dagNo.trim() || searchStatus === "loading"}
              >
                {searchStatus === "loading" ? (
                  <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Search size={18} className="mr-2" /> সার্চ
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isDropdownLoading && (
          <div className="text-center text-[var(--accent)] font-bold mt-6 text-sm flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mr-2" />
            ডাটা লোড হচ্ছে...
          </div>
        )}

        {searchStatus === "not_found" && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 mt-6 flex items-start fade-in visible">
            <AlertTriangle
              size={24}
              className="mr-3 flex-shrink-0 mt-0.5"
            />
            <div>
              <strong className="block mb-1">দাগটি পাওয়া যায়নি!</strong>
              <div className="text-sm">
                এই মৌজায় <strong>{engToBdNum(dagNo)}</strong> নম্বরের কোনো দাগ
                পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।
              </div>
            </div>
          </div>
        )}

        {searchStatus === "found" && plotData && (
          <div className="mt-8 fade-in visible">
            <div className="card-new overflow-hidden border-t-4 border-t-green-500">
              <div className="bg-green-500/10 border-b border-green-500/20 py-4 text-center">
                <h5 className="font-bold text-green-500 mb-1 flex items-center justify-center text-lg">
                  <MapPin size={20} className="mr-2" />
                  দাগ নং {engToBdNum(dagNo)} — বিস্তারিত তথ্য
                </h5>
                <small className="text-green-600/70 font-medium">
                  সরাসরি রাজউক DAP ডাটাবেস থেকে প্রাপ্ত
                </small>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 divide-x divide-[var(--border)] text-center mb-8 border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="p-4 bg-[var(--surface)]">
                    <p className="text-[var(--text-secondary)] text-sm font-bold mb-1">মোট জমির পরিমাণ</p>
                    <h4 className="text-[var(--accent)] font-bold text-2xl mb-0">
                      {getAreaDisplay()}
                    </h4>
                  </div>
                  <div className="p-4 bg-[var(--surface)]">
                    <p className="text-[var(--text-secondary)] text-sm font-bold mb-1">দাগের ধরন</p>
                    <h6 className="font-bold text-[var(--text-primary)] text-lg mb-0">
                      {selectedType === "rs_plot_no"
                        ? "RS / সাধারণ দাগ"
                        : "MS দাগ"}
                    </h6>
                  </div>
                </div>

                {onUseArea && (
                  <button
                    onClick={handleUseArea}
                    className="w-full bg-[var(--text-primary)] text-[var(--bg)] font-bold rounded-xl py-3.5 mb-6 flex items-center justify-center hover:scale-[1.02] transition-transform shadow-md"
                  >
                    <CheckCircle2 size={20} className="mr-2" />
                    এই জমি খতিয়ান হিসাবে যুক্ত করুন
                  </button>
                )}

                {!compact && (
                  <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden mb-6">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-[var(--border)]">
                        {Object.entries(plotData)
                          .filter(
                            ([key, value]) =>
                              value !== null &&
                              value !== "" &&
                              value !== " " &&
                              !IGNORED_KEYS.includes(key.toLowerCase()) &&
                              key !== "geometry",
                          )
                          .map(([key, value]) => {
                            let displayValue = value;
                            if (typeof value === "object") {
                              displayValue = JSON.stringify(value);
                            }
                            return (
                              <tr key={key} className="hover:bg-[var(--bg)] transition-colors">
                                <th
                                  className="py-3 px-4 text-[var(--text-secondary)] font-medium text-sm uppercase w-1/3 border-r border-[var(--border)] bg-black/5 dark:bg-white/5"
                                >
                                  {formatKeyName(key)}
                                </th>
                                <td
                                  className="py-3 px-4 text-[var(--text-primary)] font-bold text-sm break-words"
                                >
                                  {formatValue(key, displayValue)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    
                    {selectedType === "ms_plot_no" && (
                      <div className="p-4 bg-yellow-500/10 border-t border-[var(--border)] text-yellow-600 dark:text-yellow-500 text-sm">
                        <Info size={16} className="inline-block mr-1.5 mb-0.5" />
                        <strong>বিশেষ দ্রষ্টব্য:</strong> রাজউকের ডাটাবেসে MS দাগের জ্যামিতিক সীমানা (Geometry) বা ম্যাপ লাইন সংযুক্ত নেই। জ্যামিতিক সীমানা না থাকায় এই দাগটি কোন ড্যাপ জোন (Landuse), ফার (FAR) বা উচ্চতা (Height) সীমার মধ্যে পড়েছে, তা স্বয়ংক্রিয়ভাবে নির্ণয় করা সম্ভব নয়। পূর্ণাঙ্গ ড্যাপ তথ্য পেতে অনুগ্রহ করে জমিটির <strong>RS দাগ</strong> নম্বর দিয়ে সার্চ করুন।
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  <div className="h-full">
                    <RajukIntelligenceReport plotData={plotData} />
                  </div>
                  <div className="h-full">
                    <DapMiniMap plotData={plotData} />
                  </div>
                </div>

                <div className="text-center text-[var(--text-secondary)] text-sm mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-center">
                  <Info size={14} className="mr-1.5" />
                  তথ্যটি ডিজিটাল প্রক্রিয়ায় সরাসরি রাজউক DAP ডাটাবেস থেকে
                  সংগৃহীত।
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
