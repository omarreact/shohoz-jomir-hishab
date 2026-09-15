"use client";

import { useMemo, useState, type ReactNode, type RefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { acreFromDlrmsValue, formatAcre } from "@/src/modules/land/jsonArea";
import type { FullKhatian, FullKhatianDag } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildKhatianDisplayModel, type ParsedDagRow, type SurveyKind } from "../lib/khatian-display";

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
  sourceLabel?: string;
};

function Section({ id, title, children, icon }: { id?: string; title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <header className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-3">
        {icon}
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary)]/40 px-3 py-2">
      <p className="text-[11px] font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SurveyArchitectureNote({ kind }: { kind: SurveyKind }) {
  const notes: Record<SurveyKind, string> = {
    CS: "সি এস খতিয়ানে স্বত্ব, দখল, দাগ, সীমানা, জমির রকম ও রাজস্ব-সংক্রান্ত যে তথ্য সরকারি রেকর্ড উৎসে পাওয়া যায়, তা দেখানো হয়।",
    SA: "এস এ খতিয়ানের সাবেক/হাল রেকর্ড, মালিক, দাগ, শ্রেণী ও জমির তথ্য উৎসে যতটুকু পাওয়া যায় ততটুকুই দেখানো হয়।",
    RS: "আর এস খতিয়ানের মালিকানা, দাগ, জমির শ্রেণী ও সরকারি রেকর্ডে থাকা জমির পরিমাণ দেখানো হয়।",
    BRS: "বি আর এস রেকর্ডের মালিক, দাগ, জমির শ্রেণী ও সরকারি রেকর্ডে থাকা দাগভিত্তিক জমির পরিমাণ পাওয়া গেলে দেখানো হয়।",
    BS: "বি এস খতিয়ানের সরকারি রেকর্ড উৎসে পাওয়া তথ্য দেখানো হয়।",
    MUTATION: "নামজারি রেকর্ডের আবেদন, মামলা, দলিল, আগত খতিয়ান ও জমির তথ্য উৎসে পাওয়া অনুযায়ী দেখানো হয়।",
    OTHER: "এই খতিয়ানের সরকারি রেকর্ড উৎসে পাওয়া তথ্য দেখানো হয়।",
  };
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
      {notes[kind]}
    </p>
  );
}

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

function sourceLabel(source: FullKhatianDag["source"] | undefined): string | undefined {
  if (source === "LISF_AUTHORIZED") return "LISF Authorized";
  if (source === "DLRMS_PUBLIC") return "DLRMS Public";
  return undefined;
}

function LandBDSeal() {
  return (
    <div className="flex justify-center sm:justify-end print:justify-center" data-landbd-seal="1">
      <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-4 border-double border-[var(--brand-gold)] bg-[var(--brand-gold-faint)] px-3 text-center text-[var(--brand-gold-text)] print:bg-white">
        <p className="text-lg font-black tracking-tight">LandBD</p>
        <p className="mt-0.5 text-[11px] font-bold">সহজ জমির হিসাব</p>
        <div className="my-1.5 h-px w-16 bg-[var(--brand-gold)]/40" />
        <p className="text-[9px] font-semibold leading-4">ডিজিটাল রেকর্ড ভিউ</p>
        <p className="mt-1 rounded-full border border-[var(--brand-gold)]/40 px-2 py-0.5 text-[8px] font-bold">সরকারি সীল নয়</p>
      </div>
    </div>
  );
}

