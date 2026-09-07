"use client";

import { Download, Loader2 } from "lucide-react";

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function ResultDownloadButton({
  onClick,
  loading = false,
  disabled = false,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-exclude-export="1"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#005a42] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {loading ? "ফলাফল প্রস্তুত হচ্ছে…" : "ফলাফল ডাউনলোড করুন"}
    </button>
  );
}
