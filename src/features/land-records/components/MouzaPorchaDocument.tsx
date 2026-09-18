"use client";

import { useMemo } from "react";
import type { KhatianIndex } from "../types";
import {
  buildMouzaReportRows,
  paginateMouzaReportRows,
  segmentMouzaReportRows,
  summarizeNumericKhatianGaps,
  type HalSabekReportState,
  type MouzaReportRowSegment,
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
};

function MultiValueCell({ items }: { items: string[] }) {
  if (!items.length) return <span className="report-empty">—</span>;
  return (
    <span className="report-cell-list">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="report-cell-item">
          {item}
        </span>
      ))}
    </span>
  );
}

function DagHistoryCell({ history }: { history: MouzaReportRowSegment["history"] }) {
  if (!history.length) return <span className="report-empty">—</span>;
  return (
    <span className="report-history-list">
      {history.map((item, index) => (
        <span key={`${item.previousDag}-${item.currentDag}-${index}`} className="report-history-item">
          <span className="report-history-label">সাবেক</span> {item.previousDag || "—"}
          <span className="report-history-arrow">→</span>
          <span className="report-history-label">হাল</span> {item.currentDag || "—"}
        </span>
      ))}
    </span>
  );
}

function CompactHeader({
  mouzaName,
  jlNumber,
  surveyName,
  reportId,
}: {
  mouzaName: string;
  jlNumber: string;
  surveyName: string;
  reportId: string;
}) {
  return (
    <div className="report-repeat-header">
      <div>
        <strong>LandBD — মৌজা পর্চা রিপোর্ট</strong>
        <span>{mouzaName} · JL {jlNumber} · {surveyName}</span>
      </div>
      <span className="report-repeat-id">{reportId}</span>
    </div>
  );
}

function LegalDisclaimer() {
  return (
    <aside className="report-legal-disclaimer">
      <strong>LandBD তথ্যভিত্তিক প্রতিবেদন</strong>
      <p>এটি সরকারি প্রত্যয়িত পর্চা, খতিয়ান বা মালিকানা সনদ নয়। শুধুমাত্র তথ্যসূত্র হিসেবে ব্যবহার করুন।</p>
      <p>আইনি, নিবন্ধন, নামজারি, আদালত বা অন্য কোনো দাপ্তরিক কাজে ব্যবহারের আগে সংশ্লিষ্ট সরকারি রেকর্ড ও প্রত্যয়িত কপির সাথে তথ্য যাচাই করা আবশ্যক।</p>
      <p lang="en">LandBD is not responsible for any legal use of this document without verification against the relevant official government record.</p>
    </aside>
  );
}

