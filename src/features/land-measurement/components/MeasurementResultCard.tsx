"use client";

import { useRef } from "react";
import type { MeasurementResult } from "@/src/modules/land/geometry";
import { toBn } from "@/src/shared/utils";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDocument from "@/src/shared/components/ResultDocument";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";

type Props = {
  result: MeasurementResult;
};

export default function MeasurementResultCard({ result }: Props) {
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: resultRef,
    fileName: "LandBD-Land-Measurement-Result-A4-Portrait",
  });

  return (
    <section id="landResultSection" className="mt-8 space-y-3">
      <div className="flex justify-end print:hidden">
        <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
      </div>

      {pdfError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {pdfError}
        </p>
      ) : null}

      <ResultDocument ref={resultRef} className="rounded-3xl border p-6 shadow-sm">
        <header className="mb-5 border-b border-emerald-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006a4e]">ল্যান্ডবিডি</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">হিসাবের ফলাফল</h2>
        </header>

        {result.errorMsg ? (
          <p className="font-bold text-destructive">{result.errorMsg}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["বর্গফুট", result.sqFt],
              ["শতাংশ", result.shotok],
              ["কাঠা", result.katha],
              ["একর", result.acre],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-emerald-100 bg-white/85 p-4">
                <small className="font-semibold text-slate-600">{label}</small>
                <div className="mt-1 text-2xl font-black tabular-nums text-slate-950" data-bangla-number="1">
                  {toBn(Number(value || 0).toFixed(4))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
          এই ফলাফল LandBD-এর ডিজিটাল পরিমাপ ক্যালকুলেটর দ্বারা প্রস্তুত। দাপ্তরিক কাজে সরকারি নথি ও অনুমোদিত জরিপ যাচাই করুন।
        </p>
      </ResultDocument>
    </section>
  );
}
