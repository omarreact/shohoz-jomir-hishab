import {
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { toBn } from "@/lib/utils";

export default function ResultSection({
  detailedResults,
  exportRef,
  onDownloadPDF,
  onDownloadExcel,
}: any) {
  if (!detailedResults) return null;

  return (
    <div id="resultSection" className="container pb-5 fade-in">
      <div className="card shadow rounded-4 overflow-hidden">
        <div className="card-header bg-dark text-white text-center py-3 no-print">
          <h5 className="mb-0 fw-bold">বন্টন নামা / হিস্যা বিবরণী</h5>
        </div>

        <div
          ref={exportRef}
          id="exportContainer"
          className="bg-white p-4 p-md-5"
        >
          <div className="text-center border-bottom pb-4 mb-4">
            <h3 className="fw-bold text-success mb-1">
              জমির পরিমাপ ও বন্টন বিবরণী
            </h3>
            <p className="text-muted mb-0">
              তারিখ: {new Date().toLocaleDateString("bn-BD")}
            </p>
          </div>

          {detailedResults.map((res: any, i: number) => (
            <div
              key={i}
              className="card owner-result-card border-secondary mb-4 shadow-sm"
            >
              <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">{res.name}</h5>
                  <small className="text-muted">{res.rel}</small>
                </div>
                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 p-2">
                  {res.shareText}
                </span>
              </div>
              <div className="card-body p-0 table-responsive">
                <table className="table table-bordered mb-0">
                  <thead className="table-light text-muted small text-center align-middle">
                    <tr>
                      <th>দাগ নং</th>
                      <th>শ্রেণী</th>
                      <th>মোট জমি</th>
                      <th className="text-end">প্রাপ্ত (শতাংশ)</th>
                      <th className="text-end">বর্গফুট</th>
                    </tr>
                  </thead>
                  <tbody className="text-center align-middle">
                    {res.ownerPlots.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="text-start">
                          {p.dagText.map((dt: string, didx: number) => (
                            <span
                              key={didx}
                              className="badge bg-light text-dark border me-1 mb-1 fw-normal"
                            >
                              {dt}
                            </span>
                          ))}
                        </td>
                        <td>
                          <span className="text-muted small">
                            {p.plotClass}
                          </span>
                        </td>
                        <td>{toBn(p.totalArea)}</td>
                        <td className="text-end fw-bold text-success">
                          {toBn(p.gotArea.toFixed(4))}
                        </td>
                        <td className="text-end text-muted small">
                          {toBn((p.gotArea * 435.6).toFixed(1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-warning bg-opacity-10">
                    <tr>
                      <td
                        colSpan={3}
                        className="text-end fw-bold text-secondary py-3"
                      >
                        মোট প্রাপ্ত:
                      </td>
                      <td className="text-end fw-bold fs-5 text-success py-3">
                        {toBn(res.totalLand.toFixed(3))}
                      </td>
                      <td className="text-end text-secondary py-3">
                        {toBn((res.totalLand / 1.65).toFixed(2))} কাঠা
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          <div className="text-center text-muted small border-top pt-4 mt-5">
            <p className="mb-0">
              এই দলিলটি ডিজিটাল ক্যালকুলেটর দ্বারা প্রস্তুতকৃত। প্রয়োজনে মূল
              খতিয়ানের সাথে মিলিয়ে নিন।
            </p>
          </div>
        </div>

        <div className="card-footer bg-light p-4 no-print d-flex flex-wrap justify-content-center gap-2 border-top">
          <button
            onClick={onDownloadPDF}
            className="btn btn-danger fw-bold shadow-sm d-flex align-items-center"
          >
            <FileDown size={18} className="me-2" /> PDF (A4)
          </button>
          <button
            onClick={onDownloadExcel}
            className="btn btn-success fw-bold shadow-sm d-flex align-items-center"
          >
            <FileSpreadsheet size={18} className="me-2" /> Excel (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}