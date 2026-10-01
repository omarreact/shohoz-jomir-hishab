"use client";

import { useMemo, useState, type RefObject } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { acreFromDlrmsValue, formatAcre } from "@/src/modules/land/jsonArea";
import type { FullKhatian, FullKhatianDag, FullKhatianOwner } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildKhatianDisplayModel, type ParsedDagRow } from "../lib/khatian-display";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
};

type ExtraRow = { label: string; value: string };

type AuthoritativeDagRow = ParsedDagRow & {
  totalArea?: string;
  khatianArea?: string;
  remarks?: string;
};

type DisplayOwner = {
  name: string;
  share?: string;
  fatherOrHusband?: string;
  address?: string;
};

function sourcePriority(source: FullKhatianDag["source"]): number {
  if (source === "LISF_AUTHORIZED") return 3;
  if (source === "DLRMS_PUBLIC") return 2;
  if (source === "DLRMS_TRACKING" || source === "DLRMS_HAL_SABEK") return 1;
  return 0;
}

function detailScore(dag: FullKhatianDag): number {
  return [
    dag.landType,
    dag.agriculturalType,
    dag.totalAreaRaw,
    dag.khatianAreaRaw,
    dag.remarks,
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== "").length;
}

function authoritativeDagMap(fullKhatian: FullKhatian | undefined): Map<string, FullKhatianDag> {
  const byDag = new Map<string, FullKhatianDag>();
  for (const dag of fullKhatian?.dags ?? []) {
    if (dag.source === "LISF_MOCK") continue;
    const key = dag.dagNo.trim();
    if (!key) continue;
    const current = byDag.get(key);
    if (!current) {
      byDag.set(key, dag);
      continue;
    }
    const nextRank = sourcePriority(dag.source) * 100 + detailScore(dag);
    const currentRank = sourcePriority(current.source) * 100 + detailScore(current);
    if (nextRank > currentRank) byDag.set(key, dag);
  }
  return byDag;
}

function acreLabel(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const acre = acreFromDlrmsValue(raw, "acre");
  return acre == null ? undefined : formatAcre(acre);
}

function normalizeOwnerName(value: string): string {
  return value.replace(/[\s.,،]+/gu, "").toLocaleLowerCase("bn-BD");
}

