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
    <header className="report-repeat-header">
      <div>
        <strong className="report-repeat-title">মৌজা পর্চা রিপোর্ট</strong>
        <small>{mouzaName} · জে.এল {jlNumber || "—"} · {surveyName}</small>
      </div>
      <div className="report-repeat-meta">
        <span>Report ID</span>
        <b className="report-repeat-id">{reportId}</b>
      </div>
    </header>
  );
}

function LegalDisclaimer() {
  return (
    <aside className="report-legal-disclaimer">
      <div className="report-disclaimer-badge">গুরুত্বপূর্ণ</div>
      <div>
        <strong>এটি সরকারি প্রত্যয়িত পর্চা, খতিয়ান বা মালিকানা সনদ নয়।</strong>
        <p>
          এই তথ্যগুলো অনুসন্ধান, তুলনা ও রেফারেন্সের সুবিধার জন্য সাজানো হয়েছে। আইনি, নিবন্ধন,
          নামজারি, আদালত বা অন্য কোনো দাপ্তরিক কাজে ব্যবহারের আগে সংশ্লিষ্ট সরকারি রেকর্ড ও
          প্রত্যয়িত কপির সাথে তথ্য যাচাই করা আবশ্যক।
        </p>
        <p lang="en">
          Informational report only. Verify against the relevant official government record before legal or official use.
        </p>
      </div>
    </aside>
  );
}

