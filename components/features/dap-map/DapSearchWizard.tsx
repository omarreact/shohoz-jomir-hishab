"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Hash,
  Database,
  Info,
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
  const { fetchLocation } = useRajukSearch();

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
      const url = new URL("/api/search/smart", window.location.origin);
      url.searchParams.append("q", dagNo.trim());
      url.searchParams.append("district", selectedDist);
      url.searchParams.append("thana", selectedThana);
      url.searchParams.append("mouza", selectedMouza);
      url.searchParams.append("type", selectedType);

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.success && json.results && json.results.length > 0) {
        const feature = json.results[0].data;
        const attributes = feature.properties || feature.metadata || {};

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
        } = attributes;

        const enhanced = {
          mDistrict: selectedDist,
          upazilaPs: selectedThana,
          mauza: selectedMouza,
          plotTypeCustom:
            selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
          ...rest,
          geometry: feature.geometry,
        };

        setSearchStatus("idle");
        onPlotSelected(enhanced);
      } else {
        setSearchStatus("error");
      }
    } catch (error) {
      console.error("Search failed", error);
      setSearchStatus("error");
    }
  };

  const isDropdownLoading = searchStatus === "loading" && !dagNo;

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

      <div className="p-4 md:p-6 bg-[var(--bg)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <label className="block text-[var(--text-primary)] text-sm font-bold mb-2">
              ৪. দাগের ধরন
            </label>
            <select
              className="w-full bg-[var(--surface)] border-2 border-[var(--text-primary)] text-[var(--text-primary)] font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/30 transition-colors shadow-sm"
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
          <div className="mt-4 fade-in visible">
            <label className="block text-[var(--text-primary)] font-bold mb-3">
              ৫. দাগ নম্বর লিখুন:
            </label>
            <div className="flex rounded-xl overflow-hidden shadow-sm border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
              <span className="bg-[var(--surface)] border-r border-[var(--border)] px-4 flex items-center justify-center">
                <Hash size={20} className="text-[var(--text-secondary)]" />
              </span>
              <input
                type="text"
                className="flex-1 bg-[var(--bg)] text-[var(--text-primary)] font-bold px-4 py-3 outline-none min-w-0"
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
                className="bg-[var(--accent)] text-[var(--bg)] font-bold px-6 py-3 disabled:opacity-50 flex items-center justify-center shrink-0"
                onClick={handleSearch}
                disabled={!dagNo.trim() || searchStatus === "loading"}
              >
                {searchStatus === "loading" ? (
                  <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin"></span>
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
          <div className="text-center text-[var(--accent)] font-bold mt-4 text-sm flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mr-2" />
            ডাটা লোড হচ্ছে...
          </div>
        )}

        {searchStatus === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 mt-4 text-sm flex items-start fade-in visible">
            <Info size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <div>
              দাগটি পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
