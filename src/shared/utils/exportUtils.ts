import React from "react";
import { generateResultPdf } from "@/src/shared/lib/pdf/generate-result-pdf";

export const downloadMultiPagePDF = async (exportRef: React.RefObject<HTMLDivElement | null>) => {
  if (!exportRef.current) return;

  const result = await generateResultPdf({
    source: exportRef.current,
    fileName: "LandBD-Khatiyan-Share-Details-A4-Portrait",
  });

  if (!result.ok) {
    throw new Error(result.error || "PDF তৈরি করতে সমস্যা হয়েছে।");
  }
};

export const downloadImage = async (exportRef: React.RefObject<HTMLDivElement | null>) => {
  if (!exportRef.current) return;
  try {
    const { toJpeg } = await import("html-to-image");
    const dataUrl = await toJpeg(exportRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      style: { margin: "0", padding: "0" }
    });
    const link = document.createElement("a");
    link.download = "Khatiyan_Calculation.jpg";
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Image export error:", err);
    throw new Error("ছবি তৈরি করতে সমস্যা হয়েছে।");
  }
};
