"use client";

import { useCallback, useState } from "react";
import { Check, MousePointer2 } from "lucide-react";
import {
  calcCircle,
  calcPentagon,
  calcQuadrilateral,
  calcRectangle,
  calcTriangle,
  type MeasurementResult,
} from "@/src/modules/land/geometry";
import {
  createInitialMeasurementInputs,
  type MeasurementInputs,
  type Measure,
  type ShapeType,
} from "@/src/features/land-measurement/types";
import ShapeSelector from "@/src/features/land-measurement/components/ShapeSelector";
import MeasurementForm from "@/src/features/land-measurement/components/MeasurementForm";
import MeasurementResultCard from "@/src/features/land-measurement/components/MeasurementResultCard";

export default function LandMeasurementCalculator() {
  const [shape, setShape] = useState<ShapeType>("quad");
  const [inputs, setInputs] = useState<MeasurementInputs>(() => createInitialMeasurementInputs());
  const [result, setResult] = useState<MeasurementResult | null>(null);

  const handleShapeChange = useCallback((nextShape: ShapeType) => {
    setShape(nextShape);
    setResult(null);
  }, []);

  const updateInput = useCallback(
    (key: keyof MeasurementInputs, field: keyof Measure, value: string) => {
      setInputs((previous) => ({
        ...previous,
        [key]: { ...previous[key], [field]: value },
      }));
      setResult(null);
    },
    [],
  );

  const calculate = useCallback(() => {
    let value: MeasurementResult | null = null;
    if (shape === "rect") value = calcRectangle(inputs.side1, inputs.side2);
    if (shape === "triangle") value = calcTriangle(inputs.side1, inputs.side2, inputs.side3);
    if (shape === "quad") value = calcQuadrilateral(inputs.side1, inputs.side2, inputs.side3, inputs.side4, inputs.diag1);
    if (shape === "pentagon") value = calcPentagon(inputs.side1, inputs.side2, inputs.side3, inputs.side4, inputs.side5, inputs.diag1, inputs.diag2);
    if (shape === "circle") value = calcCircle(inputs.diameter);
    setResult(value);
    window.setTimeout(
      () => document.getElementById("landResultSection")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  }, [inputs, shape]);

  return (
    <div className="space-y-5">
      <div className="landbd-card p-3 sm:p-4" aria-label="জমি পরিমাপের ধাপ">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["১", "আকৃতি", true],
            ["২", "মাপ দিন", true],
            ["৩", "ফলাফল", Boolean(result)],
          ].map(([number, label, complete], index) => (
            <div
              key={String(label)}
              className={`flex items-center gap-3 rounded-[12px] border px-3 py-2.5 ${
                complete
                  ? "border-[color-mix(in_srgb,var(--primary)_20%,var(--border-color))] bg-[var(--brand-green-faint)]"
                  : "border-[var(--border-color)] bg-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                  complete ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {complete && index < 2 ? <Check size={14} /> : number}
              </span>
              <span>
                <span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[var(--muted-foreground)]">
                  ধাপ {number}
                </span>
                <strong className="block text-sm text-[var(--foreground)]">{label}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="landbd-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <MousePointer2 size={17} className="text-[var(--survey-teal)]" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--survey-teal)]">SHAPE</p>
            <h2 className="text-lg font-black text-[var(--foreground)]">জমির আকৃতি নির্বাচন করুন</h2>
          </div>
        </div>
        <ShapeSelector value={shape} onChange={handleShapeChange} />
      </section>

      <MeasurementForm
        shape={shape}
        inputs={inputs}
        onUpdate={updateInput}
        onCalculate={calculate}
      />

      {result ? <MeasurementResultCard result={result} /> : null}
    </div>
  );
}
