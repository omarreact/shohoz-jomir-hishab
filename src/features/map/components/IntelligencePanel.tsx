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
      icon={<BrainCircuit size={18} className="text-warning" />}
      onClose={onClose}
      className="position-absolute z-3"
      style={{
        top: 20,
        left: 20,
        width: 340,
        maxHeight: "calc(100% - 40px)",
      }}
    >
      <div className="d-flex flex-column gap-3 h-100">
        <div className="mb-0">
          <div className="badge border w-100 text-start py-2 px-3 fw-normal mb-2 d-flex align-items-center" style={{ backgroundColor: "var(--card-bg-secondary)", borderColor: "var(--border-color) !important", color: "var(--text-primary)" }}>
            <MapPin size={13} className="me-2 text-danger flex-shrink-0" />
            <span className="text-truncate">
              {clickedPos.lat.toFixed(6)}, {clickedPos.lng.toFixed(6)}
            </span>
          </div>
          <div className="badge border w-100 text-start py-2 px-3 fw-normal d-flex align-items-center" style={{ backgroundColor: "var(--card-bg-secondary)", borderColor: "var(--border-color) !important", color: "var(--text-primary)" }}>
            <Layers size={13} className="me-2 text-primary flex-shrink-0" />
            উচ্চতা:{" "}
            {elevation !== null ? (
              <strong className="ms-1">{elevation} মিটার</strong>
            ) : (
              <span
                className="spinner-border spinner-border-sm ms-2 text-primary"
                style={{ width: 12, height: 12, borderWidth: 2 }}
              />
            )}
          </div>
        </div>

        {isInferring ? (
          <div className="text-center py-4 text-success">
            <div
              className="spinner-border text-success mb-2"
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            <div className="small fw-bold">GIS ডেটা বিশ্লেষণ চলছে...</div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {inferredData.rsData && (
              <div
                className="p-2 border rounded-3"
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
                  className="small fw-bold mb-1 d-flex justify-content-between align-items-center"
                  style={{ color: "#2563eb" }}
                >
                  <span>🔵 RS দাগ (নীল পলিগন)</span>
                  <Maximize2 size={12} className="opacity-50" />
                </div>
                <div className="fw-bold fs-6">
                  {inferredData.rsData.rs_plot_no ||
                    inferredData.rsData.plot_no}
                </div>
                <div className="small text-muted">
                  {inferredData.rsData.address_search}
                </div>
              </div>
            )}

            {inferredData.landuseData && (
              <div className="p-2 border rounded-3 bg-success bg-opacity-10">
                <div className="small text-muted mb-1">
                  ড্যাপ ভূমি ব্যবহার
                </div>
                <div className="fw-bold text-success">
                  {inferredData.landuseData.Landuse ||
                    inferredData.landuseData.LANDUSE}
                </div>
                {inferredData.landuseData.zone && (
                  <div className="small">
                    জোন: {inferredData.landuseData.zone}
                  </div>
                )}
                {inferredData.landuseData.maximum_he && (
                  <div className="small">
                    সর্বোচ্চ উচ্চতা: {inferredData.landuseData.maximum_he}
                  </div>
                )}
              </div>
            )}

            {inferredData.floodData && (
              <div className="p-2 border border-danger rounded-3 bg-danger bg-opacity-10">
                <div className="small text-danger fw-bold d-flex align-items-center">
                  <Waves size={13} className="me-1" /> বন্যা প্লাবন এলাকা
                </div>
                <div className="small mt-1 text-danger">
                  এই জমিটি জলাশয় বা প্লাবন জোনের আওতাভুক্ত।
                </div>
              </div>
            )}

            {!inferredData.rsData &&
              !inferredData.landuseData &&
              !inferredData.floodData && (
                <div className="text-center py-3 text-secondary small">
                  এই স্থানে কোনো ড্যাপ ডেটা পাওয়া যায়নি।
                </div>
              )}
          </div>
        )}
      </div>
    </FloatingCard>
  );
}
