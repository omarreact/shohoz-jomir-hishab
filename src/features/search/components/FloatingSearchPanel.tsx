"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, X, ChevronDown, Filter } from "lucide-react";
import { toBn } from "@/lib/utils";

interface FloatingSearchPanelProps {
  onPlotSelected: (plotData: any) => void;
  onMouzaSelected?: (features: any[]) => void;
}

const LAYER1_FIELDS = {
  DIST: "m_district",
  THANA: "upazila_ps",
  MOUZA: "mauza",
};

export default function FloatingSearchPanel({ onPlotSelected, onMouzaSelected }: FloatingSearchPanelProps) {
  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);
  
  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dagInput, setDagInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Mobile primarily

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
    setThanas(await fetchLocationData(`${LAYER1_FIELDS.DIST}='${val}'`, LAYER1_FIELDS.THANA));
    setLoading(false);
  };

  const onThanaChange = async (val: string) => {
    setSelectedThana(val);
    setMouzas([]);
    setSelectedType("");
    setDagInput("");
    if (!val) return;
    setLoading(true);
    setMouzas(await fetchLocationData(`${LAYER1_FIELDS.DIST}='${selectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`, LAYER1_FIELDS.MOUZA));
    setLoading(false);
  };

  const onMouzaChange = (val: string) => {
    setSelectedMouza(val);
    setSelectedType("rs_plot_no");
    setDagInput("");
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
      role="search"
      aria-label="Plot Search Panel"
      className="position-absolute z-2 bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column animate-slide-in-left"
      style={{
        top: "90px", // Below GisNavbar
        left: "20px",
        width: "340px",
        maxHeight: "calc(100vh - 120px)",
        border: "1px solid rgba(0,0,0,0.08)",
        pointerEvents: "auto",
        transition: "height 0.3s ease, transform 0.3s ease"
      }}
    >
      {/* Header */}
      <div 
        className="d-flex align-items-center justify-content-between p-3 bg-light border-bottom cursor-pointer hover-bg-light transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls="search-panel-body"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsExpanded(!isExpanded);
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <Search size={18} className="text-success" />
          <h6 className="mb-0 fw-bold">Search Plots</h6>
        </div>
        <button 
          className="btn btn-sm btn-link text-muted p-0 d-md-none transition-transform"
          aria-label={isExpanded ? "Collapse search panel" : "Expand search panel"}
          tabIndex={-1} // Handled by parent div
        >
          <ChevronDown size={20} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }} />
        </button>
      </div>

      {/* Body */}
      <div 
        id="search-panel-body"
        className={`p-3 d-flex flex-column gap-3 overflow-auto ${!isExpanded ? 'd-none d-md-flex' : ''}`}
      >
        
        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-0 fw-bold d-flex align-items-center gap-2">
            <X size={14} className="flex-shrink-0" onClick={() => setError(null)} style={{ cursor: "pointer" }} />
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="small text-muted mb-1 fw-bold">District</label>
          <select
            className="form-select form-select-sm rounded-3 bg-light border-0"
            value={selectedDist}
            onChange={(e) => onDistChange(e.target.value)}
            disabled={districts.length === 0 || loading}
          >
            <option value="">Select District</option>
            {districts.map((d) => <option key={d} value={d}>{toBn(d)}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="small text-muted mb-1 fw-bold">Upazila / Thana</label>
          <select
            className="form-select form-select-sm rounded-3 bg-light border-0"
            value={selectedThana}
            onChange={(e) => onThanaChange(e.target.value)}
            disabled={!selectedDist || loading}
          >
            <option value="">Select Upazila</option>
            {thanas.map((t) => <option key={t} value={t}>{toBn(t)}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="small text-muted mb-1 fw-bold">Mouza</label>
          <select
            className="form-select form-select-sm rounded-3 bg-light border-0"
            value={selectedMouza}
            onChange={(e) => onMouzaChange(e.target.value)}
            disabled={!selectedThana || loading}
          >
            <option value="">Select Mouza</option>
            {mouzas.map((m) => <option key={m} value={m}>{toBn(m)}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="small text-muted mb-1 fw-bold">Survey Type</label>
          <select
            className="form-select form-select-sm rounded-3 bg-light border-0 text-success fw-bold"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!selectedMouza || loading}
          >
            <option value="">Select Type</option>
            <option value="rs_plot_no">RS / General</option>
            <option value="ms_plot_no">MS Survey</option>
          </select>
        </div>

        <hr className="my-1 border-secondary opacity-25" />

        <div className="form-group">
          <label className="small text-muted mb-1 fw-bold">Plot Number</label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-0">
              <MapPin size={14} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control bg-light border-0 fw-bold"
              placeholder="e.g. 123"
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
          </div>
        </div>

        <button
          className="btn btn-success fw-bold w-100 rounded-3 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
          onClick={handleDagSearch}
          disabled={!dagInput.trim() || loading || !selectedType}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Search size={16} /> Search Plot
            </>
          )}
        </button>

      </div>
    </div>
  );
}
