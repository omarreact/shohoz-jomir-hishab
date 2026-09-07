"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";
import { toBn } from "@/src/shared/utils";
import { generateCSVFromResults } from "@/src/modules/khatiyan/calculations";
import { downloadElementAsPdf, downloadTextFile } from "@/src/shared/lib/export";
import type { RefObject } from "react";
import type { KhatiyanOwnerResult } from "@/src/shared/types";

interface ResultSectionProps {
  detailedResults: KhatiyanOwnerResult[] | null;
  exportRef: RefObject<HTMLDivElement | null>;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}

export default function ResultSection({ detailedResults, exportRef }: ResultSectionProps) {
  if (!detailedResults) return null;

  const downloadKhatiyanPdf = async () => {
    if (!exportRef.current) return;
    try {
      await downloadElementAsPdf(exportRef.current, "Khatiyan_Result.pdf");
    } catch (error) {
      console.error("Khatiyan PDF export failed:", error);
      alert("PDF তৈরিতে সমস্যা হয়েছে।");
    }
  };

  const downloadKhatiyanCsv = () => {
    try {
      const csv = generateCSVFromResults(detailedResults, toBn);
      downloadTextFile(csv, "Khatiyan_Result.csv");
    } catch (error) {
      console.error("Khatiyan CSV export failed:", error);
      alert("CSV তৈরিতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div id="resultSection" className="max-w-5xl mx-auto mt-12 fade-in visible">
      <div className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
        <div className="bg-[#006a4e] text-white text-center py-4 px-6 flex flex-row justify-center items-center">
          <h3 className="text-xl font-bold m-0">বন্টন নামা / হিস্যা বিবরণী</h3>
        </div>

        <div ref={exportRef} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 md:p-10">
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">জমির পরিমাপ ও বন্টন বিবরণী</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">তারিখ: {toBn(new Date().toLocaleDateString("bn-BD"))}</p>
          </div>

          <div className="space-y-8">
            {detailedResults.map((res, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between md:items-center p-5 gap-4">
                  <div>
                    <h5 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{res.name}</h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{res.rel}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-4 py-2 rounded-xl text-sm md:text-center font-bold shadow-sm">{res.shareText}</div>
                </div>

                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-center">দাগ নং</th>
                        <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-center">শ্রেণী</th>
                        <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-center">মোট জমি</th>
                        <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-right">প্রাপ্ত (শতাংশ)</th>
                        <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-right">বর্গফুট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-center">
                      {res.ownerPlots.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                          <td className="px-4 py-3 text-left"><div className="flex flex-wrap gap-1">{p.dagText.map((dt: string, didx: number) => <span key={didx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-xs font-medium">{dt}</span>)}</div></td>
                          <td className="px-4 py-3"><span className="text-slate-500 dark:text-slate-400 font-medium">{p.plotClass}</span></td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{toBn(p.totalArea)}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-500">{toBn(p.gotArea.toFixed(4))}</td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-medium">{toBn((p.gotArea * 435.6).toFixed(1))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-500 dark:text-slate-400">মোট প্রাপ্ত:</td>
                        <td className="px-4 py-4 text-right font-bold text-lg text-green-700 dark:text-green-500">{toBn(res.totalLand.toFixed(3))}</td>
                        <td className="px-4 py-4 text-right font-medium text-slate-500 dark:text-slate-400">{toBn((res.totalLand / 1.65).toFixed(2))} কাঠা</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-6 flex flex-wrap justify-center gap-4 no-print">
          <button onClick={downloadKhatiyanPdf} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-sm flex items-center transition-colors"><FileDown size={18} className="mr-2" /> PDF ডাউনলোড</button>
          <button onClick={downloadKhatiyanCsv} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm flex items-center transition-colors"><FileSpreadsheet size={18} className="mr-2" /> CSV</button>
        </div>
      </div>
    </div>
  );
}
