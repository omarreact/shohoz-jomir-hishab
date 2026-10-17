"use client";

import { Minus, Plus } from "lucide-react";
import { toBn } from "@/src/shared/utils";

type Props = {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
};

/** Inline stepper replaces Android's blocking native <select> option dialogs. */
export default function ShareStepper({ label, value, max, onChange }: Props) {
  const current = Number.isFinite(value) ? Math.max(0, Math.min(max, Math.trunc(value))) : 0;

  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5">
      <p className="mb-1.5 text-center text-xs font-extrabold text-[var(--muted-foreground)]">{label}</p>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-1">
        <button type="button" aria-label={label + " কমান"}
          disabled={current === 0}
          onClick={() => onChange(current - 1)}
          className="grid min-h-11 place-items-center rounded-lg bg-[var(--secondary)] text-[var(--foreground)] disabled:opacity-35">
          <Minus size={17} />
        </button>
        <output aria-label={label + " এর পরিমাণ"} className="text-center text-sm font-black tabular-nums text-[var(--primary)]">
          {toBn(current)}
        </output>
        <button type="button" aria-label={label + " বাড়ান"}
          disabled={current === max}
          onClick={() => onChange(current + 1)}
          className="grid min-h-11 place-items-center rounded-lg bg-[var(--brand-green-faint)] text-[var(--primary)] disabled:opacity-35">
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}
