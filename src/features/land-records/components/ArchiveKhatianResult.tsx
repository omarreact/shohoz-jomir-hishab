"use client";

import { useMemo } from "react";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import type { FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildFullKhatianDisplayModel } from "../lib/full-khatian-display";
import type { ParsedDagRow } from "../lib/khatian-display";

/**
 * Archive-style DLRMS paper view based on the user's local LandBD.zip result:
 * a centered khatian number, source metadata and one compact official-like
 * bordered table for owners, guardians and dags.
 *
 * The source model is intentionally the CURRENT, duplicate-safe full-data
 * model. We do not infer owner/guardian relationships, land area or ownership.
 */
type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  pageOrientation: "portrait" | "landscape";
};

function bn(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

const border = "#2f4035";
const head = "border border-[#2f4035] bg-[#f3f5f3] px-2 py-2 text-center text-[12px] font-bold leading-5";
const cell = "border border-[#2f4035] px-2 py-2 align-top text-[12px] leading-[1.6]";
const label = "font-semibold text-[#203d2b]";
const BOLD = "font-bold text-[#1a3424]";

function PaperMeta({ title, value }: { title: string; value: unknown }) {
  return <div className="min-w-0 text-center text-[12px] leading-5">
    <span className="font-semibold">{title}: </span><strong className="break-words font-bold">{bn(value)}</strong>
  </div>;
}

export default function ArchiveKhatianResult({
  khatian, fullKhatian, surveyKey, pageOrientation,
}: Props) {
  const model = useMemo(
    () => buildFullKhatianDisplayModel(khatian, fullKhatian, surveyKey),
    [khatian, fullKhatian, surveyKey],
  );

  const owners = model.owners;
  const dags = model.dags;
  const separateGuardians = model.guardians.filter((value) => value.trim());
  const verifiedGuardian = owners.some((owner) => Boolean(owner.fatherOrHusband?.trim()));
  const showShares = owners.some((owner) => Boolean(owner.share?.trim()));
  const showClasses = dags.some((dag) => Boolean(dag.landClass?.trim()));
  const showTotalArea = dags.some((dag) => Boolean(dag.totalArea?.trim()));
  const showArea = dags.some((dag) => Boolean((dag.shareArea || dag.area)?.trim()));
  const showDagShare = dags.some((dag) => Boolean(dag.khatianShare?.trim()));

  const columns = [
    { key: "owners", label: "রায়তের নাম / মালিক", kind: "record" },
    ...(verifiedGuardian ? [{ key: "guardian", label: "পিতা / স্বামীর নাম", kind: "record" }] : []),
    ...(showShares ? [{ key: "ownerShare", label: "মালিকের অংশ", kind: "record" }] : []),
    { key: "dagNo", label: "দাগ নং", kind: "dag" },
    ...(showClasses ? [{ key: "landClass", label: "জমির শ্রেণী", kind: "dag" }] : []),
    ...(showTotalArea ? [{ key: "totalArea", label: "দাগের মোট জমি", kind: "dag" }] : []),
    ...(showArea ? [{ key: "khatianArea", label: "খতিয়ানের জমি", kind: "dag" }] : []),
    ...(showDagShare ? [{ key: "khatianShare", label: "অংশ / হিস্যা", kind: "dag" }] : []),
  ];
  const recordColumns = columns.filter((column) => column.kind === "record");
  const dagColumns = columns.filter((column) => column.kind === "dag");
  const displayDags: ParsedDagRow[] = dags.length ? dags : [{ dagNo: "—" }];
  const pdfPageWidth = pageOrientation === "landscape" ? "1024px" : "740px";

  function listCell(type: string) {
    if (type === "owners") {
      return owners.length
        ? owners.map((owner, index) => <div key={index} className="border-b border-dotted border-slate-300 py-1 last:border-0">
            <span className="mr-1">{bn(index + 1)}.</span>{owner.name}
          </div>)
        : <span className="text-slate-500">উৎসে প্রকাশিত হয়নি</span>;
    }
    if (type === "guardian") {
      return owners.map((owner, index) => (
        <div key={index} className="border-b border-dotted border-slate-300 py-1 last:border-0">
          {owner.fatherOrHusband || "—"}
        </div>
      ));
    }
    if (type === "ownerShare") {
      return owners.map((owner, index) => (
        <div key={index} className="border-b border-dotted border-slate-300 py-1 text-center last:border-0">
          {bn(owner.share)}
        </div>
      ));
    }
    return "—";
  }

  function dagCell(type: string, dag: ParsedDagRow) {
    if (type === "dagNo") return bn(dag.dagNo);
    if (type === "landClass") return dag.landClass || "—";
    if (type === "totalArea") return bn(dag.totalArea);
    if (type === "khatianArea") return bn(dag.shareArea || dag.area);
    if (type === "khatianShare") return bn(dag.khatianShare);
    return "—";
  }

  return (
    <div
      className="landbd-archive-khatian w-full max-w-full overflow-x-auto rounded-2xl bg-[#eef1ee] p-2 sm:p-5"
      data-result="1" data-bangla-ignore="true" translate="no"
    >
      <article
        data-page-orientation={pageOrientation}
        data-print-document="khatian"
        className="relative mx-auto box-border overflow-hidden rounded-md border border-[#cfd8d0] bg-white text-[#192c21] shadow-[0_18px_46px_rgba(16,43,28,.09)]"
        style={{ minWidth: pdfPageWidth, maxWidth: pageOrientation === "landscape" ? "1200px" : "860px",
          fontFamily: 'var(--font-noto-bengali), "Kalpurush", "Nirmala UI", sans-serif' }}
      >
        <div className="flex h-[5px] w-full" aria-hidden="true">
          <span data-pdf-surface="top-green" className="w-3/5 bg-[#006a45]" />
          <span data-pdf-surface="top-gold" className="w-1/5 bg-[#d7a327]" />
          <span data-pdf-surface="top-red" className="w-1/5 bg-[#c52d43]" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-bangla.svg" alt="" className="w-[46%] -rotate-12 opacity-[0.04]" />
        </div>
        <div className="relative z-10 p-6 sm:p-7">
          <header className="grid grid-cols-[1fr_1.3fr_1fr] items-start gap-3 border-b border-[#2f4035] pb-4">
            <div className="min-w-0 text-[11px] leading-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/landbd-logo-horizontal.svg" alt="LandBD"
                className="h-10 max-w-[144px] object-contain object-left" />
              <p className={label}>DLRMS ভূমি রেকর্ড</p>
              <p>সার্ভে: {model.badgeBn}</p>
            </div>
            <div className="pt-2 text-center">
              <p className="text-[11px] font-semibold">{model.surveyLabel}</p>
              <h2 className="mt-1 text-[22px] font-bold leading-7">খতিয়ান নং {bn(khatian.KHATIAN_NO)}</h2>
            </div>
            <div className="flex min-w-0 items-start justify-end gap-2 text-right">
              <div className="min-w-0 text-[10px] leading-4">
                <p>রেকর্ড আইডি</p>
                <p className="break-all font-semibold">{bn(khatian.ID)}</p>
                <p className="mt-1">LandBD অনুসন্ধান QR</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/reports/mouza-porcha/qr?target=dlrms-khatian"
                alt="LandBD DLRMS অনুসন্ধান QR" className="h-16 w-16 shrink-0 border border-[#2f4035] bg-white p-1" />
            </div>
          </header>

          <div className="my-4 grid grid-cols-4 gap-2">
            <PaperMeta title="জেলা" value={khatian.DISTRICT_NAME} />
            <PaperMeta title="উপজেলা" value={khatian.UPAZILA_NAME} />
            <PaperMeta title="মৌজা" value={khatian.MOUZA_NAME} />
            <PaperMeta title="জে.এল নং" value={khatian.JL_NUMBER} />
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse" style={{ borderColor: border }}>
              <caption className="sr-only">রায়ত, অভিভাবক এবং দাগের উৎসভিত্তিক বিবরণ</caption>
              <thead data-pdf-surface="table-head">
                <tr>{columns.map((column) => <th key={column.key} scope="col" className={head}>{column.label}</th>)}</tr>
                <tr>{columns.map((column, index) => <th key={column.key} className={head + " text-[11px]"}>
                  {bn(index + 1)}
                </th>)}</tr>
              </thead>
              <tbody>
                {displayDags.map((dag, dagIndex) => (
                  <tr key={dag.dagNo + "-" + dagIndex}>
                    {dagIndex === 0 && recordColumns.map((column) =>
                      <td key={column.key} className={cell} rowSpan={displayDags.length}>
                        {listCell(column.key)}
                      </td>,
                    )}
                    {dagColumns.map((column) =>
                      <td key={column.key} className={cell + " text-center"}>{dagCell(column.key, dag)}</td>,
                    )}
                  </tr>
                ))}
                <tr data-pdf-surface="soft">
                  <th colSpan={columns.length} className="border border-[#2f4035] bg-[#f3f5f3] px-3 py-2 text-right text-xs font-bold">
                    মোট জমি: {model.totalLand ? bn(model.totalLand) : "উৎসে নেই"} 
                  </th>
                </tr>
              </tbody>
            </table>
          </div>

          {separateGuardians.length > 0 && !verifiedGuardian && (
            <div className="mt-4 border border-[#2f4035] p-3 text-xs leading-6">
              <h3 className={BOLD}>উৎসে প্রকাশিত অভিভাবক তালিকা</h3>
              <p>{separateGuardians.join(" · ")}</p>
              <p className="text-[11px] text-slate-600">উৎসে নির্দিষ্ট মালিকের সঙ্গে সম্পর্ক প্রমাণিত নয়।</p>
            </div>
          )}

          {model.isPartial && (
            <p role="status" className="mt-4 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              উৎসের রেকর্ড আংশিক; অনুপস্থিত মালিক, দাগ, অংশ বা জমির পরিমাণ অনুমান করে পূরণ করা হয়নি।
            </p>
          )}

          <div className="mt-5 border-t border-[#c8d3c9] pt-3 text-[11px] leading-5 text-slate-600">
            <p><strong className={label}>বিশেষ দ্রষ্টব্য:</strong> এই তথ্য DLRMS উৎসভিত্তিক প্রদর্শন, সরকারি প্রত্যয়িত খতিয়ান নয়।
              দাপ্তরিক/আইনি কাজে মূল সরকারি নথি যাচাই করুন।</p>
            <div className="mt-2 flex justify-between gap-4 text-[10px]">
              <span>LandBD · ভূমি রেকর্ড ভিউয়ার</span>
              <span className="text-right">রেকর্ড আইডি: {bn(khatian.ID)}</span>
            </div>
          </div>
          <div data-pdf-exclude="1"><LandBdPrintRibbon className="record-local-ribbon mt-2 print:hidden" /></div>
        </div>
      </article>
    </div>
  );
}
