"use client";

import { toBn } from "@/src/shared/utils";
import { KHATIYAN_RECORD_STANDARD } from "@/src/modules/khatiyan/standards";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import ResultWatermarkPortal from "@/src/shared/components/ResultWatermarkPortal";
import type { RefObject } from "react";
import type { KhatiyanOwnerResult } from "@/src/shared/types";

interface ResultSectionProps {
  detailedResults: KhatiyanOwnerResult[] | null;
  exportRef: RefObject<HTMLDivElement | null>;
}

export default function ResultSection({ detailedResults, exportRef }: ResultSectionProps) {
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: exportRef,
    fileName: "LandBD-Khatiyan-Result-A4-Portrait",
  });

  if (!detailedResults) return null;

  return (
    <div id="resultSection" className="mx-auto mt-12 max-w-5xl fade-in visible">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-row items-center justify-center bg-[#006a4e] px-6 py-4 text-center text-white">
          <h3 className="m-0 text-xl font-bold">বন্টন নামা / হিস্যা বিবরণী</h3>
        </div>

        <div ref={exportRef} className="relative isolate overflow-hidden bg-white p-6 text-slate-900 md:p-10">
          <div className="relative z-10">
            <div className="mb-8 border-b border-slate-200 pb-6 text-center">
              <h3 className="mb-2 text-2xl font-bold text-green-700">জমির পরিমাপ ও বন্টন বিবরণী</h3>
              <p className="font-medium text-slate-500">তারিখ: {toBn(new Date().toLocaleDateString("bn-BD"))}</p>
            </div>

            <div className="space-y-8">
              {detailedResults.map((res, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center">
                    <div>
                      <h5 className="mb-1 text-lg font-bold text-slate-900">{res.name}</h5>
                      <p className="text-sm font-medium text-slate-500">{res.rel}</p>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 shadow-sm md:text-center">{res.shareText}</div>
                  </div>

                  <div className="overflow-x-auto p-0">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-center font-bold text-slate-500">দাগ নং</th>
                          <th className="px-4 py-3 text-center font-bold text-slate-500">শ্রেণী</th>
                          <th className="px-4 py-3 text-center font-bold text-slate-500">মোট জমি</th>
                          <th className="px-4 py-3 text-right font-bold text-slate-500">প্রাপ্ত (শতাংশ)</th>
                          <th className="px-4 py-3 text-right font-bold text-slate-500">বর্গফুট</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-center">
                        {res.ownerPlots.map((p, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-3 text-left">
                              <div className="flex flex-wrap gap-1">
                                {p.dagText.map((dt: string, didx: number) => (
                                  <span key={didx} className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{dt}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3"><span className="font-medium text-slate-500">{p.plotClass}</span></td>
                            <td className="px-4 py-3 font-medium text-slate-900">{toBn(p.totalArea)}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">{toBn(p.gotArea.toFixed(4))}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-500">{toBn((p.gotArea * KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal).toFixed(1))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-slate-200 bg-slate-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-500">মোট প্রাপ্ত:</td>
                          <td className="px-4 py-4 text-right text-lg font-bold text-green-700">{toBn(res.totalLand.toFixed(3))}</td>
                          <td className="px-4 py-4 text-right font-medium text-slate-500">{toBn(((res.totalLand * KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal) / KHATIYAN_RECORD_STANDARD.squareFeetPerKatha).toFixed(2))} কাঠা</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ResultWatermarkPortal targetRef={exportRef} />

        <div className="no-print flex flex-wrap justify-center gap-4 border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
          <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
          {pdfError ? <p className="w-full text-center text-xs font-semibold text-red-600">{pdfError}</p> : null}
        </div>
      </div>
    </div>
  );
}
