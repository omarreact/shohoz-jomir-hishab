"use client";

import { Circle, Ruler, Square, Triangle, type LucideIcon } from "lucide-react";
import type { ShapeType } from "@/src/features/land-measurement/types";

type ShapeOption = {
  key: ShapeType;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const SHAPES: ShapeOption[] = [
  { key: "rect", label: "আয়তক্ষেত্র", hint: "দৈর্ঘ্য × প্রস্থ", icon: Square },
  { key: "triangle", label: "ত্রিভুজ", hint: "৩ বাহু", icon: Triangle },
  { key: "quad", label: "চতুর্ভুজ", hint: "৪ বাহু + কর্ণ", icon: Ruler },
  { key: "pentagon", label: "পঞ্চভুজ", hint: "৫ বাহু + কর্ণ", icon: Ruler },
  { key: "circle", label: "বৃত্ত", hint: "ব্যাস", icon: Circle },
];

type Props = {
  value: ShapeType;
  onChange: (shape: ShapeType) => void;
};

export default function ShapeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5" role="radiogroup" aria-label="জমির আকৃতি নির্বাচন">
      {SHAPES.map(({ key, label, hint, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`group min-h-[5.3rem] rounded-[12px] border p-3 text-left transition ${
              active
                ? "border-[color-mix(in_srgb,var(--primary)_30%,var(--border-color))] bg-[var(--brand-green-faint)] text-[var(--primary)] shadow-[inset_0_0_0_1px_rgba(11,93,59,.06)]"
                : "border-[var(--border-color)] bg-white text-[var(--foreground)] hover:border-[color-mix(in_srgb,var(--primary)_24%,var(--border-color))]"
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              active ? "bg-[var(--primary)] text-white" : "bg-[var(--canvas)] text-[var(--muted-foreground)]"
            }`}>
              <Icon size={16} />
            </span>
            <strong className="mt-2 block text-sm">{label}</strong>
            <span className="mt-0.5 block text-[10px] font-semibold text-[var(--muted-foreground)]">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
