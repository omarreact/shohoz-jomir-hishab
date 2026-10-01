"use client";

import { useMemo, useRef, useState } from "react";
import type { MeasurementResult } from "@/src/modules/land/geometry";
import { toBn } from "@/src/shared/utils";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDocument from "@/src/shared/components/ResultDocument";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";

type Props = {
  result: MeasurementResult;
};

type UnitKey = "sqFt" | "shotok" | "katha" | "acre";

const UNITS: Array<{ key: UnitKey; label: string }> = [
  { key: "shotok", label: "শতাংশ" },
  { key: "katha", label: "কাঠা" },
  { key: "acre", label: "একর" },
  { key: "sqFt", label: "বর্গফুট" },
];

export default function MeasurementResultCard({ result }: Props) {
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [unit, setUnit] = useState<UnitKey>("shotok");
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: resultRef,
    fileName: "LandBD-Land-Measurement-Result-A4-Portrait",
  });

  const selected = useMemo(
    () => UNITS.find((item) => item.key === unit) ?? UNITS[0],
    [unit],
  );

  return (
    <section id="landResultSection" className="mt-6 space-y-3 scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--survey-teal)]">RESULT</p>
          <h2 className="text-xl font-black text-[var(--foreground)]">হিসাবের ফলাফল</h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
          <ResultPrintButton />
        </div>
      </div>

      {pdfError ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {pdfError}
        </p>
      ) : null}

      <ResultDocument ref={resultRef} className="rounded-[14px] border border-[var(--border-color)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
        <header className="mb-5 flex flex-col gap-3 border-b border-[var(--border-color)] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]">LandBD · Measurement</p>
            <h3 className="mt-1 text-xl font-black text-[var(--foreground)]">জমির পরিমাপ</h3>
          </div>
          <span className="landbd-status-chip">সহায়ক হিসাব</span>
        </header>

        {result.errorMsg ? (
          <p className="rounded-[10px] border border-red-200 bg-red-50 p-4 font-bold text-destructive">{result.errorMsg}</p>
        ) : (
          <>
            <div className="print:hidden">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="ফলাফলের একক">
                {UNITS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={unit === item.key}
                    onClick={() => setUnit(item.key)}
                    className={unit === item.key ? "landbd-domain-tab landbd-domain-tab-active" : "landbd-domain-tab"}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-[14px] border border-[color-mix(in_srgb,var(--primary)_18%,var(--border-color))] bg-[var(--brand-green-faint)] p-5">
                <p className="text-xs font-bold text-[var(--muted-foreground)]">{selected.label}</p>
                <div className="mt-1 text-4xl font-black tabular-nums text-[var(--primary)]" data-bangla-number="1">
                  {toBn(Number(result[unit] || 0).toFixed(4))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {UNITS.map((item) => (
                <div key={item.key} className="rounded-[12px] border border-[var(--border-color)] bg-white p-4">
                  <small className="font-semibold text-[var(--muted-foreground)]">{item.label}</small>
                  <div className="mt-1 text-2xl font-black tabular-nums text-[var(--foreground)]" data-bangla-number="1">
                    {toBn(Number(result[item.key] || 0).toFixed(4))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-6 border-t border-[var(--border-color)] pt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          এই ফলাফল LandBD-এর ডিজিটাল পরিমাপ ক্যালকুলেটর দ্বারা প্রস্তুত। দাপ্তরিক কাজে সরকারি নথি ও অনুমোদিত জরিপ যাচাই করুন।
        </p>
      </ResultDocument>
    </section>
  );
}
