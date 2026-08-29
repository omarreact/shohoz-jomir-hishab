"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { buildDetailedResults, KHATIYAN_UNIT_TIL } from "@/src/modules/khatiyan/calculations";
import { useKhatiyanGisBridge } from "@/src/modules/khatiyan/gis-bridge";
import type { KhatiyanOwner, KhatiyanPlot } from "@/src/shared/types";

const EMPTY_OWNER: KhatiyanOwner = {
  id: 1,
  n: "",
  rType: "পিতা",
  rName: "",
  a: 0,
  g: 0,
  k: 0,
  kr: 0,
  ti: 0,
};

type OwnerForm = KhatiyanOwner;
type FormValues = { owners: OwnerForm[] };

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatArea(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export default function KhatiyanCalculator() {
  const [pending, setPending] = useState<ReturnType<typeof useKhatiyanGisBridge.getState>["pendingPlot"]>(null);
  const [manualArea, setManualArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof buildDetailedResults> | null>(null);

  const { control, register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { owners: [{ ...EMPTY_OWNER }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "owners" });

  useEffect(() => {
    const selected = useKhatiyanGisBridge.getState().consumePendingPlot();
    if (!selected) return;
    setPending(selected);
    setManualArea(selected.plot.a);
    setResult(null);
    setError(null);
  }, []);

  const calculationPlot = useMemo<KhatiyanPlot | null>(() => {
    if (pending) return pending.plot;
    const area = Number(manualArea);
    if (!Number.isFinite(area) || area <= 0) return null;
    return {
      id: 0,
      cs: "",
      rs: "",
      city: "",
      bds: "",
      t: "",
      a: String(area),
    };
  }, [manualArea, pending]);

  const onSubmit = (values: FormValues) => {
    setError(null);
    setResult(null);
    if (!calculationPlot) {
      setError("একটি বৈধ জমির পরিমাণ দিন।");
      return;
    }

    const owners: KhatiyanOwner[] = values.owners.map((owner, index) => ({
      ...owner,
      id: Number(owner.id) || index + 1,
      a: numberValue(String(owner.a)),
      g: numberValue(String(owner.g)),
      k: numberValue(String(owner.k)),
      kr: numberValue(String(owner.kr)),
      ti: numberValue(String(owner.ti)),
    }));

    try {
      const calculated = buildDetailedResults(
        owners,
        [calculationPlot],
        KHATIYAN_UNIT_TIL,
        (value) => Number(value),
        (value) => String(value),
      );
      setResult(calculated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "হিসাব সম্পন্ন করা যায়নি।");
    }
  };

  const allocatedTotal = result?.computedResults.reduce((sum, owner) => sum + owner.totalLand, 0) ?? 0;
  const recordedArea = calculationPlot ? Number(calculationPlot.a) : 0;
  const conserved = result ? Math.abs(allocatedTotal - recordedArea) <= 1e-10 * Math.max(1, recordedArea) : false;

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold text-emerald-700">সহজ জমির হিসাব</p>
        <h1 className="text-3xl font-bold tracking-tight">খতিয়ান জমি বণ্টন</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          মালিকানার ১৬-আনা অংশকে সঠিক মিশ্র-রেডিক্স এককে হিসাব করে রেকর্ডকৃত জমির পরিমাণের সঙ্গে সংরক্ষণ করা হয়।
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label htmlFor="plot-area" className="mb-2 block text-sm font-semibold">রেকর্ডকৃত জমির পরিমাণ (শতাংশ)</label>
            <input
              id="plot-area"
              value={calculationPlot?.a ?? manualArea}
              onChange={(event) => setManualArea(event.target.value)}
              disabled={Boolean(pending)}
              inputMode="decimal"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-emerald-500 focus:ring-2 disabled:bg-slate-100 disabled:text-slate-600"
            />
          </div>
          {pending && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <div className="font-semibold">GIS থেকে যাচাইকৃত প্লট</div>
              <div>উৎস: RAJUK · Object ID: {pending.plot.id}</div>
              <div>নির্বাচন: {new Date(pending.selectedAt).toLocaleString("bn-BD")}</div>
            </div>
          )}
        </div>
        {pending && <p className="mt-3 text-xs text-slate-500">এই পরিমাণটি server-validated RAJUK parcel থেকে এসেছে এবং ইচ্ছাকৃতভাবে সম্পাদনা করা যায় না।</p>}
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">মালিকগণ</h2>
              <p className="text-sm text-slate-500">প্রতিটি অংশ অবশ্যই পূর্ণ ১৬-আনার মধ্যে বৈধ হতে হবে।</p>
            </div>
            <button type="button" onClick={() => append({ ...EMPTY_OWNER, id: Date.now() })} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              + মালিক যোগ করুন
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">মালিক {index + 1}</h3>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-sm font-medium text-red-600">মুছে ফেলুন</button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">নাম</label>
                    <input {...register(`owners.${index}.n`)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="মালিকের নাম" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">পিতা/স্বামী</label>
                    <input {...register(`owners.${index}.rName`)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="নাম" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(["a", "g", "k", "kr", "ti"] as const).map((unit) => (
                    <div key={unit}>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">{unit === "a" ? "আনা" : unit === "g" ? "গন্ডা" : unit === "k" ? "কড়া" : unit === "kr" ? "ক্রান্তি" : "তিল"}</label>
                      <input type="number" min="0" step="1" {...register(`owners.${index}.${unit}`, { valueAsNumber: true })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-emerald-800">
          হিসাব করুন
        </button>
      </form>

      {result && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">ফলাফল</h2>
              <p className="text-sm text-slate-500">রেকর্ডকৃত এলাকা: {formatArea(recordedArea)} শতাংশ</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${conserved ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {conserved ? "✓ এলাকা সংরক্ষিত" : "⚠ এলাকা মিলছে না"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr><th className="px-3 py-3">মালিক</th><th className="px-3 py-3">অংশ</th><th className="px-3 py-3">প্রাপ্ত জমি</th></tr>
              </thead>
              <tbody>
                {result.computedResults.map((owner) => (
                  <tr key={`${owner.name}-${owner.rel}`} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium">{owner.name}</td>
                    <td className="px-3 py-3">{owner.shareText || "—"}</td>
                    <td className="px-3 py-3 font-semibold">{formatArea(owner.totalLand)} শতাংশ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td className="px-3 py-4 font-bold" colSpan={2}>মোট বরাদ্দ</td><td className="px-3 py-4 font-bold">{formatArea(allocatedTotal)} শতাংশ</td></tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
