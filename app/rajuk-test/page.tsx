"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Terminal,
  Search,
  Info,
  CheckCircle2,
  AlertTriangle,
  Database,
  Hash,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
const IGNORED_KEYS = [
  "objectid",
  "globalid",
  "shape",
  "st_area(shape)",
  "st_length(shape)",
  "shape.starea()",
  "shape.stlength()",
];

const engToBdNum = (str: any) => {
  if (str === null || str === undefined || str === "") return "-";
  const bdNumbers: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };
  return String(str).replace(/[0-9]/g, (w) => bdNumbers[w] || w);
};

// কলামের নাম বাংলায় দেখানোর ডিকশনারি
const keyTranslations: Record<string, string> = {
  m_district: "জেলা",
  upazila_ps: "থানা",
  mauza: "মৌজা",
  plot_type_custom: "দাগের ধরন",
  landuse: "ভূমি ব্যবহার (Landuse)",
  area_katha: "প্লট এরিয়া (কাঠা)",
  area_acre: "আয়তন (একর)",
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
  region_name_en: "অঞ্চলের নাম (ইংরেজি)",
  region_name_bn: "অঞ্চলের নাম (বাংলা)",
  jl_no: "জেএল (JL) নম্বর",
  sheet_no: "শীট নম্বর",
  plot_type: "প্লট টাইপ",
  maximum_he: "সর্বোচ্চ উচ্চতা",
  far: "ফার (FAR)",
  rajuk_zone: "রাজউক জোন",
  rajuk_subzone: "রাজউক সাবজোন",
};

