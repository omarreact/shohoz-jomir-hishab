"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Search,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Database,
  Info,
  Loader,
} from "lucide-react";

// ── API Service Paths ──────────────────────────────────────────────────────────
const SERVICES = {
  LOCATION: "rajuk_db/Rajuk_dap_db/FeatureServer/1",
  RS_BASE: "rajuk_db/Rajuk_dap_db/FeatureServer/0",
  MS_BASE: "rajuk_db/Rajuk_dap_db/FeatureServer/2",
};

const LAYER1_FIELDS = {
  DIST: "m_district",
  THANA: "upazila_ps",
  MOUZA: "mauza",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const engToBdNum = (str: any): string => {
  if (str === null || str === undefined || str === "") return "-";
  const map: Record<string, string> = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
  };
  return String(str).replace(/[0-9]/g, (d) => map[d] || d);
};

const keyTranslations: Record<string, string> = {
  m_district: "জেলা",
  upazila_ps: "থানা",
  mauza: "মৌজা",
  plot_type_custom: "দাগের ধরন",
  landuse: "ভূমি ব্যবহার (Landuse)",
  area_katha: "প্লট এরিয়া (কাঠা)",
  area_acre: "আয়তন (একর)",
  remarks: "মন্তব্য",
  zone: "জোন",
  dap_zone: "ড্যাপ জোন",
  shape__area: "ভূমির পরিমাণ (Shape Area)",
  address_search: "ঠিকানা (Address)",
  rs_plot_no: "আরএস (RS) দাগ",
  ms_plot_no: "এমএস (MS) দাগ",
  plot_no: "দাগ নম্বর",
  dist_ms: "জেলা (MS)",
  thana_ms: "থানা (MS)",
  thana: "থানা",
  jl_no: "জেএল (JL) নম্বর",
  sheet_no: "শীট নম্বর",
  plot_type: "প্লট টাইপ",
  maximum_he: "সর্বোচ্চ উচ্চতা",
  far: "ফার (FAR)",
  rajuk_zone: "রাজউক জোন",
  rajuk_subzone: "রাজউক সাবজোন",
  region_name_en: "অঞ্চলের নাম (ইংরেজি)",
  region_name_bn: "অঞ্চলের নাম (বাংলা)",
};

const IGNORED_KEYS = [
  "objectid", "globalid", "shape", "st_area(shape)", "st_length(shape)",
  "shape.starea()", "shape.stlength()",
];

const formatKeyName = (key: string): string => {
  const lowerKey = key.toLowerCase();
  return keyTranslations[lowerKey] || key.replace(/_/g, " ").toUpperCase();
};

const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === "") return "-";
  let strVal = String(value);
  const lowerKey = key.toLowerCase();
  if (["m_district", "upazila_ps", "mauza", "plot_type_custom"].includes(lowerKey)) {
    return strVal;
  }
  if (["area_acre", "shape__area", "shape__length", "far", "area_katha"].includes(lowerKey)) {
    const num = parseFloat(strVal);
    if (!isNaN(num)) strVal = num.toFixed(4);
  }
  return engToBdNum(strVal);
};

