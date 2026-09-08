"use client";

import { HeirResult, Religion } from "@/src/modules/faraez/types";
import { toBn } from "@/src/shared/utils";
import { downloadTextFile, rowsToCsv } from "@/src/shared/lib/export";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import ResultWatermarkPortal from "@/src/shared/components/ResultWatermarkPortal";
import { Scale, Info, FileSpreadsheet, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/src/shared/ui/Card";
import { Button } from "@/src/shared/ui/button";

interface Props {
  results: HeirResult[];
  exportRef: React.RefObject<HTMLDivElement | null>;
  religion: Religion;
}

const COLORS = ["#198754", "#0d6efd", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14", "#20c997", "#0dcaf0", "#adb5bd"];

function measurementText(measurement: HeirResult["measurements"] extends readonly (infer T)[] | undefined ? T | undefined : never): string {
  if (!measurement) return "—";
  return `${toBn(measurement.ana.toString())} আনা · ${toBn(measurement.gonda.toString())} গন্ডা · ${toBn(measurement.kora.toString())} কড়া · ${toBn(measurement.kranti.toString())} ক্রান্তি · ${toBn(measurement.til.toString())} তিল`;
}

export default function FaraezResult({ results, exportRef, religion }: Props) {
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: exportRef,
    fileName: "LandBD-Faraez-Result-A4-Portrait",
  });

  if (!results.length) return null;
  const validResults = results.filter((result) => result.count > 0);
  const pieData = validResults
    .filter((result) => result.fraction > 0)
    .map((result) => ({
      name: result.count > 1 ? `${result.heirType} (${toBn(result.count)} জন)` : result.heirType,
      value: Number((result.fraction * 100).toFixed(2)),
    }));
  const today = toBn(new Date().toLocaleDateString("en-GB"));

  const downloadFaraezCsv = () => {
    try {
      const rows: unknown[][] = [["ওয়ারিশ", "অংশ (%)", "খতিয়ানি অংশ", "আনা", "গন্ডা", "কড়া", "ক্রান্তি", "তিল", "প্রাপ্ত জমি (শতাংশ)", "প্রাপ্ত স্বর্ণ (ভরি)", "প্রাপ্ত অর্থ (টাকা)", "আইনি ব্যাখ্যা"]];
      validResults.forEach((result) => {
        for (let index = 1; index <= result.count; index += 1) {
          const measurement = result.measurements?.[index - 1];
          rows.push([
            result.count > 1 ? `${result.heirType} ${index}` : result.heirType,
            result.fraction === 0 ? "বঞ্চিত" : `${(result.fraction * 100).toFixed(2)}%`,
            measurement ? measurementText(measurement) : "—",
            measurement?.ana.toString() ?? "",
            measurement?.gonda.toString() ?? "",
            measurement?.kora.toString() ?? "",
            measurement?.kranti.toString() ?? "",
            measurement?.til.toString() ?? "",
            result.assets.land.toFixed(3),
            result.assets.gold.toFixed(3),
            result.assets.cash.toFixed(2),
            result.reasoning,
          ]);
        }
      });
      downloadTextFile(rowsToCsv(rows), "Faraez_Result.csv");
    } catch (error) {
      console.error("Faraez CSV export failed:", error);
      alert("CSV তৈরিতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div id="resultSection" className="container mx-auto mt-4 animate-in fade-in zoom-in-95 pb-8">
      <Card className="overflow-hidden border-2 border-success/30 shadow-lg">
        <CardHeader className="no-print bg-success py-4 text-center text-success-foreground">
          <CardTitle className="m-0 flex items-center justify-center text-xl">
            <Scale className="mr-2" /> বিস্তারিত বন্টন ফলাফল
          </CardTitle>
        </CardHeader>

        <CardContent ref={exportRef as React.RefObject<HTMLDivElement>} className="relative isolate overflow-hidden rounded-none bg-white p-4 text-slate-900 md:p-8">
          <div className="relative z-10">
            <div className="mb-8 border-b-2 border-success/30 pb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-success">সম্পত্তি বন্টন (ফারায়েজ) বিবরণী</h2>
              <p className="mb-0 font-semibold text-slate-600">তারিখ: {today} | {religion === "muslim" ? "ইসলামী শরীয়ত" : "হিন্দু দায়ভাগ আইন"} মোতাবেক প্রস্তুতকৃত</p>
            </div>

            {pieData.length > 0 ? (
              <div className="mx-0 mb-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm md:flex-row">
                <div className="mb-6 text-center md:mb-0 md:w-5/12">
                  <h5 className="mb-3 flex items-center justify-center text-lg font-bold text-slate-900"><PieChartIcon className="mr-2 text-primary" /> অংশের গ্রাফিক্যাল রূপ</h5>
                  <p className="text-sm text-slate-600">নিচের চার্টে ওয়ারিশদের অংশের হার দেখানো হলো</p>
                </div>
                <div className="md:w-7/12" style={{ height: "300px", minHeight: "300px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" label={({ value }) => `${toBn(value)}%`}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${toBn(value)}%`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-success/30 bg-success/10 text-center text-success">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold">ওয়ারিশ</th>
                    <th className="py-4 font-bold">অংশ (%)</th>
                    <th className="py-4 font-bold text-success">খতিয়ানি অংশ<br /><span className="text-xs font-normal">আনা · গন্ডা · কড়া · ক্রান্তি · তিল</span></th>
                    <th className="py-4 font-bold text-success">প্রাপ্ত জমি<br /><span className="text-xs font-normal">(শতাংশ)</span></th>
                    <th className="py-4 font-bold">প্রাপ্ত স্বর্ণ<br /><span className="text-xs font-normal">(ভরি)</span></th>
                    <th className="py-4 font-bold text-primary">প্রাপ্ত অর্থ<br /><span className="text-xs font-normal">(টাকা)</span></th>
                    <th className="px-4 py-4 text-left font-bold" style={{ width: "30%" }}>আইনি ব্যাখ্যা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {validResults.flatMap((result, groupIndex) => {
                    const rows = [];
                    for (let index = 1; index <= result.count; index += 1) {
                      const isExcluded = result.fraction === 0;
                      const heirName = result.count > 1 ? `${result.heirType} ${toBn(index)}` : result.heirType;
                      const measurement = result.measurements?.[index - 1];
                      rows.push(
                        <tr key={`${groupIndex}-${index}`} className={`text-center ${isExcluded ? "bg-red-50/50 text-slate-500" : "bg-white"}`}>
                          <td className="whitespace-nowrap px-4 py-3 text-left font-bold">{heirName}</td>
                          <td className="py-3">{isExcluded ? <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">বঞ্চিত</span> : <span className="rounded bg-emerald-700 px-2 py-0.5 text-sm font-medium text-white">{toBn((result.fraction * 100).toFixed(2))}%</span>}</td>
                          <td className="min-w-[230px] px-2 py-3 text-xs font-bold leading-6 text-primary">{measurementText(measurement)}</td>
                          <td className="py-3 text-base font-bold text-success">{result.assets.land > 0 ? toBn(result.assets.land.toFixed(3)) : "-"}</td>
                          <td className="py-3 text-base font-bold">{result.assets.gold > 0 ? toBn(result.assets.gold.toFixed(3)) : "-"}</td>
                          <td className="py-3 text-base font-bold text-primary">{result.assets.cash > 0 ? toBn(result.assets.cash.toFixed(2)) : "-"}</td>
                          <td className="px-4 py-3 text-left text-sm text-slate-600"><div className="flex items-start"><Info size={14} className={`mr-2 mt-1 flex-shrink-0 ${isExcluded ? "text-red-600" : "text-success"}`} /><span className="leading-relaxed">{result.reasoning}</span></div></td>
                        </tr>,
                      );
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-8 text-center text-sm text-slate-600">
              <p className="mb-2 inline-block border-t border-slate-200 px-8 pt-4">* এই দলিলটি <strong className="text-slate-900">LandBD</strong> ডিজিটাল ক্যালকুলেটর দ্বারা প্রস্তুতকৃত।</p>
              <p>চূড়ান্ত আইনি বা দাপ্তরিক কাজের জন্য অভিজ্ঞ আইনজীবী বা মুফতির পরামর্শ গ্রহণ করুন।</p>
            </div>
          </div>
        </CardContent>
        <ResultWatermarkPortal targetRef={exportRef} />

        <CardFooter className="no-print flex flex-wrap justify-center gap-4 rounded-b-xl border-t border-success/30 bg-muted/30 p-6">
          <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
          <Button onClick={downloadFaraezCsv} variant="outline" className="rounded-full border-success px-6 font-bold text-success shadow-sm hover:bg-success hover:text-success-foreground"><FileSpreadsheet size={18} className="mr-2" /> CSV</Button>
          {pdfError ? <p className="w-full text-center text-xs font-semibold text-destructive">{pdfError}</p> : null}
        </CardFooter>
      </Card>
    </div>
  );
}