export default function RajukSinglePlotTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [localCache, setLocalCache] = useState<Record<string, any>>({});

  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);

  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchDagNo, setSearchDagNo] = useState("");

  const [singlePlotData, setSinglePlotData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    initializeEngine();
    return () => unsubscribe();
  }, []);

  const addLog = (msg: string) =>
    setLogs((prev) => [`> ${engToBdNum(msg)}`, ...prev]);

  const fetchLocationData = async (where: string, outField: string) => {
    const cacheKey = `${SERVICES.LOCATION}-${where}-${outField}`;
    if (localCache[cacheKey]) return localCache[cacheKey];

    const url = new URL("/api/rajuk-proxy", window.location.origin);
    url.searchParams.append("where", where);
    url.searchParams.append("outFields", outField);
    url.searchParams.append("servicePath", SERVICES.LOCATION);

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.error) throw new Error();

      const results = data.features
        .map((f: any) => f.attributes[outField])
        .filter((v: any) => v);
      const uniqueResults = [...new Set(results)].sort();

      setLocalCache((prev) => ({ ...prev, [cacheKey]: uniqueResults }));
      return uniqueResults as string[];
    } catch (error) {
      return [];
    }
  };

  const initializeEngine = async () => {
    setIsLoading(true);
    if (isLoggedIn) addLog("সিস্টেম প্রস্তুত করা হচ্ছে...");
    const dists = await fetchLocationData("1=1", LAYER1_FIELDS.DIST);
    setDistricts(dists);
    if (isLoggedIn) addLog("সিস্টেম প্রস্তুত।");
    setIsLoading(false);
  };

  const handleDistChange = async (val: string) => {
    setSelectedDist(val);
    setThanas([]);
    setMouzas([]);
    setSelectedType("");
    setSearchDagNo("");
    setSinglePlotData(null);
    if (!val) return;
    setIsLoading(true);
    setThanas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${val}'`,
        LAYER1_FIELDS.THANA,
      ),
    );
    setIsLoading(false);
  };

  const handleThanaChange = async (val: string) => {
    setSelectedThana(val);
    setMouzas([]);
    setSelectedType("");
    setSearchDagNo("");
    setSinglePlotData(null);
    if (!val) return;
    setIsLoading(true);
    setMouzas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${selectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA,
      ),
    );
    setIsLoading(false);
  };

  const executeSmartSearch = async (servicePath: string, queries: string[]) => {
    for (const q of queries) {
      if (isLoggedIn) addLog(`চেষ্টা: ${q}`);
      const url = new URL("/api/rajuk-proxy", window.location.origin);
      url.searchParams.append("where", q);
      url.searchParams.append("outFields", "*");
      url.searchParams.append("servicePath", servicePath);
      try {
        const response = await fetch(url.toString());
        const data = await response.json();
        if (!data.error && data.features && data.features.length > 0) {
          return data.features[0].attributes;
        }
      } catch (e) {}
    }
    return null;
  };

  const handleSearchSinglePlot = async () => {
    if (!searchDagNo || !selectedType || !selectedMouza) {
      alert("তথ্যগুলো সঠিকভাবে পূরণ করুন।");
      return;
    }

    setIsLoading(true);
    setSinglePlotData(null);
    if (isLoggedIn) addLog(`দাগ নং [${searchDagNo}] খোঁজা হচ্ছে...`);

    const clean = (str: string) => str.trim().toUpperCase().replace(/'/g, "''");
    const coreMouza = clean(selectedMouza.split(" ")[0]);
    const safePlotValue = clean(searchDagNo.replace(/^RS[-\s]?/, ""));
    const isNum = /^\d+$/.test(safePlotValue);

    const queries: string[] = [];
    let servicePath = "";

    if (selectedType === "ms_plot_no") {
      servicePath = SERVICES.MS_BASE;
      queries.push(
        `UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safePlotValue}'`,
      );
      if (isNum)
        queries.push(
          `UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safePlotValue}`,
        );
      queries.push(`plot_no='${safePlotValue}'`);
    } else {
      servicePath = SERVICES.RS_BASE;
      queries.push(
        `UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='${safePlotValue}'`,
      );
      queries.push(
        `UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='RS-${safePlotValue}'`,
      );
      if (isNum)
        queries.push(
          `UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no=${safePlotValue}`,
        );
    }

    const result = await executeSmartSearch(servicePath, queries);

    if (result) {
      // API থেকে আসা ডুপ্লিকেট লোকেশন ডাটাগুলো রিমুভ করে আমাদের কাস্টম সিলেক্টেড ডাটা দিচ্ছি
      const {
        m_district,
        upazila_ps,
        mauza,
        district,
        dist_ms,
        thana_ms,
        thana,
        plot_type,
        ...restAPI
      } = result;

      // এনহ্যান্সড ডাটা: টেবিলের একদম শুরুতে এই ফিল্ডগুলো দেখাবে
      const enhancedData = {
        m_district: selectedDist,
        upazila_ps: selectedThana,
        mauza: selectedMouza,
        plot_type_custom:
          selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
        ...restAPI,
      };

      setSinglePlotData(enhancedData);
      if (isLoggedIn) addLog(`সফল! তথ্য পাওয়া গেছে।`);
    } else {
      setSinglePlotData("NOT_FOUND");
      if (isLoggedIn) addLog(`দাগটি পাওয়া যায়নি।`);
    }

    setIsLoading(false);
  };

  const formatKeyName = (key: string) => {
    const lowerKey = key.toLowerCase();
    return keyTranslations[lowerKey] || key.replace(/_/g, " ").toUpperCase();
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return "-";
    let strVal = String(value);
    const lowerKey = key.toLowerCase();

    // দাগের ধরন, জেলা, থানা ইত্যাদিতে বাংলার পরিবর্তে যেন ইংরেজি না আসে
    if (
      ["m_district", "upazila_ps", "mauza", "plot_type_custom"].includes(
        lowerKey,
      )
    ) {
      return strVal;
    }

    if (
      [
        "area_acre",
        "shape__area",
        "shape__length",
        "far",
        "area_katha",
      ].includes(lowerKey)
    ) {
      const num = parseFloat(strVal);
      if (!isNaN(num)) strVal = num.toFixed(4);
    }
    return engToBdNum(strVal);
  };

  return (
    <div className="container py-5 fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <h2 className="fw-bold text-success text-center mb-4 d-flex align-items-center justify-content-center">
            <Search size={28} className="me-2" /> রাজউক সিঙ্গেল প্লট সার্চ
          </h2>

          <div className="card shadow border-0 rounded-4 p-4 p-md-5 mb-4 bg-white">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  ১. জেলা
                </label>
                <select
                  className="form-select rounded-3 shadow-sm"
                  value={selectedDist}
                  onChange={(e) => handleDistChange(e.target.value)}
                >
                  <option value="">নির্বাচন করুন...</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {engToBdNum(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  ২. থানা
                </label>
                <select
                  className="form-select rounded-3 shadow-sm"
                  value={selectedThana}
                  onChange={(e) => handleThanaChange(e.target.value)}
                  disabled={thanas.length === 0 || isLoading}
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
                <label className="form-label small text-muted fw-bold">
                  ৩. মৌজা
                </label>
                <select
                  className="form-select rounded-3 shadow-sm"
                  value={selectedMouza}
                  onChange={(e) => {
                    setSelectedMouza(e.target.value);
                    setSinglePlotData(null);
                  }}
                  disabled={mouzas.length === 0 || isLoading}
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
                <label className="form-label small text-success fw-bold">
                  ৪. দাগের ধরন
                </label>
                <select
                  className="form-select rounded-3 border-success text-success fw-bold shadow-sm"
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setSinglePlotData(null);
                  }}
                  disabled={!selectedMouza || isLoading}
                >
                  <option value="">ধরন নির্বাচন...</option>
                  <option value="rs_plot_no">RS / সাধারণ দাগ</option>
                  <option value="ms_plot_no">MS দাগ</option>
                </select>
              </div>
              <div className="col-12 mt-4 fade-in">
                <label className="fw-bold text-dark mb-2">
                  ৫. ম্যানুয়ালি দাগ নম্বর লিখুন:
                </label>
                <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-secondary border-opacity-25">
                    <Hash size={20} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-secondary border-opacity-25"
                    placeholder="যেমন: ১২৩"
                    value={searchDagNo}
                    onChange={(e) => setSearchDagNo(e.target.value)}
                    disabled={!selectedType || isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSinglePlot();
                    }}
                  />
                  <button
                    className="btn btn-success fw-bold px-4 px-md-5"
                    onClick={handleSearchSinglePlot}
                    disabled={!searchDagNo || isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      "সার্চ করুন"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isLoggedIn && (
            <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
              <div className="card-header bg-dark text-white border-0 py-2 d-flex align-items-center">
                <Terminal size={16} className="me-2 text-success" />
                <span className="small fw-bold">সার্ভার লগ (অ্যাডমিন)</span>
              </div>
              <div
                className="card-body bg-dark text-success p-3 font-monospace"
                style={{ height: "100px", overflowY: "auto", fontSize: "12px" }}
              >
                {logs.map((log, i) => (
                  <p key={i} className="mb-1">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {singlePlotData === "NOT_FOUND" && (
            <div className="alert alert-danger shadow-sm border-0 rounded-4 d-flex align-items-center p-4">
              <AlertTriangle size={28} className="me-3 text-danger" />
              <div>
                <h5 className="fw-bold mb-1 text-danger">দাগটি পাওয়া যায়নি!</h5>
                <span className="text-dark">
                  এই মৌজায় <b>{engToBdNum(searchDagNo)}</b> নম্বরের কোনো দাগ
                  পাওয়া যায়নি।
                </span>
              </div>
            </div>
          )}

          {singlePlotData === "ERROR" && (
            <div className="alert alert-warning shadow-sm border-0 rounded-4 d-flex align-items-center p-4">
              <AlertTriangle size={28} className="me-3 text-warning" />
              <span className="fw-bold">
                সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।
              </span>
            </div>
          )}

          {singlePlotData && typeof singlePlotData === "object" && (
            <div className="card shadow-lg border-success border-2 rounded-4 overflow-hidden mt-5">
              <div className="card-header bg-success text-white py-4 text-center position-relative">
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 bg-white opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #fff 1px, transparent 1px)",
                    backgroundSize: "10px 10px",
                  }}
                ></div>
                <h4 className="fw-bolder mb-1 position-relative z-1 d-flex align-items-center justify-content-center">
                  <Database size={24} className="me-2" />
                  দাগ নং {engToBdNum(searchDagNo)} এর বিস্তারিত তথ্য
                </h4>
                <p className="mb-0 text-white-50 small position-relative z-1">
                  সরাসরি রাজউক ডাটাবেস থেকে প্রাপ্ত
                </p>
              </div>
              <div className="card-body bg-light p-3 p-md-4">
                {/* টেবিল ভিউ: 
                  এখানে ডাটার প্রথম ৪টি এলিমেন্ট (জেলা, থানা, মৌজা, দাগের ধরন) সবার উপরে থাকবে 
                */}
                <div className="table-responsive bg-white rounded-4 shadow-sm border border-light-subtle">
                  <table className="table table-hover table-bordered mb-0 align-middle">
                    <tbody>
                      {Object.entries(singlePlotData)
                        .filter(
                          ([key, value]) =>
                            value !== null &&
                            value !== "" &&
                            value !== " " &&
                            !IGNORED_KEYS.includes(key.toLowerCase()),
                        )
                        .map(([key, value]) => (
                          <tr key={key}>
                            <th
                              className="bg-light text-secondary px-3 px-md-4 py-3 align-middle text-uppercase"
                              style={{ width: "35%", fontSize: "14px" }}
                            >
                              {formatKeyName(key)}
                            </th>
                            <td
                              className="text-dark fw-bold px-3 px-md-4 py-3 align-middle"
                              style={{
                                fontSize: "15px",
                                wordBreak: "break-word",
                              }}
                            >
                              {formatValue(key, value)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-center text-muted small pt-3">
                  <Info size={14} className="me-1 mb-1" />
                  এই তথ্যটি ডিজিটাল প্রক্রিয়ায় সরাসরি রাজউক ড্যাপ (DAP) ডাটাবেস
                  থেকে সংগৃহীত।
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
