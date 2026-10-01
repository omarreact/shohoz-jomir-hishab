"use client";

import { forwardRef, type HTMLAttributes } from "react";
import ResultWatermark from "@/src/shared/components/ResultWatermark";

const ResultDocument = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ResultDocument({ className = "", children, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-result-document="1"
        className={`relative isolate overflow-hidden bg-white text-slate-900 ${className}`}
        {...props}
      >
        <div className="landbd-print-branding" aria-hidden="true">
          <span className="landbd-print-brand-mark">LB</span>
          <span>
            <strong>LandBD</strong>
            <small>ভূমি তথ্য · হিসাব · মানচিত্র · ডকুমেন্ট</small>
          </span>
        </div>

        <ResultWatermark />
        <div className="relative z-10">{children}</div>

        <div className="landbd-print-footer" aria-hidden="true">
          <strong>landbd.pincodeit.com</strong>
          <span>দাপ্তরিক বা আইনি ব্যবহারের আগে সংশ্লিষ্ট সরকারি মূল নথি যাচাই করুন।</span>
        </div>
      </div>
    );
  },
);

export default ResultDocument;
