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
    <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xl font-bold">
        <Calculator size={22} /> মাপ দিন
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {VISIBLE_INPUTS[shape].map((key) => (
          <div key={key} className="rounded-2xl border p-4">
            <div className="mb-3 font-bold">{MEASUREMENT_LABELS[key]}</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex overflow-hidden rounded-xl border">
                <input
                  className="w-full min-w-0 bg-transparent p-3 outline-none"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={inputs[key].feet}
                  onChange={(event) => onUpdate(key, "feet", event.target.value)}
                  placeholder="০"
                  aria-label={`${MEASUREMENT_LABELS[key]} ফুট`}
                />
                <span className="flex items-center bg-muted px-3">ফুট</span>
              </label>
              <label className="flex overflow-hidden rounded-xl border">
                <input
                  className="w-full min-w-0 bg-transparent p-3 outline-none"
                  type="number"
                  min="0"
                  max="11"
                  inputMode="decimal"
                  value={inputs[key].inches}
                  onChange={(event) => onUpdate(key, "inches", event.target.value)}
                  placeholder="০"
                  aria-label={`${MEASUREMENT_LABELS[key]} ইঞ্চি`}
                />
                <span className="flex items-center bg-muted px-3">ইঞ্চি</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onCalculate}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-bold text-primary-foreground md:w-auto"
      >
        <Calculator size={20} /> হিসাব করুন
      </button>
    </section>
  );
}
