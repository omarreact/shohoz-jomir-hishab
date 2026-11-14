"use client";

import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { Download, Eye, Map, Printer } from "lucide-react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import { isPartialPublicRecord } from "../lib/khatian-display";
import { buildFullKhatianDisplayModel } from "../lib/full-khatian-display";
import type { KhatianDetails } from "../types";
import {
  exportKhatianPdf,
  type KhatianPdfOrientation,
} from "../lib/khatian-pdf-export";
import PdfPreviewDialog, { type PdfPreviewDocument } from "@/src/shared/components/PdfPreviewDialog";
import AuthoritativeKhatianDetailsView from "./AuthoritativeKhatianDetailsView";
import FullKhatianSupplement from "./FullKhatianSupplement";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  fullKhatianLoading?: boolean;
  fullKhatianFailed?: boolean;
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
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return parts.join("-") || "LandBD-Khatian";
}

export default function KhatianDetailsView({
  khatian,
  fullKhatian,
  fullKhatianLoading = false,
  fullKhatianFailed = false,
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
  const isIncomplete = Boolean(resolvedFullKhatian && isPartialPublicRecord(resolvedFullKhatian.base));
  const model = useMemo(
    () => buildFullKhatianDisplayModel(khatian, resolvedFullKhatian, surveyKey),
    [khatian, resolvedFullKhatian, surveyKey],
  );

  const owners = model.owners.map((owner) => owner.name).filter(Boolean);
  const guardians = model.owners.map((owner) => owner.fatherOrHusband).filter(Boolean);
  const fallbackGuardians = guardians.length ? guardians : model.guardians;
  const dags = [...new Set(model.dags.map((dag) => dag.dagNo).filter(Boolean))];

  const handleDownloadPdf = useCallback(
    async (delivery: "download" | "return" = "download") => {
      if (!resolvedFullKhatian || isIncomplete) {
        setExportError(isIncomplete
          ? "উৎসের মালিক/অভিভাবক/দাগ তালিকা অসম্পূর্ণ; সম্পূর্ণ PDF তৈরি করা যাবে না।"
          : "পূর্ণ খতিয়ানের তথ্য লোড না হওয়া পর্যন্ত PDF তৈরি করা যাবে না।");
        return;
      }
      const source = resolvedCaptureRef.current;
      if (!source) {
        setExportError("রিপোর্ট এলিমেন্ট পাওয়া যায়নি।");
        return;
      }

      setExporting(pageOrientation);
      setExportError(null);

      try {
        const result = await exportKhatianPdf({
          source,
          fileName: buildFileName(khatian, surveyKey),
          orientation: pageOrientation,
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
    [khatian, pageOrientation, resolvedCaptureRef, resolvedFullKhatian, surveyKey, isIncomplete],
  );

  const isBusy = exporting !== null || fullKhatianLoading || !resolvedFullKhatian || isIncomplete;

  return (
    <div className="space-y-4 font-mixed" data-print-layout="landbd-default">
      <section className="app-panel overflow-hidden text-[var(--foreground)]">
        <header className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">খতিয়ান নং</p>
            <h2 className="mt-1 text-4xl font-semibold leading-none text-[var(--foreground)]">{khatian.KHATIAN_NO || "—"}</h2>
          </div>
          <div className="inline-flex items-center gap-3 self-start rounded-full border border-[var(--border-color)] bg-[var(--secondary)] px-4 py-2">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">মোট জমি</span>
            <strong className="rounded-full bg-[var(--primary)] px-3 py-1 text-sm text-[var(--primary-foreground)]">
              {model.totalLand || khatian.TOTAL_LAND || "—"}
            </strong>
          </div>
        </header>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] p-4">
            <h3 className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)]">প্রশাসনিক তথ্য</h3>
            <dl className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
              <div><dt className="inline text-[var(--muted-foreground)]">বিভাগ: </dt><dd className="inline">{khatian.DIVISION_NAME || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">জেলা: </dt><dd className="inline">{khatian.DISTRICT_NAME || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">উপজেলা: </dt><dd className="inline">{khatian.UPAZILA_NAME || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">সার্ভে: </dt><dd className="inline">{model.surveyLabel || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">মৌজা: </dt><dd className="inline">{khatian.MOUZA_NAME || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">জে.এল নং: </dt><dd className="inline">{khatian.JL_NUMBER || "—"}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] p-4">
            <h3 className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)]">জমির বিবরণ</h3>
            <dl className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
              <div><dt className="inline text-[var(--muted-foreground)]">দাগ সংখ্যা: </dt><dd className="inline">{dags.length || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">মোট জমি: </dt><dd className="inline">{model.totalLand || khatian.TOTAL_LAND || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">মালিক: </dt><dd className="inline">{owners.join(", ") || "—"}</dd></div>
              <div><dt className="inline text-[var(--muted-foreground)]">অভিভাবক: </dt><dd className="inline">{fallbackGuardians.join(", ") || "—"}</dd></div>
            </dl>
          </section>
        </div>

        <section className="mx-5 mb-5 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">বিস্তারিত তথ্য</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">মালিক</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[var(--foreground)]">
                {(owners.length ? owners : ["—"]).map((owner, index) => (
                  <li key={`${owner}-${index}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <span>{owner}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">অভিভাবক</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[var(--foreground)]">
                {(fallbackGuardians.length ? fallbackGuardians : ["—"]).map((guardian, index) => (
                  <li key={`${guardian}-${index}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <span>{guardian}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">দাগ নম্বর</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(dags.length ? dags : ["—"]).map((dag, index) => (
                <span key={`${dag}-${index}`} className="rounded-full bg-[var(--secondary)] px-3 py-1 text-sm font-semibold text-[var(--primary)]">
                  {dag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {exportError ? (
          <p className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
            {exportError}
          </p>
        ) : null}

        {!resolvedFullKhatian || isIncomplete ? (
          <p className="mx-5 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700" role="status">
            {fullKhatianLoading ? "সম্পূর্ণ খতিয়ানের তথ্য যাচাই হচ্ছে; PDF সাময়িকভাবে বন্ধ।"
              : isIncomplete ? "উৎসে সব মালিক, অভিভাবক বা দাগ প্রকাশিত হয়নি। অসম্পূর্ণ তথ্য দিয়ে সম্পূর্ণ PDF তৈরি বন্ধ।"
              : fullKhatianFailed ? "পূর্ণ রেকর্ড লোড হয়নি। আবার চেষ্টা করুন।"
              : "সম্পূর্ণ রেকর্ড প্রস্তুত হলে PDF অপশন সক্রিয় হবে।"}
          </p>
        ) : null}

        <footer className="flex flex-wrap items-center gap-2 border-t border-[var(--border-color)] px-5 py-4">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={isBusy}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
          >
            <Printer size={16} /> প্রিন্ট করুন
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadPdf("download")}
            disabled={isBusy}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary)] disabled:opacity-50"
          >
            {exporting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Download size={16} />}
            খতিয়ান ডাউনলোড
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadPdf("return")}
            disabled={isBusy}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] disabled:opacity-50"
          >
            <Eye size={16} /> PDF প্রিভিউ
          </button>
          <a
            href="/mouza-map"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)]"
          >
            <Map size={16} /> ফ্রি মৌজা ম্যাপ
          </a>
        </footer>
      </section>

      <div className="khatian-pdf-source-host" aria-hidden="true">
        <AuthoritativeKhatianDetailsView
          khatian={khatian}
          fullKhatian={resolvedFullKhatian}
          surveyKey={surveyKey}
          captureRef={resolvedCaptureRef}
          pageOrientation={pageOrientation}
        />
      </div>

      {resolvedFullKhatian ? (
        <details className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] print:hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--foreground)]">অতিরিক্ত উৎস-তথ্য দেখুন</summary>
          <div className="border-t border-[var(--border-color)] bg-white p-3 text-black">
            <FullKhatianSupplement fullKhatian={resolvedFullKhatian} pageOrientation={pageOrientation} />
          </div>
        </details>
      ) : null}

      {pdfPreview ? <PdfPreviewDialog document={pdfPreview} onClose={() => setPdfPreview(null)} /> : null}
    </div>
  );
}
