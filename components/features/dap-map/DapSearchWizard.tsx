"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { toBn } from "@/lib/utils";

interface WizardProps {
  onPlotSelected: (plotData: any) => void;
  onMouzaSelected?: (features: any[]) => void;
}

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

export default function DapSearchWizard({ onPlotSelected, onMouzaSelected }: WizardProps) {
  // Location states
  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);
  
  // Selection states
  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dagInput, setDagInput] = useState("");
  
  // App states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Fetch Districts
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
      setDistricts(await fetchLocationData("1=1", LAYER1_FIELDS.DIST));
    } catch (e) {}
  };

  const onDistChange = async (val: string) => {
    setSelectedDist(val);
    setThanas([]);
    setMouzas([]);
    setSelectedType("");
    setDagInput("");
    if (!val) return;
    setLoading(true);
    setThanas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${val}'`,
        LAYER1_FIELDS.THANA,
      ),
    );
    setLoading(false);
  };

  const onThanaChange = async (val: string) => {
    setSelectedThana(val);
    setMouzas([]);
    setSelectedType("");
    setDagInput("");
    if (!val) return;
    setLoading(true);
    setMouzas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${selectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA,
      ),
    );
    setLoading(false);
  };

  const onMouzaChange = (val: string) => {
    setSelectedMouza(val);
    setSelectedType("rs_plot_no");
    setDagInput("");
    if (val) {
      // Auto-trigger type change to open map immediately (or setup UI)
      setTimeout(() => onTypeChange("rs_plot_no", val), 0);
    }
  };

  const onTypeChange = (val: string, overrideMouza?: string) => {
    setSelectedType(val);
    setDagInput("");
    setError(null);
  };

  const handleDagSearch = async () => {
    setError(null);
    const val = dagInput.trim();
    if (!val || !selectedType || !selectedMouza) return;

    setLoading(true);

    try {
      const clean = (str: string) => str.trim().toUpperCase().replace(/'/g, "''");
      const coreMouza = clean(selectedMouza.split(" ")[0]);
      const safePlotValue = clean(val.replace(/^RS[-\s]?/, ""));
      const isNum = /^\d+$/.test(safePlotValue);

      let targetLayer: "msPlots" | "plots" = "plots";
      const queries: string[] = [];

      if (selectedType === "ms_plot_no") {
        targetLayer = "msPlots";
        queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safePlotValue}'`);
        if (isNum) queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safePlotValue}`);
        queries.push(`plot_no='${safePlotValue}'`);
      } else {
        targetLayer = "plots";
        queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='${safePlotValue}'`);
        queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='RS-${safePlotValue}'`);
        if (isNum) queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no=${safePlotValue}`);
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
              return json.data[layer][0];
          } catch (e) {}
        }
        return null;
      };

      const foundPlot = await executeQueries(targetLayer, queries);

      if (foundPlot) {
        // Enhance data with location info for the map popup
        const enhancedData = {
          mDistrict: selectedDist,
          upazilaPs: selectedThana,
          mauza: selectedMouza,
          plotTypeCustom: selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
          ...foundPlot.properties,
          geometry: foundPlot.geometry,
        };
        onPlotSelected(enhancedData);
      } else {
        setError("এই দাগ নম্বরটি রাজউকের ডেটাবেসে পাওয়া যায়নি।");
      }
    } catch (e) {
      setError("সার্ভারে ত্রুটি হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="card border-0 shadow-lg rounded-4 p-3 mx-auto" 
      style={{ 
        background: "rgba(255, 255, 255, 0.85)", 
        backdropFilter: "blur(12px)", 
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.3)"
      }}
    >
      <h6 className="fw-bold text-success mb-3 text-center d-flex align-items-center justify-content-center">
        <MapPin size={18} className="me-2" />
        রাজউকের ম্যাপ থেকে সরাসরি দাগ খুঁজুন
      </h6>
      
      {error && (
        <div className="alert alert-danger py-1 px-2 small rounded-2 mb-3 text-center fw-bold">
          {error}
        </div>
      )}

      <div className="row g-2 mb-2">
        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm rounded-pill"
            value={selectedDist}
            onChange={(e) => onDistChange(e.target.value)}
            disabled={districts.length === 0}
          >
            <option value="">১. জেলা...</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {toBn(d)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm rounded-pill"
            value={selectedThana}
            onChange={(e) => onThanaChange(e.target.value)}
            disabled={thanas.length === 0 || loading}
          >
            <option value="">২. থানা...</option>
            {thanas.map((t) => (
              <option key={t} value={t}>
                {toBn(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm rounded-pill"
            value={selectedMouza}
            onChange={(e) => onMouzaChange(e.target.value)}
            disabled={mouzas.length === 0 || loading}
          >
            <option value="">৩. মৌজা...</option>
            {mouzas.map((m) => (
              <option key={m} value={m}>
                {toBn(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm rounded-pill text-success fw-bold"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            disabled={!selectedMouza || loading}
          >
            <option value="">৪. ধরন...</option>
            <option value="rs_plot_no">RS মৌজা হাই-রেজ</option>
            <option value="ms_plot_no">MS দাগ</option>
          </select>
        </div>
      </div>

      <div className="row justify-content-center mt-2 fade-in">
        <div className="col-12 col-md-8">
          <div className="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border bg-white">
            <span className="input-group-text bg-transparent border-0 fw-bold px-3">
              ৫. দাগ নম্বর:
            </span>
            <input
              type="text"
              className="form-control border-0 text-center fw-bold bg-transparent"
              placeholder="যেমন: ১২৩ বা 123"
              value={dagInput}
              onChange={(e) => {
                setDagInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDagSearch();
              }}
              disabled={loading || !selectedType}
            />
            {dagInput && (
              <button 
                className="btn btn-light px-3 border-0 text-muted" 
                onClick={() => {
                  setDagInput("");
                  setError(null);
                }}
              >
                ✕
              </button>
            )}
            <button
              className="btn btn-success fw-bold px-4 rounded-end-pill"
              onClick={handleDagSearch}
              disabled={!dagInput.trim() || loading || !selectedType}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : "সার্চ"}
            </button>
          </div>
          <div className="text-center mt-1 text-success fw-bold" style={{ fontSize: "0.75rem" }}>
            সার্চ করলে সাথে সাথেই ম্যাপ আসবে।
          </div>
        </div>
      </div>
    </div>
  );
}
