"use client";

import { MapPin, X } from "lucide-react";
import { useMapVisitConsent } from "../hooks/useMapVisitConsent";

export default function MapVisitConsent() {
  const { open, busy, capture, close } = useMapVisitConsent();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="লোকেশন অনুমতি"
    >
      <div className="w-full max-w-md rounded-t-3xl border border-[var(--border-color)] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="landbd-icon-tile h-11 w-11 shrink-0">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-[var(--foreground)]">লোকেশন অনুমতি</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">মানচিত্রে বর্তমান অবস্থান সংরক্ষণ করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            aria-label="বন্ধ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void capture()}
          className="landbd-primary-button min-h-12 w-full px-4 text-base font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "লোকেশন নেওয়া হচ্ছে…" : "লোকেশন অনুমতি দিন"}
        </button>
      </div>
    </div>
  );
}
