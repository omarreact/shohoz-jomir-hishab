import { BrainCircuit, MapPin, Layers, Maximize2, Waves } from "lucide-react";
import { FloatingCard } from "@/src/components/ui/gis/FloatingCard";

interface IntelligencePanelProps {
  clickedPos: { lat: number; lng: number } | null;
  elevation: number | null;
  isInferring: boolean;
  inferredData: any;
  onClose: () => void;
  onShowDetails: () => void;
}

export function IntelligencePanel({
  clickedPos,
  elevation,
  isInferring,
  inferredData,
  onClose,
  onShowDetails,
}: IntelligencePanelProps) {
  if (!clickedPos) return null;

  return (
    <FloatingCard
      title="স্থান বিশ্লেষণ"
      icon={<BrainCircuit size={18} className="text-yellow-500" />}
      onClose={onClose}
      className="absolute z-3"
      style={{
        top: 20,
        left: 20,
        width: 340,
        maxHeight: "calc(100% - 40px)",
      }}
    >
      <div className="flex flex-col gap-3 h-full">
        <div className="mb-0">
          <div className="badge border w-full text-left py-2 px-3 font-normal mb-2 flex items-center bg-slate-50 dark:bg-slate-950">
            <MapPin size={13} className="mr-2 text-red-600 shrink-0" />
            <span className="text-truncate">
              {clickedPos.lat.toFixed(6)}, {clickedPos.lng.toFixed(6)}
            </span>
          </div>
          <div className="badge border w-full text-left py-2 px-3 font-normal flex items-center bg-slate-50 dark:bg-slate-950">
            <Layers size={13} className="mr-2 text-blue-600 shrink-0" />
            উচ্চতা:{" "}
            {elevation !== null ? (
              <strong className="ml-1">{elevation} মিটার</strong>
            ) : (
              <span
                className="spinner-border spinner-border-sm ml-2 text-blue-600"
                style={{ width: 12, height: 12, borderWidth: 2 }}
              />
            )}
          </div>
        </div>

        {isInferring ? (
          <div className="text-center py-4 text-green-600">
            <div
              className="spinner-border text-green-600 mb-2"
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            <div className="text-sm font-bold">GIS ডেটা বিশ্লেষণ চলছে...</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {inferredData.rsData && (
              <div
                className="p-2 border rounded-lg"
                style={{
                  borderColor: "#3b82f6 !important",
                  background: "#eff6ff",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={onShowDetails}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                title="বিস্তারিত দেখতে ক্লিক করুন"
              >
                <div
                  className="text-sm font-bold mb-1 flex justify-between items-center"
                  style={{ color: "#2563eb" }}
                >
                  <span>🔵 RS দাগ (নীল পলিগন)</span>
                  <Maximize2 size={12} className="opacity-50" />
                </div>
                <div className="font-bold text-base">
                  {inferredData.rsData.rs_plot_no ||
                    inferredData.rsData.plot_no}
                </div>
                <div className="text-sm text-slate-500">
                  {inferredData.rsData.address_search}
                </div>
              </div>
            )}

            {inferredData.landuseData && (
              <div className="p-2 border rounded-lg bg-green-600 bg-opacity-10">
                <div className="text-sm text-slate-500 mb-1">
                  ড্যাপ ভূমি ব্যবহার
                </div>
                <div className="font-bold text-green-600">
                  {inferredData.landuseData.Landuse ||
                    inferredData.landuseData.LANDUSE}
                </div>
                {inferredData.landuseData.zone && (
                  <div className="text-sm">
                    জোন: {inferredData.landuseData.zone}
                  </div>
                )}
                {inferredData.landuseData.maximum_he && (
                  <div className="text-sm">
                    সর্বোচ্চ উচ্চতা: {inferredData.landuseData.maximum_he}
                  </div>
                )}
              </div>
            )}

            {inferredData.floodData && (
              <div className="p-2 border border-red-600 rounded-lg bg-red-600 bg-opacity-10">
                <div className="text-sm text-red-600 font-bold flex items-center">
                  <Waves size={13} className="mr-1" /> বন্যা প্লাবন এলাকা
                </div>
                <div className="text-sm mt-1 text-red-600">
                  এই জমিটি জলাশয় বা প্লাবন জোনের আওতাভুক্ত।
                </div>
              </div>
            )}

            {!inferredData.rsData &&
              !inferredData.landuseData &&
              !inferredData.floodData && (
                <div className="text-center py-3 text-slate-500 text-sm">
                  এই স্থানে কোনো ড্যাপ ডেটা পাওয়া যায়নি।
                </div>
              )}
          </div>
        )}
      </div>
    </FloatingCard>
  );
}
