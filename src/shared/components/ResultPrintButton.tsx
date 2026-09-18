"use client";

import { Printer } from "lucide-react";

type Props = {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export default function ResultPrintButton({
  onClick = () => window.print(),
  disabled = false,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-exclude-export="1"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#006a4e] bg-white px-4 py-2.5 text-sm font-bold text-[#006a4e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-transparent dark:hover:bg-slate-800 ${className}`}
    >
      <Printer size={16} />
      <span>প্রিন্ট করুন</span>
    </button>
  );
}
