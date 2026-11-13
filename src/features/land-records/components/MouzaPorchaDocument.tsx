"use client";

import { useMemo } from "react";
import ReportTable from "./mouza-report/ReportTable";
import "./mouza-report/report-document.css";
import type { KhatianIndex } from "../types";
import {
  buildMouzaReportRows,
  paginateMouzaReportRows,
  segmentMouzaReportRows,
  summarizeNumericKhatianGaps,
  type HalSabekReportState,
  type MouzaReportOrientation,
} from "../reports/mouza-porcha-report";

export type MouzaPorchaReportMeta = {
  reportId: string;
  generatedAt: string;
  verificationUrl?: string;
  payloadHash?: string;
  verificationRegistered: boolean;
};

export type MouzaKhatianBookVariant = "book" | "legacy" | "monochrome";

type Props = {
  rows: KhatianIndex[];
  halSabek: HalSabekReportState;
  includeHalSabek: boolean;
  expectedRecords: number | null;
  divisionName: string;
  districtName: string;
  upazilaName: string;
  surveyName: string;
  mouzaName: string;
  jlNumber: string;
  reportMeta: MouzaPorchaReportMeta | null;
  pageOrientation: MouzaReportOrientation;
  variant?: MouzaKhatianBookVariant;
};

const bnDigits = "০১২৩৪৫৬৭৮৯";
const arDigits = "٠١٢٣٤٥٦٧٨٩";

function toBanglaNumber(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => bnDigits[Number(digit)]);
}

