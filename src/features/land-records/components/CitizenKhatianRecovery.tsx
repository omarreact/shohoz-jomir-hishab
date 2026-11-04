"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, FileText, ShieldCheck } from "lucide-react";
import type { CitizenExpectedKhatian } from "../lib/citizen-khatian-match";

const DlrmsCitizenImport = dynamic(() => import("./DlrmsCitizenImport"), {
  ssr: false,
  loading: () => <p className="px-4 py-3 text-sm">সরকারি citizen record viewer লোড হচ্ছে…</p>,
});

/** Optional, authorized source record. Never scrape tokens or silently merge records. */
export default function CitizenKhatianRecovery({ expected }: { expected: CitizenExpectedKhatian }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-4"
      aria-label="অপূর্ণ খতিয়ানের সরকারি পূর্ণ রেকর্ড">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-base font-black text-emerald-950">
            <FileText size={18} /> নিজের সরকারি পূর্ণ খতিয়ান কপি
          </h3>
          <p className="mt-1 text-xs leading-5 text-emerald-900">
            Public API-তে মালিক, অভিভাবক বা দাগ অসম্পূর্ণ থাকলে নিজের অনুমোদিত DLRMS Citizen
            আবেদন থেকে প্রাপ্ত সব source page দেখা যায়। সরকারি আবেদন বা ফি প্রযোজ্য হতে পারে।
          </p>
        </div>
        <button type="button" aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-950">
          <ShieldCheck size={15} /> {expanded ? "বন্ধ করুন" : "পূর্ণ রেকর্ড খুলুন"}
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
      {expanded ? (
        <div className="mt-3 border-t border-emerald-200 pt-3">
          <p className="text-xs leading-5 text-emerald-900">
            নির্বাচিত খতিয়ান নং {expected.khatianNo}। অন্য খতিয়ান বা মৌজার
            citizen print response এখানে দেখানো হবে না। Session token সংরক্ষণ করা হবে না।
          </p>
          <DlrmsCitizenImport expected={expected} />
        </div>
      ) : null}
    </section>
  );
}
