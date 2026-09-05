"use client";

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  MapPin,
  Users,
} from "lucide-react";
import type { KhatianDetails } from "../types";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import {
  resolveDagMapAreas,
  type DagMapAreaRow,
} from "../lib/dag-map-areas";
import {
  buildKhatianDisplayModel,
  type SurveyKind,
} from "../lib/khatian-display";

type Props = {
  khatian: KhatianDetails;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
};

function Section({
  id,
  title,
  children,
  icon,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] print:break-inside-avoid"
    >
      <header className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-3">
        {icon}
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
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
      <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function SurveyArchitectureNote({ kind }: { kind: SurveyKind }) {
  const notes: Record<SurveyKind, string> = {
    CS: "সি এস খতিয়ানে সাধারণত স্বত্ব, দখল, অংশ, খাজনা/সেস, দাগ, উত্তর সীমানা ও জমির রকম গুরুত্ব পায়। নিচে কেবল পাবলিক API-তে উপলব্ধ ক্ষেত্র দেখানো হয়েছে।",
    SA: "এস এ খতিয়ানে সাবেক→হাল রেকর্ড ধারাবাহিকতা, মালিক, হিস্যা, দাগ ও জমির শ্রেণী একসাথে থাকে। উপলব্ধ পাবলিক তথ্য অনুসারে সাজানো।",
    RS: "আর এস খতিয়ানে মালিকানা ও হিস্যা আলাদা, এবং দাগ ও জমির বিবরণ আলাদা অংশে থাকে।",
    BRS: "বি আর এস আধুনিক সেটেলমেন্ট ফরম্যাট—মালিক+অংশ, দাগ, জমির শ্রেণী ও পরিমাণ কাঠামোবদ্ধভাবে উপস্থাপন করা হয়।",
    BS: "বি এস খতিয়ানের উপলব্ধ পাবলিক ক্ষেত্র অনুসারে মালিক ও দাগ দেখানো হয়েছে।",
    MUTATION:
      "নামজারি রেকর্ডে আবেদন, মামলা, দলিল, আগে খতিয়ান ও অনুমোদন ধাপ থাকে। কেবল যাচাইকৃত পাবলিক উৎস থেকে পাওয়া ক্ষেত্র দেখানো হয়।",
    OTHER: "এই সার্ভের উপলব্ধ পাবলিক তথ্য অনুসারে খতিয়ান সাজানো হয়েছে।",
  };
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
      {notes[kind]}
    </p>
  );
}

function dlrmsAreaLabel(row: {
  area?: string;
  shareArea?: string;
  totalArea?: string;
}): string | undefined {
  return row.area || row.shareArea || row.totalArea || undefined;
}

