"use client";

import Link from "next/link";
import { History } from "lucide-react";

export default function HistoryShortcut() {
  return (
    <Link
      href="/history"
      aria-label="হিসাবের ইতিহাস"
      className="fixed bottom-24 right-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3 text-sm font-bold text-[var(--foreground)] shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:bg-[var(--secondary)] md:bottom-6 md:right-6"
    >
      <History size={17} />
      <span className="hidden sm:inline">ইতিহাস</span>
    </Link>
  );
}
