import { HeirResult } from "@/lib/faraez/types";
import { toBn } from "@/lib/utils";
import { Scale, Info, FileDown, FileSpreadsheet } from "lucide-react";

interface Props {
  results: HeirResult[];
  exportRef: React.RefObject<HTMLDivElement | null>;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}

export default function FaraezResult({ 
  results, exportRef, onDownloadPDF, onDownloadExcel
}: Props) {
  if (!results || results.length === 0) return null;

  const validResults = results.filter((r) => r.count > 0);

  return (
    <div id="resultSection" className="container pb-5 fade-in mt-4">
      <div className="card shadow rounded-4 overflow-hidden border-success">
        <div className="card-header bg-dark text-white text-center py-3 no-print">
          <h5 className="mb-0 fw-bold d-flex justify-content-center align-items-center">
            <Scale className="me-2" /> বিস্তারিত বন্টন ফলাফল
          </h5>
        </div>
        
        {/* এই অংশটুকু PDF বা ইমেজে ডাউনলোড হবে */}
        <div ref={exportRef} className="bg-white p-4 p-md-5">
          <div className="text-center border-bottom pb-4 mb-4">
            <h3 className="fw-bold text-success mb-1">
              সম্পত্তি বন্টন (ফারায়েজ) বিবরণী
            </h3>
            <p className="text-muted mb-0">
              তারিখ: {new Date().toLocaleDateString("bn-BD")}
            </p>
          </div>

          <div className="table-responsive">
            <table className="table table-hover table-bordered mb-0 align-middle">
              <thead className="table-light text-center align-middle">
                <tr>
                  <th className="px-4 py-3 text-start">ওয়ারিশ</th>
                  <th className="py-3">অংশ (%)</th>
                  <th className="py-3 text-success">প্রাপ্ত জমি<br /><small>(শতাংশ)</small></th>
                  <th className="py-3 text-warning">প্রাপ্ত স্বর্ণ<br /><small>(ভরি)</small></th>
                  <th className="py-3 text-primary">প্রাপ্ত অর্থ<br /><small>(টাকা)</small></th>
                  <th className="px-4 py-3 text-start">আইনি ব্যাখ্যা</th>
                </tr>
              </thead>
              <tbody>
                {validResults.flatMap((res, groupIdx) => {
                  const rows = [];
                  for (let i = 1; i <= res.count; i++) {
                    const isExcluded = res.fraction === 0;
                    const heirName = res.count > 1 ? `${res.heirType} ${toBn(i)}` : res.heirType;

                    rows.push(
                      <tr key={`${groupIdx}-${i}`} className={`text-center ${isExcluded ? "table-danger bg-opacity-10" : ""}`}>
                        <td className="px-4 fw-bold text-start text-nowrap">{heirName}</td>
                        <td>
                          {isExcluded ? (
                            <span className="badge bg-danger">বঞ্চিত</span>
                          ) : (
                            <span className="badge bg-secondary">{toBn((res.fraction * 100).toFixed(2))}%</span>
                          )}
                        </td>
                        <td className="fw-bold text-success fs-6">{res.assets.land > 0 ? toBn(res.assets.land.toFixed(3)) : "-"}</td>
                        <td className="fw-bold text-warning fs-6">{res.assets.gold > 0 ? toBn(res.assets.gold.toFixed(3)) : "-"}</td>
                        <td className="fw-bold text-primary fs-6">{res.assets.cash > 0 ? toBn(res.assets.cash.toFixed(2)) : "-"}</td>
                        <td className="px-4 text-muted small text-start">
                          <div className="d-flex align-items-start">
                            <Info size={14} className={`me-2 mt-1 flex-shrink-0 ${isExcluded ? 'text-danger' : 'text-primary'}`} />
                            <span>{res.reasoning}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
              </tbody>
            </table>
          </div>
          
          <div className="text-center text-muted small border-top pt-4 mt-5">
            * এই দলিলটি ডিজিটাল ক্যালকুলেটর দ্বারা প্রস্তুতকৃত। চূড়ান্ত আইনি বন্টননামার জন্য অভিজ্ঞ আইনজীবীর পরামর্শ নিন।
          </div>
        </div>
        
        {/* ডাউনলোড বাটনসমূহ (এগুলো প্রিন্ট বা পিডিএফ এ আসবে না) */}
        <div className="card-footer bg-light p-4 no-print d-flex flex-wrap justify-content-center gap-2 border-top">
          <button onClick={onDownloadPDF} className="btn btn-danger fw-bold shadow-sm d-flex align-items-center">
            <FileDown size={18} className="me-2" /> PDF (A4)
          </button>
          <button onClick={onDownloadExcel} className="btn btn-success fw-bold shadow-sm d-flex align-items-center">
            <FileSpreadsheet size={18} className="me-2" /> Excel (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}