"use client";

import { useState } from "react";
import { Calculator, Circle, Square, Triangle, Ruler } from "lucide-react";
import { calcRectangle, calcTriangle, calcQuadrilateral, calcPentagon, calcCircle, MeasurementResult } from "@/src/modules/land/geometry";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import HeroBanner from "@/src/shared/ui/HeroBanner";

type ShapeType = "rect" | "triangle" | "quad" | "pentagon" | "circle";
type Measure = { feet: string; inches: string };
type Inputs = { side1: Measure; side2: Measure; side3: Measure; side4: Measure; side5: Measure; diag1: Measure; diag2: Measure; diameter: Measure };
const empty = (): Measure => ({ feet: "", inches: "" });
const initialInputs: Inputs = { side1: empty(), side2: empty(), side3: empty(), side4: empty(), side5: empty(), diag1: empty(), diag2: empty(), diameter: empty() };
const labels: Record<string, string> = { side1: "দৈর্ঘ্য / বাহু ১", side2: "প্রস্থ / বাহু ২", side3: "বাহু ৩", side4: "বাহু ৪", side5: "বাহু ৫", diag1: "কর্ণ ১", diag2: "কর্ণ ২", diameter: "ব্যাস" };

export default function LandMeasurementPage() {
  const [shape, setShape] = useState<ShapeType>("quad");
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const update = (key: keyof Inputs, field: keyof Measure, value: string) => { setInputs((p) => ({ ...p, [key]: { ...p[key], [field]: value } })); setResult(null); };
  const calculate = () => {
    let value: MeasurementResult | null = null;
    if (shape === "rect") value = calcRectangle(inputs.side1, inputs.side2);
    if (shape === "triangle") value = calcTriangle(inputs.side1, inputs.side2, inputs.side3);
    if (shape === "quad") value = calcQuadrilateral(inputs.side1, inputs.side2, inputs.side3, inputs.side4, inputs.diag1);
    if (shape === "pentagon") value = calcPentagon(inputs.side1, inputs.side2, inputs.side3, inputs.side4, inputs.side5, inputs.diag1, inputs.diag2);
    if (shape === "circle") value = calcCircle(inputs.diameter);
    setResult(value);
    setTimeout(() => document.getElementById("landResultSection")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const visible: (keyof Inputs)[] = shape === "rect" ? ["side1", "side2"] : shape === "triangle" ? ["side1", "side2", "side3"] : shape === "quad" ? ["side1", "side2", "side3", "side4", "diag1"] : shape === "pentagon" ? ["side1", "side2", "side3", "side4", "side5", "diag1", "diag2"] : ["diameter"];
  return <>
    <HeroBanner align="center" badge="ভূমি পরিমাপ" title={<>সহজ ও নির্ভুল <span className="accent-text">জমি পরিমাপ</span></>} description="দৈর্ঘ্য, প্রস্থ, বাহু ও কর্ণের মাপ দিয়ে জমির ক্ষেত্রফল হিসাব করুন। রাজউক-সংক্রান্ত অনুসন্ধান এখন আলাদা RAJUK পেজে রয়েছে।" pattern="none" />
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {([["rect", "আয়তক্ষেত্র", Square], ["triangle", "ত্রিভুজ", Triangle], ["quad", "চতুর্ভুজ", Ruler], ["pentagon", "পঞ্চভুজ", Ruler], ["circle", "বৃত্ত", Circle]] as const).map(([key, label, Icon]) => <button key={key} onClick={() => { setShape(key); setResult(null); }} className={`rounded-2xl border p-4 font-bold transition ${shape === key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary"}`}><Icon className="mx-auto mb-2" size={22} />{label}</button>)}
      </div>
      <section className="rounded-3xl border bg-card p-5 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-xl font-bold"><Calculator size={22} /> মাপ দিন</div>
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((key) => <div key={key} className="rounded-2xl border p-4"><div className="font-bold mb-3">{labels[key]}</div><div className="grid grid-cols-2 gap-3"><label className="border rounded-xl overflow-hidden flex"><input className="w-full min-w-0 p-3 bg-transparent outline-none" type="number" min="0" value={inputs[key].feet} onChange={(e) => update(key, "feet", e.target.value)} placeholder="০" /><span className="px-3 flex items-center bg-muted">ফুট</span></label><label className="border rounded-xl overflow-hidden flex"><input className="w-full min-w-0 p-3 bg-transparent outline-none" type="number" min="0" max="11" value={inputs[key].inches} onChange={(e) => update(key, "inches", e.target.value)} placeholder="০" /><span className="px-3 flex items-center bg-muted">ইঞ্চি</span></label></div></div>)}
        </div>
        <button onClick={calculate} className="mt-8 w-full md:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold inline-flex items-center justify-center gap-2"><Calculator size={20} /> হিসাব করুন</button>
      </section>
      {result && <section id="landResultSection" className="mt-8 rounded-3xl border bg-card p-6 shadow-sm"><h2 className="text-xl font-bold mb-5">হিসাবের ফলাফল</h2>{result.errorMsg ? <p className="text-destructive font-bold">{result.errorMsg}</p> : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[["বর্গফুট", result.sqFt], ["শতাংশ", result.shotok], ["কাঠা", result.katha], ["একর", result.acre]].map(([label, value]) => <div key={label} className="rounded-2xl bg-muted p-4"><small>{label}</small><div className="text-2xl font-bold">{Number(value || 0).toFixed(4)}</div></div>)}</div>}</section>}
      <div className="mt-16"><LatestBlogs /></div>
    </div>
  </>;
}
