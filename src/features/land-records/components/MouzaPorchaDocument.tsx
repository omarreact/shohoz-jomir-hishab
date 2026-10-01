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

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "report-logo-shell is-compact" : "report-logo-shell"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/landbd-symbol-2026.svg" alt="" aria-hidden="true" />
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
      <div className="report-repeat-brand">
        <BrandMark compact />
        <div>
          <div className="report-repeat-title">
            <strong>LandBD</strong>
            <span>মৌজা পর্চা রিপোর্ট</span>
          </div>
          <small>{mouzaName} · JL {jlNumber} · {surveyName}</small>
        </div>
      </div>
      <div className="report-repeat-meta">
        <span>তথ্যভিত্তিক ভূমি প্রতিবেদন</span>
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
          LandBD এই তথ্যগুলোকে অনুসন্ধান, তুলনা ও রেফারেন্সের সুবিধার জন্য সাজায়। আইনি, নিবন্ধন,
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/landbd-symbol-2026.svg" alt="" />
                <span>LandBD</span>
                <small>তথ্যভিত্তিক ভূমি প্রতিবেদন</small>
              </div>

              <div className="report-top-accent" aria-hidden="true">
                <i /><i /><i />
              </div>

              {firstPage ? (
                <>
                  <header className="report-document-header">
                    <div className="report-brand-lockup">
                      <BrandMark />
                      <div className="report-brand-copy">
                        <div className="report-brand-row">
                          <strong>LandBD</strong>
                          <span>RECORD INTELLIGENCE</span>
                        </div>
                        <div className="report-brand-tagline">ভূমি তথ্য · হিসাব · মানচিত্র · ডকুমেন্ট</div>
                        <h1>মৌজা-ভিত্তিক পর্চা / খতিয়ান প্রতিবেদন</h1>
                        <p>{mouzaName} মৌজা · {surveyName} · JL {jlNumber || "—"}</p>
                      </div>
                    </div>

                    <div className="report-header-right">
                      <div className={reportMeta?.verificationRegistered ? "report-verification-chip is-verified" : "report-verification-chip"}>
                        <span className="report-verification-dot" />
                        {reportMeta?.verificationRegistered ? "QR যাচাই সক্রিয়" : "লোকাল রিপোর্ট আইডি"}
                      </div>
                      {reportMeta?.verificationRegistered ? (
                        <div className="report-qr-box">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/reports/mouza-porcha/qr?id=${encodeURIComponent(reportId)}`}
                            alt="LandBD রিপোর্ট যাচাই QR"
                          />
                          <span>স্ক্যান করে রিপোর্ট যাচাই করুন</span>
                        </div>
                      ) : (
                        <div className="report-qr-unavailable">QR verification<br />unavailable</div>
                      )}
                    </div>
                  </header>

                  <div className="report-document-strip">
                    <span>LANDBD / LAND RECORD REPORT</span>
                    <span>A4 LANDSCAPE</span>
                    <span>সূত্রনির্ভর · অনুমানবিহীন</span>
                    <span>Report ID: <b className="report-latin-id">{reportId}</b></span>
                  </div>

                  <div className="report-meta-grid">
                    <div><span>জেলা</span><strong>{districtName || "—"}</strong></div>
                    <div><span>উপজেলা / রাজস্ব সার্কেল</span><strong>{upazilaName || "—"}</strong></div>
                    <div><span>সার্ভে</span><strong>{surveyName || "—"}</strong></div>
                    <div><span>মৌজা</span><strong>{mouzaName || "—"}</strong></div>
                    <div><span>JL নং</span><strong>{jlNumber || "—"}</strong></div>
                    <div><span>মোট খতিয়ান</span><strong>{completeCount}</strong></div>
                    <div><span>তৈরির সময়</span><strong>{generatedLabel}</strong></div>
                    <div><span>রিপোর্ট অবস্থা</span><strong>{reportMeta?.verificationRegistered ? "যাচাইযোগ্য" : "তথ্যভিত্তিক"}</strong></div>
                  </div>

                  <LegalDisclaimer />

                  <section className={`report-completeness ${isCountComplete ? "is-complete" : "is-warning"}`}>
                    <div className="report-completeness-main">
                      <span className="report-status-kicker">COLLECTION STATUS</span>
                      <strong>ডেটা সংগ্রহের অবস্থা</strong>
                      <span>সফলভাবে সংগৃহীত <b>{completeCount} / {targetCount}</b> খতিয়ান</span>
                    </div>
                    <div className="report-completeness-details">
                      {includeHalSabek ? (
                        <span>হাল/সাবেক mapping: <b>{mappedKhatianCount} / {completeCount}</b>{unavailableMappingCount ? ` · ${unavailableMappingCount}টিতে mapping প্রকাশিত/পাওয়া যায়নি` : ""}</span>
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
                        <span className="report-history-note">ব্যবহারযোগ্য হাল/সাবেক mapping না থাকায় দাগ পরিবর্তন কলামটি লুকানো হয়েছে।</span>
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
                <div className="report-footer-brand">
                  <BrandMark compact />
                  <div>
                    <strong>LandBD</strong>
                    <span>landbd.pincodeit.com</span>
                  </div>
                </div>
                <div className="report-footer-center">
                  <strong>Page {pageIndex + 1} of {pages.length}</strong>
                  <span className="report-latin-id">{reportId}</span>
                </div>
                <div className="report-footer-source">
                  <strong>Source / provenance</strong>
                  <span>DLRMS / LandBD record workspace · {generatedLabel}</span>
                </div>
                <div className="report-footer-disclaimer">
                  সরকারি বা আইনি ব্যবহারের আগে সংশ্লিষ্ট সরকারি মূল নথি ও প্রত্যয়িত কপির সাথে তথ্য যাচাই করুন।
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
          width: 297mm;
          min-height: 210mm;
          overflow: hidden;
          padding: 7mm 8mm 19mm;
          background: #fff;
          color: var(--report-ink);
          border: 1px solid var(--report-border);
          box-shadow: 0 10px 30px rgba(11, 45, 30, 0.08);
          font-size: 8pt;
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
          font-size: 5.8pt;
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
          font-size: 5.4pt;
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
          font-size: 6.85pt;
          line-height: 1.32;
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
          right: 8mm;
          bottom: 4mm;
          left: 8mm;
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

        @media (max-width: 900px) {
          .report-page-stack { align-items: flex-start; }
          .report-page { transform-origin: top left; }
        }

        @media print {
          @page {
            size: A4 landscape;
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

        @media print and (orientation: landscape) {
          .report-page {
            padding: 7mm 8mm 19mm !important;
          }

          .report-table {
            font-size: 6.8pt !important;
            line-height: 1.3 !important;
          }

          .report-table th {
            padding: 1.25mm 1.2mm !important;
          }

          .report-table td {
            padding: 1mm 1.2mm !important;
          }
        }
      `}</style>
    </section>
  );
}
