"use client";

import SearchPanel from "@/src/features/search/components/SearchPanel";

export default function RajukSinglePlotTestPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in visible">
      <div className="mb-8">
        <h3 className="font-bold text-2xl text-[var(--text-primary)] mb-2">রাজউক প্লট টেস্ট</h3>
        <p className="text-[var(--text-secondary)]">রাজউক ডাটাবেস থেকে সরাসরি প্লটের তথ্য খুঁজুন এবং টেস্ট করুন।</p>
      </div>
      <SearchPanel />
    </div>
  );
}
