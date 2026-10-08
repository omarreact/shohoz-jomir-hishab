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
  return value !== null && value !== undefined && Boolean(String(value).trim()) &&
    String(value).trim() !== "—";
}

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="min-w-0 rounded-lg border px-3 py-2" data-pdf-surface="soft"
      style={{ borderColor: "#d7e7dc", backgroundColor: "#f4f8f5" }}>
      <span className="block text-xs font-semibold" style={{ color: "#5c7567" }}>{label}</span>
      <strong className="mt-1 block break-words text-sm" style={{ color: "#163d2a" }}>{value || "—"}</strong>
    </div>
  );
}

/**
 * Source-driven Khatian sheet. Only render source-backed columns and never
 * associate the unordered guardian list with particular owners.
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
  const dagColumns = 1 + Number(hasClass) + Number(hasTotalArea) + Number(hasKhatianArea) + Number(hasShare);
  const totalLand = model.totalLand ? bangla(model.totalLand) + " একর" : "উৎসে নেই";

  return (
    <article
      ref={captureRef ?? undefined}
      data-page-orientation={pageOrientation}
      data-print-document="khatian"
      className="relative w-full min-w-0 overflow-hidden rounded-xl border bg-white text-[#173427] shadow-sm"
      style={{ backgroundColor: "#ffffff", borderColor: "#d0e0d5", fontFamily: 'var(--font-report), "Nirmala UI", sans-serif' }}
    >
      <div className="flex h-1.5 w-full" aria-hidden="true">
        <span className="w-3/5" data-pdf-surface="top-green" style={{ backgroundColor: "#006a45" }} />
        <span className="w-1/5" data-pdf-surface="top-gold" style={{ backgroundColor: "#d7a327" }} />
        <span className="w-1/5" data-pdf-surface="top-red" style={{ backgroundColor: "#c52d43" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center print:hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-bangla.svg" alt="" className="w-[42%] -rotate-12 object-contain"
          style={{ opacity: 0.055 }} />
      </div>
      <div className="relative z-10 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4"
          style={{ borderColor: "#a6cbb5" }}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-bangla.svg" alt="LandBD" className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16" />
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wide" style={{ color: "#006a45" }}>LandBD · ভূমি রেকর্ড</p>
              <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl" style={{ color: "#143e29" }}>
                {model.badgeBn} খতিয়ান নং {bangla(khatian.KHATIAN_NO)}
              </h1>
              <p className="mt-1 text-xs" style={{ color: "#567163" }}>
                {model.surveyLabel || "সার্ভে তথ্য নেই"} · {khatian.MOUZA_NAME || "মৌজা অজ্ঞাত"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border p-2"
            style={{ backgroundColor: "#f4f8f5", borderColor: "#d9e9dd" }} data-pdf-surface="soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/reports/mouza-porcha/qr?target=dlrms-khatian"
              alt="LandBD khatian search page QR" className="h-16 w-16 bg-white object-contain" />
            <span className="max-w-24 text-[10px] font-semibold leading-4" style={{ color: "#426651" }}>
              LandBD-তে খুলুন
            </span>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Field label="জেলা" value={khatian.DISTRICT_NAME} />
          <Field label="উপজেলা" value={khatian.UPAZILA_NAME} />
          <Field label="মৌজা" value={khatian.MOUZA_NAME} />
          <Field label="জে.এল নং" value={bangla(khatian.JL_NUMBER)} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-md border px-3 py-1.5" data-pdf-surface="soft"
            style={{ backgroundColor: "#e6f2e9", borderColor: "#b7d9c2", color: "#145c37" }}>
            মালিক: {bangla(model.ownerCount)}
          </span>
          <span className="rounded-md border px-3 py-1.5" data-pdf-surface="soft"
            style={{ backgroundColor: "#e6f2e9", borderColor: "#b7d9c2", color: "#145c37" }}>
            দাগ: {bangla(model.dagCount)}
          </span>
          <span className="rounded-md border px-3 py-1.5" data-pdf-surface="soft"
            style={{ backgroundColor: "#f2f6ed", borderColor: "#c4d6ba", color: "#145c37" }}>
            মোট জমি: {totalLand}
          </span>
          {model.isPartial ? (
            <span className="rounded-md border px-3 py-1.5"
              style={{ backgroundColor: "#fff7e7", borderColor: "#eed49e", color: "#8a5919" }}>
              উৎস রেকর্ড আংশিক
            </span>
          ) : null}
        </div>

        <section className="mt-5">
          <h2 className="mb-2 border-l-4 pl-3 text-base font-extrabold" style={{ borderColor: "#087448", color: "#17462e" }}>
            মালিক ও অভিভাবক তালিকা
          </h2>
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#bed5c5" }}>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr data-pdf-surface="table-head" style={{ backgroundColor: "#e9f3eb" }}>
                  <th scope="col" className="border-b px-3 py-2.5" style={{ borderColor: "#bed5c5" }}>মালিকের নাম</th>
                  {guardians.length ? (
                    <th scope="col" className="border-b border-l px-3 py-2.5" style={{ borderColor: "#bed5c5" }}>
                      অভিভাবক তালিকা
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  <td className="px-3 py-3">
                    {model.owners.length ? (
                      <ol className="space-y-2">
                        {model.owners.map((owner, i) => (
                          <li key={owner.name + i} className="flex items-start gap-2">
                            <span className="shrink-0 text-xs" style={{ color: "#749080" }}>{bangla(i + 1)}.</span>
                            <span className="break-words">
                              {owner.name}
                              {hasOwnerShare && present(owner.share) ? (
                                <small className="ml-2" style={{ color: "#607769" }}>
                                  (অংশ: {bangla(owner.share)})
                                </small>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : <span style={{ color: "#748478" }}>উৎসে মালিকের তথ্য নেই</span>}
                  </td>
                  {guardians.length ? (
                    <td className="border-l px-3 py-3" style={{ borderColor: "#bed5c5" }}>
                      <ul className="space-y-2">
                        {guardians.map((guardian, i) => (
                          <li key={guardian + i} className="break-words">
                            {bangla(i + 1)}. {guardian}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs" style={{ color: "#697d70" }}>
                        উৎস তালিকার ক্রম; মালিকের সঙ্গে সম্পর্ক অনুমান করা হয়নি।
                      </p>
                    </td>
                  ) : null}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 border-l-4 pl-3 text-base font-extrabold" style={{ borderColor: "#087448", color: "#17462e" }}>
            দাগ ও জমির বিবরণ
          </h2>
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#bed5c5" }}>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr data-pdf-surface="table-head" style={{ backgroundColor: "#e9f3eb" }}>
                  <th scope="col" className="border-b px-3 py-2.5" style={{ borderColor: "#bed5c5" }}>দাগ নং</th>
                  {hasClass ? <th scope="col" className="border-b px-3 py-2.5">শ্রেণী</th> : null}
                  {hasTotalArea ? <th scope="col" className="border-b px-3 py-2.5">দাগের মোট (একর)</th> : null}
                  {hasKhatianArea ? <th scope="col" className="border-b px-3 py-2.5">খতিয়ানের অংশ (একর)</th> : null}
                  {hasShare ? <th scope="col" className="border-b px-3 py-2.5">অংশ/হিস্যা</th> : null}
                </tr>
              </thead>
              <tbody>
                {model.dags.length ? model.dags.map((dag, index) => (
                  <tr key={dag.dagNo + index} className="border-b last:border-0" style={{ borderColor: "#e2eae4" }}>
                    <td className="px-3 py-2 font-bold">{bangla(dag.dagNo)}</td>
                    {hasClass ? <td className="px-3 py-2">{dag.landClass || "—"}</td> : null}
                    {hasTotalArea ? <td className="px-3 py-2">{bangla(dag.totalArea)}</td> : null}
                    {hasKhatianArea ? <td className="px-3 py-2">{bangla(dag.shareArea || dag.area)}</td> : null}
                    {hasShare ? <td className="px-3 py-2">{bangla(dag.khatianShare)}</td> : null}
                  </tr>
                )) : (
                  <tr><td colSpan={dagColumns} className="px-3 py-4 text-sm" style={{ color: "#718578" }}>
                    উৎসে দাগের তথ্য পাওয়া যায়নি।
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="mt-5 rounded-lg border px-3 py-3 text-xs leading-5"
          data-pdf-surface="soft" style={{ backgroundColor: "#f5f8f6", borderColor: "#d1e1d5", color: "#466251" }}>
          <strong style={{ color: "#1c4e31" }}>রেকর্ড যাচাই নোট:</strong> এটি DLRMS উৎসে পাওয়া তথ্যের সাজানো অনুলিপি,
          সরকারি প্রত্যয়িত পর্চা নয়। অনুপস্থিত কোনো তথ্য অনুমান করা হয়নি।
          আইনি কাজে ব্যবহারের আগে সরকারি মূল নথির সঙ্গে যাচাই করুন।
        </aside>
      </div>
      <LandBdPrintRibbon className="print:hidden" />
    </article>
  );
}
