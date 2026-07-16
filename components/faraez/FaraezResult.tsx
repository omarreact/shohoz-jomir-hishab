"use client";

import { HeirResult, Religion } from "@/lib/faraez/types"; 
import { toBn } from "@/lib/utils";
import { Scale, Info, FileDown, FileSpreadsheet, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  results: HeirResult[];
  exportRef: React.RefObject<HTMLDivElement | null>;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  religion: Religion; 
}

const COLORS = ['#198754', '#0d6efd', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#0dcaf0', '#adb5bd'];

export default function FaraezResult({ 
  results, exportRef, onDownloadPDF, onDownloadExcel, religion 
}: Props) {
  if (!results || results.length === 0) return null;

  const validResults = results.filter((r) => r.count > 0);
  
  const pieData = validResults
    .filter((r) => r.fraction > 0)
    .map((r) => ({
      name: r.count > 1 ? `${r.heirType} (${toBn(r.count)} জন)` : r.heirType,
      value: Number((r.fraction * 100).toFixed(2)),
    }));

  const today = toBn(new Date().toLocaleDateString("en-GB"));

  return (
    <div id="resultSection" className="container pb-5 fade-in mt-4">
      <div className="card shadow-lg rounded-4 overflow-hidden border-success border-2">
        <div className="card-header bg-success text-white text-center py-3 no-print">
          <h5 className="mb-0 fw-bold d-flex justify-content-center align-items-center">
            <Scale className="me-2" /> বিস্তারিত বন্টন ফলাফল
          </h5>
        </div>
        
        <div ref={exportRef} className="bg-white p-4 p-md-5">
          <div className="text-center border-bottom border-success border-2 pb-4 mb-5">
            <h2 className="fw-bold text-success mb-2">
              সম্পত্তি বন্টন (ফারায়েজ) বিবরণী
            </h2>
            <p className="text-muted mb-0 fw-semibold">
              তারিখ: {today} | {religion === "muslim" ? "ইসলামী শরীয়ত" : "হিন্দু দায়ভাগ আইন"} মোতাবেক প্রস্তুতকৃত
            </p>
          </div>

          {pieData.length > 0 && (
            <div className="row justify-content-center mb-5 align-items-center bg-light rounded-4 p-4 mx-0 shadow-sm">
              <div className="col-md-5 text-center mb-4 mb-md-0">
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center justify-content-center">
                  <PieChartIcon className="me-2 text-primary" /> অংশের গ্রাফিক্যাল রূপ
                </h5>
                <p className="text-muted small">নিচের চার্টে ওয়ারিশদের অংশের হার দেখানো হলো</p>
              </div>
              {/* চার্টের উচ্চতা বাড়িয়ে ৩০০px করা হলো এবং মার্জিন দেয়া হলো যাতে না কাটে */}
              <div className="col-md-7" style={{ height: "300px", minHeight: "300px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${toBn(value)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${toBn(value)}%`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="table-responsive shadow-sm rounded-3">
            <table className="table table-hover table-bordered mb-0 align-middle border-secondary">
              <thead className="table-success text-center align-middle border-success">
                <tr>
                  <th className="px-4 py-3 text-start">ওয়ারিশ</th>
                  <th className="py-3">অংশ (%)</th>
                  <th className="py-3 text-success">প্রাপ্ত জমি<br /><small>(শতাংশ)</small></th>
                  <th className="py-3 text-warning text-dark">প্রাপ্ত স্বর্ণ<br /><small>(ভরি)</small></th>
                  <th className="py-3 text-primary">প্রাপ্ত অর্থ<br /><small>(টাকা)</small></th>
                  <th className="px-4 py-3 text-start" style={{width: "35%"}}>আইনি ব্যাখ্যা</th>
                </tr>
              </thead>
              <tbody>
                {validResults.flatMap((res, groupIdx) => {
                  const rows = [];
                  for (let i = 1; i <= res.count; i++) {
                    const isExcluded = res.fraction === 0;
                    const heirName = res.count > 1 ? `${res.heirType} ${toBn(i)}` : res.heirType;

                    rows.push(
                      <tr key={`${groupIdx}-${i}`} className={`text-center ${isExcluded ? "table-danger text-muted" : "bg-white"}`}>
                        <td className="px-4 fw-bold text-start text-nowrap">{heirName}</td>
                        <td>
                          {isExcluded ? (
                            <span className="badge bg-danger">বঞ্চিত</span>
                          ) : (
                            <span className="badge bg-success bg-opacity-75 fs-6">{toBn((res.fraction * 100).toFixed(2))}%</span>
                          )}
                        </td>
                        <td className="fw-bold text-success fs-6">{res.assets.land > 0 ? toBn(res.assets.land.toFixed(3)) : "-"}</td>
                        <td className="fw-bold text-warning text-dark fs-6">{res.assets.gold > 0 ? toBn(res.assets.gold.toFixed(3)) : "-"}</td>
                        <td className="fw-bold text-primary fs-6">{res.assets.cash > 0 ? toBn(res.assets.cash.toFixed(2)) : "-"}</td>
                        <td className="px-4 text-muted small text-start">
                          <div className="d-flex align-items-start">
                            <Info size={14} className={`me-2 mt-1 flex-shrink-0 ${isExcluded ? 'text-danger' : 'text-success'}`} />
                            <span style={{ lineHeight: "1.6" }}>{res.reasoning}</span>
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
          
          <div className="text-center text-muted small pt-5 mt-4">
            <p className="mb-1 border-top pt-3 d-inline-block px-5 border-secondary">
              * এই দলিলটি <strong>LandBD</strong> ডিজিটাল ক্যালকুলেটর দ্বারা প্রস্তুতকৃত। 
            </p>
            <p>চূড়ান্ত আইনি বা দাপ্তরিক কাজের জন্য অভিজ্ঞ আইনজীবী বা মুফতির পরামর্শ গ্রহণ করুন।</p>
          </div>
        </div>
        
        <div className="card-footer bg-light p-4 no-print d-flex flex-wrap justify-content-center gap-3 border-top border-success">
          <button onClick={onDownloadPDF} className="btn btn-danger px-4 fw-bold shadow-sm d-flex align-items-center rounded-pill">
            <FileDown size={18} className="me-2" /> PDF ডাউনলোড
          </button>
          <button onClick={onDownloadExcel} className="btn btn-outline-success px-4 fw-bold shadow-sm d-flex align-items-center rounded-pill">
            <FileSpreadsheet size={18} className="me-2" /> Excel (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}