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
        <ResultWatermark />
        <div className="relative z-10">{children}</div>
      </div>
    );
  },
);

export default ResultDocument;
