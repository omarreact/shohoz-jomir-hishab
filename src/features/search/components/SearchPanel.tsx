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
    <div className="card shadow border-0 rounded-4 overflow-hidden">
      <div className="card-header bg-dark text-white p-3 text-center">
        <h5 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
          <Database size={20} className="me-2 text-warning" />
          রাজউক মাস্টারপ্ল্যান (DAP) ডাটাবেস
        </h5>
        <small className="text-white-50">
          সরাসরি রাজউক সার্ভার থেকে রিয়েল-টাইম ডাটা
        </small>
      </div>

      <div className="card-body p-4 bg-light">
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted mb-1">
              ১. জেলা
            </label>
            <select
              className="form-select rounded-3 shadow-sm"
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

          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted mb-1">
              ২. থানা
            </label>
            <select
              className="form-select rounded-3 shadow-sm"
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

          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted mb-1">
              ৩. মৌজা
            </label>
            <select
              className="form-select rounded-3 shadow-sm"
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

          <div className="col-md-6">
            <label className="form-label small fw-bold text-success mb-1">
              ৪. দাগের ধরন
            </label>
            <select
              className="form-select rounded-3 border-success text-success fw-bold shadow-sm"
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
          <div className="mt-3 fade-in">
            <label className="form-label fw-bold text-dark mb-2">
              ৫. দাগ নম্বর লিখুন:
            </label>
            <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
              <span className="input-group-text bg-white border-secondary border-opacity-25">
                <Hash size={20} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-secondary border-opacity-25"
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
                className="btn btn-success fw-bold px-4 px-md-5"
                onClick={handleSearch}
                disabled={!dagNo.trim() || searchStatus === "loading"}
              >
                {searchStatus === "loading" ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <>
                    <Search size={18} className="me-1" /> সার্চ
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isDropdownLoading && (
          <div className="text-center text-success fw-bold mt-3 small">
            <span className="spinner-border spinner-border-sm me-2" />
            ডাটা লোড হচ্ছে...
          </div>
        )}

        {searchStatus === "not_found" && (
          <div className="alert alert-danger shadow-sm border-0 rounded-4 d-flex align-items-center p-3 mt-4 fade-in">
            <AlertTriangle
              size={24}
              className="me-3 text-danger flex-shrink-0"
            />
            <div>
              <strong>দাগটি পাওয়া যায়নি!</strong>
              <div className="small text-dark mt-1">
                এই মৌজায় <strong>{engToBdNum(dagNo)}</strong> নম্বরের কোনো দাগ
                পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।
              </div>
            </div>
          </div>
        )}

        {searchStatus === "found" && plotData && (
          <div className="mt-4 fade-in">
            <div className="card border-success border-2 rounded-4 overflow-hidden shadow-sm">
              <div className="card-header bg-success text-white py-3 text-center">
                <h5 className="fw-bolder mb-0 d-flex align-items-center justify-content-center">
                  <MapPin size={20} className="me-2" />
                  দাগ নং {engToBdNum(dagNo)} — বিস্তারিত তথ্য
                </h5>
                <small className="text-white-50">
                  সরাসরি রাজউক DAP ডাটাবেস থেকে প্রাপ্ত
                </small>
              </div>

              <div className="card-body bg-white p-3 p-md-4">
                <div className="row g-3 text-center mb-4">
                  <div className="col-6 border-end">
                    <p className="text-muted small mb-1">মোট জমির পরিমাণ</p>
                    <h4 className="text-success fw-bold mb-0">
                      {getAreaDisplay()}
                    </h4>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">দাগের ধরন</p>
                    <h6 className="fw-bold mb-0 text-dark">
                      {selectedType === "rs_plot_no"
                        ? "RS / সাধারণ দাগ"
                        : "MS দাগ"}
                    </h6>
                  </div>
                </div>

                {onUseArea && (
                  <button
                    onClick={handleUseArea}
                    className="btn btn-dark w-100 rounded-pill fw-bold mb-3"
                  >
                    <CheckCircle2 size={18} className="me-2" />
                    এই জমি খতিয়ান হিসাবে যুক্ত করুন
                  </button>
                )}

                {!compact && (
                  <div className="table-responsive bg-white rounded-4 shadow-sm border border-light-subtle mt-3">
                    <table className="table table-hover table-bordered mb-0 align-middle">
                      <tbody>
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
                              <tr key={key}>
                                <th
                                  className="bg-light text-secondary px-3 py-2 align-middle text-uppercase"
                                  style={{ width: "38%", fontSize: "13px" }}
                                >
                                  {formatKeyName(key)}
                                </th>
                                <td
                                  className="text-dark fw-bold px-3 py-2 align-middle"
                                  style={{
                                    fontSize: "14px",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {formatValue(key, displayValue)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    
                    {selectedType === "ms_plot_no" && (
                      <div className="p-3 bg-light border-top text-muted small">
                        <Info size={14} className="me-1 mb-1 text-warning" />
                        <strong>বিশেষ দ্রষ্টব্য:</strong> রাজউকের ডাটাবেসে MS দাগের জ্যামিতিক সীমানা (Geometry) বা ম্যাপ লাইন সংযুক্ত নেই। জ্যামিতিক সীমানা না থাকায় এই দাগটি কোন ড্যাপ জোন (Landuse), ফার (FAR) বা উচ্চতা (Height) সীমার মধ্যে পড়েছে, তা স্বয়ংক্রিয়ভাবে নির্ণয় করা সম্ভব নয়। পূর্ণাঙ্গ ড্যাপ তথ্য পেতে অনুগ্রহ করে জমিটির <strong>RS দাগ</strong> নম্বর দিয়ে সার্চ করুন।
                      </div>
                    )}
                  </div>
                )}

                <div className="row mt-4 g-3 align-items-stretch">
                  <div className="col-12 col-xl-6">
                    <RajukIntelligenceReport plotData={plotData} />
                  </div>
                  <div className="col-12 col-xl-6">
                    <DapMiniMap plotData={plotData} />
                  </div>
                </div>

                <div className="text-center text-muted small mt-4 pt-2 border-top">
                  <Info size={13} className="me-1 mb-1" />
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
