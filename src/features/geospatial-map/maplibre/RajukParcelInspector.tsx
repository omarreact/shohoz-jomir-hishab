"use client";

import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

type Props = {
  selected: RajukPlotFeature;
  activeDetails: Array<{ label: string; value: string }>;
  routingCalculator: "khatiyan" | "faraez" | null;
  validateAndRoute: (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => void;
};

/** Consistent parcel inspection on phones, tablets and wide desktop maps. */
export default function RajukParcelInspector({
  selected, activeDetails, routingCalculator, validateAndRoute,
}: Props) {
  return (
    <section aria-label="নির্বাচিত দাগের বিস্তারিত" className="rounded-lg border border-[var(--border-color)] bg-white p-4 text-[var(--foreground)]">
      <div className="mb-2 inline-flex rounded-md bg-[var(--brand-green-faint)] px-2.5 py-1 text-[10px] font-black tracking-[.1em] text-[var(--primary)]">
        PARCEL INSPECTOR
      </div>
      <h2 className="text-base font-black">নির্বাচিত দাগ</h2>
      <dl className="mt-2 space-y-1.5">
        {activeDetails.map(({ label, value }, index) => (
          <div key={label + index} className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] py-2 text-[11px]">
            <dt className="text-[var(--muted-foreground)]">{label}</dt>
            <dd className="max-w-[56%] break-words text-right font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <details className="mt-3 rounded-md border border-[var(--border-color)] bg-[var(--brand-green-faint)] p-2.5">
        <summary className="cursor-pointer text-xs font-black text-[var(--primary)]">ভূমি ব্যবহার / DAP বিশ্লেষণ</summary>
        <p className="mt-2 text-[11px] leading-5 text-[var(--muted-foreground)]">
          প্রস্তাবিত ভূমি-ব্যবহার ও বন্যা ঝুঁকির লেয়ার চালু করা যায়।
          এই প্লটের সরকারি DAP শ্রেণিবিন্যাস বর্তমান API রেসপন্সে যাচাই করা হয়নি।
        </p>
      </details>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" disabled={routingCalculator !== null}
          onClick={() => void validateAndRoute("khatiyan", selected)}
          className="min-h-11 rounded-md bg-[var(--primary)] px-2 text-[11px] font-bold text-white disabled:opacity-50">
          খতিয়ান হিসাব
        </button>
        <button type="button" disabled={routingCalculator !== null}
          onClick={() => void validateAndRoute("faraez", selected)}
          className="min-h-11 rounded-md border border-[var(--border-color)] bg-white px-2 text-[11px] font-bold disabled:opacity-50">
          ফারায়েজ
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-[#92664d]">GIS তথ্য আনুমানিক; সার্টিফায়েড সীমানা বা মালিকানা নয়।</p>
    </section>
  );
}
