"use client";

import { useMemo, type RefObject } from "react";
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

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return Boolean(text && text !== "—" && text !== "-");
}

function toBanglaDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

/**
 * Temporary restored view after a bad deploy truncated this file.
 * Layout: owners block + dags block (no rowspan) so PDF export stays aligned.
 */
export default function AuthoritativeKhatianDetailsView({
  khatian,
  surveyKey,
  captureRef,
  pageOrientation,
}: Props) {
  const model = useMemo(() => buildKhatianDisplayModel(khatian, surveyKey), [khatian, surveyKey]);
  const owners = model.owners;
  const dags = model.dags.length ? model.dags : [{ dagNo: "", landClass: "", area: "", shareArea: "", khatianShare: "", totalArea: "" }];
  const guardians = model.guardians.filter(hasValue);
  const totalLand = model.totalLand
    ? /একর|acre/i.test(model.totalLand)
      ? model.totalLand
      : `${model.totalLand} একর`
    : "";

  return (
    <div
      ref={captureRef ?? undefined}
      className="w-full min-w-0 max-w-full bg-white p-4 text-slate-950"
      data-page-orientation={pageOrientation}
    >
      <header className="mb-4 border-b border-slate-200 pb-3 text-center">
        <h1 className="text-xl font-bold">খতিয়ান নং {toBanglaDigits(khatian.KHATIAN_NO)}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {model.surveyLabel || surveyKey || "—"} · {khatian.MOUZA_NAME || "—"} · জে.এল {toBanglaDigits(khatian.JL_NUMBER)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <p>জেলা: <strong>{khatian.DISTRICT_NAME || "—"}</strong></p>
          <p>উপজেলা: <strong>{khatian.UPAZILA_NAME || "—"}</strong></p>
          <p>মৌজা: <strong>{khatian.MOUZA_NAME || "—"}</strong></p>
          <p>জে.এল: <strong>{toBanglaDigits(khatian.JL_NUMBER)}</strong></p>
        </div>
      </header>

      <div className="space-y-3">
        <table className="w-full border-collapse border border-slate-800 text-sm">
          <thead>
            <tr className="bg-emerald-50">
              <th className="border border-slate-800 px-2 py-2">মালিকের নাম</th>
              <th className="border border-slate-800 px-2 py-2">পিতা / স্বামী / অভিভাবক</th>
            </tr>
            <tr className="bg-emerald-50/60 text-center text-xs">
              <th className="border border-slate-800 px-2 py-1">১</th>
              <th className="border border-slate-800 px-2 py-1">১(ক)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top">
              <td className="border border-slate-800 px-2 py-2">
                {owners.length ? (
                  <ul className="space-y-1">
                    {owners.map((owner, index) => (
                      <li key={`${owner.name}-${index}`} className="font-medium">
                        {owner.name}
                        {hasValue(owner.share) ? (
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            (অংশ {toBanglaDigits(owner.share)})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
              <td className="border border-slate-800 px-2 py-2">
                {guardians.length ? (
                  <ul className="space-y-1">
                    {guardians.map((g, index) => (
                      <li key={`${g}-${index}`}>{g}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border border-slate-800 text-sm">
          <thead>
            <tr className="bg-emerald-50">
              <th className="border border-slate-800 px-2 py-2">দাগ নং</th>
              <th className="border border-slate-800 px-2 py-2">জমির শ্রেণী</th>
              <th className="border border-slate-800 px-2 py-2">পরিমাণ</th>
            </tr>
            <tr className="bg-emerald-50/60 text-center text-xs">
              <th className="border border-slate-800 px-2 py-1">৪</th>
              <th className="border border-slate-800 px-2 py-1">৫</th>
              <th className="border border-slate-800 px-2 py-1">৮</th>
            </tr>
          </thead>
          <tbody>
            {dags.map((dag, index) => (
              <tr key={dag.dagNo || `dag-${index}`} className="text-center">
                <td className="border border-slate-800 px-2 py-2">{toBanglaDigits(dag.dagNo || "—")}</td>
                <td className="border border-slate-800 px-2 py-2">{hasValue(dag.landClass) ? dag.landClass : "—"}</td>
                <td className="border border-slate-800 px-2 py-2">
                  {toBanglaDigits(dag.area || dag.shareArea || dag.totalArea || "—")}
                </td>
              </tr>
            ))}
            {hasValue(totalLand) ? (
              <tr>
                <td colSpan={3} className="border border-slate-800 bg-slate-50 px-3 py-2 text-right">
                  <span className="font-medium">মোট জমি</span>{" "}
                  <strong className="ml-4">{toBanglaDigits(totalLand)}</strong>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <section className="mt-5 text-xs leading-5 text-slate-700">
        <p className="font-semibold">বিশেষ দ্রষ্টব্য:</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4">
          <li>এই প্রদর্শন সরকারি ডিএলআরএমএস উৎসে পাওয়া রেকর্ড তথ্যের ভিত্তিতে তৈরি।</li>
          <li>এটি সরকার কর্তৃক জারি করা সার্টিফাইড/আইনসঙ্গত খতিয়ান কপি নয়।</li>
          <li>উৎসে অনুপস্থিত মালিক, দাগ, শ্রেণী বা জমির পরিমাণ অনুমান করে পূরণ করা হয়নি।</li>
          <li>সরকারি যাচাই ও কিউআর কপির জন্য ডিএলআরএমএস / e-Porcha ব্যবহার করুন।</li>
        </ol>
      </section>
    </div>
  );
}
