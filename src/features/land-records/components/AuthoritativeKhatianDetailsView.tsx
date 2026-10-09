"use client";

import { useMemo, type RefObject } from "react";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import type { FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildKhatianDisplayModel } from "../lib/khatian-display";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
  pageOrientation: "portrait" | "landscape";
};

function bangla(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function present(value: unknown): boolean {
  return value !== null && value !== undefined && Boolean(String(value).trim()) && String(value).trim() !== "—";
}

const tableBorder = "#8fb69d";
const tableHeader = "#e2f0e7";
const tableSoft = "#f7faf8";
const ink = "#173427";
const muted = "#526b5d";
const sectionGreen = "#0f5536";

/**
 * Source-driven Khatian sheet. The result body is intentionally rendered as one
 * disciplined bordered table so identity, owners/guardians, and dag details
 * stay visually connected in the older official khatian-style format.
 */
export default function AuthoritativeKhatianDetailsView({
  khatian,
  surveyKey,
  captureRef,
  pageOrientation,
}: Props) {
  const model = useMemo(() => buildKhatianDisplayModel(khatian, surveyKey), [khatian, surveyKey]);
  const guardians = model.guardians.filter(present);
  const hasClass = model.dags.some((dag) => present(dag.landClass));
  const hasTotalArea = model.dags.some((dag) => present(dag.totalArea));
  const hasKhatianArea = model.dags.some((dag) => present(dag.shareArea || dag.area));
  const hasShare = model.dags.some((dag) => present(dag.khatianShare));
  const hasOwnerShare = model.owners.some((owner) => present(owner.share));
  const totalLand = model.totalLand ? `${bangla(model.totalLand)} একর` : "উৎসে নেই";

  return (
    <article
      ref={captureRef ?? undefined}
      data-page-orientation={pageOrientation}
      data-print-document="khatian"
      className="relative w-full min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm"
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#c9ded0",
        color: ink,
        fontFamily: 'var(--font-report), "Kalpurush", "Nirmala UI", sans-serif',
      }}
    >
      <div className="flex h-1.5 w-full" aria-hidden="true">
        <span className="w-3/5" data-pdf-surface="top-green" style={{ backgroundColor: "#006a45" }} />
        <span className="w-1/5" data-pdf-surface="top-gold" style={{ backgroundColor: "#d7a327" }} />
        <span className="w-1/5" data-pdf-surface="top-red" style={{ backgroundColor: "#c52d43" }} />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center print:hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-bangla.svg" alt="" className="w-[40%] -rotate-12 object-contain" style={{ opacity: 0.045 }} />
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        <header className="grid gap-3 border-b pb-3 sm:grid-cols-[1fr_auto]" style={{ borderColor: tableBorder }}>
          <div className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-bangla.svg" alt="LandBD" className="h-14 w-14 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="text-[11px] font-black tracking-wide" style={{ color: "#006a45" }}>LandBD · ভূমি রেকর্ড</p>
              <h1 className="mt-0.5 text-[22px] font-black leading-tight" style={{ color: "#143e29" }}>
                {model.badgeBn} খতিয়ান নং {bangla(khatian.KHATIAN_NO)}
              </h1>
              <p className="mt-0.5 text-[12px] font-semibold" style={{ color: muted }}>
                {model.surveyLabel || "সার্ভে তথ্য নেই"} · {khatian.MOUZA_NAME || "মৌজা অজ্ঞাত"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="text-right text-[11px] font-semibold leading-4" style={{ color: muted }}>
              <div>Verify via LandBD</div>
              <div>QR স্ক্যান করুন</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/reports/mouza-porcha/qr?target=dlrms-khatian"
              alt="LandBD khatian search page QR"
              className="h-20 w-20 border bg-white object-contain p-1"
              style={{ borderColor: tableBorder }}
            />
          </div>
        </header>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[12px] leading-5" style={{ borderColor: tableBorder }}>
            <tbody>
              <tr data-pdf-surface="table-head" style={{ backgroundColor: tableHeader }}>
                <th colSpan={6} className="border px-3 py-1.5 text-center text-[14px] font-black" style={{ borderColor: tableBorder, color: sectionGreen }}>
                  খতিয়ান পরিচিতি
                </th>
              </tr>
              <tr>
                <th className="border px-2.5 py-1.5 text-left font-extrabold" style={{ borderColor: tableBorder, backgroundColor: tableHeader }}>জেলা</th>
                <td colSpan={2} className="border px-2.5 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{khatian.DISTRICT_NAME || "—"}</td>
                <th className="border px-2.5 py-1.5 text-left font-extrabold" style={{ borderColor: tableBorder, backgroundColor: tableHeader }}>উপজেলা</th>
                <td colSpan={2} className="border px-2.5 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{khatian.UPAZILA_NAME || "—"}</td>
              </tr>
              <tr style={{ backgroundColor: tableSoft }}>
                <th className="border px-2.5 py-1.5 text-left font-extrabold" style={{ borderColor: tableBorder, backgroundColor: tableHeader }}>মৌজা</th>
                <td colSpan={2} className="border px-2.5 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{khatian.MOUZA_NAME || "—"}</td>
                <th className="border px-2.5 py-1.5 text-left font-extrabold" style={{ borderColor: tableBorder, backgroundColor: tableHeader }}>জে.এল নং</th>
                <td colSpan={2} className="border px-2.5 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{bangla(khatian.JL_NUMBER)}</td>
              </tr>
              <tr>
                <th className="border px-2.5 py-1.5 text-left font-extrabold" style={{ borderColor: tableBorder, backgroundColor: tableHeader }}>মালিক সংখ্যা</th>
                <td colSpan={2} className="border px-2.5 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{bangla(model.ownerCount)}</td>
                <th className="border px-2.5 py-1.5 text-left font-extrabold" style={{ borderColor: tableBorder, backgroundColor: tableHeader }}>দাগ সংখ্যা / মোট জমি</th>
                <td colSpan={2} className="border px-2.5 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{bangla(model.dagCount)} / {totalLand}</td>
              </tr>

              {model.isPartial ? (
                <tr>
                  <td colSpan={6} className="border px-3 py-1.5 text-center font-bold" style={{ borderColor: "#e4c77f", backgroundColor: "#fff8e7", color: "#805315" }}>
                    উৎস রেকর্ড আংশিক — LandBD কোনো অনুপস্থিত তথ্য অনুমান করেনি।
                  </td>
                </tr>
              ) : null}

              <tr data-pdf-surface="table-head" style={{ backgroundColor: tableHeader }}>
                <th colSpan={6} className="border px-3 py-1.5 text-center text-[14px] font-black" style={{ borderColor: tableBorder, color: sectionGreen }}>
                  মালিক ও অভিভাবক তালিকা
                </th>
              </tr>
              <tr data-pdf-surface="table-head" style={{ backgroundColor: tableHeader }}>
                <th className="w-12 border px-2 py-1.5 text-center font-black" style={{ borderColor: tableBorder }}>ক্রম</th>
                <th colSpan={guardians.length || hasOwnerShare ? 2 : 5} className="border px-2 py-1.5 text-left font-black" style={{ borderColor: tableBorder }}>মালিকের নাম</th>
                {guardians.length ? (
                  <th colSpan={hasOwnerShare ? 2 : 3} className="border px-2 py-1.5 text-left font-black" style={{ borderColor: tableBorder }}>অভিভাবক তালিকা</th>
                ) : null}
                {hasOwnerShare ? (
                  <th className="w-24 border px-2 py-1.5 text-center font-black" style={{ borderColor: tableBorder }}>অংশ</th>
                ) : null}
              </tr>
              {model.owners.length ? model.owners.map((owner, index) => (
                <tr key={`${owner.name}-${index}`} style={{ backgroundColor: index % 2 ? tableSoft : "#ffffff" }}>
                  <td className="border px-2 py-1.5 text-center font-bold" style={{ borderColor: tableBorder }}>{bangla(index + 1)}</td>
                  <td colSpan={guardians.length || hasOwnerShare ? 2 : 5} className="border px-2 py-1.5 font-semibold" style={{ borderColor: tableBorder }}>{owner.name || "—"}</td>
                  {guardians.length ? (
                    <td colSpan={hasOwnerShare ? 2 : 3} className="border px-2 py-1.5" style={{ borderColor: tableBorder }}>
                      {guardians[index] || (index === 0 ? guardians.join(", ") : "—")}
                    </td>
                  ) : null}
                  {hasOwnerShare ? (
                    <td className="border px-2 py-1.5 text-center" style={{ borderColor: tableBorder }}>{present(owner.share) ? bangla(owner.share) : "—"}</td>
                  ) : null}
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="border px-3 py-3 text-center" style={{ borderColor: tableBorder, color: muted }}>
                    উৎসে মালিকের তথ্য নেই
                  </td>
                </tr>
              )}
              {guardians.length ? (
                <tr>
                  <td colSpan={6} className="border px-3 py-1.5 text-[11px] font-semibold" style={{ borderColor: tableBorder, color: muted, backgroundColor: "#fbfdfb" }}>
                    নোট: অভিভাবক তালিকা উৎস ডাটার ক্রমে দেখানো হয়েছে; মালিকের সঙ্গে সম্পর্ক অনুমান করা হয়নি।
                  </td>
                </tr>
              ) : null}

              <tr data-pdf-surface="table-head" style={{ backgroundColor: tableHeader }}>
                <th colSpan={6} className="border px-3 py-1.5 text-center text-[14px] font-black" style={{ borderColor: tableBorder, color: sectionGreen }}>
                  দাগ ও জমির বিবরণ
                </th>
              </tr>
              <tr data-pdf-surface="table-head" style={{ backgroundColor: tableHeader }}>
                <th className="w-12 border px-2 py-1.5 text-center font-black" style={{ borderColor: tableBorder }}>ক্রম</th>
                <th className="border px-2 py-1.5 text-left font-black" style={{ borderColor: tableBorder }}>দাগ নং</th>
                {hasClass ? <th className="border px-2 py-1.5 text-left font-black" style={{ borderColor: tableBorder }}>শ্রেণী</th> : null}
                {hasTotalArea ? <th className="border px-2 py-1.5 text-right font-black" style={{ borderColor: tableBorder }}>দাগের মোট জমি</th> : null}
                {hasKhatianArea ? <th className="border px-2 py-1.5 text-right font-black" style={{ borderColor: tableBorder }}>খতিয়ানের অংশ</th> : null}
                {hasShare ? <th className="border px-2 py-1.5 text-center font-black" style={{ borderColor: tableBorder }}>অংশ/হিস্যা</th> : null}
                {!(hasClass && hasTotalArea && hasKhatianArea && hasShare) ? (
                  <th colSpan={4 - Number(hasClass) - Number(hasTotalArea) - Number(hasKhatianArea) - Number(hasShare)} className="border px-2 py-1.5 text-center font-black" style={{ borderColor: tableBorder }}>
                    মন্তব্য
                  </th>
                ) : null}
              </tr>
              {model.dags.length ? model.dags.map((dag, index) => (
                <tr key={`${dag.dagNo}-${index}`} style={{ backgroundColor: index % 2 ? tableSoft : "#ffffff" }}>
                  <td className="border px-2 py-1.5 text-center font-bold" style={{ borderColor: tableBorder }}>{bangla(index + 1)}</td>
                  <td className="border px-2 py-1.5 font-bold" style={{ borderColor: tableBorder }}>{bangla(dag.dagNo)}</td>
                  {hasClass ? <td className="border px-2 py-1.5" style={{ borderColor: tableBorder }}>{dag.landClass || "—"}</td> : null}
                  {hasTotalArea ? <td className="border px-2 py-1.5 text-right" style={{ borderColor: tableBorder }}>{bangla(dag.totalArea)}</td> : null}
                  {hasKhatianArea ? <td className="border px-2 py-1.5 text-right" style={{ borderColor: tableBorder }}>{bangla(dag.shareArea || dag.area)}</td> : null}
                  {hasShare ? <td className="border px-2 py-1.5 text-center" style={{ borderColor: tableBorder }}>{bangla(dag.khatianShare)}</td> : null}
                  {!(hasClass && hasTotalArea && hasKhatianArea && hasShare) ? (
                    <td colSpan={4 - Number(hasClass) - Number(hasTotalArea) - Number(hasKhatianArea) - Number(hasShare)} className="border px-2 py-1.5 text-center" style={{ borderColor: tableBorder, color: muted }}>
                      —
                    </td>
                  ) : null}
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="border px-3 py-3 text-center" style={{ borderColor: tableBorder, color: muted }}>
                    উৎসে দাগের তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              )}

              <tr>
                <td colSpan={6} className="border px-3 py-2 text-[11px] font-semibold leading-5" data-pdf-surface="soft" style={{ backgroundColor: "#f4f8f5", borderColor: tableBorder, color: muted }}>
                  <strong style={{ color: "#17462e" }}>রেকর্ড যাচাই নোট:</strong> এটি DLRMS উৎসে পাওয়া তথ্যের সাজানো অনুলিপি, সরকারি প্রত্যয়িত পর্চা নয়।
                  অনুপস্থিত কোনো তথ্য অনুমান করা হয়নি। আইনি কাজে ব্যবহারের আগে সরকারি মূল নথির সঙ্গে যাচাই করুন।
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <LandBdPrintRibbon className="print:hidden" />
    </article>
  );
}
