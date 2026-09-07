"use client";

import { FormEvent, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  QrCode,
  Search,
  ShieldCheck,
} from "lucide-react";
import { landRecordsApi } from "../api";
import type { FullKhatian } from "../full-khatian";
import KhatianDetailsView from "./KhatianDetailsView";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const MUTATION_QR_RE = /^[0-9a-f]{6,16}$/i;

function extractVerificationUuid(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(UUID_RE);
  if (!match) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.hostname.toLowerCase() !== "dlrms.land.gov.bd") return null;
      if (!url.pathname.toLowerCase().includes(`/v/${match[0].toLowerCase()}`)) return null;
    } catch {
      return null;
    }
  }
  return match[0].toLowerCase();
}

function extractMutationKey(value: string): string | null {
  const trimmed = value.trim();
  const urlMatch = trimmed.match(
    /https?:\/\/mutation\.land\.gov\.bd\/qr-vk\/([0-9a-f]{6,16})/i,
  );
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase();
  if (MUTATION_QR_RE.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

function surveyLabel(surveyId?: number): string {
  const labels: Record<number, string> = {
    1: "CS", 2: "RS", 3: "SA", 4: "BS", 5: "DIARA", 6: "PETY", 7: "BRS", 8: "BDS",
  };
  return surveyId ? labels[surveyId] ?? `Survey ${surveyId}` : "—";
}

interface MutationRecord {
  qrKey: string;
  khatianNo?: string;
  applicationNo?: string;
  mutationCaseNo?: string;
  dcrNo?: string;
  office?: string;
  district?: string;
  upazila?: string;
  mouza?: string;
  jlNo?: string;
  owners: string[];
  dags: string[];
  totalLand?: string;
  deedNo?: string;
  deedDate?: string;
  sourceKhatian?: string;
  verifiedAt?: string;
  verificationPageUrl: string;
  structuredResponse: boolean;
}

function MutationResultCard({ record }: { record: MutationRecord }) {
  const location = [record.district, record.upazila, record.mouza].filter(Boolean).join(" · ");
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={17} className="text-emerald-600" />
          <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
            Mutation Verification Record
          </span>
          {record.structuredResponse ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              JSON
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              Partial
            </span>
          )}
        </div>
        <a
          href={record.verificationPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#006a4e] no-underline hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
        >
          <ExternalLink size={13} />
          সরকারি পেজ দেখুন
        </a>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {record.khatianNo && (
          <div>
            <p className="text-[11px] text-slate-500">খতিয়ান নং</p>
            <p className="font-bold text-slate-900 dark:text-white">{record.khatianNo}</p>
          </div>
        )}
        {record.applicationNo && (
          <div>
            <p className="text-[11px] text-slate-500">আবেদন নং</p>
            <p className="font-semibold">{record.applicationNo}</p>
          </div>
        )}
        {record.mutationCaseNo && (
          <div>
            <p className="text-[11px] text-slate-500">মিউটেশন মামলা নং</p>
            <p className="font-semibold">{record.mutationCaseNo}</p>
          </div>
        )}
        {record.dcrNo && (
          <div>
            <p className="text-[11px] text-slate-500">DCR নং</p>
            <p className="font-semibold">{record.dcrNo}</p>
          </div>
        )}
        {record.office && (
          <div>
            <p className="text-[11px] text-slate-500">ভূমি অফিস</p>
            <p className="font-semibold">{record.office}</p>
          </div>
        )}
        {location && (
          <div>
            <p className="text-[11px] text-slate-500">অবস্থান</p>
            <p className="font-semibold">{location}</p>
          </div>
        )}
        {record.jlNo && (
          <div>
            <p className="text-[11px] text-slate-500">JL নং</p>
            <p className="font-semibold">{record.jlNo}</p>
          </div>
        )}
        {record.totalLand && (
          <div>
            <p className="text-[11px] text-slate-500">মোট জমি</p>
            <p className="font-semibold">{record.totalLand}</p>
          </div>
        )}
        {record.deedNo && (
          <div>
            <p className="text-[11px] text-slate-500">দলিল নং</p>
            <p className="font-semibold">{record.deedNo}</p>
          </div>
        )}
        {record.deedDate && (
          <div>
            <p className="text-[11px] text-slate-500">দলিলের তারিখ</p>
            <p className="font-semibold">{record.deedDate}</p>
          </div>
        )}
        {record.sourceKhatian && (
          <div>
            <p className="text-[11px] text-slate-500">আগত / সাবেক খতিয়ান</p>
            <p className="font-semibold">{record.sourceKhatian}</p>
          </div>
        )}
      </div>

      {(record.owners.length > 0 || record.dags.length > 0) && (
        <div className="grid gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-2">
          {record.owners.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">মালিক</p>
              <ul className="space-y-1">
                {record.owners.map((owner, i) => (
                  <li key={i} className="text-sm font-medium text-slate-800 dark:text-slate-200">{owner}</li>
                ))}
              </ul>
            </div>
          )}
          {record.dags.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">দাগ নং</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {record.dags.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {!record.structuredResponse && (
        <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          সরকারি API থেকে structured JSON পাওয়া যায়নি। সরকারি পেজে গিয়ে সম্পূর্ণ তথ্য ও PDF দেখুন।
        </div>
      )}
    </div>
  );
}

export default function KhatianVerificationLookup() {
  const [dlrmsValue, setDlrmsValue] = useState("");
  const [dlrmsLoading, setDlrmsLoading] = useState(false);
  const [dlrmsError, setDlrmsError] = useState<string | null>(null);
  const [dlrmsRecord, setDlrmsRecord] = useState<FullKhatian | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const [mutationValue, setMutationValue] = useState("");
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationRecord, setMutationRecord] = useState<MutationRecord | null>(null);

  const submitDlrms = async (event: FormEvent) => {
    event.preventDefault();
    const uuid = extractVerificationUuid(dlrmsValue);
    if (!uuid) {
      setDlrmsError("সঠিক DLRMS যাচাইকরণ UUID অথবা https://dlrms.land.gov.bd/v/... লিংক দিন।");
      setDlrmsRecord(null);
      return;
    }
    setDlrmsLoading(true);
    setDlrmsError(null);
    setDlrmsRecord(null);
    try {
      const full = await landRecordsApi.fullKhatianByVerificationUuid(uuid);
      setDlrmsRecord(full);
      requestAnimationFrame(() => {
        document.getElementById("verified-khatian-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (cause) {
      setDlrmsError(cause instanceof Error ? cause.message : "DLRMS যাচাইকরণ তথ্য আনা যায়নি।");
    } finally {
      setDlrmsLoading(false);
    }
  };

  const submitMutation = async (event: FormEvent) => {
    event.preventDefault();
    const key = extractMutationKey(mutationValue);
    if (!key) {
      setMutationError("সঠিক Mutation QR key বা mutation.land.gov.bd/qr-vk/... লিংক দিন।");
      setMutationRecord(null);
      return;
    }
    setMutationLoading(true);
    setMutationError(null);
    setMutationRecord(null);
    try {
      const res = await fetch(`/api/land-records/mutation-verify?qrKey=${encodeURIComponent(key)}`);
      const data = await res.json() as MutationRecord | { error: string };
      if (!res.ok) {
        setMutationError((data as { error: string }).error || "Mutation যাচাইকরণ ব্যর্থ হয়েছে।");
        return;
      }
      setMutationRecord(data as MutationRecord);
      requestAnimationFrame(() => {
        document.getElementById("mutation-verify-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Mutation যাচাইকরণ তথ্য আনা যায়নি।");
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 px-3 pt-4 sm:px-6 sm:pt-6" aria-labelledby="dlrms-verify-heading">
      {/* DLRMS QR Verification */}
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm dark:border-emerald-900/70 dark:from-emerald-950/30 dark:via-slate-950 dark:to-sky-950/20">
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#006a4e] text-white shadow-sm">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="dlrms-verify-heading" className="text-base font-black text-slate-950 dark:text-white">
                  সরকারি DLRMS QR / Verification
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <ShieldCheck size={11} /> Public resolver
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                খতিয়ানের QR লিংক বা verification UUID দিন। LandBD সরকারি public tracking থেকে survey, JL ও খতিয়ান শনাক্ত করে public index-এর পূর্ণতম রেকর্ড পুনর্গঠন করবে।
              </p>
            </div>
          </div>

          <form onSubmit={submitDlrms} className="min-w-0">
            <label htmlFor="dlrms-verification-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              DLRMS যাচাইকরণ লিংক / UUID
            </label>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="dlrms-verification-input"
                  value={dlrmsValue}
                  onChange={(event) => setDlrmsValue(event.target.value)}
                  placeholder="https://dlrms.land.gov.bd/v/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={dlrmsLoading || !dlrmsValue.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 text-sm font-bold text-white transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dlrmsLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                {dlrmsLoading ? "যাচাই হচ্ছে…" : "যাচাই ও বিস্তারিত দেখুন"}
              </button>
            </div>
            {dlrmsError ? (
              <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {dlrmsError}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {/* Mutation / নামজারি QR Verification */}
      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm dark:border-blue-900/70 dark:from-blue-950/30 dark:via-slate-950 dark:to-indigo-950/20">
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-slate-950 dark:text-white">
                  Mutation / নামজারি QR যাচাই
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  <ShieldCheck size={11} /> mutation.land.gov.bd
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                নামজারি খতিয়ানের QR লিংক (mutation.land.gov.bd/qr-vk/...) বা ৬–১৬ ডিজিটের QR কোড দিন।
              </p>
            </div>
          </div>

          <form onSubmit={submitMutation} className="min-w-0">
            <label htmlFor="mutation-verification-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Mutation QR লিংক / কোড
            </label>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="mutation-verification-input"
                  value={mutationValue}
                  onChange={(event) => setMutationValue(event.target.value)}
                  placeholder="https://mutation.land.gov.bd/qr-vk/b610d4d2 অথবা b610d4d2"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={mutationLoading || !mutationValue.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutationLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                {mutationLoading ? "যাচাই হচ্ছে…" : "যাচাই করুন"}
              </button>
            </div>
            {mutationError ? (
              <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {mutationError}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {/* DLRMS result */}
      {dlrmsRecord ? (
        <div id="verified-khatian-result" className="scroll-mt-4 pt-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/25">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 size={17} />
              সরকারি verification record মিলেছে
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-emerald-800 dark:text-emerald-200">
              <span>{surveyLabel(dlrmsRecord.tracking?.surveyId)}</span>
              <span>খতিয়ান {dlrmsRecord.base.KHATIAN_NO}</span>
              {dlrmsRecord.base.JL_NUMBER ? <span>JL {dlrmsRecord.base.JL_NUMBER}</span> : null}
              {dlrmsRecord.base.MOUZA_NAME ? <span>{dlrmsRecord.base.MOUZA_NAME}</span> : null}
            </div>
          </div>
          <KhatianDetailsView
            khatian={dlrmsRecord.base}
            fullKhatian={dlrmsRecord}
            surveyKey={surveyLabel(dlrmsRecord.tracking?.surveyId)}
            captureRef={captureRef}
          />
        </div>
      ) : null}

      {/* Mutation result */}
      {mutationRecord ? (
        <div id="mutation-verify-result" className="scroll-mt-4">
          <MutationResultCard record={mutationRecord} />
        </div>
      ) : null}
    </section>
  );
}
