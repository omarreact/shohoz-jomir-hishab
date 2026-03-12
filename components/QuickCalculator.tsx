import { Ruler, LayoutGrid } from "lucide-react";
import { toBn } from "@/lib/utils";
import {
  anaOptions,
  gondaOptions,
  koraOptions,
  krantiOptions,
  tilOptions,
} from "@/lib/options";

export default function QuickCalculator({
  quickData,
  quickResult,
  onQuickDataChange,
  onCalculateQuick,
}: any) {
  return (
    <div className="row justify-content-center fade-in">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow rounded-4">
          <div className="card-header bg-primary text-white text-center p-3">
            <h4 className="mb-0 fw-bold">দ্রুত জমির হিসাব</h4>
            <small className="text-white-50">
              শুধুমাত্র মোট জমি দিয়ে নিজের অংশ বের করুন
            </small>
          </div>
          <div className="card-body p-4">
            <div className="mb-4">
              <label className="form-label fw-bold">
                মোট জমির পরিমাণ (শতাংশ)
              </label>
              <input
                type="text"
                value={quickData.totalLand}
                onChange={(e) =>
                  onQuickDataChange({
                    ...quickData,
                    totalLand: e.target.value,
                  })
                }
                className="form-control form-control-lg bg-light"
                placeholder="উদাহরণ: ৫০"
              />
            </div>

            <div className="bg-light p-3 rounded-3 border mb-4">
              <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">
                আপনার অংশ/হিস্যা সিলেক্ট করুন
              </h6>
              <div className="row g-2">
                <div className="col-4">
                  <label className="text-muted small mb-1">আনা</label>
                  <select
                    value={quickData.a}
                    onChange={(e) =>
                      onQuickDataChange({
                        ...quickData,
                        a: parseInt(e.target.value, 10),
                      })
                    }
                    className="form-select form-select-sm"
                  >
                    {anaOptions.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-4">
                  <label className="text-muted small mb-1">গন্ডা</label>
                  <select
                    value={quickData.g}
                    onChange={(e) =>
                      onQuickDataChange({
                        ...quickData,
                        g: parseInt(e.target.value, 10),
                      })
                    }
                    className="form-select form-select-sm"
                  >
                    {gondaOptions.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-4">
                  <label className="text-muted small mb-1">কড়া</label>
                  <select
                    value={quickData.k}
                    onChange={(e) =>
                      onQuickDataChange({
                        ...quickData,
                        k: parseInt(e.target.value, 10),
                      })
                    }
                    className="form-select form-select-sm"
                  >
                    {koraOptions.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="text-muted small mb-1">ক্রান্তি</label>
                  <select
                    value={quickData.kr}
                    onChange={(e) =>
                      onQuickDataChange({
                        ...quickData,
                        kr: parseInt(e.target.value, 10),
                      })
                    }
                    className="form-select form-select-sm"
                  >
                    {krantiOptions.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="text-muted small mb-1">তিল</label>
                  <select
                    value={quickData.ti}
                    onChange={(e) =>
                      onQuickDataChange({
                        ...quickData,
                        ti: parseInt(e.target.value, 10),
                      })
                    }
                    className="form-select form-select-sm"
                  >
                    {tilOptions.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={onCalculateQuick}
              className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
            >
              ফলাফল দেখুন
            </button>
          </div>

          {quickResult && (
            <div className="card-footer bg-success bg-opacity-10 border-success border-opacity-25 text-center p-4">
              <span className="text-success fw-bold d-block mb-2">
                আপনার প্রাপ্ত জমি
              </span>
              <h2 className="text-success fw-bold mb-3">
                {toBn(quickResult.land.toFixed(3))} শতাংশ
              </h2>
              <div className="d-flex justify-content-center gap-3">
                <span className="badge bg-white text-dark border p-2 d-flex align-items-center">
                  <Ruler size={16} className="text-success me-1" />
                  {toBn(quickResult.sqft.toFixed(1))} বর্গফুট
                </span>
                <span className="badge bg-white text-dark border p-2 d-flex align-items-center">
                  <LayoutGrid size={16} className="text-success me-1" />
                  {toBn(quickResult.katha.toFixed(2))} কাঠা
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
