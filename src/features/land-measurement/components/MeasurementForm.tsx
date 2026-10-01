"use client";

import { Calculator } from "lucide-react";
import {
  MEASUREMENT_LABELS,
  VISIBLE_INPUTS,
  type MeasurementInputs,
  type Measure,
  type ShapeType,
} from "@/src/features/land-measurement/types";

type Props = {
  shape: ShapeType;
  inputs: MeasurementInputs;
  onUpdate: (key: keyof MeasurementInputs, field: keyof Measure, value: string) => void;
  onCalculate: () => void;
};

export default function MeasurementForm({ shape, inputs, onUpdate, onCalculate }: Props) {
  return (
    <section className="landbd-card p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--survey-teal)]">DIMENSIONS</p>
          <h2 className="mt-1 text-lg font-black text-[var(--foreground)]">মাপ দিন</h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">ফুট ও ইঞ্চি আলাদা ঘরে লিখুন। ফলাফল নতুন মাপ দিলে স্বয়ংক্রিয়ভাবে রিসেট হবে।</p>
        </div>
        <span className="landbd-status-chip">লাইভ ইনপুট</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {VISIBLE_INPUTS[shape].map((key) => (
          <fieldset key={key} className="rounded-[12px] border border-[var(--border-color)] bg-[var(--canvas)] p-3 sm:p-4">
            <legend className="px-1 text-sm font-black text-[var(--foreground)]">{MEASUREMENT_LABELS[key]}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <label className="overflow-hidden rounded-[10px] border border-[var(--border-color)] bg-white focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[color-mix(in_srgb,var(--primary)_10%,transparent)]">
                <span className="sr-only">{MEASUREMENT_LABELS[key]} ফুট</span>
                <div className="flex">
                  <input
                    className="w-full min-w-0 bg-transparent p-3 text-base font-bold outline-none"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={inputs[key].feet}
                    onChange={(event) => onUpdate(key, "feet", event.target.value)}
                    placeholder="০"
                    aria-label={`${MEASUREMENT_LABELS[key]} ফুট`}
                  />
                  <span className="flex items-center border-l border-[var(--border-color)] bg-[var(--canvas)] px-3 text-xs font-bold text-[var(--muted-foreground)]">ফুট</span>
                </div>
              </label>
              <label className="overflow-hidden rounded-[10px] border border-[var(--border-color)] bg-white focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[color-mix(in_srgb,var(--primary)_10%,transparent)]">
                <span className="sr-only">{MEASUREMENT_LABELS[key]} ইঞ্চি</span>
                <div className="flex">
                  <input
                    className="w-full min-w-0 bg-transparent p-3 text-base font-bold outline-none"
                    type="number"
                    min="0"
                    max="11"
                    inputMode="decimal"
                    value={inputs[key].inches}
                    onChange={(event) => onUpdate(key, "inches", event.target.value)}
                    placeholder="০"
                    aria-label={`${MEASUREMENT_LABELS[key]} ইঞ্চি`}
                  />
                  <span className="flex items-center border-l border-[var(--border-color)] bg-[var(--canvas)] px-3 text-xs font-bold text-[var(--muted-foreground)]">ইঞ্চি</span>
                </div>
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--border-color)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">প্রয়োজনীয় ঘর পূরণ করে হিসাব করুন। ভুল বা অসম্ভব মাপ হলে ফলাফলে সতর্কতা দেখাবে।</p>
        <button
          type="button"
          onClick={onCalculate}
          className="landbd-primary-button inline-flex min-h-12 shrink-0 items-center justify-center gap-2 px-6 py-3 text-sm font-black"
        >
          <Calculator size={18} /> হিসাব করুন
        </button>
      </div>
    </section>
  );
}
