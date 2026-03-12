"use client";

import { useState } from "react";
import AppHeader from "@/components/shared/AppHeader";
import AdBanner from "@/components/shared/AdBanner";
import { Ruler, Map, TriangleRight, CheckCircle2, AlertTriangle, Calculator, Square, Triangle, Circle, Box, HelpCircle, Info } from "lucide-react";
import { calcRectangle, calcTriangle, calcQuadrilateral, calcPentagon, calcCircle, MeasurementResult } from "@/lib/land/geometry";
import { toBn } from "@/lib/utils";
import LatestBlogs from "../../components/shared/LatestBlogs";

type ShapeType = "rect" | "triangle" | "quad" | "pentagon" | "circle";

export default function LandMeasurementPage() {
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

  const handleInputChange = (side: keyof typeof inputs, field: "feet" | "inches", value: string) => {
    setInputs(prev => ({ ...prev, [side]: { ...prev[side], [field]: value } }));
  };

  const handleShapeChange = (newShape: ShapeType) => {
    setShape(newShape);
    setResult(null); 
  };

  const handleCalculate = () => {
    let res: MeasurementResult | null = null;
    
    if (shape === "rect") res = calcRectangle(inputs.side1, inputs.side2);
    else if (shape === "triangle") res = calcTriangle(inputs.side1, inputs.side2, inputs.side3);
    else if (shape === "quad") res = calcQuadrilateral(inputs.side1, inputs.side2, inputs.side3, inputs.side4, inputs.diag1);
    else if (shape === "pentagon") res = calcPentagon(inputs.side1, inputs.side2, inputs.side3, inputs.side4, inputs.side5, inputs.diag1, inputs.diag2);
    else if (shape === "circle") res = calcCircle(inputs.diameter);

    if (res) {
      setResult(res);
      setTimeout(() => document.getElementById("landResultSection")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const InputRow = ({ label, sideKey, icon: Icon, colorClass, subLabel }: any) => (
    <div className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between p-3 rounded-4 mb-3 border ${colorClass} bg-opacity-10`}>
      <div className="mb-2 mb-md-0">
        <div className="d-flex align-items-center fw-bold text-dark">
          <Icon size={18} className="me-2" /> {label}
        </div>
        {subLabel && <small className="text-muted" style={{ fontSize: "11px" }}>{subLabel}</small>}
      </div>
      <div className="d-flex gap-2">
        <div className="input-group input-group-sm" style={{ maxWidth: "130px" }}>
          <input type="number" className="form-control text-center fw-bold" placeholder="০" value={inputs[sideKey as keyof typeof inputs].feet} onChange={(e) => handleInputChange(sideKey as keyof typeof inputs, "feet", e.target.value)} />
          <span className="input-group-text bg-white">ফুট</span>
        </div>
        <div className="input-group input-group-sm" style={{ maxWidth: "130px" }}>
          <input type="number" className="form-control text-center fw-bold" placeholder="০" max="11" value={inputs[sideKey as keyof typeof inputs].inches} onChange={(e) => handleInputChange(sideKey as keyof typeof inputs, "inches", e.target.value)} />
          <span className="input-group-text bg-white">ইঞ্চি</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-5 fade-in">
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8">
          
          {/* ইউজার ম্যানুয়াল (Land) */}
          <div className="accordion mb-4 shadow-sm rounded-4" id="manualLand">
            <div className="accordion-item border-0 rounded-4 overflow-hidden">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-white text-primary fw-bold p-3 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapseLand">
                  <HelpCircle size={20} className="me-2" /> কীভাবে ব্যবহার করবেন? (নির্দেশিকা)
                </button>
              </h2>
              <div id="collapseLand" className="accordion-collapse collapse" data-bs-parent="#manualLand">
                <div className="accordion-body bg-light text-secondary lh-lg pt-2 pb-4">
                  <ol className="mb-0 ps-3">
                    <li className="mb-1">ওপরের ট্যাব থেকে আপনার জমির সঠিক <strong>আকৃতি</strong> বেছে নিন।</li>
                    <li className="mb-1">জমির প্রতিটি আইলের মাপ <strong>ফুট এবং ইঞ্চি</strong> আলাদা বক্সে ইনপুট দিন।</li>
                    <li className="mb-1">চতুর্ভুজের ক্ষেত্রে কর্ণ না দিলেও <strong>গড় পদ্ধতিতে</strong> হিসাব হবে। তবে ১০০% নিখুঁত মাপ পেতে কর্ণ ইনপুট দেওয়া উত্তম।</li>
                    <li><strong>ক্ষেত্রফল হিসাব করুন</strong> বাটনে ক্লিক করে ফলাফল দেখুন।</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
            <button onClick={() => handleShapeChange("rect")} className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "rect" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}>
              <Square size={16} className="me-2"/> আয়তক্ষেত্র
            </button>
            <button onClick={() => handleShapeChange("triangle")} className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "triangle" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}>
              <Triangle size={16} className="me-2"/> ত্রিভুজ
            </button>
            <button onClick={() => handleShapeChange("quad")} className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "quad" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}>
              <Box size={16} className="me-2"/> চতুর্ভুজ (৪ আইল)
            </button>
            <button onClick={() => handleShapeChange("pentagon")} className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "pentagon" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}>
              <Map size={16} className="me-2"/> পঞ্চভুজ (৫ আইল)
            </button>
            <button onClick={() => handleShapeChange("circle")} className={`btn rounded-pill px-3 fw-bold d-flex align-items-center ${shape === "circle" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}>
              <Circle size={16} className="me-2"/> বৃত্তাকার
            </button>
          </div>

          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-dark text-white p-3 text-center">
              <h5 className="fw-bold mb-0">জমি পরিমাপ ক্যালকুলেটর</h5>
            </div>
            
            <div className="card-body p-4 bg-light">
              <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border">
                
                {shape === "rect" && (
                  <>
                    <InputRow label="দৈর্ঘ্য (Length)" sideKey="side1" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="প্রস্থ (Width)" sideKey="side2" icon={Ruler} colorClass="border-warning" />
                  </>
                )}

                {shape === "triangle" && (
                  <>
                    <InputRow label="১ম বাহু" sideKey="side1" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="২য় বাহু" sideKey="side2" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="৩য় বাহু" sideKey="side3" icon={Ruler} colorClass="border-primary" />
                  </>
                )}

                {shape === "quad" && (
                  <>
                    <InputRow label="উত্তর আইল" sideKey="side1" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="দক্ষিণ আইল" sideKey="side2" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="পূর্ব আইল" sideKey="side3" icon={Ruler} colorClass="border-warning" />
                    <InputRow label="পশ্চিম আইল" sideKey="side4" icon={Ruler} colorClass="border-warning" />
                    <InputRow label="কর্ণ (Diagonal) - ঐচ্ছিক" sideKey="diag1" icon={TriangleRight} colorClass="border-success bg-success" subLabel="কর্ণ না দিলে গড় পদ্ধতিতে হিসাব হবে" />
                  </>
                )}

                {shape === "pentagon" && (
                  <>
                    <InputRow label="১ম বাহু" sideKey="side1" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="২য় বাহু" sideKey="side2" icon={Ruler} colorClass="border-primary" />
                    <InputRow label="৩য় বাহু" sideKey="side3" icon={Ruler} colorClass="border-warning" />
                    <InputRow label="৪র্থ বাহু" sideKey="side4" icon={Ruler} colorClass="border-warning" />
                    <InputRow label="৫ম বাহু" sideKey="side5" icon={Ruler} colorClass="border-warning" />
                    <div className="mt-3 pt-3 border-top">
                      <InputRow label="১ম কর্ণ" sideKey="diag1" icon={TriangleRight} colorClass="border-success bg-success" subLabel="১ম ও ৩য় কোণার সংযোগ" />
                      <InputRow label="২য় কর্ণ" sideKey="diag2" icon={TriangleRight} colorClass="border-success bg-success" subLabel="১ম ও ৪র্থ কোণার সংযোগ" />
                    </div>
                  </>
                )}

                {shape === "circle" && (
                  <InputRow label="জমির ব্যাস (Diameter)" sideKey="diameter" icon={Circle} colorClass="border-primary" subLabel="বৃত্তের একপ্রান্ত থেকে কেন্দ্র হয়ে অন্যপ্রান্তের দূরত্ব" />
                )}

              </div>

              <div className="text-center mt-4 pt-2">
                <button onClick={handleCalculate} className="btn btn-success btn-lg px-5 rounded-pill shadow fw-bold d-inline-flex align-items-center">
                  <Calculator size={20} className="me-2" /> ক্ষেত্রফল হিসাব করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div id="landResultSection" className="row justify-content-center pb-5 fade-in">
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

                {/* গড় পদ্ধতির সতর্কবার্তা */}
                {result.isAverage && (
                  <div className="bg-warning bg-opacity-10 border-bottom border-warning px-4 py-2 text-center text-dark small fw-bold d-flex align-items-center justify-content-center">
                    <Info size={16} className="me-2 text-warning" /> 
                    কর্ণ না দেওয়ায় এটি গড় পদ্ধতিতে হিসাব করা হয়েছে (আনুমানিক)। নিখুঁত হিসাবের জন্য কর্ণের মাপ দিন।
                  </div>
                )}

                <div className="card-body p-0">
                  <div className="row g-0 text-center">
                    <div className="col-6 col-md-4 border-end border-bottom p-4 bg-light">
                      <p className="text-muted small fw-bold mb-1">মোট শতাংশ (ডেসিমেল)</p>
                      <h3 className="text-success fw-bold mb-0">{toBn(result.shotok.toFixed(3))}</h3>
                    </div>
                    <div className="col-6 col-md-4 border-end border-bottom p-4">
                      <p className="text-muted small fw-bold mb-1">মোট কাঠা</p>
                      <h3 className="text-primary fw-bold mb-0">{toBn(result.katha.toFixed(3))}</h3>
                    </div>
                    <div className="col-12 col-md-4 border-bottom p-4 bg-light">
                      <p className="text-muted small fw-bold mb-1">মোট বর্গফুট (Sq. Ft)</p>
                      <h3 className="text-dark fw-bold mb-0">{toBn(result.sqFt.toFixed(2))}</h3>
                    </div>
                    <div className="col-6 border-end p-4">
                      <p className="text-muted small fw-bold mb-1">অযুতাংশ (Ojutangsho)</p>
                      <h4 className="text-warning fw-bold mb-0">{toBn(result.ojutangsho.toFixed(2))}</h4>
                    </div>
                    <div className="col-6 p-4 bg-light">
                      <p className="text-muted small fw-bold mb-1">বিঘা</p>
                      <h4 className="text-secondary fw-bold mb-0">{toBn(result.bigha.toFixed(3))}</h4>
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