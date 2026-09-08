"use client";

import { useCallback, useState } from "react";
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
    window.setTimeout(() => document.getElementById("landResultSection")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [inputs, shape]);

  return (
    <div className="space-y-8">
      <ShapeSelector value={shape} onChange={handleShapeChange} />
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
