"use client";

import type { ReactNode } from "react";
import { acreFromDlrmsValue, formatAcre } from "@/src/modules/land/jsonArea";
import LandBdPrintRibbon from "@/src/shared/components/LandBdPrintRibbon";
import type { FullKhatian } from "../full-khatian";

type Props = {
  fullKhatian: FullKhatian;
  pageOrientation: "portrait" | "landscape";
};

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-black bg-white">
      <h3 className="border-b border-black px-3 py-2 text-[15px] font-normal">{title}</h3>
      <div className="p-3">{children}</div>
    </section>
  );
}

function sourceLabel(source: FullKhatian["evidence"][number]["source"]): string {
  switch (source) {
    case "DLRMS_PUBLIC": return "DLRMS Public";
    case "DLRMS_TRACKING": return "DLRMS Verification";
    case "DLRMS_HAL_SABEK": return "DLRMS হাল–সাবেক";
    case "LISF_AUTHORIZED": return "LISF Authorized";
    case "LISF_MOCK": return "LISF Mock";
  }
}

function dlrmsAreaLabel(value: string | null | undefined): string {
  return formatAcre(acreFromDlrmsValue(value, "acre"));
}

export default function FullKhatianSupplement({ fullKhatian, pageOrientation }: Props) {
  const { tracking, halSabek, lisf, evidence, warnings } = fullKhatian;
  const structuredOwners = fullKhatian.owners.filter(
    (owner) => owner.fatherOrHusband || owner.address || owner.shareRaw,
  );
  const structuredDags = fullKhatian.dags.filter(
    (dag) => dag.landType || dag.agriculturalType || dag.totalAreaRaw || dag.khatianAreaRaw ||
      dag.isGovernmentOwned !== undefined || dag.isRoad !== undefined || dag.isWetland !== undefined ||
      dag.isForest !== undefined || dag.isReligiousType !== undefined || dag.remarks,
  );
  const hasLisfData = lisf.status === "ready" && (
    lisf.owners.length > 0 || lisf.dags.length > 0 || Boolean(lisf.taxAmountRaw) ||
    lisf.referenceKhatians.length > 0 || lisf.referenceDags.length > 0 ||
    lisf.deeds.length > 0 || lisf.formattedRecord !== undefined
  );

  const showOwnerFather = structuredOwners.some((owner) => Boolean(owner.fatherOrHusband?.trim()));
  const showOwnerAddress = structuredOwners.some((owner) => Boolean(owner.address?.trim()));
  const showOwnerShare = structuredOwners.some((owner) => Boolean(owner.shareRaw?.trim()));
  const showDagClass = structuredDags.some((dag) => Boolean(dag.landType?.trim() || dag.agriculturalType?.trim()));
  const showDagTotalArea = structuredDags.some((dag) => Boolean(dag.totalAreaRaw?.trim()));
  const showDagKhatianArea = structuredDags.some((dag) => Boolean(dag.khatianAreaRaw?.trim()));
  const showDagUsage = structuredDags.some((dag) =>
    Boolean(
      dag.isGovernmentOwned || dag.isRoad || dag.isWetland || dag.isForest ||
      dag.isReligiousType || dag.remarks?.trim()
    ),
  );

  return (
    <section
      className={`dlrms-official-record dlrms-full-khatian-supplement record-page-${pageOrientation} mx-auto mt-4 w-full space-y-4 bg-white text-[14px] leading-6 text-black print:break-before-page ${
        pageOrientation === "landscape" ? "max-w-[1320px]" : "max-w-[900px]"
      }`}
      aria-label="সম্পূর্ণ খতিয়ান উৎস ও সমৃদ্ধ তথ্য"
      data-page-orientation={pageOrientation}
    >
      <Panel title="ডেটা উৎস ও পূর্ণতা">
        <p>
          {evidence.length
            ? evidence.map((item) => `${sourceLabel(item.source)} · ${item.access === "public" ? "পাবলিক" : item.access === "authorized-private" ? "অনুমোদিত" : "ডেভেলপমেন্ট"}`).join(" | ")
            : "উৎস তথ্য পাওয়া যায়নি।"}
        </p>
        <p className="mt-2 text-[12px]">
          কোনো অনুমান করা মালিক–অভিভাবক সম্পর্ক দেখানো হয় না। জমির পরিমাণ শুধু উৎস JSON-এর area value থেকে Acre-এ দেখানো হয়; geometry থেকে area গণনা করা হয় না।
        </p>
      </Panel>

      {tracking ? (
        <Panel title="DLRMS যাচাইকরণ / QR রেকর্ড">
          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr>
                <td className="w-1/4 border border-black px-2 py-1.5">Verification ID</td>
                <td className="border border-black px-2 py-1.5">{tracking.displayCode}</td>
                <td className="w-1/4 border border-black px-2 py-1.5">Tracking Khatian ID</td>
                <td className="border border-black px-2 py-1.5">{tracking.khatianId || "—"}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1.5">Application status</td>
                <td className="border border-black px-2 py-1.5">{tracking.applicationStatus ?? "—"}</td>
                <td className="border border-black px-2 py-1.5">মোট জমি (একর)</td>
                <td className="border border-black px-2 py-1.5">{tracking.totalLandRaw ? dlrmsAreaLabel(tracking.totalLandRaw) : "—"}</td>
              </tr>
            </tbody>
          </table>
          {!tracking.matchesBaseRecord ? (
            <p className="mt-2 border border-black px-2 py-1.5 text-[12px]">
              এই verification ID অন্য একটি খতিয়ান নির্দেশ করছে; তথ্য মূল রেকর্ডের সঙ্গে merge করা হয়নি।
            </p>
          ) : null}
        </Panel>
      ) : null}

      {halSabek.length ? (
        <Panel title="হাল–সাবেক দাগ">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1.5 text-left font-normal">হাল দাগ</th>
                <th className="border border-black px-2 py-1.5 text-left font-normal">সাবেক দাগ</th>
              </tr>
            </thead>
            <tbody>
              {halSabek.map((row, index) => (
                <tr key={`${row.currentDag}-${row.previousDag}-${index}`}>
                  <td className="border border-black px-2 py-1.5">{row.currentDag || "—"}</td>
                  <td className="border border-black px-2 py-1.5">{row.previousDag || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      {structuredOwners.length ? (
        <Panel title="Structured মালিকানা তথ্য">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[42rem] border-collapse border border-black print:min-w-0">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1.5 text-left font-normal">মালিক</th>
                  {showOwnerFather ? <th className="border border-black px-2 py-1.5 text-left font-normal">পিতা/স্বামী</th> : null}
                  {showOwnerAddress ? <th className="border border-black px-2 py-1.5 text-left font-normal">ঠিকানা</th> : null}
                  {showOwnerShare ? <th className="border border-black px-2 py-1.5 text-left font-normal">অংশ</th> : null}
                </tr>
              </thead>
              <tbody>
                {structuredOwners.map((owner, index) => (
                  <tr key={`${owner.name}-${index}`}>
                    <td className="border border-black px-2 py-1.5">{owner.name}</td>
                    {showOwnerFather ? <td className="border border-black px-2 py-1.5">{owner.fatherOrHusband || "—"}</td> : null}
                    {showOwnerAddress ? <td className="border border-black px-2 py-1.5">{owner.address || "—"}</td> : null}
                    {showOwnerShare ? <td className="border border-black px-2 py-1.5">{owner.shareRaw || "—"}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {structuredDags.length ? (
        <Panel title="দাগভিত্তিক পূর্ণ তথ্য">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[52rem] border-collapse border border-black print:min-w-0">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1.5 text-left font-normal">দাগ</th>
                  {showDagClass ? <th className="border border-black px-2 py-1.5 text-left font-normal">শ্রেণী</th> : null}
                  {showDagTotalArea ? <th className="border border-black px-2 py-1.5 text-left font-normal">মোট আয়তন (একর)</th> : null}
                  {showDagKhatianArea ? <th className="border border-black px-2 py-1.5 text-left font-normal">খতিয়ান অংশ (একর)</th> : null}
                  {showDagUsage ? <th className="border border-black px-2 py-1.5 text-left font-normal">ব্যবহার / মন্তব্য</th> : null}
                </tr>
              </thead>
              <tbody>
                {structuredDags.map((dag, index) => {
                  const flags = [
                    dag.isGovernmentOwned ? "সরকারি" : "",
                    dag.isRoad ? "রাস্তা" : "",
                    dag.isWetland ? "জলাভূমি" : "",
                    dag.isForest ? "বন" : "",
                    dag.isReligiousType ? "ধর্মীয়" : "",
                  ].filter(Boolean).join(", ");

                  return (
                    <tr key={`${dag.dagNo}-${index}`}>
                      <td className="border border-black px-2 py-1.5">{dag.dagNo}</td>
                      {showDagClass ? <td className="border border-black px-2 py-1.5">{dag.landType || dag.agriculturalType || "—"}</td> : null}
                      {showDagTotalArea ? <td className="border border-black px-2 py-1.5">{dag.totalAreaRaw ? dlrmsAreaLabel(dag.totalAreaRaw) : "—"}</td> : null}
                      {showDagKhatianArea ? <td className="border border-black px-2 py-1.5">{dag.khatianAreaRaw ? dlrmsAreaLabel(dag.khatianAreaRaw) : "—"}</td> : null}
                      {showDagUsage ? <td className="border border-black px-2 py-1.5">{flags || dag.remarks || "—"}</td> : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {hasLisfData ? (
        <Panel title="LISF অতিরিক্ত রেকর্ড">
          <table className="w-full border-collapse border border-black">
            <tbody>
              {lisf.taxAmountRaw ? (
                <tr><td className="w-1/4 border border-black px-2 py-1.5">কর/রাজস্ব</td><td className="border border-black px-2 py-1.5">{lisf.taxAmountRaw}</td></tr>
              ) : null}
              {lisf.referenceKhatians.length ? (
                <tr><td className="border border-black px-2 py-1.5">রেফারেন্স খতিয়ান</td><td className="border border-black px-2 py-1.5">{lisf.referenceKhatians.join(", ")}</td></tr>
              ) : null}
              {lisf.referenceDags.length ? (
                <tr><td className="border border-black px-2 py-1.5">রেফারেন্স দাগ</td><td className="border border-black px-2 py-1.5">{lisf.referenceDags.join(", ")}</td></tr>
              ) : null}
              {lisf.deeds.length ? (
                <tr><td className="border border-black px-2 py-1.5">দলিল রেকর্ড</td><td className="border border-black px-2 py-1.5">{lisf.deeds.length}</td></tr>
              ) : null}
              {lisf.formattedRecord !== undefined ? (
                <tr><td className="border border-black px-2 py-1.5">পূর্ণ formatted khatian</td><td className="border border-black px-2 py-1.5">উপলব্ধ</td></tr>
              ) : null}
            </tbody>
          </table>

          {lisf.deeds.length ? (
            <div className="mt-3 space-y-2">
              {lisf.deeds.map((deed, index) => (
                <div key={`${deed.deedNo}-${index}`} className="border border-black px-3 py-2 text-[12px]">
                  <p>দলিল {deed.deedNo || index + 1}</p>
                  <p>{[deed.deedType, deed.deedDate, deed.officeInformation].filter(Boolean).join(" · ") || "—"}</p>
                  {deed.scannedDeedLink ? <p className="break-all">Scanned reference: {deed.scannedDeedLink}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      ) : (
        <Panel title={`LISF enrichment: ${lisf.status}`}>
          <p className="text-[12px]">{lisf.message || "অতিরিক্ত LISF তথ্য পাওয়া যায়নি।"}</p>
        </Panel>
      )}

      {warnings.length ? (
        <Panel title="আংশিক তথ্য / সতর্কতা">
          <ol className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{index + 1}। {warning}</li>
            ))}
          </ol>
        </Panel>
      ) : null}

      <footer className="pt-2">
        <LandBdPrintRibbon />
      </footer>
    </section>
  );
}
