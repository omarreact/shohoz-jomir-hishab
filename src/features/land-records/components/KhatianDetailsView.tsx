"use client";

import { useRef, type RefObject } from "react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import AuthoritativeKhatianDetailsView from "./AuthoritativeKhatianDetailsView";
import FullKhatianSupplement from "./FullKhatianSupplement";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
};

export type KhatianPageOrientation = "portrait" | "landscape";

function resolveKhatianPageOrientation(surveyKey: string | undefined, surveyName: string): KhatianPageOrientation {
  const normalized = (surveyKey || surveyName || "").toUpperCase().replace(/[^A-Z]/g, "");
  return normalized === "BRS" || normalized === "SA" ? "landscape" : "portrait";
}

export default function KhatianDetailsView({ khatian, fullKhatian, surveyKey, captureRef }: Props) {
  const internalCaptureRef = useRef<HTMLDivElement | null>(null);
  const resolvedCaptureRef = captureRef ?? internalCaptureRef;
  const embeddedFull = FullKhatianSchema.safeParse(khatian.PUBLIC_RECORD?.LANDBD_FULL_KHATIAN);
  const resolvedFullKhatian = fullKhatian ?? (embeddedFull.success ? embeddedFull.data : undefined);
  const pageOrientation = resolveKhatianPageOrientation(surveyKey, khatian.SURVEY_NAME);

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

      <div className="mb-2 flex justify-end gap-2 print:hidden" data-exclude-export="1">
        <ResultPrintButton />
      </div>

      {/* Repeated by Chromium on every physical printed page. */}
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
          <FullKhatianSupplement fullKhatian={resolvedFullKhatian} pageOrientation={pageOrientation} />
        </div>
      ) : null}
    </div>
  );
}
