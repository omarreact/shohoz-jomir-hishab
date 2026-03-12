import { MapPin, X } from "lucide-react";
import { plotClassOptionsList } from "@/lib/constants";

// সমাধান: এখানে শুধু `: any` যুক্ত করা হয়েছে
export default function PlotsCard({
  plots,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
}: any) {
  return (
    <div className="col-lg-6">
      <div className="card shadow-sm h-100 rounded-4 overflow-hidden border-0">
        <div className="card-header bg-dark text-white p-3 d-flex justify-content-between align-items-center">
          <span className="fw-semibold d-flex align-items-center">
            <MapPin size={18} className="me-2" /> ১. জমির দাগসমূহ
          </span>
          <button
            onClick={onAddPlot}
            className="btn btn-sm btn-outline-light rounded-3"
          >
            + দাগ যোগ
          </button>
        </div>
        <div className="card-body bg-light p-3">
          {plots.length === 0 && (
            <div className="text-center py-5 text-muted fst-italic border rounded-3 bg-white">
              কোনো দাগ যুক্ত করা হয়নি
            </div>
          )}
          {plots.map((p: any) => (
            <div
              key={p.id}
              className="card mb-3 shadow-sm border-start border-success position-relative"
            >
              <button
                onClick={() => onRemovePlot(p.id)}
                className="btn btn-sm btn-light text-danger position-absolute top-0 end-0 m-2 rounded-circle p-1"
                style={{ zIndex: 10 }}
              >
                <X size={16} />
              </button>
              <div className="card-body p-3">
                <div className="row g-2 mb-3">
                  <div className="col-6 col-md-3">
                    <label
                      className="form-label text-muted small fw-bold mb-1"
                      style={{ fontSize: "11px" }}
                    >
                      সিএস/এসএ দাগ
                    </label>
                    <input
                      type="text"
                      value={p.cs}
                      onChange={(e) => onUpdatePlot(p.id, "cs", e.target.value)}
                      className="form-control form-control-sm bg-light"
                      placeholder="১০১"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label
                      className="form-label text-muted small fw-bold mb-1"
                      style={{ fontSize: "11px" }}
                    >
                      আরএস দাগ
                    </label>
                    <input
                      type="text"
                      value={p.rs}
                      onChange={(e) => onUpdatePlot(p.id, "rs", e.target.value)}
                      className="form-control form-control-sm bg-light"
                      placeholder="১০২"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label
                      className="form-label text-muted small fw-bold mb-1"
                      style={{ fontSize: "11px" }}
                    >
                      সিটি দাগ
                    </label>
                    <input
                      type="text"
                      value={p.city}
                      onChange={(e) =>
                        onUpdatePlot(p.id, "city", e.target.value)
                      }
                      className="form-control form-control-sm bg-light"
                      placeholder="১০৩"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label
                      className="form-label text-muted small fw-bold mb-1"
                      style={{ fontSize: "11px" }}
                    >
                      বিডিএস দাগ
                    </label>
                    <input
                      type="text"
                      value={p.bds}
                      onChange={(e) =>
                        onUpdatePlot(p.id, "bds", e.target.value)
                      }
                      className="form-control form-control-sm bg-light"
                      placeholder="১০৪"
                    />
                  </div>
                </div>
                <div className="row g-2 pt-2 border-top">
                  <div className="col-6">
                    <label
                      className="form-label text-muted small fw-bold mb-1"
                      style={{ fontSize: "11px" }}
                    >
                      শ্রেণী
                    </label>
                    <select
                      value={p.t}
                      onChange={(e) =>
                        onUpdatePlot(p.id, "t", e.target.value)
                      }
                      className="form-select form-select-sm bg-light"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {plotClassOptionsList.map((c: string) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label
                      className="form-label text-muted small fw-bold mb-1"
                      style={{ fontSize: "11px" }}
                    >
                      দাগের মোট জমি (শতাংশ)
                    </label>
                    <input
                      type="text"
                      value={p.a}
                      onChange={(e) =>
                        onUpdatePlot(p.id, "a", e.target.value)
                      }
                      className="form-control form-control-sm bg-light"
                      placeholder="০.০০"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}