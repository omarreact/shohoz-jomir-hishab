"use client";

import { MapPin, X } from "lucide-react";
import { useMapVisitConsent } from "../hooks/useMapVisitConsent";

export default function MapVisitConsent() {
  const { open, busy, capture, close } = useMapVisitConsent();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006a4e]/15 text-[#006a4e]">
            <MapPin className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="বন্ধ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void capture()}
          className="min-h-12 w-full rounded-xl bg-[#006a4e] px-4 text-base font-bold text-white disabled:opacity-60"
        >
          {busy ? "লোকেশন নেওয়া হচ্ছে…" : "লোকেশন অনুমতি দিন"}
        </button>
      </div>
    </div>
  );
}
