"use client";

import { useMemo } from "react";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import ReportTable from "./mouza-report/ReportTable";
import CompactHeader from "./mouza-report/ReportHeader";
import LegalDisclaimer from "./mouza-report/LegalDisclaimer";
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

export default function MouzaPorchaDocument({
  rows,
  halSabek,
  includeHalSabek,
  expectedRecords,
  districtName,
  upazilaName,
  surveyName,
  mouzaName,
  jlNumber,
  reportMeta,
  pageOrientation,
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
  const mappedKhatianCount = includeHalSabek
    ? reportRows.filter((row) => row.history.length > 0).length
    : 0;
  const unavailableMappingCount = includeHalSabek ? Math.max(0, rows.length - mappedKhatianCount) : 0;
  const completeCount = rows.length;
  const targetCount = expectedRecords ?? completeCount;
  const isCountComplete = expectedRecords === null || completeCount === expectedRecords;
  const reportId = reportMeta?.reportId ?? "REPORT-ID-PENDING";
  const generatedLabel = reportMeta
    ? new Intl.DateTimeFormat("bn-BD", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Asia/Dhaka",
      }).format(new Date(reportMeta.generatedAt))
    : "প্রস্তুত হচ্ছে…";

  if (!rows.length) return null;

  return (
    <section
      id="mouza-porcha-report"
      className="landbd-report-font"
      data-bangla-ignore="true"
      translate="no"
      aria-label="মৌজা পর্চা রিপোর্ট"
    >
      {/* Bundled Bengali webfonts are already loaded by LandBD; no remote font dependency. */}
      <div className="report-page-stack">
        {pages.map((pageRows, pageIndex) => {
          const firstPage = pageIndex === 0;
          const pageStartIndex = pages.slice(0, pageIndex).reduce((sum, item) => sum + item.length, 0);
          return (
            <article
              className={`report-page report-page-${pageOrientation}`}
              data-page-orientation={pageOrientation}
              key={`page-${pageIndex + 1}`}
            >
              <div className="report-top-accent" aria-hidden="true"><i /><i /><i /></div>
              <div className="report-watermark" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo-bangla.svg" alt="" />
              </div>
              {firstPage ? (
                <>
                  <header className="report-document-header">
                    <div className="report-official-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="report-official-logo" src="/brand/logo-bangla.svg" alt="সহজ জমির হিসাব - LandBD" />
                      <p>তথ্যসূত্র : DLRMS ভূমি রেকর্ড</p>
                      <p>সার্ভে : {surveyName || "—"}</p>
                    </div>

                    <div className="report-official-center">
                      <h1>মৌজা পর্চা রিপোর্ট</h1>
                      <p>{mouzaName || "—"} মৌজা</p>
                    </div>

                    <div className="report-official-right">
                      <div className="report-qr-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            reportMeta?.verificationRegistered
                              ? "/api/reports/mouza-porcha/qr?id=" + encodeURIComponent(reportId)
                              : "/api/reports/mouza-porcha/qr?target=mouza-porcha-report"
                          }
                          alt={reportMeta?.verificationRegistered ? "LandBD verification QR" : "LandBD report QR"}
                        />
                        <span>{reportMeta?.verificationRegistered ? "Verify via LandBD" : "Open in LandBD"}</span>
                      </div>
                      <div>
                        <p>Report ID: <b className="report-latin-id">{reportId}</b></p>
                        <p>{reportMeta?.verificationRegistered ? "QR যাচাই সক্রিয়" : "তথ্যভিত্তিক রিপোর্ট"}</p>
                      </div>
                    </div>
                  </header>

                  <div className="report-location-row">
                    <span>জেলা : <strong>{districtName || "—"}</strong></span>
                    <span>উপজেলা / রাজস্ব সার্কেল : <strong>{upazilaName || "—"}</strong></span>
                    <span>মৌজা : <strong>{mouzaName || "—"}</strong></span>
                    <span>জে.এল নং : <strong>{jlNumber || "—"}</strong></span>
                  </div>

                  <table className="report-summary-table">
                    <tbody>
                      <tr>
                        <td>মোট খতিয়ান</td>
                        <td><strong>{completeCount}</strong></td>
                        <td>প্রত্যাশিত</td>
                        <td><strong>{targetCount}</strong></td>
                        <td>তৈরির সময়</td>
                        <td><strong>{generatedLabel}</strong></td>
                      </tr>
                      <tr>
                        <td>হাল/সাবেক mapping</td>
                        <td><strong>{includeHalSabek ? mappedKhatianCount + " / " + completeCount : "অন্তর্ভুক্ত নয়"}</strong></td>
                        <td>সংগ্রহ অবস্থা</td>
                        <td><strong>{isCountComplete ? "সম্পূর্ণ" : "আংশিক"}</strong></td>
                        <td>রিপোর্ট অবস্থা</td>
                        <td><strong>{reportMeta?.verificationRegistered ? "যাচাইযোগ্য" : "তথ্যভিত্তিক"}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  {gapSummary.count > 0 ? (
                    <p className="report-collection-note">
                      সংখ্যাগত ধারায় সম্ভাব্য ফাঁক: {gapSummary.count}
                      {gapSummary.samples.length ? " (নমুনা: " + gapSummary.samples.join(", ") + ")" : ""}।
                      এটি সরকারি রেকর্ড অনুপস্থিত থাকার প্রমাণ নয়।
                    </p>
                  ) : null}

                  {includeHalSabek && unavailableMappingCount > 0 ? (
                    <p className="report-collection-note">
                      {unavailableMappingCount}টি খতিয়ানে হাল/সাবেক mapping প্রকাশিত বা পাওয়া যায়নি।
                    </p>
                  ) : null}

                  <LegalDisclaimer />
                </>
              ) : (
                <CompactHeader
                  mouzaName={mouzaName}
                  jlNumber={jlNumber}
                  surveyName={surveyName}
                  reportId={reportId}
                />
              )}

              <div className="report-table-wrapper">
                <ReportTable
                  rows={pageRows}
                  showHistory={showHistory}
                  showOwners={showOwners}
                  showGuardians={showGuardians}
                  showDags={showDags}
                  showLandArea={showLandArea}
                  startIndex={pageStartIndex}
                />
              </div>

              <footer className="report-page-footer">
                <div>
                  <strong>তথ্যসূত্র</strong>
                  <span>DLRMS / সরকারি ভূমি রেকর্ড উৎস</span>
                </div>
                <div className="report-footer-center">
                  <strong>পৃষ্ঠা {pageIndex + 1} / {pages.length}</strong>
                  <span className="report-latin-id">{reportId}</span>
                </div>
                <div className="report-footer-source">
                  <strong>তৈরির সময়</strong>
                  <span>{generatedLabel}</span>
                </div>
                <div className="report-footer-disclaimer">
                  এটি সরকারি প্রত্যয়িত পর্চা নয়। দাপ্তরিক বা আইনি ব্যবহারের আগে সরকারি মূল নথির সাথে যাচাই করুন।
                </div>
              </footer>
              <LandBdPrintRibbon className="report-page-ribbon" />
            </article>
          );
        })}
      </div>

      
    </section>
  );
}
