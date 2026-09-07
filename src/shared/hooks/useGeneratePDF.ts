"use client";

import { useCallback, useState } from "react";
import { generateResultPdf, type GenerateResultPdfOptions } from "@/src/shared/lib/pdf/generate-result-pdf";

type UseGeneratePdfOptions = Omit<GenerateResultPdfOptions, "source"> & {
  sourceRef: React.RefObject<HTMLElement | null>;
};

export function useGeneratePDF({ sourceRef, ...options }: UseGeneratePdfOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = useCallback(async () => {
    const source = sourceRef.current;
    if (!source || isGenerating) return false;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateResultPdf({ source, ...options });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (reason) {
      console.error("PDF generation hook failed", reason);
      setError("ফলাফলের পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, options, sourceRef]);

  const clearPdfError = useCallback(() => setError(null), []);

  return {
    generatePDF,
    isGenerating,
    pdfError: error,
    clearPdfError,
  };
}
