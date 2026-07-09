import { FileDown, FileSpreadsheet } from "lucide-react";
import { toBn } from "@/lib/utils";

export default function ResultSection({
  detailedResults,
  exportRef,
  onDownloadPDF,
  onDownloadExcel,
}: any) {
  if (!detailedResults) return null;

  return (
    <div id="resultSection" className="container fade-in">
      <div className="card shadow-sm rounded-4 border-0">
        <div className="card-header bg-dark text-white text-center py-3">
          <h5 className="mb-0 fw-bold">বন্টন নামা / হিস্যা বিবরণী</h5>
        </div>
        <div ref={exportRef} className="bg-white p-4 p-md-5">
          <div className="text-center border-bottom pb-4 mb-4">
            <h3 className="fw-bold text-success">জমির পরিমাপ ও বন্টন বিবরণী</h3>
            <p className="text-muted">
              তারিখ: {toBn(new Date().toLocaleDateString("bn-BD"))}
            </p>
          </div>

          {detailedResults.map((res: any, i: number) => (
            <div key={i} className="mb-5">
              <h6 className="fw-bold text-primary mb-3">
                হিস্যা বিবরণী - {toBn(i + 1)}
              </h6>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>মালিকের নাম</th>
                      <th className="text-end">জমির পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody>{/* ডাটা রেন্ডার */}</tbody>
                  <tfoot className="table-success">
                    <tr>
                      <td className="fw-bold py-3">মোট প্রাপ্ত:</td>
                      <td className="text-end fw-bold py-3">
                        {toBn(res.totalLand.toFixed(2))} শতাংশ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="card-footer bg-light p-4 d-flex justify-content-center gap-3 no-print">
          <button
            onClick={onDownloadPDF}
            className="btn btn-danger fw-bold shadow-sm"
          >
            <FileDown size={18} /> PDF ডাউনলোড
          </button>
          <button
            onClick={onDownloadExcel}
            className="btn btn-success fw-bold shadow-sm"
          >
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
      </div>
    </div>
  );
}
