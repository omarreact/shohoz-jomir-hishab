"use client";

import { useRef, type RefObject } from "react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";
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
    <>
      <div className="mb-2 flex justify-end gap-2 print:hidden" data-exclude-export="1">
        <ResultPrintButton />
      </div>

      <AuthoritativeKhatianDetailsView
        khatian={khatian}
        fullKhatian={resolvedFullKhatian}
        surveyKey={surveyKey}
        captureRef={resolvedCaptureRef}
        pageOrientation={pageOrientation}
      />
      {resolvedFullKhatian ? (
        <FullKhatianSupplement fullKhatian={resolvedFullKhatian} pageOrientation={pageOrientation} />
      ) : null}
    </>
  );
}