export default function KhatianDetailsView({ khatian, surveyKey, captureRef }: Props) {
  const model = useMemo(
    () => buildKhatianDisplayModel(khatian, surveyKey),
    [khatian, surveyKey],
  );
  const [techOpen, setTechOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const [mapAreas, setMapAreas] = useState<DagMapAreaRow[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (!model.dags.length) {
      setMapAreas([]);
      return;
    }
    const controller = new AbortController();
    setMapLoading(true);
    void resolveDagMapAreas({
      dags: model.dags.map((d) => d.dagNo),
      mouzaName: khatian.MOUZA_NAME || "",
      jlNumber: khatian.JL_NUMBER || "",
      upazilaName: khatian.UPAZILA_NAME || "",
      districtName: khatian.DISTRICT_NAME || "",
      signal: controller.signal,
    })
      .then((rows) => {
        if (!controller.signal.aborted) setMapAreas(rows);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapAreas([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMapLoading(false);
      });
    return () => controller.abort();
  }, [
    model.dags,
    khatian.MOUZA_NAME,
    khatian.JL_NUMBER,
    khatian.UPAZILA_NAME,
    khatian.DISTRICT_NAME,
  ]);

  const mapByDag = useMemo(() => {
    const m = new Map<string, DagMapAreaRow>();
    for (const row of mapAreas) m.set(row.dagNo, row);
    return m;
  }, [mapAreas]);

  const showRsCol = mapAreas.some((r) => Boolean(r.rsAreaLabel));
  const showMsCol = mapAreas.some((r) => Boolean(r.msAreaLabel));

  const lineageFrom =
    typeof model.publicRecord["আগে_খতিয়ান"] === "string"
      ? String(model.publicRecord["আগে_খতিয়ান"])
      : typeof model.publicRecord.PREVIOUS_KHATIAN === "string"
        ? String(model.publicRecord.PREVIOUS_KHATIAN)
        : "";

  const totalLandDisplay = model.totalLand
    ? /একর|শতাংশ|acre/i.test(model.totalLand)
      ? model.totalLand
      : `${model.totalLand} একর`
    : "";

  return (
    <div
      ref={captureRef ?? undefined}
      className="space-y-4 print:space-y-3 print:bg-white print:text-black"
    >
      <div className="overflow-hidden rounded-xl border border-[#006a4e]/25 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-[var(--card-bg)] print:border-slate-300 print:bg-white print:from-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#006a4e] px-2.5 py-0.5 text-xs font-bold text-white">
                {model.badgeBn}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">{model.surveyLabel}</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              খতিয়ান নং — {khatian.KHATIAN_NO || "—"}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
              <MapPin size={14} className="shrink-0 text-[#006a4e]" />
              <span>
                {[khatian.DIVISION_NAME, khatian.DISTRICT_NAME, khatian.UPAZILA_NAME, khatian.MOUZA_NAME]
                  .filter(Boolean)
                  .join(" · ") || "অবস্থান উপলব্ধ নয়"}
              </span>
            </p>
          </div>
          <div className="text-right text-xs text-[var(--muted-foreground)]">
            {khatian.JL_NUMBER ? (
              <p>
                জে.এল. নং: <strong className="text-slate-800 dark:text-slate-100">{khatian.JL_NUMBER}</strong>
              </p>
            ) : null}
            {khatian.IS_LOCKED === 1 ? (
              <p className="mt-1 font-medium text-amber-700 dark:text-amber-300">রেকর্ড লক করা আছে</p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaChip label="বিভাগ" value={khatian.DIVISION_NAME || ""} />
          <MetaChip label="জেলা" value={khatian.DISTRICT_NAME || ""} />
          <MetaChip label="উপজেলা / থানা" value={khatian.UPAZILA_NAME || ""} />
          <MetaChip label="মৌজা" value={khatian.MOUZA_NAME || ""} />
        </div>
      </div>

      {model.isPartial ? (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-bold">পাবলিক API-তে আংশিক তথ্য</p>
            <p className="mt-1 text-xs leading-6 opacity-90">
              সরকারি public API কিছু মালিক, দাগ বা অভিভাবকের তথ্য সংক্ষিপ্ত করেছে। LandBD অনুপস্থিত নাম বা দাগ
              অনুমান করে যোগ করে না। সম্পূর্ণ আইনগত কপির জন্য সরকারি DLRMS / ePorcha certified copy ব্যবহার করুন।
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-bold">উপলব্ধ পাবলিক তথ্য</p>
            <p className="mt-1 text-xs leading-6 opacity-90">
              এই প্রদর্শন সরকারি পাবলিক উৎস থেকে পাওয়া যাচাইকৃত ক্ষেত্রের উপর ভিত্তি করে। এটি LandBD কর্তৃক জারি করা
              সার্টিফাইড কপি নয়।
            </p>
          </div>
        </div>
      )}

      <SurveyArchitectureNote kind={model.kind} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "মোট মালিক", value: model.ownerCount ? String(model.ownerCount) : "—" },
          { label: "মোট দাগ", value: model.dagCount ? String(model.dagCount) : "—" },
          { label: "মোট জমি", value: totalLandDisplay || "—" },
          { label: "খতিয়ান নং", value: khatian.KHATIAN_NO || "—" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-3 text-center print:break-inside-avoid"
          >
            <p className="text-[11px] text-[var(--muted-foreground)]">{item.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {(model.kind === "SA" || model.kind === "MUTATION" || lineageFrom) && (
        <Section id="lineage" title="রেকর্ডের ধারাবাহিকতা" icon={<FileText size={16} className="text-[#006a4e]" />}>
          <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {lineageFrom ? (
              <>
                <li className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm">
                  <span className="text-xs text-[var(--muted-foreground)]">আগে / সাবেক</span>
                  <p className="font-semibold">{lineageFrom}</p>
                </li>
                <li className="hidden text-slate-400 sm:block" aria-hidden>
                  →
                </li>
              </>
            ) : null}
            <li className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <span className="text-xs text-[var(--muted-foreground)]">
                {model.kind === "MUTATION" ? "নামজারি / হাল" : "বর্তমান খতিয়ান"}
              </span>
              <p className="font-semibold">{khatian.KHATIAN_NO || "—"}</p>
            </li>
          </ol>
        </Section>
      )}

      <Section
        id="owners"
        title={model.kind === "CS" ? "স্বত্ব · দখল · মালিকানা ও অংশ" : "মালিকানা ও অংশ"}
        icon={<Users size={16} className="text-[#006a4e]" />}
      >
        {model.owners.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">মালিকের নাম পাবলিক তথ্যে নেই।</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[28rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--muted-foreground)]">
                    <th className="px-2 py-2 font-semibold">ক্রম</th>
                    <th className="px-2 py-2 font-semibold">মালিকের নাম</th>
                    <th className="px-2 py-2 font-semibold">পিতা / স্বামী / অভিভাবক</th>
                    {model.hasOwnerShares ? (
                      <th className="px-2 py-2 font-semibold">অংশ</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {model.owners.map((row, index) => (
                    <tr
                      key={`${row.name}-${index}`}
                      className="border-b border-[var(--border-color)]/70 print:break-inside-avoid"
                    >
                      <td className="px-2 py-2.5 tabular-nums text-[var(--muted-foreground)]">{index + 1}</td>
                      <td className="px-2 py-2.5 font-medium">{row.name}</td>
                      <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">
                        {row.guardian || "—"}
                      </td>
                      {model.hasOwnerShares ? (
                        <td className="px-2 py-2.5 tabular-nums">{row.share || "—"}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-2 md:hidden">
              {model.owners.map((row, index) => (
                <li
                  key={`m-${row.name}-${index}`}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-2.5 print:break-inside-avoid"
                >
                  <p className="text-[11px] text-[var(--muted-foreground)]">মালিক {index + 1}</p>
                  <p className="font-semibold">{row.name}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    পিতা / স্বামী / অভিভাবক: {row.guardian || "—"}
                  </p>
                  {row.share ? (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">অংশ: {row.share}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}

        {model.extraGuardians.length > 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--border-color)] p-3">
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">অতিরিক্ত অভিভাবক তথ্য</p>
            <p className="mt-2 text-sm leading-7">{model.extraGuardians.join(", ")}</p>
          </div>
        ) : null}

        <p className="mt-3 text-[11px] leading-5 text-[var(--muted-foreground)]">
          অভিভাবক কলামে পাবলিক GUARDIANS তালিকা ক্রমানুসারে দেখানো হয়েছে। এটি স্বয়ংক্রিয় প্রদর্শন ম্যাপিং; প্রতিটি
          মালিক–অভিভাবক জোড়ার আইনগত প্রমাণ নয়।
        </p>
      </Section>

      <Section
        id="dags"
        title={model.kind === "CS" ? "দাগ · সীমানা · জমির রকম" : "দাগ ও জমির বিবরণ"}
        icon={<MapPin size={16} className="text-[#006a4e]" />}
      >
        {model.dags.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">দাগ নম্বর পাবলিক তথ্যে নেই।</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[22rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--muted-foreground)]">
                    <th className="px-2 py-2 font-semibold">ক্রম</th>
                    <th className="px-2 py-2 font-semibold">
                      {model.kind === "MUTATION" ? "দাগ / প্লট নং" : "দাগ নং"}
                    </th>
                    {model.hasLandClass ? (
                      <th className="px-2 py-2 font-semibold">জমির শ্রেণী</th>
                    ) : null}
                    {showRsCol ? (
                      <th className="px-2 py-2 font-semibold">আর এস জমির পরিমাণ</th>
                    ) : null}
                    {showMsCol ? (
                      <th className="px-2 py-2 font-semibold">এম এস জমির পরিমাণ</th>
                    ) : null}
                    {!showRsCol && !showMsCol ? (
                      <th className="px-2 py-2 font-semibold">জমির পরিমাণ (মানচিত্র)</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {model.dags.map((dag, index) => {
                    const map = mapByDag.get(dag.dagNo);
                    const rs = map?.rsAreaLabel;
                    const ms = map?.msAreaLabel;
                    const dlrms = dlrmsAreaLabel(dag);
                    const fallback =
                      rs ||
                      ms ||
                      dlrms ||
                      (mapLoading ? "মানচিত্র লোড হচ্ছে…" : "ম্যাপ থেকে জমির পরিমাণ পাওয়া যায়নি");
                    return (
                      <tr
                        key={`${dag.dagNo}-${index}`}
                        className="border-b border-[var(--border-color)]/70 print:break-inside-avoid"
                      >
                        <td className="px-2 py-2.5 tabular-nums text-[var(--muted-foreground)]">{index + 1}</td>
                        <td className="px-2 py-2.5 font-semibold tabular-nums">{dag.dagNo}</td>
                        {model.hasLandClass ? (
                          <td className="px-2 py-2.5">{dag.landClass || "—"}</td>
                        ) : null}
                        {showRsCol ? (
                          <td className={`px-2 py-2.5 text-sm ${rs ? "font-medium" : "text-[var(--muted-foreground)]"}`}>
                            {rs || "ম্যাপ থেকে জমির পরিমাণ পাওয়া যায়নি"}
                          </td>
                        ) : null}
                        {showMsCol ? (
                          <td className={`px-2 py-2.5 text-sm ${ms ? "font-medium" : "text-[var(--muted-foreground)]"}`}>
                            {ms || "ম্যাপ থেকে জমির পরিমাণ পাওয়া যায়নি"}
                          </td>
                        ) : null}
                        {!showRsCol && !showMsCol ? (
                          <td
                            className={`px-2 py-2.5 text-sm ${
                              rs || ms || dlrms ? "font-medium" : "text-[var(--muted-foreground)]"
                            }`}
                          >
                            {fallback}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-2 md:hidden">
              {model.dags.map((dag, index) => {
                const map = mapByDag.get(dag.dagNo);
                return (
                  <li
                    key={`dag-m-${dag.dagNo}-${index}`}
                    className="rounded-lg border border-[var(--border-color)] px-3 py-2.5"
                  >
                    <p className="text-[11px] text-[var(--muted-foreground)]">দাগ {index + 1}</p>
                    <p className="font-semibold tabular-nums">{dag.dagNo}</p>
                    {dag.landClass ? (
                      <p className="mt-1 text-xs">জমির শ্রেণী: {dag.landClass}</p>
                    ) : null}
                    {map?.rsAreaLabel ? (
                      <p className="mt-1 text-xs">আর এস জমির পরিমাণ: {map.rsAreaLabel}</p>
                    ) : null}
                    {map?.msAreaLabel ? (
                      <p className="mt-1 text-xs">এম এস জমির পরিমাণ: {map.msAreaLabel}</p>
                    ) : null}
                    {!map?.rsAreaLabel && !map?.msAreaLabel ? (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {mapLoading
                          ? "মানচিত্র লোড হচ্ছে…"
                          : dlrmsAreaLabel(dag) || "ম্যাপ থেকে জমির পরিমাণ পাওয়া যায়নি"}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {model.dags.length > 0 ? (
          <p className="mt-3 text-xs leading-6 text-[var(--muted-foreground)]">
            জমির পরিমাণ LandBD মানচিত্রের যাচাইকৃত আর এস / এম এস প্লট ডেটা থেকে প্রদর্শিত হয়েছে (মৌজা, জে.এল. ও দাগ
            মিলিয়ে)। এটি সরকারি খতিয়ান TOTAL_LAND-এর বিকল্প নয়।
          </p>
        ) : null}

        {totalLandDisplay ? (
          <p className="mt-3 text-sm">
            <span className="text-[var(--muted-foreground)]">মোট জমি (পাবলিক): </span>
            <strong>{totalLandDisplay}</strong>
          </p>
        ) : null}
      </Section>

      {(() => {
        const revenueKeys = [
          ["রাজস্ব", model.publicRecord.RAJASWA ?? model.publicRecord.REVENUE],
          ["খাজনা", model.publicRecord.KHAJNA ?? model.publicRecord.RENT],
          ["সেস", model.publicRecord.CESS],
          ["ভূমি উন্নয়ন কর", model.publicRecord.LAND_DEVELOPMENT_TAX],
        ] as const;
        const rows = revenueKeys.filter(([, v]) => v != null && String(v).trim());
        if (!rows.length) return null;
        return (
          <Section id="revenue" title="রাজস্ব / খাজনা / কর">
            <div className="grid gap-2 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <MetaChip key={label} label={label} value={String(value)} />
              ))}
            </div>
          </Section>
        );
      })()}

      {model.kind === "MUTATION" ? (
        <Section id="mutation" title="নামজারি তথ্য">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["আবেদন নং", model.publicRecord.APPLICATION_NO ?? model.publicRecord["আবেদন_নং"]],
                ["আবেদনের তারিখ", model.publicRecord.APPLICATION_DATE],
                ["মামলা নং", model.publicRecord.CASE_NO ?? model.publicRecord["মামলা_নং"]],
                ["অনলাইন DCR", model.publicRecord.DCR_NO ?? model.publicRecord.ONLINE_DCR],
                ["দলিল নং", model.publicRecord.DEED_NO],
                ["দলিলের তারিখ", model.publicRecord.DEED_DATE],
                ["আগে খতিয়ান", lineageFrom || model.publicRecord.PREVIOUS_KHATIAN],
                ["হোল্ডিং নম্বর", model.publicRecord.HOLDING_NO],
              ] as const
            )
              .filter(([, v]) => v != null && String(v).trim())
              .map(([label, value]) => (
                <MetaChip key={label} label={label} value={String(value)} />
              ))}
          </div>
        </Section>
      ) : null}

      <Section id="verify" title="যাচাই ও সরকারি কপি" icon={<Info size={16} className="text-[#006a4e]" />}>
        <ul className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>• LandBD এই পৃষ্ঠায় শুধু সরকারি পাবলিক তথ্যের পাঠযোগ্য সংস্করণ দেখায়।</li>
          <li>• এটি সরকারি সার্টিফাইড / আইনগত কপি নয়; সিল বা স্বাক্ষর তৈরি করা হয় না।</li>
          <li>• সম্পূর্ণ যাচাই ও QR কপির জন্য সরকারি DLRMS বা ePorcha ব্যবহার করুন।</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <a
            href="https://dlrms.land.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-lg border border-[var(--border-color)] px-3 text-xs font-semibold no-underline hover:bg-[var(--secondary)]"
          >
            সরকারি DLRMS-এ যাচাই করুন
          </a>
          <a
            href="https://eporcha.tech/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-lg border border-[var(--border-color)] px-3 text-xs font-semibold no-underline hover:bg-[var(--secondary)]"
          >
            ePorcha দেখুন
          </a>
        </div>
      </Section>

      {isLoggedIn ? (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] print:hidden" data-exclude-export="1">
          <button
            type="button"
            onClick={() => setTechOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--muted-foreground)]"
          >
            প্রযুক্তিগত তথ্য
            {techOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {techOpen ? (
            <div className="space-y-2 border-t border-[var(--border-color)] px-4 py-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
              <p>রেকর্ড ID: {khatian.ID}</p>
              {khatian.KHATIAN_ENTRY_ID != null ? <p>KHATIAN_ENTRY_ID: {khatian.KHATIAN_ENTRY_ID}</p> : null}
              <p>JL_NUMBER_ID: {khatian.JL_NUMBER_ID}</p>
              {khatian.SURVEY_ID != null ? <p>SURVEY_ID: {khatian.SURVEY_ID}</p> : null}
              {mapAreas.length ? (
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-950/5 p-2 text-[10px] dark:bg-white/5">
                  {JSON.stringify(mapAreas, null, 2)}
                </pre>
              ) : null}
              {model.reconstruction ? (
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950/5 p-2 text-[10px] dark:bg-white/5">
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
