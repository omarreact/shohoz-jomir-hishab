"use client";

import { useMemo } from "react";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import "./mouza-report/report-document.css";
import {
  buildMouzaDagRows,
  paginateMouzaDagRows,
} from "../reports/mouza-dag-report";
import type { KhatianIndex } from "../types";

type Props = {
  rows: KhatianIndex[];
  expectedKhatians: number | null;
  districtName: string;
  upazilaName: string;
  surveyName: string;
  mouzaName: string;
  jlNumber: string;
  generatedAt: string;
  orientation: "portrait" | "landscape";
};

export default function MouzaDagDocument({
  rows,
  expectedKhatians,
  districtName,
  upazilaName,
  surveyName,
  mouzaName,
  jlNumber,
  generatedAt,
  orientation,
}: Props) {
  const dagRows = useMemo(() => buildMouzaDagRows(rows), [rows]);
  const pages = useMemo(
    () => paginateMouzaDagRows(dagRows, orientation === "portrait" ? 32 : 24),
    [dagRows, orientation],
  );
  const partialDagRows = rows.filter((row) => /(?:\.{3,}|…)+\s*$/u.test(row.DAGS ?? "")).length;
  const generatedLabel = new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(new Date(generatedAt));

  if (!dagRows.length) return null;

  return (
    <section
      id="mouza-dag-report"
      className="landbd-report-font"
      data-bangla-ignore="true"
      translate="no"
      aria-label="মৌজা ভিত্তিক দাগ বই"
    >
      <div className="report-page-stack">
        {pages.map((pageRows, pageIndex) => {
          const firstPage = pageIndex === 0;
          return (
            <article
              className={`report-page report-page-${orientation}`}
              data-page-orientation={orientation}
              key={`dag-page-${pageIndex + 1}`}
            >
              <div className="report-top-accent" aria-hidden="true"><i /><i /><i /></div>
              <div className="report-watermark" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo-bangla.svg" alt="" />
              </div>

              {firstPage ? (
                <>
                  <header className="report-document-header">
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="report-official-logo" src="/brand/logo-bangla.svg" alt="LandBD" />
                      <h1>মৌজা ভিত্তিক দাগ বই</h1>
                      <p>উপলভ্য খতিয়ান সূচি থেকে দাগ → খতিয়ান reverse index</p>
                    </div>
                    <div className="report-qr-unavailable">
                      তথ্যভিত্তিক রিপোর্ট<br />
                      সরকারি প্রত্যয়িত নকল নয়
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
                        <td>সার্ভে</td>
                        <td><strong>{surveyName || "—"}</strong></td>
                        <td>খতিয়ান সূচি</td>
                        <td><strong>{rows.length}{expectedKhatians != null ? ` / ${expectedKhatians}` : ""}</strong></td>
                        <td>স্বতন্ত্র দাগ</td>
                        <td><strong>{dagRows.length}</strong></td>
                      </tr>
                      <tr>
                        <td>আংশিক দাগ field</td>
                        <td><strong>{partialDagRows}</strong></td>
                        <td>তৈরির সময়</td>
                        <td colSpan={3}><strong>{generatedLabel}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="report-collection-note">
                    এই বইটি উৎসে প্রকাশিত দাগগুলোকেই group করে। যেসব DLRMS row-তে দাগ ellipsis/truncated,
                    সেখানে অনুপস্থিত দাগ অনুমান করে যোগ করা হয়নি। বিস্তারিত সরকারি কাজে মূল নথি যাচাই করুন।
                  </p>
                </>
              ) : (
                <div className="report-document-strip">
                  <strong>মৌজা ভিত্তিক দাগ বই</strong>
                  <span>{mouzaName || "—"}</span>
                  <span>JL {jlNumber || "—"}</span>
                  <span>{surveyName || "—"}</span>
                </div>
              )}

              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: "12%" }}>ক্রম</th>
                      <th style={{ width: "24%" }}>দাগ নং</th>
                      <th>সংশ্লিষ্ট খতিয়ান নং</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, rowIndex) => (
                      <tr
                        key={row.dagNo}
                        data-report-dag={row.dagNo}
                        data-source-count={row.sourceIds.length}
                      >
                        <td>{pageIndex * (orientation === "portrait" ? 32 : 24) + rowIndex + 1}</td>
                        <td className="tabular-nums"><strong>{row.dagNo}</strong></td>
                        <td className="tabular-nums">{row.khatianNos.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="report-page-footer">
                <div>
                  <strong>তথ্যসূত্র</strong>
                  <span>DLRMS / LandBD verified enrichment যেখানে উপলভ্য</span>
                </div>
                <div className="report-footer-center">
                  <strong>পৃষ্ঠা {pageIndex + 1} / {pages.length}</strong>
                  <span>দাগ {dagRows.length}</span>
                </div>
                <div className="report-footer-source">
                  <strong>তৈরির সময়</strong>
                  <span>{generatedLabel}</span>
                </div>
                <div className="report-footer-disclaimer">
                  এটি সরকারি প্রত্যয়িত দাগ বই নয়। আইনি ব্যবহারের আগে সরকারি মূল রেকর্ড যাচাই করুন।
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