export default function AuthoritativeKhatianDetailsView({ khatian, fullKhatian, surveyKey, captureRef }: Props) {
  const model = useMemo(() => buildKhatianDisplayModel(khatian, surveyKey), [khatian, surveyKey]);
  const fullDagMap = useMemo(() => authoritativeDagMap(fullKhatian), [fullKhatian]);
  const { isLoggedIn } = useAuth();
  const [techOpen, setTechOpen] = useState(false);

  const dags = useMemo<AuthoritativeDagRow[]>(() => model.dags.map((dag) => {
    const official = fullDagMap.get(dag.dagNo.trim());
    return {
      ...dag,
      landClass: official?.landType || official?.agriculturalType || dag.landClass,
      totalArea: acreLabel(official?.totalAreaRaw) || dag.totalArea,
      khatianArea: acreLabel(official?.khatianAreaRaw) || dag.area || dag.shareArea,
      sourceLabel: sourceLabel(official?.source),
    };
  }), [model.dags, fullDagMap]);

  const showOwnerCol = model.owners.length > 0;
  const showOwnerShareCol = model.hasOwnerShares;
  const showGuardianCol = model.guardians.length > 0;
  const showDagCol = dags.length > 0;
  const showLandClassCol = dags.some((dag) => Boolean(dag.landClass));
  const showTotalAreaCol = dags.some((dag) => Boolean(dag.totalArea));
  const showKhatianAreaCol = dags.some((dag) => Boolean(dag.khatianArea));
  const hasOfficialPerDagArea = showTotalAreaCol || showKhatianAreaCol;

  const rowCount = Math.max(model.owners.length, model.guardians.length, dags.length);
  const combinedRows = Array.from({ length: rowCount }, (_, index) => ({
    owner: model.owners[index],
    guardian: model.guardians[index],
    dag: dags[index],
  }));

  const totalLandDisplay = model.totalLand
    ? /একর|acre/i.test(model.totalLand)
      ? model.totalLand
      : `${model.totalLand} একর`
    : "";

  const previousRaw = model.publicRecord["আগে_খতিয়ান"] ?? model.publicRecord.PREVIOUS_KHATIAN;
  const lineageFrom = previousRaw != null ? String(previousRaw).trim() : "";
  const extraRows: ExtraRow[] = [];
  const addExtra = (label: string, value: unknown) => {
    if (value == null) return;
    const text = String(value).trim();
    if (!text) return;
    if (!extraRows.some((row) => row.label === label && row.value === text)) extraRows.push({ label, value: text });
  };
  addExtra("আগে / সাবেক খতিয়ান", lineageFrom);
  addExtra("রাজস্ব", model.publicRecord.RAJASWA ?? model.publicRecord.REVENUE);
  addExtra("খাজনা", model.publicRecord.KHAJNA ?? model.publicRecord.RENT);
  addExtra("সেস", model.publicRecord.CESS);
  addExtra("ভূমি উন্নয়ন কর", model.publicRecord.LAND_DEVELOPMENT_TAX);

  const summaryItems = [
    model.ownerCount ? { label: "মোট মালিক", value: String(model.ownerCount) } : null,
    model.guardians.length ? { label: "অভিভাবক তথ্য", value: String(model.guardians.length) } : null,
    model.dagCount ? { label: "মোট দাগ", value: String(model.dagCount) } : null,
    totalLandDisplay ? { label: "মোট জমি", value: totalLandDisplay } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div ref={captureRef ?? undefined} className="w-full min-w-0 max-w-full space-y-3 overflow-x-hidden print:bg-white print:text-black">
      <div className="overflow-hidden rounded-xl border border-[var(--brand-gold)]/35 bg-[var(--card-bg)] print:border-slate-300 print:bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold)] text-sm font-black text-white">LB</div>
            <div>
              <p className="text-base font-black tracking-tight text-slate-950">LandBD · সহজ জমির হিসাব</p>
              <a href="https://landbd.pincodeit.com/" className="text-xs font-semibold text-[var(--brand-gold-text)] no-underline">landbd.pincodeit.com</a>
              <p className="text-[11px] text-[var(--muted-foreground)]">ডিজিটাল খতিয়ান রিডার · সরকারি রেকর্ড উৎসের পাঠযোগ্য উপস্থাপন</p>
            </div>
          </div>
          <div className="text-right text-[11px] leading-5 text-[var(--muted-foreground)]">
            <p className="font-semibold text-slate-800">{model.badgeBn} · {model.surveyLabel}</p>
            {khatian.JL_NUMBER ? <p>জে.এল. নং: {khatian.JL_NUMBER}</p> : null}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">খতিয়ান নং — {khatian.KHATIAN_NO || "—"}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                <MapPin size={14} className="shrink-0 text-[var(--brand-gold-text)]" />
                <span>{[khatian.DIVISION_NAME, khatian.DISTRICT_NAME, khatian.UPAZILA_NAME, khatian.MOUZA_NAME].filter(Boolean).join(" · ") || "অবস্থান উপলব্ধ নয়"}</span>
              </p>
            </div>
            {khatian.IS_LOCKED === 1 ? <p className="text-xs font-semibold text-amber-700">রেকর্ড লক করা আছে</p> : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetaChip label="বিভাগ" value={khatian.DIVISION_NAME || ""} />
            <MetaChip label="জেলা" value={khatian.DISTRICT_NAME || ""} />
            <MetaChip label="উপজেলা / থানা" value={khatian.UPAZILA_NAME || ""} />
            <MetaChip label="মৌজা" value={khatian.MOUZA_NAME || ""} />
          </div>

          {summaryItems.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border-color)] bg-[var(--secondary)]/30 px-3 py-2 text-center">
                  <p className="text-[10px] text-[var(--muted-foreground)]">{item.label}</p>
                  <p className="mt-0.5 text-base font-black tabular-nums text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {model.isPartial ? (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-bold">পাবলিক API-তে আংশিক তথ্য</p>
            <p className="mt-1 text-xs leading-5">সরকারি পাবলিক API কিছু ক্ষেত্র সংক্ষিপ্ত করেছে। LandBD অনুপস্থিত নাম, দাগ, শ্রেণী বা জমির পরিমাণ অনুমান করে যোগ করে না।</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-bold">উপলব্ধ সরকারি রেকর্ড তথ্য</p>
            <p className="mt-1 text-xs leading-5">এই প্রদর্শন উৎসে পাওয়া ক্ষেত্রের উপর ভিত্তি করে। এটি LandBD কর্তৃক জারি করা সার্টিফাইড কপি নয়।</p>
          </div>
        </div>
      )}

      <SurveyArchitectureNote kind={model.kind} />

      {showDagCol && !hasOfficialPerDagArea && totalLandDisplay ? (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-bold">দাগভিত্তিক সরকারি জমির পরিমাণ পাওয়া যায়নি</p>
            <p className="mt-1 text-xs leading-5">এই রেকর্ডের TOTAL_LAND পাওয়া গেছে, কিন্তু বর্তমান সরকারি/অনুমোদিত JSON উৎসে প্রতিটি দাগের area field নেই। LandBD মোট জমি ভাগ করে বা RAJUK GIS Shape__Area ব্যবহার করে দাগভিত্তিক খতিয়ান area বানায় না।</p>
          </div>
        </div>
      ) : null}

      {rowCount > 0 ? (
        <Section id="record-table" title={model.kind === "CS" ? "সমন্বিত স্বত্ব ও দাগ সারণি" : "সমন্বিত খতিয়ান তথ্য"} icon={<FileText size={16} className="text-[var(--brand-gold-text)]" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--secondary)]/30 text-left text-xs text-[var(--muted-foreground)]">
                  <th className="px-2 py-2 font-semibold">ক্রম</th>
                  {showOwnerCol ? <th className="px-2 py-2 font-semibold">মালিকের নাম</th> : null}
                  {showOwnerShareCol ? <th className="px-2 py-2 font-semibold">অংশ</th> : null}
                  {showGuardianCol ? <th className="px-2 py-2 font-semibold">পিতা / স্বামী / অভিভাবক তালিকা</th> : null}
                  {showDagCol ? <th className="px-2 py-2 font-semibold">{model.kind === "MUTATION" ? "দাগ / প্লট নং" : "দাগ নং"}</th> : null}
                  {showLandClassCol ? <th className="px-2 py-2 font-semibold">জমির শ্রেণী</th> : null}
                  {showTotalAreaCol ? <th className="px-2 py-2 font-semibold">দাগের মোট পরিমাণ</th> : null}
                  {showKhatianAreaCol ? <th className="px-2 py-2 font-semibold">খতিয়ানে জমির পরিমাণ</th> : null}
                </tr>
              </thead>
              <tbody>
                {combinedRows.map((row, index) => (
                  <tr key={`combined-${index}`} className="border-b border-[var(--border-color)]/70 last:border-0 print:break-inside-avoid">
                    <td className="px-2 py-2 tabular-nums text-[var(--muted-foreground)]">{index + 1}</td>
                    {showOwnerCol ? <td className="max-w-[16rem] break-words px-2 py-2 font-medium [overflow-wrap:anywhere]">{row.owner?.name || "—"}</td> : null}
                    {showOwnerShareCol ? <td className="whitespace-nowrap px-2 py-2 tabular-nums">{row.owner?.share || "—"}</td> : null}
                    {showGuardianCol ? <td className="max-w-[16rem] break-words px-2 py-2 [overflow-wrap:anywhere]">{row.guardian || "—"}</td> : null}
                    {showDagCol ? <td className="px-2 py-2 font-semibold tabular-nums">{row.dag?.dagNo || "—"}</td> : null}
                    {showLandClassCol ? <td className="px-2 py-2">{row.dag?.landClass || "—"}</td> : null}
                    {showTotalAreaCol ? <td className="px-2 py-2 tabular-nums">{row.dag?.totalArea || "—"}</td> : null}
                    {showKhatianAreaCol ? <td className="px-2 py-2 tabular-nums">{row.dag?.khatianArea || "—"}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(showGuardianCol || showDagCol) ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-600">
              এই সারণির মালিক, অভিভাবক ও দাগ কলাম পৃথক উৎস তালিকার ক্রম compactভাবে পাশাপাশি দেখায়। একই সারির মানগুলোর মধ্যে আইনগত মালিক–অভিভাবক–দাগ সম্পর্ক LandBD দাবি করে না।
            </div>
          ) : null}

          {hasOfficialPerDagArea ? (
            <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">দাগভিত্তিক জমির পরিমাণ শুধু DLRMS/LISF record JSON-এর area field থেকে Acre-এ দেখানো হয়েছে। RAJUK geometry, polygon, coordinates বা Shape__Area এই খতিয়ান area কলামে ব্যবহার করা হয়নি।</p>
          ) : null}
        </Section>
      ) : null}

      {extraRows.length ? (
        <Section id="extra-record-data" title="অতিরিক্ত রেকর্ড তথ্য" icon={<Info size={16} className="text-[var(--brand-gold-text)]" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-sm">
              <thead><tr className="border-b border-[var(--border-color)] bg-[var(--secondary)]/30 text-left text-xs text-[var(--muted-foreground)]"><th className="px-2 py-2 font-semibold">তথ্য</th><th className="px-2 py-2 font-semibold">মান</th></tr></thead>
              <tbody>{extraRows.map((row) => <tr key={`${row.label}-${row.value}`} className="border-b border-[var(--border-color)]/70 last:border-0"><td className="px-2 py-2 font-medium">{row.label}</td><td className="px-2 py-2">{row.value}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      ) : null}

      <Section id="verify" title="যাচাই, উৎস ও LandBD সীল" icon={<Info size={16} className="text-[var(--brand-gold-text)]" />}>
        <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <ul className="space-y-1.5 text-sm leading-6 text-slate-700">
              <li>• LandBD সরকারি ভূমি-রেকর্ড তথ্যকে পাঠযোগ্য ডিজিটাল বিন্যাসে দেখায়।</li>
              <li>• এটি সরকারি সার্টিফাইড / আইনগত কপি নয়। সরকারি সিল, স্বাক্ষর বা QR LandBD তৈরি করে না।</li>
              <li>• খতিয়ানের জমির পরিমাণে GIS geometry-ভিত্তিক area ব্যবহার করা হয় না।</li>
              <li>• সম্পূর্ণ আইনগত যাচাই ও QR কপির জন্য সরকারি DLRMS / ePorcha ব্যবহার করুন।</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              <a href="https://dlrms.land.gov.bd/" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg border border-[var(--border-color)] px-3 text-xs font-semibold no-underline hover:bg-[var(--secondary)]">সরকারি DLRMS-এ যাচাই করুন</a>
              <a href="https://eporcha.gov.bd/" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg border border-[var(--border-color)] px-3 text-xs font-semibold no-underline hover:bg-[var(--secondary)]">ePorcha দেখুন</a>
            </div>
          </div>
          <LandBDSeal />
        </div>
      </Section>

      {isLoggedIn ? (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] print:hidden" data-exclude-export="1">
          <button type="button" onClick={() => setTechOpen((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--muted-foreground)]">
            প্রযুক্তিগত তথ্য
            {techOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {techOpen ? (
            <div className="space-y-2 border-t border-[var(--border-color)] px-4 py-3 text-xs leading-6 text-slate-600">
              <p>রেকর্ড ID: {khatian.ID}</p>
              {khatian.KHATIAN_ENTRY_ID != null ? <p>KHATIAN_ENTRY_ID: {khatian.KHATIAN_ENTRY_ID}</p> : null}
              <p>JL_NUMBER_ID: {khatian.JL_NUMBER_ID}</p>
              {khatian.SURVEY_ID != null ? <p>SURVEY_ID: {khatian.SURVEY_ID}</p> : null}
              {fullKhatian ? <p>LISF status: {fullKhatian.lisf.status}</p> : null}
              {model.reconstruction ? <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950/5 p-2 text-[10px]">{JSON.stringify(model.reconstruction, null, 2)}</pre> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
