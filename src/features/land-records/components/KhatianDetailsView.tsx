"use client";

import { useRef, useState, type RefObject } from "react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import ResultWatermarkPortal from "@/src/shared/components/ResultWatermarkPortal";
import AuthoritativeKhatianDetailsView from "./AuthoritativeKhatianDetailsView";
import FullKhatianSupplement from "./FullKhatianSupplement";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
};

function safePart(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.replace(/[^\w\u0980-\u09FF-]+/g, "_").replace(/_+/g, "_").slice(0, 48);
}

export default function KhatianDetailsView({ khatian, fullKhatian, surveyKey, captureRef }: Props) {
  const internalCaptureRef = useRef<HTMLDivElement | null>(null);
  const resolvedCaptureRef = captureRef ?? internalCaptureRef;
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const embeddedFull = FullKhatianSchema.safeParse(khatian.PUBLIC_RECORD?.LANDBD_FULL_KHATIAN);
  const resolvedFullKhatian = fullKhatian ?? (embeddedFull.success ? embeddedFull.data : undefined);

  const fileName = `LandBD-${safePart(surveyKey, "Khatian")}-Khatian-${safePart(khatian.KHATIAN_NO, "record")}-${safePart(khatian.MOUZA_NAME, "mouza")}-A4-Portrait`;
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: resolvedCaptureRef,
    fileName,
  });

  const handleGeneratePdf = async () => {
    if (isPreparingPdf || isGenerating) return;
    setIsPreparingPdf(true);
    try {
      // The printable view is now entirely record-source driven. There is no
      // asynchronous RAJUK area lookup to wait for because GIS Shape__Area is
      // not a khatian land-amount source.
      await generatePDF();
    } finally {
      setIsPreparingPdf(false);
    }
  };

  return (
    <>
      <div className="mb-2 flex justify-end print:hidden" data-exclude-export="1">
        <ResultDownloadButton onClick={() => void handleGeneratePdf()} loading={isGenerating || isPreparingPdf} />
      </div>

      {pdfError ? (
        <div data-exclude-export="1" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {pdfError}
        </div>
      ) : null}

      <AuthoritativeKhatianDetailsView
        khatian={khatian}
        fullKhatian={resolvedFullKhatian}
        surveyKey={surveyKey}
        captureRef={resolvedCaptureRef}
      />
      <ResultWatermarkPortal targetRef={resolvedCaptureRef} />
      {resolvedFullKhatian ? <FullKhatianSupplement fullKhatian={resolvedFullKhatian} /> : null}
    </>
  );
}