function ReportTable({
  rows,
  showHistory,
  showOwners,
  showGuardians,
  showDags,
  showLandArea,
  startIndex,
}: {
  rows: MouzaReportRowSegment[];
  showHistory: boolean;
  showOwners: boolean;
  showGuardians: boolean;
  showDags: boolean;
  showLandArea: boolean;
  startIndex: number;
}) {
  const numberLabels = ["১", "২", "৩", "৪", "৫", "৬", "৭"];
  const columns = [
    { key: "serial", label: "ক্রম", weight: 6, visible: true },
    { key: "khatian", label: "খতিয়ান নং", weight: 11, visible: true },
    { key: "owners", label: "মালিকের নাম", weight: 24, visible: showOwners },
    { key: "guardians", label: "অভিভাবক / সম্পর্ক", weight: 20, visible: showGuardians },
    { key: "dags", label: "দাগ নং", weight: 14, visible: showDags },
    { key: "history", label: "দাগ পরিবর্তন (সাবেক → হাল)", weight: 19, visible: showHistory },
    { key: "landArea", label: "জমির পরিমাণ (একর)", weight: 10, visible: showLandArea },
  ].filter((column) => column.visible);
  const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);

  return (
    <table className={showHistory ? "report-table report-table-history" : "report-table"}>
      <colgroup>
        {columns.map((column) => (
          <col
            key={column.key}
            style={{ width: `${((column.weight / totalWeight) * 100).toFixed(2)}%` }}
          />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column) => <th key={column.key}>{column.label}</th>)}
        </tr>
        <tr className="report-column-numbers">
          {columns.map((column, index) => <th key={column.key}>{numberLabels[index]}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.segmentKey}>
            {columns.map((column) => {
              if (column.key === "serial") {
                return <td key={column.key} className="report-serial-number">{startIndex + index + 1}</td>;
              }
              if (column.key === "khatian") {
                return <td key={column.key} className="report-khatian-number">{row.khatianNo || "—"}</td>;
              }
              if (column.key === "owners") {
                return <td key={column.key}><MultiValueCell items={row.owners} /></td>;
              }
              if (column.key === "guardians") {
                return <td key={column.key}><MultiValueCell items={row.guardians} /></td>;
              }
              if (column.key === "dags") {
                return <td key={column.key} className="report-dag-cell"><MultiValueCell items={row.dags} /></td>;
              }
              if (column.key === "history") {
                return <td key={column.key} className="report-dag-cell"><DagHistoryCell history={row.history} /></td>;
              }
              return (
                <td key={column.key} className="report-land-area">
                  {row.totalLandAcre ? row.totalLandAcre + " একর" : "—"}
                </td>
              );
            })}
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
      <style>{`@import url("https://fonts.maateen.me/kalpurush/font.css");`}</style>
      <div className="report-page-stack">
        {pages.map((pageRows, pageIndex) => {
          const firstPage = pageIndex === 0;
          const pageStartIndex = pages.slice(0, pageIndex).reduce((sum, item) => sum + item.length, 0);
          return (
            <article className="report-page" key={`page-${pageIndex + 1}`}>
              <div className="report-top-accent" aria-hidden="true"><i /><i /><i /></div>
              <div className="report-watermark" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/landbd-symbol-2026.svg" alt="" />
                <span>LANDBD</span>
                <small>সহজ জমির হিসাব</small>
              </div>
              {firstPage ? (
                <>
                  <header className="report-document-header">
                    <div className="report-official-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="report-official-logo" src="/brand/landbd-logo-horizontal.svg" alt="LandBD" />
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
                <div className="report-footer-brand-strip" aria-label="LandBD brand principles">
                  <span>সহজ জমির হিসাব</span>
                  <span>ডিজিটাল ভূমি তথ্য</span>
                  <span>যাচাই করে ব্যবহার</span>
                </div>
              </footer>
            </article>
          );
        })}
      </div>

      <style jsx global>{`
        .landbd-report-font,
        .landbd-report-font * {
          font-family: "Kalpurush", "Noto Serif Bengali", "Nirmala UI", serif !important;
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
          --report-primary: #0b5d3b;
          --report-field: #18a363;
          --report-teal: #0c7f7a;
          --report-alert: #c83a3a;
          --report-gold: #d6a124;
          --report-ink: #12221a;
          --report-muted: #607068;
          --report-border: #dde7e1;
          --report-canvas: #f5f8f6;
          --report-mist: #e7efea;
          position: relative;
          box-sizing: border-box;
          width: 210mm;
          min-height: 297mm;
          overflow: hidden;
          padding: 8mm 7mm 19mm;
          background: #fff;
          color: var(--report-ink);
          border: 1px solid var(--report-border);
          box-shadow: 0 10px 30px rgba(11, 45, 30, 0.08);
          font-size: 7.6pt;
          line-height: 1.38;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .report-page > :not(.report-watermark):not(.report-top-accent) {
          position: relative;
          z-index: 2;
        }

        .report-top-accent {
          position: absolute;
          inset: 0 0 auto;
          z-index: 3;
          display: grid;
          grid-template-columns: 66% 22% 12%;
          height: 1.15mm;
        }
        .report-top-accent i:nth-child(1) { background: var(--report-primary); }
        .report-top-accent i:nth-child(2) { background: var(--report-teal); }
        .report-top-accent i:nth-child(3) { background: var(--report-alert); }

        .report-watermark {
          position: absolute;
          z-index: 0;
          top: 54%;
          left: 50%;
          display: flex;
          transform: translate(-50%, -50%) rotate(-25deg);
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          color: rgba(11, 93, 59, 0.045);
          text-align: center;
          white-space: nowrap;
        }

        .report-watermark img {
          width: 38mm;
          height: 38mm;
          opacity: 0.055;
          filter: grayscale(1);
        }

        .report-watermark span {
          margin-top: 1mm;
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 42pt;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .report-watermark small {
          margin-top: 0.5mm;
          font-size: 11pt;
          font-weight: 750;
          letter-spacing: 0.03em;
        }

        .report-official-logo {
          display: block;
          width: 34mm;
          max-width: 100%;
          height: auto;
          margin-bottom: 1.2mm;
        }

        .report-document-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 8mm;
          padding-bottom: 3mm;
          border-bottom: 0.45mm solid var(--report-primary);
        }

        .report-brand-lockup {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 4mm;
        }

        .report-logo-shell {
          display: inline-flex;
          width: 17mm;
          height: 17mm;
          flex: 0 0 17mm;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 0.3mm solid var(--report-border);
          border-radius: 4.2mm;
          background: var(--report-canvas);
        }

        .report-logo-shell img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .report-logo-shell.is-compact {
          width: 8.5mm;
          height: 8.5mm;
          flex-basis: 8.5mm;
          border-radius: 2.2mm;
        }

        .report-brand-copy {
          min-width: 0;
        }

        .report-brand-row {
          display: flex;
          align-items: center;
          gap: 2.2mm;
        }

        .report-brand-row strong {
          color: var(--report-primary);
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 12pt;
          font-weight: 850;
          letter-spacing: -0.2pt;
        }

        .report-brand-row span {
          padding: 0.65mm 1.4mm;
          border: 0.25mm solid rgba(12, 127, 122, 0.22);
          border-radius: 1.5mm;
          background: rgba(12, 127, 122, 0.07);
          color: var(--report-teal);
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 5.1pt;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .report-brand-tagline {
          margin-top: 0.25mm;
          color: var(--report-muted);
          font-size: 6.1pt;
          font-weight: 650;
        }

        .report-document-header h1 {
          margin: 1.25mm 0 0;
          color: var(--report-ink);
          font-size: 15.8pt;
          font-weight: 800;
          line-height: 1.16;
        }

        .report-document-header p {
          margin: 0.8mm 0 0;
          color: var(--report-muted);
          font-size: 7.5pt;
          font-weight: 650;
        }

        .report-header-right {
          display: flex;
          align-items: flex-start;
          gap: 3mm;
        }

        .report-verification-chip {
          display: inline-flex;
          align-items: center;
          gap: 1.1mm;
          margin-top: 0.5mm;
          padding: 1mm 1.6mm;
          border: 0.25mm solid var(--report-border);
          border-radius: 2mm;
          background: var(--report-canvas);
          color: var(--report-muted);
          font-size: 5.3pt;
          font-weight: 750;
          white-space: nowrap;
        }

        .report-verification-chip.is-verified {
          border-color: rgba(24, 163, 99, 0.24);
          background: rgba(24, 163, 99, 0.08);
          color: var(--report-primary);
        }

        .report-verification-dot {
          width: 1.7mm;
          height: 1.7mm;
          border-radius: 50%;
          background: #a6b2ac;
        }

        .report-verification-chip.is-verified .report-verification-dot {
          background: var(--report-field);
        }

        .report-qr-box {
          width: 25mm;
          padding: 1.4mm 1.3mm 1mm;
          border: 0.25mm solid var(--report-border);
          border-radius: 2.2mm;
          background: #fff;
          text-align: center;
          color: var(--report-muted);
          font-size: 5.2pt;
          line-height: 1.25;
        }

        .report-qr-box img {
          display: block;
          width: 18.5mm;
          height: 18.5mm;
          margin: 0 auto 0.7mm;
          object-fit: contain;
        }

        .report-qr-unavailable {
          width: 25mm;
          padding: 4mm 1mm;
          border: 0.3mm dashed var(--report-border);
          border-radius: 2mm;
          color: #8a9891;
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 5.6pt;
          line-height: 1.35;
          text-align: center;
        }

        .report-document-strip {
          display: grid;
          grid-template-columns: auto auto auto minmax(0, 1fr);
          align-items: center;
          gap: 3mm;
          margin: 2.1mm 0 2.4mm;
          padding: 1.25mm 2mm;
          border-radius: 1.6mm;
          background: var(--report-canvas);
          color: var(--report-muted);
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 5.3pt;
          font-weight: 700;
        }

        .report-document-strip > :last-child {
          justify-self: end;
        }

        .report-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.3mm;
          margin: 0 0 2.4mm;
          padding: 0.3mm;
          border: 0.25mm solid var(--report-border);
          border-radius: 2mm;
          background: var(--report-border);
          overflow: hidden;
        }

        .report-meta-grid > div {
          min-width: 0;
          padding: 1.55mm 2.1mm;
          background: rgba(255, 255, 255, 0.98);
        }

        .report-meta-grid span {
          display: block;
          margin-bottom: 0.35mm;
          color: var(--report-muted);
          font-size: 8.8pt;
          font-weight: 650;
        }

        .report-meta-grid strong {
          display: block;
          overflow-wrap: break-word;
          color: var(--report-ink);
          font-size: 7.1pt;
          font-weight: 750;
        }

        .report-latin-id,
        .report-repeat-id,
        .report-footer-center strong,
        .report-footer-brand strong,
        .report-footer-brand span,
        .report-footer-source strong,
        .report-legal-disclaimer p[lang="en"] {
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
        }

        .report-legal-disclaimer {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2.5mm;
          margin: 2.4mm 0;
          padding: 2mm 2.5mm;
          border: 0.3mm solid rgba(200, 58, 58, 0.32);
          border-left: 1.1mm solid var(--report-alert);
          border-radius: 1.8mm;
          background: rgba(200, 58, 58, 0.045);
          color: #6e2929;
          line-height: 1.36;
        }

        .report-disclaimer-badge {
          align-self: start;
          padding: 0.8mm 1.3mm;
          border-radius: 1.2mm;
          background: var(--report-alert);
          color: #fff;
          font-size: 8.4pt;
          font-weight: 800;
          white-space: nowrap;
        }

        .report-legal-disclaimer strong {
          display: block;
          color: #6a2828;
          font-size: 7.1pt;
        }

        .report-legal-disclaimer p {
          margin: 0.35mm 0 0;
          font-size: 5.9pt;
        }

        .report-legal-disclaimer p[lang="en"] {
          color: #815050;
          font-size: 5.25pt;
        }

        .report-completeness {
          display: grid;
          grid-template-columns: 0.7fr 1.6fr;
          gap: 3mm;
          margin-bottom: 2.5mm;
          padding: 2mm 2.5mm;
          border: 0.25mm solid rgba(24, 163, 99, 0.25);
          border-left: 1.1mm solid var(--report-field);
          border-radius: 1.8mm;
          background: rgba(24, 163, 99, 0.045);
          color: #173b2c;
          font-size: 5.95pt;
        }

        .report-completeness.is-warning {
          border-color: rgba(214, 161, 36, 0.35);
          border-left-color: var(--report-gold);
          background: rgba(214, 161, 36, 0.06);
          color: #624a13;
        }

        .report-completeness-main,
        .report-completeness-details {
          display: flex;
          flex-direction: column;
          gap: 0.55mm;
        }

        .report-status-kicker {
          color: var(--report-teal);
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 4.8pt;
          font-weight: 850;
          letter-spacing: 0.08em;
        }

        .report-completeness-main strong {
          font-size: 7.2pt;
        }

        .report-history-note {
          color: var(--report-muted);
          font-style: italic;
        }

        .report-repeat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6mm;
          margin-bottom: 2.7mm;
          padding-bottom: 2mm;
          border-bottom: 0.4mm solid var(--report-primary);
        }

        .report-repeat-brand {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 2.5mm;
        }

        .report-repeat-title {
          display: flex;
          align-items: baseline;
          gap: 2mm;
        }

        .report-repeat-title strong {
          color: var(--report-primary);
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-size: 8.3pt;
          font-weight: 850;
        }

        .report-repeat-title span {
          color: var(--report-ink);
          font-size: 7.6pt;
          font-weight: 750;
        }

        .report-repeat-brand small {
          display: block;
          margin-top: 0.25mm;
          color: var(--report-muted);
          font-size: 5.6pt;
          font-weight: 650;
        }

        .report-repeat-meta {
          text-align: right;
        }

        .report-repeat-meta > span {
          display: block;
          color: var(--report-teal);
          font-size: 5pt;
          font-weight: 750;
        }

        .report-repeat-id {
          display: block;
          margin-top: 0.4mm;
          color: var(--report-muted);
          font-size: 5.5pt;
          font-weight: 750;
        }

        .report-table-wrapper {
          width: 100%;
          overflow: visible;
          border-radius: 1.8mm;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 6.35pt;
          line-height: 1.3;
        }

        .report-table thead {
          display: table-header-group;
        }

        .report-table th {
          padding: 1.35mm 1.25mm;
          border: 0.25mm solid #0a5135;
          background: var(--report-primary);
          color: #fff;
          font-weight: 750;
          text-align: left;
          vertical-align: middle;
        }

        .report-table th:first-child {
          border-left-color: var(--report-teal);
          box-shadow: inset 1.2mm 0 0 var(--report-teal);
          padding-left: 2mm;
        }

        .report-table td {
          padding: 1.1mm 1.25mm;
          border: 0.22mm solid var(--report-border);
          color: #20342a;
          text-align: left;
          vertical-align: top;
          white-space: normal;
          word-break: normal;
          overflow-wrap: anywhere;
          background: rgba(255, 255, 255, 0.96);
        }

        .report-table tbody tr:nth-child(even) td {
          background: rgba(245, 248, 246, 0.92);
        }

        .report-table tbody tr:nth-child(5n) td:first-child {
          border-left: 0.6mm solid rgba(12, 127, 122, 0.45);
        }

        .report-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .report-cell-list,
        .report-history-list,
        .report-cell-item,
        .report-history-item {
          display: inline;
        }

        .report-cell-item:not(:last-child)::after,
        .report-history-item:not(:last-child)::after {
          content: ", ";
          color: #829188;
        }

        .report-empty {
          color: #8a9891;
        }

        .report-khatian-number,
        .report-dag-cell,
        .report-land-area {
          font-variant-numeric: tabular-nums;
        }

        .report-khatian-number {
          color: var(--report-primary) !important;
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-weight: 800;
        }

        .report-land-area {
          color: #263f33;
          font-weight: 750;
        }

        .report-history-label {
          color: var(--report-muted);
          font-size: 0.92em;
          font-weight: 700;
        }

        .report-history-arrow {
          display: inline-block;
          margin: 0 0.65mm;
          color: var(--report-teal);
          font-family: var(--font-inter), Inter, Arial, sans-serif !important;
          font-weight: 800;
        }

        .report-page-footer {
          position: absolute !important;
          z-index: 3 !important;
          right: 7mm;
          bottom: 4mm;
          left: 7mm;
          display: grid;
          grid-template-columns: 1fr auto 1.4fr;
          align-items: end;
          gap: 4mm;
          padding-top: 1.5mm;
          border-top: 0.25mm solid var(--report-border);
          color: var(--report-muted);
          font-size: 5.15pt;
          line-height: 1.3;
          background: #fff;
        }

        .report-footer-brand {
          display: flex;
          align-items: center;
          gap: 1.8mm;
        }

        .report-footer-brand strong {
          display: block;
          color: var(--report-primary);
          font-size: 6.1pt;
          font-weight: 850;
        }

        .report-footer-brand span {
          display: block;
          color: var(--report-muted);
          font-size: 4.8pt;
          font-weight: 650;
        }

        .report-footer-center {
          text-align: center;
        }

        .report-footer-center strong {
          display: block;
          color: var(--report-ink);
          font-size: 5.7pt;
        }

        .report-footer-center span {
          display: block;
          margin-top: 0.2mm;
          font-size: 4.7pt;
        }

        .report-footer-source {
          text-align: right;
        }

        .report-footer-source strong {
          display: block;
          color: var(--report-teal);
          font-size: 4.8pt;
          font-weight: 800;
        }

        .report-footer-source span {
          display: block;
          margin-top: 0.2mm;
          font-size: 4.7pt;
        }

        .report-footer-disclaimer {
          grid-column: 1 / -1;
          padding-top: 0.7mm;
          border-top: 0.18mm solid #eef3f0;
          color: #7a4c4c;
          font-size: 4.75pt;
          font-weight: 650;
          text-align: center;
        }

        .report-footer-brand-strip {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 55% 27% 18%;
          min-height: 5.5mm;
          margin-top: 0.8mm;
          overflow: hidden;
          color: #fff;
          font-size: 7.2pt;
          font-weight: 800;
          line-height: 1.1;
          text-align: center;
        }

        .report-footer-brand-strip span {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.8mm 1mm;
        }

        .report-footer-brand-strip span:nth-child(1) { background: var(--report-primary); }
        .report-footer-brand-strip span:nth-child(2) { background: var(--report-alert); }
        .report-footer-brand-strip span:nth-child(3) { background: #b3237b; }

        @media (max-width: 900px) {
          .report-page-stack { align-items: flex-start; }
          .report-page { transform-origin: top left; }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body > * { visibility: hidden !important; }

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
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            overflow: hidden !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
          }

          .report-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .report-table-wrapper { overflow: visible !important; }

          nav,
          .report-controls,
          .report-actions,
          footer:not(.report-page-footer) {
            display: none !important;
          }
        }

        @media print and (orientation: portrait) {
          .report-page {
            padding: 8mm 7mm 19mm !important;
          }

          .report-table {
            font-size: 6.25pt !important;
            line-height: 1.28 !important;
          }

          .report-table th {
            padding: 1.15mm 1mm !important;
          }

          .report-table td {
            padding: 1mm 1mm !important;
          }
        }


        /* Official khatian-inspired black-and-white presentation */
        #mouza-porcha-report,
        #mouza-porcha-report * {
          font-family: "Kalpurush", "Noto Serif Bengali", "Nirmala UI", serif !important;
        }

        #mouza-porcha-report .report-page {
          --report-ink: #000;
          --report-muted: #222;
          --report-border: #000;
          color: #000;
          border: 0.25mm solid #b8b8b8;
          border-radius: 0;
          box-shadow: 0 5px 18px rgba(0, 0, 0, 0.08);
          background: #fff;
        }

        #mouza-porcha-report .report-watermark {
          display: flex !important;
        }

        #mouza-porcha-report .report-top-accent {
          display: grid !important;
        }

        #mouza-porcha-report .report-document-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          gap: 5mm;
          padding: 0 0 3mm;
          border: 0;
        }

        #mouza-porcha-report .report-official-left,
        #mouza-porcha-report .report-official-right {
          font-size: 10pt;
          line-height: 1.45;
        }

        #mouza-porcha-report .report-official-right {
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
          gap: 2.5mm;
          text-align: right;
        }

        #mouza-porcha-report .report-official-left p,
        #mouza-porcha-report .report-official-right p,
        #mouza-porcha-report .report-official-center p {
          margin: 0.3mm 0 0;
          color: #000;
          font-size: inherit;
          font-weight: 400;
        }

        #mouza-porcha-report .report-official-center {
          min-width: 52mm;
          text-align: center;
        }

        #mouza-porcha-report .report-official-center h1 {
          margin: 0;
          color: #000;
          font-size: 19pt;
          font-weight: 400;
          line-height: 1.05;
        }

        #mouza-porcha-report .report-official-center p {
          margin-top: 1.2mm;
          font-size: 11pt;
        }

        #mouza-porcha-report .report-qr-box {
          width: 17mm;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: #fff;
        }

        #mouza-porcha-report .report-qr-box img {
          width: 17mm;
          height: 17mm;
          margin: 0;
        }

        #mouza-porcha-report .report-location-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4mm;
          margin: 2.8mm 0 2mm;
          text-align: center;
          font-size: 11pt;
        }

        #mouza-porcha-report .report-location-row strong {
          font-weight: 400;
        }

        #mouza-porcha-report .report-summary-table {
          width: 100%;
          margin-bottom: 2mm;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 9.5pt;
        }

        #mouza-porcha-report .report-summary-table td {
          padding: 1mm 1.2mm;
          border: 0.22mm solid #000;
          background: #fff;
          color: #000;
        }

        #mouza-porcha-report .report-summary-table td:nth-child(odd) {
          width: 11%;
          text-align: center;
        }

        #mouza-porcha-report .report-summary-table td:nth-child(even) {
          width: 22%;
        }

        #mouza-porcha-report .report-summary-table strong {
          font-weight: 400;
        }

        #mouza-porcha-report .report-collection-note {
          margin: 1mm 0;
          color: #000;
          font-size: 8.8pt;
          line-height: 1.35;
        }

        #mouza-porcha-report .report-legal-disclaimer {
          display: block;
          margin: 1.6mm 0 2mm;
          padding: 1.4mm 1.8mm;
          border: 0.22mm solid #000;
          border-radius: 0;
          background: #fff;
          color: #000;
          line-height: 1.35;
        }

        #mouza-porcha-report .report-disclaimer-badge {
          display: none;
        }

        #mouza-porcha-report .report-legal-disclaimer strong,
        #mouza-porcha-report .report-legal-disclaimer p,
        #mouza-porcha-report .report-legal-disclaimer p[lang="en"] {
          color: #000;
        }

        #mouza-porcha-report .report-legal-disclaimer strong {
          font-size: 9.8pt;
          font-weight: 400;
        }

        #mouza-porcha-report .report-legal-disclaimer p {
          margin: 0.5mm 0 0;
          font-size: 8.4pt;
        }

        #mouza-porcha-report .report-repeat-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 6mm;
          margin-bottom: 2.5mm;
          padding-bottom: 1.5mm;
          border-bottom: 0.25mm solid #000;
        }

        #mouza-porcha-report .report-repeat-title {
          display: block;
          color: #000 !important;
          font-size: 13pt;
          font-weight: 400;
        }

        #mouza-porcha-report .report-repeat-header small,
        #mouza-porcha-report .report-repeat-meta span,
        #mouza-porcha-report .report-repeat-id {
          color: #000;
          font-size: 9pt;
          font-weight: 400;
        }

        #mouza-porcha-report .report-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          border: 0.28mm solid #000;
          font-size: 10.1pt;
          line-height: 1.34;
        }

        #mouza-porcha-report .report-table th,
        #mouza-porcha-report .report-table th:first-child {
          padding: 1.25mm 1.15mm;
          border: 0.22mm solid #000;
          box-shadow: none;
          background: #fff;
          color: #000;
          font-weight: 400;
          text-align: center;
          vertical-align: middle;
        }

        #mouza-porcha-report .report-table th:first-child {
          padding-left: 1.15mm;
        }

        #mouza-porcha-report .report-table .report-column-numbers th {
          padding: 0.65mm 0.7mm;
          font-size: 9.2pt;
        }

        #mouza-porcha-report .report-table td,
        #mouza-porcha-report .report-table tbody tr:nth-child(even) td {
          padding: 1.1mm 1.15mm;
          border: 0.22mm solid #000;
          background: #fff;
          color: #000;
          vertical-align: top;
        }

        #mouza-porcha-report .report-table tbody tr:nth-child(5n) td:first-child {
          border-left: 0.22mm solid #000;
        }

        #mouza-porcha-report .report-serial-number,
        #mouza-porcha-report .report-khatian-number,
        #mouza-porcha-report .report-dag-cell,
        #mouza-porcha-report .report-land-area {
          color: #000 !important;
          font-weight: 400;
          font-variant-numeric: tabular-nums;
        }

        #mouza-porcha-report .report-serial-number,
        #mouza-porcha-report .report-khatian-number,
        #mouza-porcha-report .report-land-area {
          text-align: center;
        }

        #mouza-porcha-report .report-history-label,
        #mouza-porcha-report .report-history-arrow,
        #mouza-porcha-report .report-empty {
          color: #000;
          font-weight: 400;
        }

        #mouza-porcha-report .report-page-footer {
          right: 7mm;
          bottom: 4mm;
          left: 7mm;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 4mm;
          padding-top: 1.2mm;
          border-top: 0.2mm solid #000;
          background: #fff;
          color: #000;
          font-size: 8.1pt;
        }

        #mouza-porcha-report .report-page-footer > div:first-child strong,
        #mouza-porcha-report .report-footer-center strong,
        #mouza-porcha-report .report-footer-source strong {
          display: block;
          color: #000;
          font-size: 8.4pt;
          font-weight: 400;
        }

        #mouza-porcha-report .report-page-footer span,
        #mouza-porcha-report .report-latin-id {
          color: #000;
          font-size: 7.8pt;
          font-weight: 400;
        }

        #mouza-porcha-report .report-footer-source {
          text-align: right;
        }

        #mouza-porcha-report .report-footer-disclaimer {
          grid-column: 1 / -1;
          padding-top: 0.6mm;
          border-top: 0.15mm solid #000;
          color: #000;
          font-size: 7.7pt;
          font-weight: 400;
          text-align: center;
        }

        #mouza-porcha-report .report-footer-brand-strip span {
          color: #fff !important;
          font-size: 7.2pt;
          font-weight: 800;
        }
      `}</style>
    </section>
  );
}
