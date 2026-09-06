"use client";

import { AlertTriangle, Database, FileText, History, Link2, ShieldCheck } from "lucide-react";
import type { FullKhatian } from "../full-khatian";

type Props = {
  fullKhatian: FullKhatian;
};

function Value({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-slate-900 dark:text-slate-100">{children}</span>;
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

export default function FullKhatianSupplement({ fullKhatian }: Props) {
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

  return (
    <section className="mt-4 space-y-3 print:break-before-page" aria-label="সম্পূর্ণ খতিয়ান উৎস ও সমৃদ্ধ তথ্য">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#006a4e]" size={19} />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">ডেটা উৎস ও পূর্ণতা</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {evidence.map((item, index) => (
                <span
                  key={`${item.source}-${item.field}-${index}`}
                  className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  title={item.endpoint}
                >
                  {sourceLabel(item.source)} · {item.access === "public" ? "পাবলিক" : item.access === "authorized-private" ? "অনুমোদিত" : "ডেভেলপমেন্ট"}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-emerald-800/90 dark:text-emerald-200/90">
              কোনো অনুমান করা মালিক–অভিভাবক সম্পর্ক দেখানো হয় না। LISF-এর structured data পাওয়া গেলে ঠিক সেই উৎসের তথ্য আলাদাভাবে দেখানো হবে।
            </p>
          </div>
        </div>
      </div>

      {tracking ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Database size={17} className="text-[#006a4e]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">DLRMS যাচাইকরণ / QR রেকর্ড</h3>
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div><span className="text-[var(--muted-foreground)]">Verification ID:</span> <Value>{tracking.displayCode}</Value></div>
            {tracking.khatianId ? <div><span className="text-[var(--muted-foreground)]">Tracking Khatian ID:</span> <Value>{tracking.khatianId}</Value></div> : null}
            {tracking.applicationStatus !== undefined ? <div><span className="text-[var(--muted-foreground)]">Application status:</span> <Value>{tracking.applicationStatus}</Value></div> : null}
            {tracking.totalLandRaw ? <div><span className="text-[var(--muted-foreground)]">মোট জমি:</span> <Value>{tracking.totalLandRaw}</Value></div> : null}
          </div>
          {!tracking.matchesBaseRecord ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              এই verification ID অন্য একটি খতিয়ান নির্দেশ করছে; তথ্য মূল রেকর্ডের সঙ্গে merge করা হয়নি।
            </p>
          ) : null}
        </div>
      ) : null}

      {halSabek.length ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <History size={17} className="text-[#006a4e]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">হাল–সাবেক দাগ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-sm">
              <thead><tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--muted-foreground)]"><th className="py-2 pr-4">হাল দাগ</th><th className="py-2">সাবেক দাগ</th></tr></thead>
              <tbody>
                {halSabek.map((row, index) => (
                  <tr key={`${row.currentDag}-${row.previousDag}-${index}`} className="border-b border-[var(--border-color)]/60 last:border-0">
                    <td className="py-2 pr-4 font-semibold tabular-nums">{row.currentDag || "—"}</td>
                    <td className="py-2 font-semibold tabular-nums">{row.previousDag || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {structuredOwners.length ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Structured মালিকানা তথ্য</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead><tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--muted-foreground)]"><th className="py-2 pr-3">মালিক</th><th className="py-2 pr-3">পিতা/স্বামী</th><th className="py-2 pr-3">ঠিকানা</th><th className="py-2">অংশ</th></tr></thead>
              <tbody>{structuredOwners.map((owner, index) => <tr key={`${owner.name}-${index}`} className="border-b border-[var(--border-color)]/60 last:border-0"><td className="py-2 pr-3 font-semibold">{owner.name}</td><td className="py-2 pr-3">{owner.fatherOrHusband || "—"}</td><td className="py-2 pr-3">{owner.address || "—"}</td><td className="py-2">{owner.shareRaw || "—"}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : null}

      {structuredDags.length ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">দাগভিত্তিক পূর্ণ তথ্য</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead><tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--muted-foreground)]"><th className="py-2 pr-3">দাগ</th><th className="py-2 pr-3">শ্রেণী</th><th className="py-2 pr-3">মোট আয়তন</th><th className="py-2 pr-3">খতিয়ান অংশ</th><th className="py-2">GIS/ব্যবহার</th></tr></thead>
              <tbody>{structuredDags.map((dag, index) => {
                const flags = [dag.isGovernmentOwned ? "সরকারি" : "", dag.isRoad ? "রাস্তা" : "", dag.isWetland ? "জলাভূমি" : "", dag.isForest ? "বন" : "", dag.isReligiousType ? "ধর্মীয়" : ""].filter(Boolean).join(", ");
                return <tr key={`${dag.dagNo}-${index}`} className="border-b border-[var(--border-color)]/60 last:border-0"><td className="py-2 pr-3 font-semibold tabular-nums">{dag.dagNo}</td><td className="py-2 pr-3">{dag.landType || dag.agriculturalType || "—"}</td><td className="py-2 pr-3">{dag.totalAreaRaw || "—"}</td><td className="py-2 pr-3">{dag.khatianAreaRaw || "—"}</td><td className="py-2">{flags || dag.remarks || "—"}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      ) : null}

      {hasLisfData ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <div className="flex items-center gap-2"><FileText size={17} className="text-[#006a4e]" /><h3 className="text-sm font-bold">LISF অতিরিক্ত রেকর্ড</h3></div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {lisf.taxAmountRaw ? <p>কর/রাজস্ব: <Value>{lisf.taxAmountRaw}</Value></p> : null}
            {lisf.referenceKhatians.length ? <p>রেফারেন্স খতিয়ান: <Value>{lisf.referenceKhatians.join(", ")}</Value></p> : null}
            {lisf.referenceDags.length ? <p>রেফারেন্স দাগ: <Value>{lisf.referenceDags.join(", ")}</Value></p> : null}
            {lisf.deeds.length ? <p>দলিল রেকর্ড: <Value>{lisf.deeds.length}</Value></p> : null}
            {lisf.formattedRecord !== undefined ? <p>পূর্ণ formatted khatian: <Value>উপলব্ধ</Value></p> : null}
          </div>
          {lisf.deeds.length ? <div className="mt-3 space-y-2">{lisf.deeds.map((deed, index) => <div key={`${deed.deedNo}-${index}`} className="rounded-lg border border-[var(--border-color)] p-3 text-xs"><div className="flex items-center gap-1.5 font-semibold"><Link2 size={13} /> দলিল {deed.deedNo || index + 1}</div><p className="mt-1 text-[var(--muted-foreground)]">{[deed.deedType, deed.deedDate, deed.officeInformation].filter(Boolean).join(" · ")}</p>{deed.scannedDeedLink ? <p className="mt-1 break-all">Scanned reference: {deed.scannedDeedLink}</p> : null}</div>)}</div> : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--secondary)]/20 p-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-start gap-2"><Database size={16} className="mt-0.5 shrink-0" /><div><p className="font-semibold text-slate-700 dark:text-slate-200">LISF enrichment: {lisf.status}</p>{lisf.message ? <p className="mt-1 leading-5">{lisf.message}</p> : null}</div></div>
        </div>
      )}

      {warnings.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><div><p className="font-semibold">আংশিক তথ্য / সতর্কতা</p><ul className="mt-1 list-disc space-y-1 pl-4">{warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div></div>
        </div>
      ) : null}
    </section>
  );
}
