"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/shared/AppHeader";
import AdBanner from "@/components/shared/AdBanner";
import {
  Ruler,
  Map,
  TriangleRight,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Square,
  Triangle,
  Circle,
  Box,
  Info,
  Database,
} from "lucide-react";
import {
  calcRectangle,
  calcTriangle,
  calcQuadrilateral,
  calcPentagon,
  calcCircle,
  MeasurementResult,
} from "@/lib/land/geometry";
import { toBn } from "@/lib/utils";
import LatestBlogs from "../../components/shared/LatestBlogs";

type ShapeType = "rect" | "triangle" | "quad" | "pentagon" | "circle";

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

export default function LandMeasurementPage() {
  const [mode, setMode] = useState<"manual" | "rajuk">("manual");
  const [shape, setShape] = useState<ShapeType>("quad");
  const [result, setResult] = useState<MeasurementResult | null>(null);

  const [inputs, setInputs] = useState({
    side1: { feet: "", inches: "" },
    side2: { feet: "", inches: "" },
    side3: { feet: "", inches: "" },
    side4: { feet: "", inches: "" },
    side5: { feet: "", inches: "" },
    diag1: { feet: "", inches: "" },
    diag2: { feet: "", inches: "" },
    diameter: { feet: "", inches: "" },
  });

  const [rDistricts, setRDistricts] = useState<string[]>([]);
  const [rThanas, setRThanas] = useState<string[]>([]);
  const [rMouzas, setRMouzas] = useState<string[]>([]);
  const [rSelectedDist, setRSelectedDist] = useState("");
  const [rSelectedThana, setRSelectedThana] = useState("");
  const [rSelectedMouza, setRSelectedMouza] = useState("");
  const [rSelectedType, setRSelectedType] = useState("");
  const [rDagInput, setRDagInput] = useState("");
  const [rLoading, setRLoading] = useState(false);

  useEffect(() => {
    initRajuk();
  }, []);

  const fetchLocationData = async (where: string, outField: string) => {
    try {
      const url = new URL("/api/unified", window.location.origin);
      url.searchParams.append("include", "location");
      url.searchParams.append("where", where);
      url.searchParams.append("outFields", outField);
      url.searchParams.append("returnGeometry", "false");
      url.searchParams.append("limit", "2000");

      const res = await fetch(url.toString());
      const json = await res.json();
      if (!json.success || !json.data.location) throw new Error();
      const camelOutField = outField.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
      const results = json.data.location
        .map((f: any) => f.properties[camelOutField] || f.properties[outField])
        .filter(Boolean);
      return [...new Set(results)].sort() as string[];
    } catch (e) {
      return [];
    }
  };

  const initRajuk = async () => {
    try {
      setRDistricts(await fetchLocationData("1=1", LAYER1_FIELDS.DIST));
    } catch (e) {}
  };

  const onRDistChange = async (val: string) => {
    setRSelectedDist(val);
    setRThanas([]);
    setRMouzas([]);
    setRSelectedType("");
    setRDagInput("");
    setResult(null);
    if (!val) return;
    setRLoading(true);
    setRThanas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${val}'`,
        LAYER1_FIELDS.THANA,
      ),
    );
    setRLoading(false);
  };

  const onRThanaChange = async (val: string) => {
    setRSelectedThana(val);
    setRMouzas([]);
    setRSelectedType("");
    setRDagInput("");
    setResult(null);
    if (!val) return;
    setRLoading(true);
    setRMouzas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${rSelectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA,
      ),
    );
    setRLoading(false);
  };

  const onRTypeChange = (val: string) => {
    setRSelectedType(val);
    setRDagInput("");
    setResult(null);
  };

  const handleDagSearch = async () => {
    const val = rDagInput.trim();
    if (!val || !rSelectedType || !rSelectedMouza) return;
    setRLoading(true);
    setResult(null);

    const clean = (str: string) => str.trim().toUpperCase().replace(/'/g, "''");
    const coreMouza = clean(rSelectedMouza.split(" ")[0]);
    const safePlotValue = clean(val.replace(/^RS[-\s]?/, ""));
    const isNum = /^\d+$/.test(safePlotValue);

    const queries: string[] = [];
    let targetLayer: "msPlots" | "plots" = "plots";

    if (rSelectedType === "ms_plot_no") {
      targetLayer = "msPlots";
      queries.push(
        `UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safePlotValue}'`,
      );
      if (isNum)
        queries.push(
          `UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safePlotValue}`,
        );
      queries.push(`plot_no='${safePlotValue}'`);
    } else {
      targetLayer = "plots";
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

    const executeQueries = async (layer: "msPlots" | "plots", qList: string[]) => {
      for (const q of qList) {
        const url = new URL("/api/unified", window.location.origin);
        url.searchParams.append("include", layer);
        url.searchParams.append("where", q);
        url.searchParams.append("limit", "1");
        try {
          const res = await fetch(url.toString());
          const json = await res.json();
          if (json.success && json.data[layer] && json.data[layer].length > 0)
            return json.data[layer][0].properties;
        } catch (e) {}
      }
      return null;
    };

    const details = await executeQueries(targetLayer, queries);

    if (details) {
      const rawArea =
        rSelectedType === "ms_plot_no"
          ? details.areaKatha || 0
          : details.area || 0;

      let sqft = 0;
      if (rSelectedType === "ms_plot_no") {
        sqft = rawArea * 720;
      } else {
        const sqMeters = rawArea;
        sqft = sqMeters * 10.7639;
      }
      
      if (sqft === 0) {
        setResult({
          isValid: false,
          errorMsg: "সার্ভারে এই দাগের কোনো পরিমাপ দেওয়া নেই!",
          shotok: 0,
          katha: 0,
          sqFt: 0,
          ojutangsho: 0,
          bigha: 0,
          acre: 0,
          isAverage: false,
        });
      } else {
        const decimal =
          rSelectedType === "ms_plot_no" ? rawArea * 1.65 : rawArea * 0.0247105;
        setResult({
          isValid: true,
          shotok: decimal,
          katha: decimal / 1.65,
          sqFt: decimal * 435.6,
          ojutangsho: decimal * 100,
          bigha: decimal / 33,
          acre: (decimal * 435.6) / 43560,
          isAverage: false,
        });
      }
      setTimeout(
        () =>
          document
            .getElementById("landResultSection")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
    setRLoading(false);
  };

  const handleInputChange = (
    side: keyof typeof inputs,
    field: "feet" | "inches",
    value: string,
  ) =>
    setInputs((prev) => ({
      ...prev,
      [side]: { ...prev[side], [field]: value },
    }));
  const handleShapeChange = (newShape: ShapeType) => {
    setShape(newShape);
    setResult(null);
  };

  const handleCalculate = () => {
    let res: MeasurementResult | null = null;
    if (shape === "rect") res = calcRectangle(inputs.side1, inputs.side2);
    else if (shape === "triangle")
      res = calcTriangle(inputs.side1, inputs.side2, inputs.side3);
    else if (shape === "quad")
      res = calcQuadrilateral(
        inputs.side1,
        inputs.side2,
        inputs.side3,
        inputs.side4,
        inputs.diag1,
      );
    else if (shape === "pentagon")
      res = calcPentagon(
        inputs.side1,
        inputs.side2,
        inputs.side3,
        inputs.side4,
        inputs.side5,
        inputs.diag1,
        inputs.diag2,
      );
    else if (shape === "circle") res = calcCircle(inputs.diameter);
    if (res) {
      setResult(res);
      setTimeout(
        () =>
          document
            .getElementById("landResultSection")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  };

  const InputRow = ({
    label,
    sideKey,
    icon: Icon,
    colorClass,
    subLabel,
  }: any) => (
    <div
      className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between p-3 rounded-4 mb-3 border ${colorClass} bg-opacity-10`}
    >
      <div className="mb-2 mb-md-0">
        <div className="d-flex align-items-center fw-bold text-dark">
          <Icon size={18} className="me-2" /> {label}
        </div>
        {subLabel && (
          <small className="text-muted" style={{ fontSize: "11px" }}>
            {subLabel}
          </small>
        )}
      </div>
      <div className="d-flex gap-2">
        <div
          className="input-group input-group-sm"
          style={{ maxWidth: "130px" }}
        >
          <input
            type="number"
            className="form-control text-center fw-bold"
            placeholder="০"
            value={inputs[sideKey as keyof typeof inputs].feet}
            onChange={(e) =>
              handleInputChange(
                sideKey as keyof typeof inputs,
                "feet",
                e.target.value,
              )
            }
          />
          <span className="input-group-text bg-white">ফুট</span>
        </div>
        <div
          className="input-group input-group-sm"
          style={{ maxWidth: "130px" }}
        >
          <input
            type="number"
            className="form-control text-center fw-bold"
            placeholder="০"
            max="11"
            value={inputs[sideKey as keyof typeof inputs].inches}
            onChange={(e) =>
              handleInputChange(
                sideKey as keyof typeof inputs,
                "inches",
                e.target.value,
              )
            }
          />
          <span className="input-group-text bg-white">ইঞ্চি</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-5 fade-in">
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8">
          <div className="d-flex justify-content-center mb-4">
            <div className="bg-white p-1 rounded-pill shadow-sm border d-inline-flex">
              <button
                onClick={() => setMode("manual")}
                className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ${mode === "manual" ? "btn-success shadow-sm" : "btn-light text-secondary"}`}
              >
                <Ruler size={18} className="me-2" /> ম্যানুয়াল পরিমাপ
              </button>
              <button
                onClick={() => setMode("rajuk")}
                className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ms-2 ${mode === "rajuk" ? "btn-dark shadow-sm" : "btn-light text-secondary"}`}
              >
                <Database size={18} className="me-2 text-warning" /> রাজউক অটো
                পরিমাপ
              </button>
            </div>
          </div>

          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-dark text-white p-3 text-center">
              <h5 className="fw-bold mb-0">জমি পরিমাপ ক্যালকুলেটর</h5>
            </div>

            <div className="card-body p-4 bg-light">
              {mode === "rajuk" ? (
                <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border fade-in">
                  <h6 className="fw-bold text-success mb-3 text-center">
                    রাজউকের ম্যাপ থেকে সরাসরি দাগের মাপ বের করুন
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <select
                        className="form-select rounded-pill"
                        value={rSelectedDist}
                        onChange={(e) => onRDistChange(e.target.value)}
                        disabled={rDistricts.length === 0}
                      >
                        <option value="">১. জেলা...</option>
                        {rDistricts.map((d) => (
                          <option key={d} value={d}>
                            {toBn(d)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select rounded-pill"
                        value={rSelectedThana}
                        onChange={(e) => onRThanaChange(e.target.value)}
                        disabled={rThanas.length === 0 || rLoading}
                      >
                        <option value="">২. থানা...</option>
                        {rThanas.map((t) => (
                          <option key={t} value={t}>
                            {toBn(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select rounded-pill"
                        value={rSelectedMouza}
                        onChange={(e) => {
                          setRSelectedMouza(e.target.value);
                          setRSelectedType("");
                          setRDagInput("");
                          setResult(null);
                        }}
                        disabled={rMouzas.length === 0 || rLoading}
                      >
                        <option value="">৩. মৌজা...</option>
                        {rMouzas.map((m) => (
                          <option key={m} value={m}>
                            {toBn(m)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select rounded-pill text-success fw-bold"
                        value={rSelectedType}
                        onChange={(e) => onRTypeChange(e.target.value)}
                        disabled={!rSelectedMouza || rLoading}
                      >
                        <option value="">৪. দাগের ধরন...</option>
                        <option value="rs_plot_no">RS দাগ</option>
                        <option value="ms_plot_no">MS দাগ</option>
                      </select>
                    </div>

                    {rSelectedType && (
                      <div className="col-12 mt-3 fade-in">
                        <label className="fw-bold text-dark mb-2 text-center w-100">
                          ৫. দাগ নম্বর লিখুন:
                        </label>
                        <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                          <input
                            type="text"
                            className="form-control border-dark border-opacity-25 text-center fw-bold"
                            placeholder="যেমন: ১২৩ বা 123"
                            value={rDagInput}
                            onChange={(e) => { setRDagInput(e.target.value); setResult(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleDagSearch(); }}
                            disabled={rLoading}
                          />
                          <button
                            className="btn btn-success fw-bold px-4"
                            onClick={handleDagSearch}
                            disabled={!rDagInput.trim() || rLoading}
                          >
                            {rLoading
                              ? <span className="spinner-border spinner-border-sm" />
                              : "সার্চ"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {rLoading && (
                    <div className="text-center text-success fw-bold mt-3">
                      <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                      ডাটা আনা হচ্ছে...
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                    <button
                      onClick={() => handleShapeChange("rect")}
                      className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "rect" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                    >
                      <Square size={16} className="me-2" /> আয়তক্ষেত্র
                    </button>
                    <button
                      onClick={() => handleShapeChange("triangle")}
                      className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "triangle" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                    >
                      <Triangle size={16} className="me-2" /> ত্রিভুজ
                    </button>
                    <button
                      onClick={() => handleShapeChange("quad")}
                      className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "quad" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                    >
                      <Box size={16} className="me-2" /> চতুর্ভুজ
                    </button>
                    <button
                      onClick={() => handleShapeChange("pentagon")}
                      className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "pentagon" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                    >
                      <Map size={16} className="me-2" /> পঞ্চভুজ
                    </button>
                    <button
                      onClick={() => handleShapeChange("circle")}
                      className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "circle" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                    >
                      <Circle size={16} className="me-2" /> বৃত্তাকার
                    </button>
                  </div>
                  <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border">
                    {shape === "rect" && (
                      <>
                        <InputRow
                          label="দৈর্ঘ্য"
                          sideKey="side1"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="প্রস্থ"
                          sideKey="side2"
                          icon={Ruler}
                          colorClass="border-warning"
                        />
                      </>
                    )}
                    {shape === "triangle" && (
                      <>
                        <InputRow
                          label="১ম বাহু"
                          sideKey="side1"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="২য় বাহু"
                          sideKey="side2"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="৩য় বাহু"
                          sideKey="side3"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                      </>
                    )}
                    {shape === "quad" && (
                      <>
                        <InputRow
                          label="উত্তর আইল"
                          sideKey="side1"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="দক্ষিণ আইল"
                          sideKey="side2"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="পূর্ব আইল"
                          sideKey="side3"
                          icon={Ruler}
                          colorClass="border-warning"
                        />
                        <InputRow
                          label="পশ্চিম আইল"
                          sideKey="side4"
                          icon={Ruler}
                          colorClass="border-warning"
                        />
                        <InputRow
                          label="কর্ণ (ঐচ্ছিক)"
                          sideKey="diag1"
                          icon={TriangleRight}
                          colorClass="border-success bg-success"
                          subLabel="কর্ণ না দিলে গড় পদ্ধতিতে হিসাব হবে"
                        />
                      </>
                    )}
                    {shape === "pentagon" && (
                      <>
                        <InputRow
                          label="১ম বাহু"
                          sideKey="side1"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="২য় বাহু"
                          sideKey="side2"
                          icon={Ruler}
                          colorClass="border-primary"
                        />
                        <InputRow
                          label="৩য় বাহু"
                          sideKey="side3"
                          icon={Ruler}
                          colorClass="border-warning"
                        />
                        <InputRow
                          label="৪র্থ বাহু"
                          sideKey="side4"
                          icon={Ruler}
                          colorClass="border-warning"
                        />
                        <InputRow
                          label="৫ম বাহু"
                          sideKey="side5"
                          icon={Ruler}
                          colorClass="border-warning"
                        />
                        <div className="mt-3 pt-3 border-top">
                          <InputRow
                            label="১ম কর্ণ"
                            sideKey="diag1"
                            icon={TriangleRight}
                            colorClass="border-success bg-success"
                            subLabel="১ম ও ৩য় কোণার সংযোগ"
                          />
                          <InputRow
                            label="২য় কর্ণ"
                            sideKey="diag2"
                            icon={TriangleRight}
                            colorClass="border-success bg-success"
                            subLabel="১ম ও ৪র্থ কোণার সংযোগ"
                          />
                        </div>
                      </>
                    )}
                    {shape === "circle" && (
                      <InputRow
                        label="ব্যাস (Diameter)"
                        sideKey="diameter"
                        icon={Circle}
                        colorClass="border-primary"
                        subLabel="একপ্রান্ত থেকে অন্যপ্রান্তের দূরত্ব"
                      />
                    )}
                  </div>
                  <div className="text-center mt-4 pt-2">
                    <button
                      onClick={handleCalculate}
                      className="btn btn-success btn-lg px-5 rounded-pill shadow fw-bold d-inline-flex align-items-center"
                    >
                      <Calculator size={20} className="me-2" /> ক্ষেত্রফল হিসাব
                      করুন
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div
          id="landResultSection"
          className="row justify-content-center pb-5 fade-in"
        >
          <div className="col-lg-8">
            {!result.isValid ? (
              <div className="alert alert-danger d-flex align-items-center p-4 rounded-4 shadow-sm">
                <AlertTriangle size={28} className="me-3 flex-shrink-0" />
                <span className="fw-bold">{result.errorMsg}</span>
              </div>
            ) : (
              <div className="card shadow border-success border-2 rounded-4 overflow-hidden">
                <div className="card-header bg-success text-white text-center py-3">
                  <h5 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
                    <CheckCircle2 className="me-2" /> পরিমাপের ফলাফল
                  </h5>
                </div>
                {result.isAverage && (
                  <div className="bg-warning bg-opacity-10 border-bottom border-warning px-4 py-2 text-center text-dark small fw-bold d-flex align-items-center justify-content-center">
                    <Info size={16} className="me-2 text-warning" /> কর্ণ না
                    দেওয়ায় এটি গড় পদ্ধতিতে হিসাব করা হয়েছে (আনুমানিক)। নিখুঁত
                    হিসাবের জন্য কর্ণের মাপ দিন।
                  </div>
                )}
                <div className="card-body p-0">
                  <div className="row g-0 text-center">
                    <div className="col-6 col-md-4 border-end border-bottom p-4 bg-light">
                      <p className="text-muted small fw-bold mb-1">
                        মোট শতাংশ (ডেসিমেল)
                      </p>
                      <h3 className="text-success fw-bold mb-0">
                        {toBn(result.shotok.toFixed(3))}
                      </h3>
                    </div>
                    <div className="col-6 col-md-4 border-end border-bottom p-4">
                      <p className="text-muted small fw-bold mb-1">মোট কাঠা</p>
                      <h3 className="text-primary fw-bold mb-0">
                        {toBn(result.katha.toFixed(3))}
                      </h3>
                    </div>
                    <div className="col-12 col-md-4 border-bottom p-4 bg-light">
                      <p className="text-muted small fw-bold mb-1">
                        মোট বর্গফুট (Sq. Ft)
                      </p>
                      <h3 className="text-dark fw-bold mb-0">
                        {toBn(result.sqFt.toFixed(2))}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <LatestBlogs />
    </div>
  );
}
