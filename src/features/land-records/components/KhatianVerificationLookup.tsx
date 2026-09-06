"use client";

import { FormEvent, useRef, useState } from "react";
import { CheckCircle2, Link2, Loader2, QrCode, Search, ShieldCheck } from "lucide-react";
import { landRecordsApi } from "../api";
import type { FullKhatian } from "../full-khatian";
import KhatianDetailsView from "./KhatianDetailsView";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

function extractVerificationUuid(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(UUID_RE);
  if (!match) return null;

  // A pasted URL is accepted only as a DLRMS verification URL. A bare UUID is
  // also accepted. We never fetch or proxy an arbitrary user-supplied URL.
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

function surveyLabel(surveyId?: number): string {
  const labels: Record<number, string> = {
    1: "CS",
    2: "RS",
    3: "SA",
    4: "BS",
    5: "DIARA",
    6: "PETY",
    7: "BRS",
    8: "BDS",
  };
  return surveyId ? labels[surveyId] ?? `Survey ${surveyId}` : "—";
}

export default function KhatianVerificationLookup() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<FullKhatian | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const uuid = extractVerificationUuid(value);
    if (!uuid) {
      setError("সঠিক DLRMS যাচাইকরণ UUID অথবা https://dlrms.land.gov.bd/v/... লিংক দিন।");
      setRecord(null);
      return;
    }

    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      const full = await landRecordsApi.fullKhatianByVerificationUuid(uuid);
      setRecord(full);
      requestAnimationFrame(() => {
        document.getElementById("verified-khatian-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DLRMS যাচাইকরণ তথ্য আনা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pt-4 sm:px-6 sm:pt-6" aria-labelledby="dlrms-verify-heading">
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
                খতিয়ানের QR লিংক বা verification UUID দিন। LandBD সরকারি public tracking থেকে survey, JL ও খতিয়ান শনাক্ত করে public index-এর পূর্ণতম রেকর্ড পুনর্গঠন করবে।
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="min-w-0">
            <label htmlFor="dlrms-verification-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              DLRMS যাচাইকরণ লিংক / UUID
            </label>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="dlrms-verification-input"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="https://dlrms.land.gov.bd/v/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !value.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 text-sm font-bold text-white transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                {loading ? "যাচাই হচ্ছে…" : "যাচাই ও বিস্তারিত দেখুন"}
              </button>
            </div>
            {error ? (
              <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {record ? (
        <div id="verified-khatian-result" className="scroll-mt-4 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/25">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 size={17} />
              সরকারি verification record মিলেছে
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-emerald-800 dark:text-emerald-200">
              <span>{surveyLabel(record.tracking?.surveyId)}</span>
              <span>খতিয়ান {record.base.KHATIAN_NO}</span>
              {record.base.JL_NUMBER ? <span>JL {record.base.JL_NUMBER}</span> : null}
              {record.base.MOUZA_NAME ? <span>{record.base.MOUZA_NAME}</span> : null}
            </div>
          </div>
          <KhatianDetailsView
            khatian={record.base}
            fullKhatian={record}
            surveyKey={surveyLabel(record.tracking?.surveyId)}
            captureRef={captureRef}
          />
        </div>
      ) : null}
    </section>
  );
}
