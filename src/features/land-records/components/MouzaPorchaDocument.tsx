"use client";

import { useMemo } from "react";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import ReportTable from "./mouza-report/ReportTable";
import CompactHeader from "./mouza-report/ReportHeader";
import LegalDisclaimer from "./mouza-report/LegalDisclaimer";
import "./mouza-report/report-document.css";
import type { KhatianIndex } from "../types";
import {
  buildMouzaReportRows, paginateMouzaReportRows, segmentMouzaReportRows,
  summarizeNumericKhatianGaps, type HalSabekReportState, type MouzaReportOrientation,
} from "../reports/mouza-porcha-report";

export type MouzaPorchaReportMeta = {
  reportId: string;
  generatedAt: string;
  verificationUrl?: string;
  payloadHash?: string;
  verificationRegistered: boolean;
};

type Props = {
  rows: KhatianIndex[];
  halSabek: HalSabekReportState;
  includeHalSabek: boolean;
  expectedRecords: number | null;
  districtName: string;
  upazilaName: string;
  surveyName: string;
  mouzaName: string;
  jlNumber: string;
  reportMeta: MouzaPorchaReportMeta | null;
  pageOrientation: MouzaReportOrientation;
};

function bangla(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function ReportFooter({
  page, total, reportId, generatedLabel,
}: { page: number; total: number; reportId: string; generatedLabel: string }) {
  return <footer className="report-page-footer">
    <div><strong>তথ্যসূত্র</strong><span>DLRMS / সরকারি ভূমি রেকর্ড উৎস</span></div>
    <div className="report-footer-center">
      <strong>পৃষ্ঠা {bangla(page)} / {bangla(total)}</strong>
      <span className="report-latin-id">{reportId}</span>
    </div>
    <div className="report-footer-source"><strong>তৈরির সময়</strong><span>{generatedLabel}</span></div>
    <div className="report-footer-disclaimer">
      এটি সরকারি প্রত্যয়িত পর্চা নয়। দাপ্তরিক বা আইনি ব্যবহারের আগে সরকারি মূল নথির সাথে যাচাই করুন।
    </div>
  </footer>;
}

/**
 * Restores the local LandBD.zip report result's distinct A4 cover sheet
 * followed by compact, numbered, source-driven table pages.
 * The CURRENT safe grouping, pagination and Hal/Sabek mapping remain intact.
 */
export default function MouzaPorchaDocument({
  rows, halSabek, includeHalSabek, expectedRecords,
  districtName, upazilaName, surveyName, mouzaName, jlNumber,
  reportMeta, pageOrientation,
}: Props) {
  const reportRows = useMemo(() => buildMouzaReportRows(rows, halSabek), [rows, halSabek]);
  const segments = useMemo(() => segmentMouzaReportRows(reportRows), [reportRows]);
  const pages = useMemo(
    () => paginateMouzaReportRows(segments, undefined, undefined, pageOrientation),
    [segments, pageOrientation],
  );
  const gapSummary = useMemo(
    () => summarizeNumericKhatianGaps(reportRows.map((row) => row.khatianNo)),
    [reportRows],
  );
  const showHistory = includeHalSabek && reportRows.some((row) => row.history.length > 0);
  const showOwners = reportRows.some((row) => row.owners.length > 0);
  const showGuardians = reportRows.some((row) => row.guardians.length > 0);
  const showDags = reportRows.some((row) => row.dags.length > 0);
  const showLandArea = reportRows.some((row) => Boolean(row.totalLandAcre));

  const mapped = includeHalSabek ? reportRows.filter((row) => row.history.length > 0).length : 0;
  const unmapped = includeHalSabek ? Math.max(0, rows.length - mapped) : 0;
  const completeCount = rows.length;
  const expectedCount = expectedRecords ?? completeCount;
  const isCountComplete = expectedRecords === null || completeCount === expectedRecords;
  const reportId = reportMeta?.reportId ?? "REPORT-ID-PENDING";
  const generatedLabel = reportMeta ? new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Dhaka",
  }).format(new Date(reportMeta.generatedAt)) : "প্রস্তুত হচ্ছে…";
  const totalPages = pages.length + 1;

  if (!rows.length) return null;

  return (
    <section id="mouza-porcha-report" className="landbd-report-font"
      data-result="1" data-bangla-ignore="true" translate="no" aria-label="মৌজা পর্চা রিপোর্ট">
      <div className="report-page-stack">
        <article className={ "report-page report-page-cover report-page-" + pageOrientation }
          data-page-orientation={pageOrientation} data-report-page="cover">
          <div className="report-top-accent" aria-hidden="true"><i/><i/><i/></div>
          <div className="report-watermark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-bangla.svg" alt=""/>
          </div>
          <header className="report-archive-cover-header">
            <div className="report-archive-cover-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-bangla.svg" alt="LandBD" className="report-official-logo"/>
              <p>তথ্যসূত্র: DLRMS ভূমি রেকর্ড</p>
              <strong>সার্ভে: {surveyName || "—"}</strong>
            </div>
            <div className="report-archive-cover-title">
              <span className="report-archive-eyebrow">LAND RECORD SUMMARY</span>
              <h1>মৌজা পর্চা রিপোর্ট</h1>
              <p>{mouzaName || "—"} মৌজা</p>
            </div>
            <div className="report-archive-cover-verification">
              <div className="report-qr-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reportMeta?.verificationRegistered
                    ? "/api/reports/mouza-porcha/qr?id=" + encodeURIComponent(reportId)
                    : "/api/reports/mouza-porcha/qr?target=mouza-porcha-report"}
                  alt={reportMeta?.verificationRegistered ? "LandBD verification QR" : "LandBD report QR"}
                />
                <span>{reportMeta?.verificationRegistered ? "Verify via LandBD" : "Open in LandBD"}</span>
              </div>
              <div className="min-w-0 text-xs">
                <span className="block uppercase tracking-wide text-slate-500">Report ID</span>
                <b className="report-latin-id block break-all">{reportId}</b>
                <strong className="mt-1 block text-emerald-800">
                  {reportMeta?.verificationRegistered ? "QR যাচাই সক্রিয়" : "তথ্যভিত্তিক রিপোর্ট"}
                </strong>
              </div>
            </div>
          </header>

          <div className="report-archive-location">
            <div><span>জেলা</span><strong>{districtName || "—"}</strong></div>
            <div><span>উপজেলা / রাজস্ব সার্কেল</span><strong>{upazilaName || "—"}</strong></div>
            <div><span>মৌজা</span><strong>{mouzaName || "—"}</strong></div>
            <div><span>জে.এল নং</span><strong>{bangla(jlNumber || "—")}</strong></div>
          </div>

          <table className="report-summary-table">
            <tbody>
              <tr>
                <td>মোট খতিয়ান</td><td><strong>{bangla(completeCount)}</strong></td>
                <td>প্রত্যাশিত</td><td><strong>{bangla(expectedCount)}</strong></td>
                <td>তৈরির সময়</td><td><strong>{generatedLabel}</strong></td>
              </tr>
              <tr>
                <td>হাল / সাবেক ম্যাপিং</td>
                <td><strong>{includeHalSabek ? bangla(mapped) + " / " + bangla(completeCount) : "অন্তর্ভুক্ত নয়"}</strong></td>
                <td>সংগ্রহ অবস্থা</td><td><strong>{isCountComplete ? "সংখ্যায় পূর্ণ" : "আংশিক"}</strong></td>
                <td>রিপোর্ট অবস্থা</td>
                <td><strong>{reportMeta?.verificationRegistered ? "যাচাইযোগ্য" : "তথ্যভিত্তিক"}</strong></td>
              </tr>
            </tbody>
          </table>

          {gapSummary.count > 0 && <p className="report-collection-note">
            সংখ্যাগত ধারায় সম্ভাব্য ফাঁক: {bangla(gapSummary.count)}
            {gapSummary.samples.length ? " (নমুনা: " + gapSummary.samples.join(", ") + ")" : ""}।
            এটি সরকারি রেকর্ড অনুপস্থিত থাকার প্রমাণ নয়।
          </p>}
          <p className="report-collection-note">
            সংখ্যায় পূর্ণ মানে শুধু প্রত্যাশিত সংখ্যক খতিয়ান-সূচি পাওয়া গেছে; প্রতিটি মালিক, অভিভাবক ও দাগ সম্পূর্ণ হওয়ার নিশ্চয়তা নয়।
            সম্পূরক তথ্য তৃতীয়-পক্ষের mirror থেকে আসতে পারে; সরকারি মূল নথিতে যাচাই করুন।
          </p>
          {includeHalSabek && unmapped > 0 && <p className="report-collection-note">
            {bangla(unmapped)}টি খতিয়ানে হাল / সাবেক দাগের ম্যাপিং উৎসে পাওয়া যায়নি।
          </p>}
          <LegalDisclaimer />
          <ReportFooter page={1} total={totalPages} reportId={reportId} generatedLabel={generatedLabel} />
          <LandBdPrintRibbon className="report-page-ribbon"/>
        </article>

        {pages.map((pageRows, pageIndex) => {
          const pageStartIndex = pages.slice(0, pageIndex).reduce((sum, item) => sum + item.length, 0);
          return <article
            className={"report-page report-page-content report-page-" + pageOrientation}
            data-page-orientation={pageOrientation}
            data-report-page="content"
            key={"page-" + (pageIndex + 2)}>
            <div className="report-top-accent" aria-hidden="true"><i/><i/><i/></div>
            <div className="report-watermark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-bangla.svg" alt=""/>
            </div>
            <CompactHeader mouzaName={mouzaName} jlNumber={jlNumber}
              surveyName={surveyName} reportId={reportId}/>
            <div className="report-table-wrapper">
              <ReportTable rows={pageRows} showHistory={showHistory}
                showOwners={showOwners} showGuardians={showGuardians}
                showDags={showDags} showLandArea={showLandArea}
                startIndex={pageStartIndex}/>
            </div>
            <ReportFooter page={pageIndex + 2} total={totalPages}
              reportId={reportId} generatedLabel={generatedLabel} />
            <LandBdPrintRibbon className="report-page-ribbon"/>
          </article>;
        })}
      </div>
    </section>
  );
}
