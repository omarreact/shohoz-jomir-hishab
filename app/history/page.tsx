"use client";

import { History as HistoryIcon, ShieldCheck } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import HistoryList from "@/src/features/history/HistoryList";

export default function HistoryPage() {
  return (
    <>
      <HeroBanner
        align="center"
        badge="হিসাবের ইতিহাস"
        title={<><span>আপনার </span><span className="accent-text">সংরক্ষিত হিসাব</span></>}
        description="খতিয়ান ও ফারায়েজের আগের হিসাবগুলো এক জায়গা থেকে খুলুন, যাচাই করুন বা মুছে ফেলুন।"
        pattern="none"
      />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200">
          <ShieldCheck size={20} className="shrink-0" />
          <p className="text-sm font-semibold">হিসাবের ইতিহাস এই ডিভাইসের Local Storage-এ সংরক্ষিত থাকে। কোনো সার্ভারে ব্যক্তিগত হিসাব পাঠানো হয় না।</p>
        </div>
        <div className="mb-6 flex items-center gap-3">
          <HistoryIcon size={22} />
          <h1 className="text-xl font-bold">সকল হিসাব</h1>
        </div>
        <HistoryList />
      </main>
    </>
  );
}
