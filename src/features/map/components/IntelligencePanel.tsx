import { BrainCircuit, X, MapPin, Layers, Maximize2, Waves } from "lucide-react";

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
    <div
      className="position-absolute bg-white rounded-4 shadow-lg overflow-hidden"
      style={{
        top: 20,
        left: 20,
        width: 340,
        maxHeight: "calc(100% - 40px)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <div className="bg-dark text-white p-3 d-flex align-items-center justify-content-between">
        <span className="d-flex align-items-center fw-bold">
          <BrainCircuit size={18} className="me-2 text-warning" />
          স্থান বিশ্লেষণ
        </span>
        <button
          className="btn btn-sm btn-dark border-0 p-0"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 overflow-auto" style={{ flexGrow: 1 }}>
        <div className="mb-3">
          <div className="badge bg-light text-dark border w-100 text-start py-2 px-3 fw-normal mb-2 d-flex align-items-center">
            <MapPin size={13} className="me-2 text-danger flex-shrink-0" />
            <span className="text-truncate">
              {clickedPos.lat.toFixed(6)}, {clickedPos.lng.toFixed(6)}
            </span>
          </div>
          <div className="badge bg-light text-dark border w-100 text-start py-2 px-3 fw-normal d-flex align-items-center">
            <Layers size={13} className="me-2 text-primary flex-shrink-0" />
            উচ্চতা:{" "}
            {elevation !== null ? (
              <strong className="ms-1">{elevation} মিটার</strong>
            ) : (
              <span
                className="spinner-border spinner-border-sm ms-2"
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
                <div className="text-center py-3 text-muted small">
                  এই স্থানে কোনো ড্যাপ ডেটা পাওয়া যায়নি।
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