// ── Props ──────────────────────────────────────────────────────────────────────
interface SmartRajukSearchProps {
  /** Called when user clicks "Use this land". Receives parsed decimal area (শতাংশ), dag no, and type. */
  onUseArea?: (decimalArea: number, dagNo: string, type: string) => void;
  /** When true, hides the full data table — just shows area summary + "Use" button. */
  compact?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SmartRajukSearch({
  onUseArea,
  compact = false,
}: SmartRajukSearchProps) {
  const [localCache, setLocalCache] = useState<Record<string, any>>({});

  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);

  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dagNo, setDagNo] = useState("");

  const [plotData, setPlotData] = useState<any | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const fetchLocation = useCallback(
    async (where: string, outField: string): Promise<string[]> => {
      const cacheKey = `${SERVICES.LOCATION}-${where}-${outField}`;
      if (localCache[cacheKey]) return localCache[cacheKey];

      const url = new URL("/api/rajuk-proxy", window.location.origin);
      url.searchParams.append("where", where);
      url.searchParams.append("outFields", outField);
      url.searchParams.append("servicePath", SERVICES.LOCATION);

      try {
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.error) throw new Error();
        const results = data.features
          .map((f: any) => f.attributes[outField])
          .filter(Boolean);
        const unique = [...new Set(results)].sort() as string[];
        setLocalCache((prev) => ({ ...prev, [cacheKey]: unique }));
        return unique;
      } catch {
        return [];
      }
    },
    [localCache]
  );

  const smartSearch = async (servicePath: string, queries: string[]): Promise<any | null> => {
    for (const q of queries) {
      const url = new URL("/api/rajuk-proxy", window.location.origin);
      url.searchParams.append("where", q);
      url.searchParams.append("outFields", "*");
      url.searchParams.append("servicePath", servicePath);
      try {
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.error && data.features && data.features.length > 0) {
          return data.features[0].attributes;
        }
      } catch { /* try next query */ }
    }
    return null;
  };

  // ── Init: load districts ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const dists = await fetchLocation("1=1", LAYER1_FIELDS.DIST);
      setDistricts(dists);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cascade handlers ─────────────────────────────────────────────────────────
  const handleDistChange = async (val: string) => {
    setSelectedDist(val);
    setThanas([]); setMouzas([]);
    setSelectedThana(""); setSelectedMouza(""); setSelectedType(""); setDagNo("");
    setPlotData(null); setSearchStatus("idle");
    if (!val) return;
    setSearchStatus("loading");
    setThanas(await fetchLocation(`${LAYER1_FIELDS.DIST}='${val}'`, LAYER1_FIELDS.THANA));
    setSearchStatus("idle");
  };

  const handleThanaChange = async (val: string) => {
    setSelectedThana(val);
    setMouzas([]);
    setSelectedMouza(""); setSelectedType(""); setDagNo("");
    setPlotData(null); setSearchStatus("idle");
    if (!val) return;
    setSearchStatus("loading");
    setMouzas(
      await fetchLocation(
        `${LAYER1_FIELDS.DIST}='${selectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA
      )
    );
    setSearchStatus("idle");
  };

  // ── Search ───────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!dagNo.trim() || !selectedType || !selectedMouza) return;

    setSearchStatus("loading");
    setPlotData(null);

    const clean = (s: string) => s.trim().toUpperCase().replace(/'/g, "''");
    const coreMouza = clean(selectedMouza.split(" ")[0]);
    const safeDag = clean(dagNo.replace(/^RS[-\s]?/, ""));
    const isNum = /^\d+$/.test(safeDag);

    const queries: string[] = [];
    let servicePath = "";

    if (selectedType === "ms_plot_no") {
      servicePath = SERVICES.MS_BASE;
      queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safeDag}'`);
      if (isNum) queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safeDag}`);
      queries.push(`plot_no='${safeDag}'`);
    } else {
      servicePath = SERVICES.RS_BASE;
      queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='${safeDag}'`);
      queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='RS-${safeDag}'`);
      if (isNum) queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no=${safeDag}`);
    }

    const result = await smartSearch(servicePath, queries);

    if (result) {
      // Inject selected location values (override API's raw location fields)
      const {
        m_district, upazila_ps, mauza, district,
        dist_ms, thana_ms, thana, plot_type,
        ...rest
      } = result;

      const enhanced = {
        m_district: selectedDist,
        upazila_ps: selectedThana,
        mauza: selectedMouza,
        plot_type_custom: selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
        ...rest,
      };

      setPlotData(enhanced);
      setSearchStatus("found");
    } else {
      setSearchStatus("not_found");
    }
  };

  // ── "Use this land" handler ──────────────────────────────────────────────────
  const handleUseArea = () => {
    if (!plotData || !onUseArea) return;

    let decimalArea = 0;
    if (selectedType === "ms_plot_no") {
      decimalArea = (plotData.area_katha || 0) * 1.65;
    } else {
      decimalArea =
        (plotData.shape__area || plotData.Shape__Area || 0) * 0.0247105;
    }

    if (decimalArea === 0) {
      alert("দুঃখিত, রাজউক সার্ভারে এই দাগের কোনো পরিমাপ দেওয়া নেই।");
      return;
    }

    onUseArea(parseFloat(decimalArea.toFixed(2)), dagNo, selectedType);
  };

  // ── Area display helper ──────────────────────────────────────────────────────
  const getAreaDisplay = (): string => {
    if (!plotData) return "-";
    if (selectedType === "ms_plot_no") {
      return engToBdNum((plotData.area_katha || 0).toFixed(2)) + " কাঠা";
    }
    return (
      engToBdNum(
        ((plotData.shape__area || plotData.Shape__Area || 0) * 0.0247105).toFixed(2)
      ) + " শতাংশ"
    );
  };

  const isDropdownLoading = searchStatus === "loading" && !plotData;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="card shadow border-0 rounded-4 overflow-hidden">
      {/* Header */}
      <div className="card-header bg-dark text-white p-3 text-center">
        <h5 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
          <Database size={20} className="me-2 text-warning" />
          রাজউক মাস্টারপ্ল্যান (DAP) ডাটাবেস
        </h5>
        <small className="text-white-50">সরাসরি রাজউক সার্ভার থেকে রিয়েল-টাইম ডাটা</small>
      </div>

      <div className="card-body p-4 bg-light">
        {/* Location Selectors */}
        <div className="row g-3 mb-3">
          {/* District */}
          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted mb-1">১. জেলা</label>
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
                <option key={d} value={d}>{engToBdNum(d)}</option>
              ))}
            </select>
          </div>

          {/* Thana */}
          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted mb-1">২. থানা</label>
            <select
              className="form-select rounded-3 shadow-sm"
              value={selectedThana}
              onChange={(e) => handleThanaChange(e.target.value)}
              disabled={thanas.length === 0 || isDropdownLoading}
            >
              <option value="">নির্বাচন করুন...</option>
              {thanas.map((t) => (
                <option key={t} value={t}>{engToBdNum(t)}</option>
              ))}
            </select>
          </div>

          {/* Mouza */}
          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted mb-1">৩. মৌজা</label>
            <select
              className="form-select rounded-3 shadow-sm"
              value={selectedMouza}
              onChange={(e) => {
                setSelectedMouza(e.target.value);
                setSelectedType(""); setDagNo("");
                setPlotData(null); setSearchStatus("idle");
              }}
              disabled={mouzas.length === 0 || isDropdownLoading}
            >
              <option value="">নির্বাচন করুন...</option>
              {mouzas.map((m) => (
                <option key={m} value={m}>{engToBdNum(m)}</option>
              ))}
            </select>
          </div>

          {/* Plot Type */}
          <div className="col-md-6">
            <label className="form-label small fw-bold text-success mb-1">৪. দাগের ধরন</label>
            <select
              className="form-select rounded-3 border-success text-success fw-bold shadow-sm"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setDagNo(""); setPlotData(null); setSearchStatus("idle");
              }}
              disabled={!selectedMouza || isDropdownLoading}
            >
              <option value="">ধরন নির্বাচন করুন...</option>
              <option value="rs_plot_no">RS / সাধারণ দাগ</option>
              <option value="ms_plot_no">MS দাগ</option>
            </select>
          </div>
        </div>

        {/* Dag Number Input */}
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
                  setPlotData(null); setSearchStatus("idle");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
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
                  <><Search size={18} className="me-1" /> সার্চ</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading indicator for dropdowns */}
        {isDropdownLoading && (
          <div className="text-center text-success fw-bold mt-3 small">
            <span className="spinner-border spinner-border-sm me-2" />
            ডাটা লোড হচ্ছে...
          </div>
        )}

        {/* Not Found */}
        {searchStatus === "not_found" && (
          <div className="alert alert-danger shadow-sm border-0 rounded-4 d-flex align-items-center p-3 mt-4 fade-in">
            <AlertTriangle size={24} className="me-3 text-danger flex-shrink-0" />
            <div>
              <strong>দাগটি পাওয়া যায়নি!</strong>
              <div className="small text-dark mt-1">
                এই মৌজায় <strong>{engToBdNum(dagNo)}</strong> নম্বরের কোনো দাগ পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {searchStatus === "found" && plotData && (
          <div className="mt-4 fade-in">
            {/* Area Summary Card */}
            <div className="card border-success border-2 rounded-4 overflow-hidden shadow-sm">
              <div className="card-header bg-success text-white py-3 text-center">
                <h5 className="fw-bolder mb-0 d-flex align-items-center justify-content-center">
                  <MapPin size={20} className="me-2" />
                  দাগ নং {engToBdNum(dagNo)} — বিস্তারিত তথ্য
                </h5>
                <small className="text-white-50">সরাসরি রাজউক DAP ডাটাবেস থেকে প্রাপ্ত</small>
              </div>

              <div className="card-body bg-white p-3 p-md-4">
                {/* Area Highlight */}
                <div className="row g-3 text-center mb-4">
                  <div className="col-6 border-end">
                    <p className="text-muted small mb-1">মোট জমির পরিমাণ</p>
                    <h4 className="text-success fw-bold mb-0">{getAreaDisplay()}</h4>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">দাগের ধরন</p>
                    <h6 className="fw-bold mb-0 text-dark">
                      {selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ"}
                    </h6>
                  </div>
                </div>

                {/* Use Area Button — only shown if onUseArea prop is provided */}
                {onUseArea && (
                  <button
                    onClick={handleUseArea}
                    className="btn btn-dark w-100 rounded-pill fw-bold mb-3"
                  >
                    <CheckCircle2 size={18} className="me-2" />
                    এই জমি খতিয়ান হিসাবে যুক্ত করুন
                  </button>
                )}

                {/* Full data table — hidden in compact mode */}
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
                              !IGNORED_KEYS.includes(key.toLowerCase())
                          )
                          .map(([key, value]) => (
                            <tr key={key}>
                              <th
                                className="bg-light text-secondary px-3 py-2 align-middle text-uppercase"
                                style={{ width: "38%", fontSize: "13px" }}
                              >
                                {formatKeyName(key)}
                              </th>
                              <td
                                className="text-dark fw-bold px-3 py-2 align-middle"
                                style={{ fontSize: "14px", wordBreak: "break-word" }}
                              >
                                {formatValue(key, value)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-center text-muted small mt-3 pt-2 border-top">
                  <Info size={13} className="me-1 mb-1" />
                  তথ্যটি ডিজিটাল প্রক্রিয়ায় সরাসরি রাজউক DAP ডাটাবেস থেকে সংগৃহীত।
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}