function numericLand(value: string): number {
  const latin = value
    .replace(/[০-৯]/g, (digit) => String(bnDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arDigits.indexOf(digit)))
    .replace(/[^d.+-]/g, "");
  const parsed = Number(latin);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function MouzaPorchaDocument({
  rows,
  halSabek,
  includeHalSabek,
  expectedRecords,
  divisionName,
  districtName,
  upazilaName,
  surveyName,
  mouzaName,
  jlNumber,
  reportMeta,
  pageOrientation,
  variant = "book",
}: Props) {
  const reportRows = useMemo(() => buildMouzaReportRows(rows, halSabek), [rows, halSabek]);
  const segments = useMemo(() => segmentMouzaReportRows(reportRows), [reportRows]);
  const pages = useMemo(
    () => paginateMouzaReportRows(segments, 48, 48, pageOrientation),
    [segments, pageOrientation],
  );
  const gapSummary = useMemo(
    () => summarizeNumericKhatianGaps(reportRows.map((row) => row.khatianNo)),
    [reportRows],
  );
  const totalLand = useMemo(
    () => reportRows.reduce((sum, row) => sum + numericLand(row.totalLandAcre), 0),
    [reportRows],
  );

  const showHistory = includeHalSabek && reportRows.some((row) => row.history.length > 0);
  const showOwners = reportRows.some((row) => row.owners.length > 0);
  const showGuardians = reportRows.some((row) => row.guardians.length > 0);
  const showDags = reportRows.some((row) => row.dags.length > 0);
  const showLandArea = reportRows.some((row) => Boolean(row.totalLandAcre));
  const completeCount = rows.length;
  const targetCount = expectedRecords ?? completeCount;
  const isCountComplete = expectedRecords === null || completeCount === expectedRecords;
  const referenceEnrichedCount = rows.filter((row) =>
    row.LANDBD_REFERENCE_ENRICHMENT?.source === "LANDBD_BUNDLED_REFERENCE"
  ).length;
  const reportId = reportMeta?.reportId ?? "REPORT-ID-PENDING";
  const generatedDate = reportMeta
    ? new Intl.DateTimeFormat("bn-BD", {
        dateStyle: "long",
        timeZone: "Asia/Dhaka",
      }).format(new Date(reportMeta.generatedAt))
    : "প্রস্তুত হচ্ছে…";
  const totalPages = pages.length + 1;

  if (!rows.length) return null;

  return (
    <section
      id="mouza-porcha-report"
      className={`landbd-report-font report-variant-${variant}`}
      data-bangla-ignore="true"
      translate="no"
      aria-label="মৌজা ভিত্তিক খতিয়ান বই"
    >
      <div className="report-page-stack">
        <article className="report-page report-page-portrait report-cover-page" data-page-orientation="portrait">
          <div className="report-cover-hero">
            <div className="report-cover-brand-row">
              <strong>landbd.pincodeit.com</strong>
              <span>ডিজিটাল ভূমি রেকর্ড</span>
            </div>
            <div className="report-cover-rule" />
            <p className="report-cover-eyebrow">LAND RECORDS / MOUZA COLLECTION</p>
            <h1>মৌজা ভিত্তিক<br /><em>খতিয়ান বই</em></h1>
            <p className="report-cover-survey">{surveyName || "সার্ভে"} জরিপ • সম্পূর্ণ খতিয়ান তালিকা</p>
            <div className="report-cover-map-lines" aria-hidden="true">
              <i /><i /><i /><i />
            </div>
            <div className="report-cover-bottom-copy">
              <span>ভূমির তথ্য, এক মলাটে।</span>
              <b>{(surveyName || "RECORD").toUpperCase()} / RECORD BOOK</b>
            </div>
          </div>

          <div className="report-cover-body">
            <p className="report-cover-label">নির্বাচিত মৌজা</p>
            <h2>{mouzaName || "—"}</h2>

            <div className="report-cover-meta-grid">
              <div><span>বিভাগ</span><strong>{divisionName || "—"}</strong></div>
              <div><span>জেলা</span><strong>{districtName || "—"}</strong></div>
              <div><span>উপজেলা / থানা</span><strong>{upazilaName || "—"}</strong></div>
              <div><span>মৌজা</span><strong>{mouzaName || "—"}</strong></div>
              <div><span>জে.এল. নম্বর</span><strong>{jlNumber || "—"}</strong></div>
              <div><span>জরিপ</span><strong>{surveyName || "—"}</strong></div>
            </div>

            <div className="report-cover-stats">
              <div>
                <span>মোট খতিয়ান</span>
                <strong>{toBanglaNumber(completeCount)}</strong>
              </div>
              <div>
                <span>মোট জমি (একর)</span>
                <strong>{toBanglaNumber(totalLand.toFixed(2))}</strong>
              </div>
            </div>

            <p className="report-cover-date">প্রস্তুতের তারিখ: {generatedDate}</p>
            <p className="report-cover-disclaimer">
              এটি তথ্যের সংকলন, প্রত্যয়িত পর্চা নয়। শুধুমাত্র দেখার জন্য; সরকারি বা আইনি কাজে ব্যবহারের আগে সরকারি মূল রেকর্ড যাচাই করুন।
            </p>
            <p className="report-cover-integrity">
              সূচি: {isCountComplete ? "সংখ্যায় পূর্ণ" : `${completeCount} / ${targetCount}`} ·
              সম্ভাব্য সংখ্যাগত ফাঁক: {gapSummary.count} ·
              reference-enriched row: {referenceEnrichedCount} ·
              Report ID: <span className="report-latin-id">{reportId}</span>
            </p>
          </div>

          <footer className="report-book-footer report-page-footer">
            <span>landbd.pincodeit.com · ভূমি রেকর্ড ও মৌজা ম্যাপ</span>
            <span>পৃষ্ঠা নং ১ / {toBanglaNumber(totalPages)}</span>
          </footer>
        </article>

        {pages.map((pageRows, pageIndex) => (
          <article
            className="report-page report-page-portrait report-book-data-page"
            data-page-orientation="portrait"
            key={`page-${pageIndex + 2}`}
          >
            <header className="report-book-header">
              <div className="report-book-header-top">landbd.pincodeit.com / মৌজা ভিত্তিক খতিয়ান বই</div>
              <h2>{mouzaName || "—"} · {surveyName || "—"}</h2>
              <div className="report-book-header-meta">
                <span>জেলা: {districtName || "—"}</span>
                <span>উপজেলা: {upazilaName || "—"}</span>
                <span>জে.এল.: {jlNumber || "—"}</span>
                <span>খতিয়ান: {toBanglaNumber(completeCount)}</span>
              </div>
            </header>

            <div className="report-table-wrapper">
              <ReportTable
                rows={pageRows}
                showHistory={showHistory}
                showOwners={showOwners}
                showGuardians={showGuardians}
                showDags={showDags}
                showLandArea={showLandArea}
              />
            </div>

            <footer className="report-book-footer report-page-footer">
              <span>landbd.pincodeit.com · ভূমি রেকর্ড ও মৌজা ম্যাপ</span>
              <span>পৃষ্ঠা নং {toBanglaNumber(pageIndex + 2)} / {toBanglaNumber(totalPages)}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
