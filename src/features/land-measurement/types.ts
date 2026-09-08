export type ShapeType = "rect" | "triangle" | "quad" | "pentagon" | "circle";

export type Measure = {
  feet: string;
  inches: string;
};

export type MeasurementInputs = {
  side1: Measure;
  side2: Measure;
  side3: Measure;
  side4: Measure;
  side5: Measure;
  diag1: Measure;
  diag2: Measure;
  diameter: Measure;
};

export const MEASUREMENT_LABELS: Record<keyof MeasurementInputs, string> = {
  side1: "দৈর্ঘ্য / বাহু ১",
  side2: "প্রস্থ / বাহু ২",
  side3: "বাহু ৩",
  side4: "বাহু ৪",
  side5: "বাহু ৫",
  diag1: "কর্ণ ১",
  diag2: "কর্ণ ২",
  diameter: "ব্যাস",
};

export const VISIBLE_INPUTS: Record<ShapeType, Array<keyof MeasurementInputs>> = {
  rect: ["side1", "side2"],
  triangle: ["side1", "side2", "side3"],
  quad: ["side1", "side2", "side3", "side4", "diag1"],
  pentagon: ["side1", "side2", "side3", "side4", "side5", "diag1", "diag2"],
  circle: ["diameter"],
};

function emptyMeasure(): Measure {
  return { feet: "", inches: "" };
}

export function createInitialMeasurementInputs(): MeasurementInputs {
  return {
    side1: emptyMeasure(),
    side2: emptyMeasure(),
    side3: emptyMeasure(),
    side4: emptyMeasure(),
    side5: emptyMeasure(),
    diag1: emptyMeasure(),
    diag2: emptyMeasure(),
    diameter: emptyMeasure(),
  };
}