function mergeOwnerDetails(
  owners: Array<{ name: string; share?: string }>,
  fullKhatian: FullKhatian | undefined,
): DisplayOwner[] {
  const structured = (fullKhatian?.owners ?? []).filter((owner) => owner.source !== "LISF_MOCK");

  const findStructured = (name: string): FullKhatianOwner | undefined => {
    const key = normalizeOwnerName(name);
    return (
      structured.find((candidate) => normalizeOwnerName(candidate.name) === key) ??
      structured.find((candidate) => {
        const candidateKey = normalizeOwnerName(candidate.name);
        return candidateKey.includes(key) || key.includes(candidateKey);
      })
    );
  };

  if (!owners.length && structured.length) {
    return structured.map((owner) => ({
      name: owner.name,
      share: owner.shareRaw,
      fatherOrHusband: owner.fatherOrHusband,
      address: owner.address,
    }));
  }

  return owners.map((owner) => {
    const detail = findStructured(owner.name);
    return {
      name: owner.name,
      share: owner.share || detail?.shareRaw,
      fatherOrHusband: detail?.fatherOrHusband,
      address: detail?.address,
    };
  });
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function toBanglaDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function ownerShareText(owners: DisplayOwner[]): string {
  const shares = owners.map((owner) => owner.share?.trim()).filter(Boolean);
  return shares.length ? shares.map((value) => toBanglaDigits(value)).join("\n") : "—";
}

export default function AuthoritativeKhatianDetailsView({ khatian, fullKhatian, surveyKey, captureRef }: Props) {
  const model = useMemo(() => buildKhatianDisplayModel(khatian, surveyKey), [khatian, surveyKey]);
  const fullDagMap = useMemo(() => authoritativeDagMap(fullKhatian), [fullKhatian]);
  const owners = useMemo(() => mergeOwnerDetails(model.owners, fullKhatian), [model.owners, fullKhatian]);
  const { isLoggedIn } = useAuth();
  const [techOpen, setTechOpen] = useState(false);

  const dags = useMemo<AuthoritativeDagRow[]>(() => model.dags.map((dag) => {
    const official = fullDagMap.get(dag.dagNo.trim());
    return {
      ...dag,
      landClass: official?.landType || official?.agriculturalType || dag.landClass,
      totalArea: acreLabel(official?.totalAreaRaw) || dag.totalArea,
      khatianArea: acreLabel(official?.khatianAreaRaw) || dag.area || dag.shareArea,
      remarks: official?.remarks,
    };
  }), [model.dags, fullDagMap]);

  const tableDags: AuthoritativeDagRow[] = dags.length ? dags : [{ dagNo: "" }];

  const totalLandDisplay = model.totalLand
    ? /একর|acre/i.test(model.totalLand)
      ? model.totalLand
      : `${model.totalLand} একর`
    : "";

  const previousRaw = model.publicRecord["আগে_খতিয়ান"] ?? model.publicRecord.PREVIOUS_KHATIAN;
  const lineageFrom = previousRaw != null ? String(previousRaw).trim() : "";
  const totalTax = firstText(
    fullKhatian?.lisf.taxAmountRaw,
    model.publicRecord.LAND_DEVELOPMENT_TAX,
    model.publicRecord.RAJASWA,
    model.publicRecord.REVENUE,
    model.publicRecord.KHAJNA,
    model.publicRecord.RENT,
  );

  const extraRows: ExtraRow[] = [];
  const addExtra = (label: string, value: unknown) => {
    if (value == null) return;
    const text = String(value).trim();
    if (!text) return;
    if (!extraRows.some((row) => row.label === label && row.value === text)) {
      extraRows.push({ label, value: text });
    }
  };

  addExtra("আগে / সাবেক খতিয়ান", lineageFrom);
  addExtra("রাজস্ব", model.publicRecord.RAJASWA ?? model.publicRecord.REVENUE);
  addExtra("খাজনা", model.publicRecord.KHAJNA ?? model.publicRecord.RENT);
  addExtra("সেস", model.publicRecord.CESS);

  const verificationId = firstText(fullKhatian?.tracking?.displayCode);
  const guardianText = model.guardians.join(", ");

  return (
    <div ref={captureRef ?? undefined} className="w-full min-w-0 max-w-full bg-white text-black">
      <style>{`
        @import url("https://fonts.maateen.me/kalpurush/font.css");
        .dlrms-official-record,
        .dlrms-official-record * {
          font-family: "Kalpurush", "Noto Serif Bengali", "Nirmala UI", serif;
        }
        .dlrms-official-record table,
        .dlrms-official-record th,
        .dlrms-official-record td {
          border-color: #000 !important;
        }
        @media print {
          .dlrms-official-record {
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="w-full overflow-x-auto bg-white">
        <article className="dlrms-official-record mx-auto min-w-[1120px] max-w-[1320px] bg-white px-5 py-7 text-[15px] leading-[1.45] text-black print:min-w-0 print:max-w-none print:px-0 print:py-0">
          <header className="mb-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
              <div className="pt-2 text-[13px] leading-5">
                <p>সরকারি DLRMS ভূমি রেকর্ড</p>
                <p>{model.badgeBn} · {model.surveyLabel}</p>
              </div>

              <div className="text-center">
                <h2 className="text-[30px] font-normal leading-none">
                  খতিয়ান নং {toBanglaDigits(khatian.KHATIAN_NO || "—")}
                </h2>
              </div>

              <div className="justify-self-end text-right text-[13px] leading-5">
                {verificationId ? <p>যাচাইকরণ আইডি: {verificationId}</p> : null}
                <p>রেকর্ড আইডি: {toBanglaDigits(khatian.ID)}</p>
                {khatian.KHATIAN_ENTRY_ID != null ? (
                  <p>এন্ট্রি আইডি: {toBanglaDigits(khatian.KHATIAN_ENTRY_ID)}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-4 gap-x-8 text-center text-[15px]">
              <p>জেলা : {khatian.DISTRICT_NAME || "—"}</p>
              <p>উপজেলা / সার্কেল : {khatian.UPAZILA_NAME || "—"}</p>
              <p>মৌজা : {khatian.MOUZA_NAME || "—"}</p>
              <p>জে.এল নং : {toBanglaDigits(khatian.JL_NUMBER || "—")}</p>
            </div>
          </header>

          <div className="overflow-visible">
            <table className="w-full table-fixed border-collapse border border-black text-[14px] leading-[1.4]">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 text-center font-normal">
                    মালিক, অকৃষি প্রজা বা ইজারাদারের নাম ও ঠিকানা
                  </th>
                  <th className="border border-black px-2 py-2 text-center font-normal">অংশ</th>
                  <th className="border border-black px-2 py-2 text-center font-normal">মোট ভূমি উন্নয়ন কর</th>
                  <th className="border border-black px-2 py-2 text-center font-normal">
                    {model.kind === "MUTATION" ? "দাগ/প্লট নং" : "দাগ নং"}
                  </th>
                  <th className="border border-black px-2 py-2 text-center font-normal">জমির রেকর্ডীয় শ্রেণী</th>
                  <th className="border border-black px-2 py-2 text-center font-normal">দাগের মোট জমির পরিমাণ</th>
                  <th className="border border-black px-2 py-2 text-center font-normal">দাগের মধ্যে অত্র খতিয়ানের অংশ</th>
                  <th className="border border-black px-2 py-2 text-center font-normal">অংশানুযায়ী জমির পরিমাণ</th>
                  <th className="border border-black px-2 py-2 text-center font-normal">দখল/স্বত্ব বিষয়ক বা অন্যান্য বিষয়ে মন্তব্য</th>
                </tr>
                <tr className="text-center">
                  {["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"].map((number) => (
                    <th key={number} className="border border-black px-1 py-1 font-normal">{number}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableDags.map((dag, index) => (
                  <tr key={dag.dagNo || `empty-${index}`} className="align-top print:break-inside-avoid">
                    {index === 0 ? (
                      <>
                        <td rowSpan={tableDags.length} className="border border-black px-2 py-2">
                          {owners.length ? (
                            <div className="space-y-2">
                              {owners.map((owner, ownerIndex) => (
                                <div key={`${owner.name}-${ownerIndex}`} className={ownerIndex ? "border-t border-dotted border-black pt-2" : ""}>
                                  <p>{owner.name}</p>
                                  {owner.fatherOrHusband ? <p>পিতা/স্বামী- {owner.fatherOrHusband}</p> : null}
                                  {owner.address ? <p>সাং- {owner.address}</p> : null}
                                </div>
                              ))}
                              {guardianText ? (
                                <p className="border-t border-dotted border-black pt-2 text-[12px]">
                                  অভিভাবক তালিকা (উৎস ক্রম): {guardianText}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p>—</p>
                          )}
                        </td>
                        <td rowSpan={tableDags.length} className="whitespace-pre-line border border-black px-2 py-2 text-center">
                          {ownerShareText(owners)}
                        </td>
                        <td rowSpan={tableDags.length} className="border border-black px-2 py-2 text-center">
                          {totalTax ? toBanglaDigits(totalTax) : "—"}
                        </td>
                      </>
                    ) : null}

                    <td className="border border-black px-2 py-2 text-center">{toBanglaDigits(dag.dagNo)}</td>
                    <td className="border border-black px-2 py-2 text-center">{dag.landClass || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center">{dag.totalArea ? toBanglaDigits(dag.totalArea) : "—"}</td>
                    <td className="border border-black px-2 py-2 text-center">{dag.khatianShare ? toBanglaDigits(dag.khatianShare) : "—"}</td>
                    <td className="border border-black px-2 py-2 text-center">{dag.khatianArea ? toBanglaDigits(dag.khatianArea) : "—"}</td>
                    <td className="border border-black px-2 py-2">{dag.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border border-black px-2 py-2 text-right" colSpan={6}>
                    মোট জমি
                  </td>
                  <td className="border border-black px-2 py-2 text-center" colSpan={2}>
                    {totalLandDisplay ? toBanglaDigits(totalLandDisplay) : "—"}
                  </td>
                  <td className="border border-black px-2 py-2">
                    {lineageFrom ? <>আগত/সাবেক খতিয়ান: {toBanglaDigits(lineageFrom)}</> : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {extraRows.length ? (
            <div className="mt-5">
              <table className="w-full border-collapse border border-black text-[14px]">
                <tbody>
                  {extraRows.map((row) => (
                    <tr key={`${row.label}-${row.value}`}>
                      <td className="w-[22%] border border-black px-2 py-1.5">{row.label}</td>
                      <td className="border border-black px-2 py-1.5">{toBanglaDigits(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <section className="mt-8 text-[13px] leading-6">
            <p className="font-semibold">বিশেষ দ্রষ্টব্য:</p>
            <p>১। এই প্রদর্শন সরকারি DLRMS উৎসে পাওয়া রেকর্ড তথ্যের ভিত্তিতে তৈরি।</p>
            <p>২। এটি সরকার কর্তৃক জারি করা সার্টিফাইড/আইনগত খতিয়ান কপি নয়।</p>
            <p>৩। উৎসে অনুপস্থিত মালিক, দাগ, শ্রেণী বা জমির পরিমাণ অনুমান করে পূরণ করা হয়নি।</p>
            <p>৪। সরকারি যাচাই ও QR কপির জন্য DLRMS / ePorcha ব্যবহার করুন।</p>
          </section>
        </article>
      </div>

      {isLoggedIn ? (
        <div className="dlrms-official-record mt-3 border border-dashed border-slate-400 bg-white print:hidden" data-exclude-export="1">
          <button
            type="button"
            onClick={() => setTechOpen((value) => !value)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
          >
            প্রযুক্তিগত তথ্য
            {techOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {techOpen ? (
            <div className="space-y-1 border-t border-slate-300 px-4 py-3 text-xs leading-6">
              <p>রেকর্ড ID: {khatian.ID}</p>
              {khatian.KHATIAN_ENTRY_ID != null ? <p>KHATIAN_ENTRY_ID: {khatian.KHATIAN_ENTRY_ID}</p> : null}
              <p>JL_NUMBER_ID: {khatian.JL_NUMBER_ID}</p>
              {khatian.SURVEY_ID != null ? <p>SURVEY_ID: {khatian.SURVEY_ID}</p> : null}
              {fullKhatian ? <p>LISF status: {fullKhatian.lisf.status}</p> : null}
              {model.reconstruction ? (
                <pre className="mt-2 max-h-48 overflow-auto border border-slate-300 bg-slate-50 p-2 text-[10px]">
                  {JSON.stringify(model.reconstruction, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
