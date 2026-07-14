import { MapPin, X } from "lucide-react";
import { plotClassOptionsList } from "@/lib/constants";
import { toBn } from "@/lib/utils";
import type { KhatiyanPlot } from "@/lib/types";

interface PlotsCardProps {
  plots: KhatiyanPlot[];
  onAddPlot: () => void;
  onRemovePlot: (id: number) => void;
  onUpdatePlot: (id: number, field: keyof KhatiyanPlot, value: string) => void;
}

export default function PlotsCard({
  plots,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
}: PlotsCardProps) {
  return (
    <div className="col-lg-6">
      <div className="card shadow-sm h-100 rounded-4 border-0">
        <div className="card-header bg-primary text-white p-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold d-flex align-items-center">
            <MapPin size={18} className="me-2" /> জমির দাগসমূহ
          </span>
          <button
            onClick={onAddPlot}
            className="btn btn-sm btn-light text-primary fw-bold"
          >
            + দাগ যোগ
          </button>
        </div>
        <div className="card-body bg-light p-3">
          {plots.length === 0 && (
            <div className="text-center py-4 text-muted border border-dashed rounded-3 bg-white">
              কোনো দাগ যুক্ত করা হয়নি
            </div>
          )}
          {plots.map((p, index) => (
            <div
              key={p.id}
              className="card mb-3 shadow-sm border-0 rounded-3 p-3"
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-success rounded-pill">
                  দাগ নং: {toBn(index + 1)}
                </span>
                <button
                  onClick={() => onRemovePlot(p.id)}
                  className="btn btn-sm btn-outline-danger"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Dag number inputs row */}
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label small fw-bold">সিএস/এসএ দাগ</label>
                  <input
                    type="text"
                    value={p.cs}
                    onChange={(e) => onUpdatePlot(p.id, "cs", e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="১০১"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">আরএস দাগ</label>
                  <input
                    type="text"
                    value={p.rs}
                    onChange={(e) => onUpdatePlot(p.id, "rs", e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="১০২"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">সিটি দাগ</label>
                  <input
                    type="text"
                    value={p.city}
                    onChange={(e) => onUpdatePlot(p.id, "city", e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="১০৩"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">বিডিএস দাগ</label>
                  <input
                    type="text"
                    value={p.bds}
                    onChange={(e) => onUpdatePlot(p.id, "bds", e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="১০৪"
                  />
                </div>
              </div>

              {/* শ্রেণী and জমি row */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small fw-bold">শ্রেণী</label>
                  <select
                    value={p.t}
                    onChange={(e) => onUpdatePlot(p.id, "t", e.target.value)}
                    className="form-select form-select-sm"
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
                  <label className="form-label small fw-bold">
                    দাগের মোট জমি (শতাংশ)
                  </label>
                  <input
                    type="text"
                    value={p.a}
                    onChange={(e) => onUpdatePlot(p.id, "a", e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="০.০০"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
