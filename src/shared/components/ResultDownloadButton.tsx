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
      aria-busy={loading}
      className={`landbd-primary-button inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      <span>{loading ? "পিডিএফ তৈরি হচ্ছে…" : "রিপোর্ট ডাউনলোড করুন"}</span>
    </button>
  );
}
