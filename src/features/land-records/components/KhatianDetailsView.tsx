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

export default function KhatianDetailsView({ khatian, fullKhatian, surveyKey, captureRef }: Props) {
  const internalCaptureRef = useRef<HTMLDivElement | null>(null);
  const resolvedCaptureRef = captureRef ?? internalCaptureRef;
  const embeddedFull = FullKhatianSchema.safeParse(khatian.PUBLIC_RECORD?.LANDBD_FULL_KHATIAN);
  const resolvedFullKhatian = fullKhatian ?? (embeddedFull.success ? embeddedFull.data : undefined);

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
      />
      {resolvedFullKhatian ? <FullKhatianSupplement fullKhatian={resolvedFullKhatian} /> : null}
    </>
  );
}
