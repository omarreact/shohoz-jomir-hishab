"use client";

import { useEffect, useState, type RefObject } from "react";
import { Download, Loader2 } from "lucide-react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { exportKhatianPdf } from "../lib/khatian-pdf-export";
import CompactKhatianDetailsView from "./CompactKhatianDetailsView";
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const embeddedFull = FullKhatianSchema.safeParse(khatian.PUBLIC_RECORD?.LANDBD_FULL_KHATIAN);
  const resolvedFullKhatian = fullKhatian ?? (embeddedFull.success ? embeddedFull.data : undefined);

  useEffect(() => {
    const panel = document.getElementById("khatian-details-panel");
    if (!panel) return;

    const toolbar = panel.firstElementChild as HTMLElement | null;
    if (!toolbar) return;

    const hiddenButtons: Array<{ element: HTMLButtonElement; display: string }> = [];
    toolbar.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      const label = button.textContent?.replace(/\s+/g, " ").trim() || "";
      if (label === "প্রিন্ট" || label.includes("উচ্চ রেজোলিউশন ছবি ডাউনলোড")) {
        hiddenButtons.push({ element: button, display: button.style.display });
        button.style.display = "none";
      }
    });

    return () => {
      hiddenButtons.forEach(({ element, display }) => {
        element.style.display = display;
      });
    };
  }, [khatian.ID]);

  useEffect(() => {
    const root = captureRef?.current;
    if (!root) return;

    const headerCard = root.children[0] as HTMLElement | undefined;
    const details = headerCard?.children[1] as HTMLElement | undefined;
    if (!details) return;

    const children = Array.from(details.children) as HTMLElement[];
    const duplicatedMetaGrid = children[1];
    const summaryGrid = children[2];

    const previousMetaDisplay = duplicatedMetaGrid?.style.display ?? "";
    const previousSummaryCss = summaryGrid?.style.cssText ?? "";
    const previousCardCss: string[] = [];
    const previousParagraphCss: string[][] = [];

    if (duplicatedMetaGrid) duplicatedMetaGrid.style.display = "none";

    if (summaryGrid) {
      summaryGrid.style.marginTop = "8px";
      summaryGrid.style.display = "flex";
      summaryGrid.style.flexWrap = "wrap";
      summaryGrid.style.gap = "6px";

      Array.from(summaryGrid.children).forEach((child, index) => {
        const card = child as HTMLElement;
        previousCardCss[index] = card.style.cssText;
        card.style.flex = "1 1 150px";
        card.style.minWidth = "130px";
        card.style.padding = "6px 9px";
        card.style.display = "flex";
        card.style.alignItems = "center";
        card.style.justifyContent = "center";
        card.style.gap = "6px";

        const paragraphs = Array.from(card.querySelectorAll<HTMLElement>("p"));
        previousParagraphCss[index] = paragraphs.map((paragraph) => paragraph.style.cssText);
        paragraphs.forEach((paragraph) => {
          paragraph.style.margin = "0";
          paragraph.style.lineHeight = "1.2";
        });
      });
    }

    return () => {
      if (duplicatedMetaGrid) duplicatedMetaGrid.style.display = previousMetaDisplay;
      if (summaryGrid) {
        summaryGrid.style.cssText = previousSummaryCss;
        Array.from(summaryGrid.children).forEach((child, index) => {
          const card = child as HTMLElement;
          card.style.cssText = previousCardCss[index] ?? "";
          Array.from(card.querySelectorAll<HTMLElement>("p")).forEach((paragraph, pIndex) => {
            paragraph.style.cssText = previousParagraphCss[index]?.[pIndex] ?? "";
          });
        });
      }
    };
  }, [captureRef, khatian.ID]);

  const downloadPdf = async () => {
    if (!captureRef?.current || downloadingPdf) return;

    setDownloadingPdf(true);
    setPdfError(null);
    try {
      const survey = safePart(surveyKey, "Khatian");
      const khatianNo = safePart(khatian.KHATIAN_NO, "record");
      const mouza = safePart(khatian.MOUZA_NAME, "mouza");
      const result = await exportKhatianPdf({
        source: captureRef.current,
        fileName: `LandBD-${survey}-Khatian-${khatianNo}-${mouza}-A4-Landscape`,
      });

      if (!result.ok) setPdfError(result.error);
    } catch (error) {
      console.error("Khatian PDF download failed", error);
      setPdfError("A4 Landscape PDF ডাউনলোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <>
      <div className="mb-2 flex justify-end print:hidden" data-exclude-export="1">
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={downloadingPdf}
          className="inline-flex items-center gap-2 rounded-lg bg-[#006a4e] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloadingPdf ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          {downloadingPdf ? "PDF তৈরি হচ্ছে…" : "A4 Landscape PDF ডাউনলোড"}
        </button>
      </div>

      {pdfError ? (
        <div data-exclude-export="1" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {pdfError}
        </div>
      ) : null}

      <CompactKhatianDetailsView khatian={khatian} surveyKey={surveyKey} captureRef={captureRef} />
      {resolvedFullKhatian ? <FullKhatianSupplement fullKhatian={resolvedFullKhatian} /> : null}
    </>
  );
}
