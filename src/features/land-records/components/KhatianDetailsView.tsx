"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { Download, Eye, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import {
  exportKhatianPdf,
  type KhatianPdfOrientation,
} from "../lib/khatian-pdf-export";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import PdfPreviewDialog, { type PdfPreviewDocument } from "@/src/shared/components/PdfPreviewDialog";
import AuthoritativeKhatianDetailsView from "./AuthoritativeKhatianDetailsView";
import FullKhatianSupplement from "./FullKhatianSupplement";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
};

export type KhatianPageOrientation = "portrait" | "landscape";

function resolveKhatianPageOrientation(
  surveyKey: string | undefined,
  surveyName: string,
): KhatianPageOrientation {
  const normalized = (surveyKey || surveyName || "").toUpperCase().replace(/[^A-Z]/g, "");
  return normalized === "BRS" || normalized === "SA" ? "landscape" : "portrait";
}

function buildFileName(khatian: KhatianDetails, surveyKey?: string): string {
  const parts = [
    "LandBD",
    surveyKey || khatian.SURVEY_NAME || "Khatian",
    khatian.MOUZA_NAME,
    khatian.KHATIAN_NO,
  ]
    .map((p) => String(p || "").trim())
    .filter(Boolean);
  return parts.join("-") || "LandBD-Khatian";
}

export default function KhatianDetailsView({
  khatian,
  fullKhatian,
  surveyKey,
  captureRef,
}: Props) {
  const internalCaptureRef = useRef<HTMLDivElement | null>(null);
  const resolvedCaptureRef = captureRef ?? internalCaptureRef;
  const [exporting, setExporting] = useState<KhatianPdfOrientation | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewDocument | null>(null);

  const embeddedFull = FullKhatianSchema.safeParse(khatian.PUBLIC_RECORD?.LANDBD_FULL_KHATIAN);
  const resolvedFullKhatian =
    fullKhatian ?? (embeddedFull.success ? embeddedFull.data : undefined);
  const pageOrientation = resolveKhatianPageOrientation(surveyKey, khatian.SURVEY_NAME);

  const handleDownloadPdf = useCallback(
    async (orientation: KhatianPdfOrientation, delivery: "download" | "return" = "download") => {
      const source = resolvedCaptureRef.current;
      if (!source) {
        setExportError("রিপোর্ট এলিমেন্ট পাওয়া যায়নি।");
        return;
      }

      setExporting(orientation);
      setExportError(null);

      try {
        const result = await exportKhatianPdf({
          source,
          fileName: buildFileName(khatian, surveyKey),
          orientation,
          delivery,
        });

        if (!result.ok) {
          setExportError(result.error);
        } else if (delivery === "return") {
          setPdfPreview({ blob: result.blob, fileName: result.fileName, pages: result.pages });
        }
      } catch (error) {
        console.error("[KhatianDetailsView] PDF export failed", error);
        setExportError("A4 পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      } finally {
        setExporting(null);
      }
    },
    [khatian, resolvedCaptureRef, surveyKey],
  );

  const isBusy = exporting !== null;

  return (
    <div
      className={`dlrms-print-document dlrms-print-document-${pageOrientation}`}
      data-print-layout="landbd-v3"
    >
      <style>{`
        .dlrms-fixed-print-watermark,
        .dlrms-fixed-print-ribbon {
          display: none;
        }

        @media print {
          .dlrms-fixed-print-watermark {
            position: fixed;
            z-index: 40;
            top: 50%;
            left: 50%;
            display: block !important;
            width: 96mm;
            height: auto;
            transform: translate(-50%, -50%) rotate(-24deg);
            opacity: 0.055;
            filter: grayscale(1);
            pointer-events: none;
            user-select: none;
          }

          .dlrms-print-document-landscape .dlrms-fixed-print-watermark {
            width: 122mm;
          }

          .dlrms-fixed-print-ribbon {
            position: fixed !important;
            z-index: 80 !important;
            right: 0;
            bottom: 0;
            left: 0;
            display: block !important;
            width: 100%;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #fff;
          }

          .dlrms-fixed-print-ribbon svg {
            width: 100% !important;
            height: 9mm !important;
            min-height: 0 !important;
          }

          .dlrms-print-document-landscape .dlrms-fixed-print-ribbon svg {
            height: 8mm !important;
          }
        }
      `}</style>

      <div
        className="mb-3 flex flex-col items-stretch gap-2 print:hidden sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
        data-exclude-export="1"
      >
        <p className="text-xs font-semibold text-[var(--muted-foreground)] sm:mr-auto sm:self-center">
          A4 {pageOrientation === "landscape" ? "ল্যান্ডস্কেপ" : "পোর্ট্রেট"} প্রস্তাবিত · PDF দেখুন বা ডাউনলোড করুন
        </p>

        <button
          type="button"
          onClick={() => void handleDownloadPdf(pageOrientation, "return")}
          disabled={isBusy}
          data-exclude-export="1"
          className="landbd-primary-button inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting === pageOrientation ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : <Eye size={17} />}
          <span>PDF প্রিভিউ দেখুন</span>
        </button>

        <button
          type="button"
          onClick={() => void handleDownloadPdf("portrait")}
          disabled={isBusy}
          data-exclude-export="1"
          className="landbd-secondary-button inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting === "portrait" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>পোর্ট্রেট তৈরি হচ্ছে…</span>
            </>
          ) : (
            <>
              <RectangleVertical size={16} />
              <Download size={15} className="opacity-70" />
              <span>A4 পোর্ট্রেট ডাউনলোড</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => void handleDownloadPdf("landscape")}
          disabled={isBusy}
          data-exclude-export="1"
          className="landbd-secondary-button inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting === "landscape" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>ল্যান্ডস্কেপ তৈরি হচ্ছে…</span>
            </>
          ) : (
            <>
              <RectangleHorizontal size={16} />
              <Download size={15} className="opacity-70" />
              <span>A4 ল্যান্ডস্কেপ ডাউনলোড</span>
            </>
          )}
        </button>
      </div>

      {exportError ? (
        <p
          className="mb-2 text-right text-sm font-semibold text-red-600 print:hidden"
          data-exclude-export="1"
          role="alert"
        >
          {exportError}
        </p>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="dlrms-fixed-print-watermark"
        src="/brand/logo-bangla.svg"
        alt=""
        aria-hidden="true"
      />
      <LandBdPrintRibbon className="dlrms-fixed-print-ribbon" />

      <AuthoritativeKhatianDetailsView
        khatian={khatian}
        fullKhatian={resolvedFullKhatian}
        surveyKey={surveyKey}
        captureRef={resolvedCaptureRef}
        pageOrientation={pageOrientation}
      />

      {resolvedFullKhatian ? (
        <div className="print:hidden" data-exclude-export="1">
          <FullKhatianSupplement
            fullKhatian={resolvedFullKhatian}
            pageOrientation={pageOrientation}
          />
        </div>
      ) : null}
      {pdfPreview ? (
        <PdfPreviewDialog document={pdfPreview} onClose={() => setPdfPreview(null)} />
      ) : null}
    </div>
  );
}