function ReportTable({
  rows,
  showHistory,
}: {
  rows: MouzaReportRowSegment[];
  showHistory: boolean;
}) {
  return (
    <table className={`report-table ${showHistory ? "report-table-history" : ""}`}>
      <colgroup>
        {showHistory ? (
          <>
            <col style={{ width: "8%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "10%" }} />
          </>
        ) : (
          <>
            <col style={{ width: "9%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "12%" }} />
          </>
        )}
      </colgroup>
      <thead>
        <tr>
          <th>খতিয়ান নং</th>
          <th>মালিকের নাম</th>
          <th>অভিভাবক / সম্পর্ক</th>
          <th>দাগ নং</th>
          {showHistory ? <th>দাগ পরিবর্তন (সাবেক → হাল)</th> : null}
          <th>জমির পরিমাণ (একর)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.segmentKey}>
            <td className="report-khatian-number">{row.khatianNo || "—"}</td>
            <td><MultiValueCell items={row.owners} /></td>
            <td><MultiValueCell items={row.guardians} /></td>
            <td className="report-dag-cell"><MultiValueCell items={row.dags} /></td>
            {showHistory ? <td className="report-dag-cell"><DagHistoryCell history={row.history} /></td> : null}
            <td className="report-land-area">{row.totalLandAcre ? `${row.totalLandAcre} একর` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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
}: Props) {
  const reportRows = useMemo(() => buildMouzaReportRows(rows, halSabek), [rows, halSabek]);
  const segments = useMemo(() => segmentMouzaReportRows(reportRows), [reportRows]);
  const pages = useMemo(() => paginateMouzaReportRows(segments), [segments]);
  const gapSummary = useMemo(
    () => summarizeNumericKhatianGaps(reportRows.map((row) => row.khatianNo)),
    [reportRows],
  );

  const showHistory = includeHalSabek && reportRows.some((row) => row.history.length > 0);
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
      <div className="report-page-stack">
        {pages.map((pageRows, pageIndex) => {
          const firstPage = pageIndex === 0;
          return (
            <article className="report-page" key={`page-${pageIndex + 1}`}>
              <div className="report-watermark" aria-hidden="true">
                <span>LandBD</span>
                <small>তথ্যভিত্তিক প্রতিবেদন</small>
              </div>

              {firstPage ? (
                <>
                  <header className="report-document-header">
                    <div className="report-brand-lockup">
                      <div className="report-brand-mark" aria-label="LandBD logo">LB</div>
                      <div>
                        <div className="report-brand-name">LandBD</div>
                        <h1>মৌজা-ভিত্তিক পর্চা / খতিয়ান প্রতিবেদন</h1>
                        <p>{mouzaName} মৌজা · {surveyName}</p>
                      </div>
                    </div>
                    <div className="report-header-right">
                      {reportMeta?.verificationRegistered ? (
                        <div className="report-qr-box">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/reports/mouza-porcha/qr?id=${encodeURIComponent(reportId)}`}
                            alt="LandBD রিপোর্ট যাচাই QR"
                          />
                          <span>QR স্ক্যান করে যাচাই করুন</span>
                        </div>
                      ) : (
                        <div className="report-qr-unavailable">QR verification<br />unavailable</div>
                      )}
                    </div>
                  </header>

                  <div className="report-meta-grid">
                    <div><span>জেলা</span><strong>{districtName || "—"}</strong></div>
                    <div><span>উপজেলা</span><strong>{upazilaName || "—"}</strong></div>
                    <div><span>সার্ভে</span><strong>{surveyName || "—"}</strong></div>
                    <div><span>মৌজা</span><strong>{mouzaName || "—"}</strong></div>
                    <div><span>JL নং</span><strong>{jlNumber || "—"}</strong></div>
                    <div><span>মোট খতিয়ান</span><strong>{completeCount}</strong></div>
                    <div><span>Report ID</span><strong className="report-latin-id">{reportId}</strong></div>
                    <div><span>তৈরির সময়</span><strong>{generatedLabel}</strong></div>
                  </div>

                  <LegalDisclaimer />

                  <section className={`report-completeness ${isCountComplete ? "is-complete" : "is-warning"}`}>
                    <div className="report-completeness-main">
                      <strong>ডেটা সংগ্রহের অবস্থা</strong>
                      <span>সফলভাবে সংগৃহীত: <b>{completeCount} / {targetCount}</b> | কিছু খতিয়ান নম্বর অনুপস্থিত থাকতে পারে</span>
                    </div>
                    <div className="report-completeness-details">
                      {includeHalSabek ? (
                        <span>হাল/সাবেক mapping পাওয়া গেছে: <b>{mappedKhatianCount} / {completeCount}</b>{unavailableMappingCount ? ` · ${unavailableMappingCount}টিতে mapping প্রকাশিত/পাওয়া যায়নি` : ""}</span>
                      ) : (
                        <span>হাল/সাবেক mapping এই রিপোর্টে অন্তর্ভুক্ত করা হয়নি।</span>
                      )}
                      {gapSummary.count > 0 ? (
                        <span>
                          সংখ্যাগত ধারায় সম্ভাব্য ফাঁক: <b>{gapSummary.count}</b>
                          {gapSummary.samples.length ? ` (নমুনা: ${gapSummary.samples.join(", ")})` : ""}। এটি সরকারি রেকর্ড অনুপস্থিত থাকার প্রমাণ নয়।
                        </span>
                      ) : (
                        <span>সংখ্যাগত ধারায় দৃশ্যমান ফাঁক শনাক্ত হয়নি; ভগ্নাংশ/বিশেষ খতিয়ান নম্বর আলাদাভাবে গণ্য।</span>
                      )}
                      {includeHalSabek && !showHistory ? (
                        <span className="report-history-note">কোনো ব্যবহারযোগ্য হাল/সাবেক mapping না থাকায় দাগ পরিবর্তন কলামটি লুকানো হয়েছে।</span>
                      ) : null}
                    </div>
                  </section>
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
                <ReportTable rows={pageRows} showHistory={showHistory} />
              </div>

              <footer className="report-page-footer">
                <div className="report-footer-top">
                  <span className="report-latin-id">{reportId}</span>
                  <strong>Page {pageIndex + 1} of {pages.length}</strong>
                  <span>{generatedLabel}</span>
                </div>
                <div className="report-footer-disclaimer">
                  এটি সরকারি প্রত্যয়িত পর্চা নয় — LandBD তথ্যভিত্তিক প্রতিবেদন। সরকারি রেকর্ডের সাথে যাচাই করুন।
                </div>
              </footer>
            </article>
          );
        })}
      </div>

      <style jsx global>{`
        .landbd-report-font,
        .landbd-report-font * {
          font-family: var(--font-noto-bengali), "Noto Sans Bengali", "Nirmala UI", sans-serif !important;
          font-synthesis: none !important;
          text-rendering: optimizeLegibility;
        }

        .report-page-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          overflow-x: auto;
          padding: 2px 2px 24px;
        }

        .report-page {
          position: relative;
          box-sizing: border-box;
          width: 297mm;
          min-height: 210mm;
          overflow: hidden;
          padding: 8mm 8mm 17mm;
          background: #fff;
          color: #172033;
          border: 1px solid #d8dee8;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          font-size: 8.2pt;
          line-height: 1.42;
        }

        .report-page > :not(.report-watermark) {
          position: relative;
          z-index: 1;
        }

        .report-watermark {
          position: absolute;
          z-index: 0;
          top: 50%;
          left: 50%;
          display: flex;
          width: 72%;
          transform: translate(-50%, -50%) rotate(-31deg);
          transform-origin: center;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          color: rgba(0, 106, 78, 0.055);
          text-align: center;
          white-space: nowrap;
        }

        .report-watermark span {
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 58pt;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .report-watermark small {
          margin-top: 1mm;
          font-size: 15pt;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .report-document-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10mm;
          padding-bottom: 3mm;
          border-bottom: 1.5pt solid #006a4e;
        }

        .report-brand-lockup {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 4mm;
        }

        .report-brand-mark {
          display: flex;
          width: 15mm;
          height: 15mm;
          flex: 0 0 15mm;
          align-items: center;
          justify-content: center;
          border-radius: 4mm;
          background: #006a4e;
          color: #fff;
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 16pt;
          font-weight: 800;
          letter-spacing: -0.5pt;
          box-shadow: inset 0 -2mm 0 #f5b400;
        }

        .report-brand-name,
        .report-latin-id,
        .report-repeat-id,
        .report-footer-top strong,
        .report-qr-unavailable,
        .report-legal-disclaimer p[lang="en"] {
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
        }

        .report-brand-name {
          color: #006a4e;
          font-size: 9pt;
          font-weight: 800;
          letter-spacing: 0.7pt;
          text-transform: uppercase;
        }

        .report-document-header h1 {
          margin: 0.7mm 0 0;
          color: #0f172a;
          font-size: 17pt;
          font-weight: 700;
          line-height: 1.25;
        }

        .report-document-header p {
          margin: 1mm 0 0;
          color: #64748b;
          font-size: 8pt;
          font-weight: 600;
        }

        .report-header-right {
          flex: 0 0 auto;
        }

        .report-qr-box {
          width: 28mm;
          text-align: center;
          color: #64748b;
          font-size: 5.8pt;
          line-height: 1.25;
        }

        .report-qr-box img {
          display: block;
          width: 22mm;
          height: 22mm;
          margin: 0 auto 0.7mm;
          object-fit: contain;
        }

        .report-qr-unavailable {
          width: 25mm;
          padding: 3mm 1mm;
          border: 0.6pt dashed #cbd5e1;
          color: #94a3b8;
          font-size: 6pt;
          line-height: 1.35;
          text-align: center;
        }

        .report-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.5pt;
          margin: 3mm 0;
          border: 0.6pt solid #cbd5e1;
          background: #cbd5e1;
        }

        .report-meta-grid > div {
          min-width: 0;
          padding: 1.8mm 2.4mm;
          background: rgba(255, 255, 255, 0.92);
        }

        .report-meta-grid span {
          display: block;
          margin-bottom: 0.5mm;
          color: #64748b;
          font-size: 6.3pt;
          font-weight: 600;
        }

        .report-meta-grid strong {
          display: block;
          overflow-wrap: break-word;
          color: #0f172a;
          font-size: 7.4pt;
          font-weight: 700;
        }

        .report-latin-id {
          letter-spacing: 0.15pt;
        }

        .report-legal-disclaimer {
          margin: 3mm 0;
          padding: 2.5mm 3mm;
          border: 1.2pt solid #b91c1c;
          border-radius: 1.5mm;
          background: rgba(255, 241, 242, 0.94);
          color: #7f1d1d;
          line-height: 1.45;
        }

        .report-legal-disclaimer strong {
          display: block;
          margin-bottom: 0.7mm;
          font-size: 8.2pt;
        }

        .report-legal-disclaimer p {
          margin: 0.4mm 0;
          font-size: 6.7pt;
        }

        .report-legal-disclaimer p[lang="en"] {
          font-size: 6.2pt;
        }

        .report-completeness {
          display: grid;
          grid-template-columns: 0.85fr 1.5fr;
          gap: 3mm;
          margin-bottom: 3mm;
          padding: 2.4mm 3mm;
          border: 0.6pt solid #bbd7c9;
          border-left: 2.2pt solid #006a4e;
          background: rgba(242, 251, 247, 0.94);
          color: #173b2c;
          font-size: 6.6pt;
        }

        .report-completeness.is-warning {
          border-color: #f5d58b;
          border-left-color: #b7791f;
          background: rgba(255, 250, 240, 0.95);
          color: #6b4612;
        }

        .report-completeness-main,
        .report-completeness-details {
          display: flex;
          flex-direction: column;
          gap: 0.7mm;
        }

        .report-completeness-main strong {
          font-size: 7.3pt;
        }

        .report-history-note {
          color: #475569;
          font-style: italic;
        }

        .report-repeat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6mm;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 1.2pt solid #006a4e;
        }

        .report-repeat-header > div {
          min-width: 0;
        }

        .report-repeat-header strong {
          display: block;
          color: #0f172a;
          font-size: 9pt;
        }

        .report-repeat-header span {
          display: block;
          margin-top: 0.5mm;
          color: #64748b;
          font-size: 6.5pt;
        }

        .report-repeat-header .report-repeat-id {
          flex: 0 0 auto;
          color: #334155;
          font-size: 6.4pt;
          font-weight: 700;
        }

        .report-table-wrapper {
          width: 100%;
          overflow: visible;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 7.1pt;
          line-height: 1.38;
        }

        .report-table thead {
          display: table-header-group;
        }

        .report-table th {
          padding: 1.5mm 1.4mm;
          border: 1px solid #b9c5d3;
          background: #006a4e;
          color: #fff;
          font-weight: 700;
          text-align: left;
          vertical-align: middle;
        }

        .report-table td {
          padding: 1.35mm 1.4mm;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          text-align: left;
          vertical-align: top;
          white-space: normal;
          word-break: normal;
          overflow-wrap: anywhere;
          background: rgba(255, 255, 255, 0.82);
        }

        .report-table tbody tr:nth-child(even) td {
          background: rgba(248, 250, 252, 0.86);
        }

        .report-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .report-cell-list,
        .report-history-list {
          display: inline;
        }

        .report-cell-item,
        .report-history-item {
          display: inline;
        }

        .report-cell-item:not(:last-child)::after,
        .report-history-item:not(:last-child)::after {
          content: ", ";
          color: #94a3b8;
        }

        .report-empty {
          color: #94a3b8;
        }

        .report-khatian-number,
        .report-dag-cell,
        .report-land-area {
          font-variant-numeric: tabular-nums;
        }

        .report-khatian-number {
          color: #0f172a !important;
          font-weight: 700;
        }

        .report-land-area {
          font-weight: 700;
        }

        .report-history-label {
          color: #475569;
          font-size: 0.92em;
          font-weight: 700;
        }

        .report-history-arrow {
          display: inline-block;
          margin: 0 0.65mm;
          color: #006a4e;
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-weight: 700;
        }

        .report-page-footer {
          position: absolute !important;
          z-index: 2 !important;
          right: 8mm;
          bottom: 5mm;
          left: 8mm;
          color: #64748b;
          font-size: 5.8pt;
          line-height: 1.35;
        }

        .report-footer-top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 3mm;
          padding-top: 1.2mm;
          border-top: 1px solid #cbd5e1;
        }

        .report-footer-top > :last-child {
          text-align: right;
        }

        .report-footer-top strong {
          color: #334155;
          font-size: 6pt;
        }

        .report-footer-disclaimer {
          margin-top: 0.8mm;
          text-align: center;
          color: #7f1d1d;
          font-size: 5.7pt;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .report-page-stack {
            align-items: flex-start;
          }
          .report-page {
            transform-origin: top left;
          }
        }

        @media print {
          @page {
            size: auto;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body > * {
            visibility: hidden !important;
          }

          #mouza-porcha-report,
          #mouza-porcha-report * {
            visibility: visible !important;
          }

          #mouza-porcha-report {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .report-page-stack {
            display: block !important;
            width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
          }

          .report-page {
            width: 100vw !important;
            height: 100vh !important;
            min-height: 100vh !important;
            margin: 0 !important;
            overflow: hidden !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .report-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .report-table-wrapper {
            overflow: visible !important;
          }

          nav,
          .report-controls,
          .report-actions,
          footer:not(.report-page-footer) {
            display: none !important;
          }
        }

        @media print and (orientation: landscape) {
          .report-page {
            padding: 7mm 8mm 16mm !important;
          }

          .report-table {
            font-size: 7pt !important;
            line-height: 1.34 !important;
          }

          .report-table th {
            padding: 1.35mm 1.3mm !important;
          }

          .report-table td {
            padding: 1.15mm 1.3mm !important;
          }
        }

        @media print and (orientation: portrait) {
          .report-page {
            padding: 7mm 6.5mm 16mm !important;
          }

          .report-document-header {
            gap: 5mm !important;
            padding-bottom: 2mm !important;
          }

          .report-brand-mark {
            width: 12mm !important;
            height: 12mm !important;
            flex-basis: 12mm !important;
            border-radius: 3mm !important;
            font-size: 12.5pt !important;
          }

          .report-brand-name {
            font-size: 7.5pt !important;
          }

          .report-document-header h1 {
            margin-top: 0.4mm !important;
            font-size: 13pt !important;
          }

          .report-document-header p {
            margin-top: 0.5mm !important;
            font-size: 6.8pt !important;
          }

          .report-qr-box {
            width: 22mm !important;
            font-size: 5.2pt !important;
          }

          .report-qr-box img {
            width: 18mm !important;
            height: 18mm !important;
          }

          .report-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            margin: 2mm 0 !important;
          }

          .report-meta-grid > div {
            padding: 1.2mm 1.7mm !important;
          }

          .report-meta-grid span {
            margin-bottom: 0.25mm !important;
            font-size: 5.5pt !important;
          }

          .report-meta-grid strong {
            font-size: 6.5pt !important;
          }

          .report-legal-disclaimer {
            margin: 2mm 0 !important;
            padding: 1.7mm 2mm !important;
            line-height: 1.32 !important;
          }

          .report-legal-disclaimer strong {
            margin-bottom: 0.35mm !important;
            font-size: 7.1pt !important;
          }

          .report-legal-disclaimer p {
            margin: 0.2mm 0 !important;
            font-size: 5.8pt !important;
          }

          .report-legal-disclaimer p[lang="en"] {
            font-size: 5.3pt !important;
          }

          .report-completeness {
            grid-template-columns: 1fr !important;
            gap: 1mm !important;
            margin-bottom: 2mm !important;
            padding: 1.7mm 2mm !important;
            font-size: 5.7pt !important;
          }

          .report-completeness-main strong {
            font-size: 6.4pt !important;
          }

          .report-repeat-header {
            gap: 3mm !important;
            margin-bottom: 2mm !important;
            padding-bottom: 1.5mm !important;
          }

          .report-repeat-header strong {
            font-size: 7.4pt !important;
          }

          .report-repeat-header span,
          .report-repeat-header .report-repeat-id {
            font-size: 5.5pt !important;
          }

          .report-table {
            font-size: 6.05pt !important;
            line-height: 1.28 !important;
          }

          .report-table th {
            padding: 1.05mm 0.8mm !important;
          }

          .report-table td {
            padding: 0.9mm 0.8mm !important;
          }

          .report-page-footer {
            right: 6.5mm !important;
            bottom: 4mm !important;
            left: 6.5mm !important;
            font-size: 5.1pt !important;
          }

          .report-footer-top strong {
            font-size: 5.2pt !important;
          }

          .report-footer-disclaimer {
            margin-top: 0.5mm !important;
            font-size: 5pt !important;
          }

          .report-watermark span {
            font-size: 44pt !important;
          }

          .report-watermark small {
            font-size: 11pt !important;
          }
        }
      `}</style>
    </section>
  );
}
