"use client";

import { Circle, Ruler, Square, Triangle, type LucideIcon } from "lucide-react";
import type { ShapeType } from "@/src/features/land-measurement/types";

type ShapeOption = {
  key: ShapeType;
  label: string;
  icon: LucideIcon;
};

const SHAPES: ShapeOption[] = [
  { key: "rect", label: "আয়তক্ষেত্র", icon: Square },
  { key: "triangle", label: "ত্রিভুজ", icon: Triangle },
  { key: "quad", label: "চতুর্ভুজ", icon: Ruler },
  { key: "pentagon", label: "পঞ্চভুজ", icon: Ruler },
  { key: "circle", label: "বৃত্ত", icon: Circle },
];

type Props = {
  value: ShapeType;
  onChange: (shape: ShapeType) => void;
};

export default function ShapeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5" role="radiogroup" aria-label="জমির আকৃতি নির্বাচন">
      {SHAPES.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`rounded-2xl border p-4 font-bold transition ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:border-primary"
            }`}
          >
            <Icon className="mx-auto mb-2" size={22} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
