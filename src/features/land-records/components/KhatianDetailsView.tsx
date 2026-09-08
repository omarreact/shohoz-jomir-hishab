"use client";

import { useEffect, useRef, type RefObject } from "react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import ResultWatermarkPortal from "@/src/shared/components/ResultWatermarkPortal";
import CompactKhatianDetailsView from "./CompactKhatianDetailsView";
import FullKhatianSupplement from "./FullKhatianSupplement";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
};

type ChildLayerSnapshot = {
  node: HTMLElement;
  position: string;
  zIndex: string;
};

function safePart(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.replace(/[^\w\u0980-\u09FF-]+/g, "_").replace(/_+/g, "_").slice(0, 48);
}

function markExcluded(node: Element | null): HTMLElement | null {
  if (!(node instanceof HTMLElement)) return null;
  node.dataset.pdfExclude = "1";
  node.dataset.printExclude = "1";
  node.classList.add("print:hidden");
  return node;
}

export default function KhatianDetailsView({ khatian, fullKhatian, surveyKey, captureRef }: Props) {
  const internalCaptureRef = useRef<HTMLDivElement | null>(null);
  const resolvedCaptureRef = captureRef ?? internalCaptureRef;
  const embeddedFull = FullKhatianSchema.safeParse(khatian.PUBLIC_RECORD?.LANDBD_FULL_KHATIAN);
  const resolvedFullKhatian = fullKhatian ?? (embeddedFull.success ? embeddedFull.data : undefined);

  const fileName = `LandBD-${safePart(surveyKey, "Khatian")}-Khatian-${safePart(khatian.KHATIAN_NO, "record")}-${safePart(khatian.MOUZA_NAME, "mouza")}-A4-Portrait`;
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: resolvedCaptureRef,
    fileName,
  });

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
    const root = resolvedCaptureRef.current;
    if (!root) return;

    const previousFontFamily = root.style.fontFamily;
    const previousFontVariantNumeric = root.style.fontVariantNumeric;
    const previousPosition = root.style.position;
    const previousIsolation = root.style.isolation;
    const childLayers: ChildLayerSnapshot[] = Array.from(root.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .map((node) => ({
        node,
        position: node.style.position,
        zIndex: node.style.zIndex,
      }));

    root.style.fontFamily = 'var(--font-noto-bengali), var(--font-hind-siliguri), "Nirmala UI", "Segoe UI", Arial, sans-serif';
    root.style.fontVariantNumeric = "tabular-nums";
    root.style.position = "relative";
    root.style.isolation = "isolate";
    root.dataset.resultDocument = "1";
    childLayers.forEach(({ node }) => {
      node.style.position = "relative";
      node.style.zIndex = "1";
    });

    const restoreRootPresentation = () => {
      root.style.fontFamily = previousFontFamily;
      root.style.fontVariantNumeric = previousFontVariantNumeric;
      root.style.position = previousPosition;
      root.style.isolation = previousIsolation;
      delete root.dataset.resultDocument;
      childLayers.forEach(({ node, position, zIndex }) => {
        node.style.position = position;
        node.style.zIndex = zIndex;
      });
    };

    const publicInfoBanner = markExcluded(root.children[1]);
    const surveyArchitectureNote = markExcluded(root.children[2]);
    const supplement = markExcluded(
      document.querySelector("section[aria-label='সম্পূর্ণ খতিয়ান উৎস ও সমৃদ্ধ তথ্য']"),
    );

    const restoreExcluded = () => {
      [publicInfoBanner, surveyArchitectureNote, supplement].forEach((node) => {
        if (!node) return;
        delete node.dataset.pdfExclude;
        delete node.dataset.printExclude;
        node.classList.remove("print:hidden");
      });
    };

    const headerCard = root.children[0] as HTMLElement | undefined;
    const details = headerCard?.children[1] as HTMLElement | undefined;
    if (!details) {
      return () => {
        restoreRootPresentation();
        restoreExcluded();
      };
    }

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
      restoreRootPresentation();
      restoreExcluded();
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
  }, [khatian.ID, resolvedCaptureRef, resolvedFullKhatian]);

  return (
    <>
      <div className="mb-2 flex justify-end print:hidden" data-exclude-export="1">
        <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
      </div>

      {pdfError ? (
        <div data-exclude-export="1" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {pdfError}
        </div>
      ) : null}

      <CompactKhatianDetailsView khatian={khatian} surveyKey={surveyKey} captureRef={resolvedCaptureRef} />
      <ResultWatermarkPortal targetRef={resolvedCaptureRef} />
      {resolvedFullKhatian ? <FullKhatianSupplement fullKhatian={resolvedFullKhatian} /> : null}
    </>
  );
}
