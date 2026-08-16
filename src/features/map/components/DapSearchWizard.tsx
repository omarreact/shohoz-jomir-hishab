"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Hash,
  Database,
  Info,
  X,
} from "lucide-react";
import { useRajukSearch, LAYER1_FIELDS } from "@/src/features/search/hooks/useRajukSearch";
import { engToBdNum } from "@/src/features/search/utils/formatters";

interface WizardProps {
  onPlotSelected: (plotData: any) => void;
  onMouzaSelected?: (mouza: string) => void;
}

export default function DapSearchWizard({
  onPlotSelected,
  onMouzaSelected,
}: WizardProps) {
  const { fetchLocation, smartSearch } = useRajukSearch();

  const [isExpanded, setIsExpanded] = useState(false);
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);

  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dagNo, setDagNo] = useState("");

  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  useEffect(() => {
    if (!isExpanded) return;
    (async () => {
      const dists = await fetchLocation("1=1", LAYER1_FIELDS.DIST);
      setDistricts(dists);
    })();
  }, [fetchLocation, isExpanded]);

  const handleDistChange = async (val: string) => {
    setSelectedDist(val);
    setThanas([]);
    setMouzas([]);
    setSelectedThana("");
    setSelectedMouza("");
    setSelectedType("");
    setDagNo("");
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

  const handleMouzaChange = (val: string) => {
    setSelectedMouza(val);
    setSelectedType("");
    setDagNo("");
    setSearchStatus("idle");
    if (val && onMouzaSelected) {
      onMouzaSelected(val);
    }
  };

  const handleSearch = async () => {
    if (!dagNo.trim() || !selectedType || !selectedMouza) return;

    setSearchStatus("loading");

    try {
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

        setSearchStatus("idle");
        onPlotSelected(enhanced);
        setIsExpanded(false); // Collapse on success
      } else {
        setSearchStatus("error");
      }
    } catch (error) {
      console.error("Search failed", error);
      setSearchStatus("error");
    }
  };

  const isDropdownLoading = searchStatus === "loading" && !dagNo;

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="bg-white rounded-sm shadow-sm flex items-center justify-between px-3 py-2 text-slate-500 w-full border"
        style={{ minWidth: "260px", textAlign: "left", borderColor: "#cbd5e1" }}
      >
        <span>Search Plot, Mouza (e.g...</span>
        <Search size={16} className="text-slate-500 ml-2 shrink-0" />
      </button>
    );
  }

  return (
    <div className="card-new overflow-hidden shadow-lg relative">
      <button 
        aria-label="Close search wizard"
        onClick={() => setIsExpanded(false)}
        className="absolute border-0 bg-transparent text-white cursor-pointer hover:opacity-75 transition-opacity"
        style={{ top: "10px", right: "10px", zIndex: 10 }}
      >
        <X size={20} />
      </button>
      <div className="bg-[#006a4e] text-white p-6 text-center">
        <h5 className="font-bold mb-1 flex items-center justify-center">
          <Database size={20} className="mr-2 text-yellow-300" />
          রাজউক মাস্টারপ্ল্যান (DAP) ডাটাবেস
        </h5>
        <small className="opacity-80">
          সরাসরি রাজউক সার্ভার থেকে রিয়েল-টাইম ডাটা
        </small>
      </div>

      <div className="p-6 md:p-6 bg-slate-50 dark:bg-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
              ১. জেলা
            </label>
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] transition-colors shadow-sm"
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
            <label className="block text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
              ২. থানা
            </label>
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] transition-colors shadow-sm"
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
            <label className="block text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
              ৩. মৌজা
            </label>
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] transition-colors shadow-sm"
              value={selectedMouza}
              onChange={(e) => handleMouzaChange(e.target.value)}
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
            <label className="block text-slate-900 dark:text-white text-sm font-bold mb-2">
              ৪. দাগের ধরন
            </label>
            <select
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/30 dark:focus:ring-white/30 transition-colors shadow-sm"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setDagNo("");
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
            <label className="block text-slate-900 dark:text-white font-bold mb-6">
              ৫. দাগ নম্বর লিখুন:
            </label>
            <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 focus-within:border-[#006a4e] transition-colors">
              <span className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-4 flex items-center justify-center">
                <Hash size={20} className="text-slate-500 dark:text-slate-400" />
              </span>
              <input
                type="text"
                aria-label="দাগ নম্বর লিখুন"
                className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-4 py-3 outline-none min-w-0"
                placeholder="যেমন: ১২৩ বা 123"
                value={dagNo}
                onChange={(e) => {
                  setDagNo(e.target.value);
                  setSearchStatus("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                disabled={searchStatus === "loading"}
              />
              <button
                className="bg-[#006a4e] text-white font-bold px-6 py-3 disabled:opacity-50 flex items-center justify-center shrink-0"
                onClick={handleSearch}
                disabled={!dagNo.trim() || searchStatus === "loading"}
              >
                {searchStatus === "loading" ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Search size={18} className="mr-2 hidden sm:block" /> সার্চ
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isDropdownLoading && (
          <div className="text-center text-[#006a4e] font-bold mt-6 text-sm flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-[#006a4e] border-t-transparent rounded-full animate-spin mr-2" />
            ডাটা লোড হচ্ছে...
          </div>
        )}

        {searchStatus === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-6 mt-6 text-sm flex items-start fade-in visible">
            <Info size={18} className="mr-2 shrink-0 mt-0.5" />
            <div>
              দাগটি পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
